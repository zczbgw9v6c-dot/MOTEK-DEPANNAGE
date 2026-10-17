import { createHash, timingSafeEqual } from "node:crypto";
import { ImapFlow } from "imapflow";
import PostalMime from "postal-mime";
import type { V3Store } from "./v3-store.ts";

const MAX_MAIL = 1024 * 1024;
const BATCH = 20;
const hash = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");
export function imapConfig(env: NodeJS.ProcessEnv = process.env) {
  const host = env.MOTEK_IMAP_HOST || "",
    user = env.MOTEK_IMAP_USER || "",
    pass = env.MOTEK_IMAP_PASSWORD || "";
  const folder = env.MOTEK_IMAP_FOLDER || "INBOX",
    since = env.MOTEK_IMAP_SINCE || "",
    token = env.MOTEK_IMAP_OPERATOR_TOKEN || "";
  const enabled = env.MOTEK_IMAP_ENABLED === "1";
  const configured =
    enabled &&
    !!host &&
    !!user &&
    !!pass &&
    token.length >= 24 &&
    /^\d{4}-\d{2}-\d{2}$/.test(since) &&
    Number.isFinite(Date.parse(since)) &&
    new Date(since).toISOString().slice(0, 10) === since;
  return {
    enabled,
    configured,
    host,
    user,
    pass,
    folder,
    since,
    token,
    account: hash(JSON.stringify([host, user, folder])),
  };
}
export function operatorAllowed(
  authorization: string | undefined,
  token: string,
) {
  const expected = Buffer.from("Bearer " + token),
    actual = Buffer.from(authorization || "");
  return (
    token.length >= 24 &&
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}
export type MailBatch = {
  validity: string;
  messages: { uid: number; source?: Buffer; skipped?: string }[];
  more: boolean;
};
export async function readImap(
  config: ReturnType<typeof imapConfig>,
  cursor: { validity?: string; uid?: number },
  makeClient: (
    options: ConstructorParameters<typeof ImapFlow>[0],
  ) => ImapFlow = (options) => new ImapFlow(options),
): Promise<MailBatch> {
  const client = makeClient({
    host: config.host,
    port: 993,
    secure: true,
    auth: { user: config.user, pass: config.pass },
    logger: false,
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    disableAutoIdle: true,
  });
  client.on("error", () => {}); // Ne jamais journaliser une erreur contenant des identifiants.
  const timer = setTimeout(() => client.close(), 60000);
  timer.unref();
  try {
    await client.connect();
    const lock = await client.getMailboxLock(config.folder, { readOnly: true });
    try {
      if (!client.mailbox) throw Error("Boîte indisponible");
      const validity = String(client.mailbox.uidValidity),
        after =
          cursor.validity === validity
            ? Number.isSafeInteger(cursor.uid) && cursor.uid! >= 0
              ? cursor.uid!
              : 0
            : 0;
      const found = await client.search(
        { since: new Date(config.since + "T00:00:00Z"), uid: after + 1 + ":*" },
        { uid: true },
      );
      if (!Array.isArray(found)) throw Error("Recherche IMAP indisponible");
      const ids = found.filter((n) => n > after).sort((a, b) => a - b),
        selected = ids.slice(0, BATCH);
      const messages: MailBatch["messages"] = [];
      // Ne jamais lancer une commande imbriquée dans le générateur fetch().
      for (const uid of selected) {
        const meta = await client.fetchOne(
          uid,
          { uid: true, size: true },
          { uid: true },
        );
        if (!meta) {
          messages.push({ uid, skipped: "Courriel disparu de la boîte" });
          continue;
        }
        if ((meta.size || 0) > MAX_MAIL) {
          messages.push({
            uid,
            skipped: "Courriel supérieur à 1 Mo : à consulter dans la boîte",
          });
          continue;
        }
        const mail = await client.fetchOne(
          uid,
          { uid: true, source: { maxLength: MAX_MAIL + 1 } },
          { uid: true },
        );
        if (!mail || !mail.source || mail.source.length > MAX_MAIL) {
          messages.push({
            uid,
            skipped: "Contenu indisponible ou trop volumineux",
          });
          continue;
        }
        messages.push({ uid, source: mail.source });
      }
      return { validity, messages, more: ids.length > selected.length };
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
    } finally {
      clearTimeout(timer);
      client.close();
    }
  }
}
function htmlText(html: string) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?(?:br|p|div|li|tr|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}
export async function decodeMail(source: Buffer) {
  if (source.length > MAX_MAIL) throw Error("Courriel trop volumineux");
  const m = await PostalMime.parse(source);
  const subject = (m.subject || "(sans objet)").slice(0, 500);
  const fullBody =
    m.text ||
    (m.html
      ? "[HTML converti en texte ; liens et mise en forme ignorés]\n" +
        htmlText(m.html)
      : "[Aucun texte : consulter le courriel original]");
  const body =
    fullBody.slice(0, 24000) +
    (fullBody.length > 24000
      ? "\n[Contenu abrégé : consultez le courriel original pour la suite.]"
      : "");
  const from = [m.from?.name, m.from?.address]
    .filter(Boolean)
    .join(" ")
    .slice(0, 500);
  const raw = ("Objet : " + subject + "\n" + body).replace(/\u0000/g, "");
  return {
    raw,
    from,
    messageId: (m.messageId || "").slice(0, 1000),
    attachmentsIgnored: m.attachments?.length || 0,
    fingerprint: m.messageId ? hash(source) : null,
  };
}
export class ImapIntake {
  busy = false;
  constructor(
    privateStore: V3Store,
    read = readImap,
    config = () => imapConfig(),
  ) {
    this.store = privateStore;
    this.read = read;
    this.config = config;
  }
  store: V3Store;
  read: typeof readImap;
  config: () => ReturnType<typeof imapConfig>;
  status() {
    const c = this.config();
    return {
      configured: c.configured,
      enabled: c.enabled,
      busy: this.busy,
      readOnly: true,
    };
  }
  async sync() {
    const config = this.config();
    if (!config.configured)
      throw Object.assign(
        Error("Courriel entrant non configuré sur le serveur."),
        { status: 503 },
      );
    if (this.busy)
      throw Object.assign(Error("Une réception est déjà en cours."), {
        status: 409,
      });
    this.busy = true;
    try {
      const initial = this.store.read().state as any;
      if (!initial?.intake?.requests)
        throw Object.assign(Error("Ouvrez l’application avant la réception."), {
          status: 409,
        });
      const cursor = initial.intake.imap?.accounts?.[config.account] || {};
      const batch = await this.read(config, cursor);
      const decoded = [];
      for (const m of batch.messages) {
        if (m.skipped) {
          decoded.push({ ...m, mail: null });
          continue;
        }
        // Un MIME illisible ne fait pas perdre le lot : journaliser et avancer.
        try {
          decoded.push({ ...m, mail: await decodeMail(m.source!) });
        } catch {
          decoded.push({
            ...m,
            mail: null,
            skipped: "Courriel illisible : consulter la boîte",
          });
        }
      }
      // Relecture APRÈS le réseau : préserver les modifications du bureau.
      const latest = this.store.read(),
        state = latest.state as any;
      if (!state?.intake?.requests || state.created !== initial.created)
        throw Object.assign(
          Error("État réinitialisé pendant la réception : recommencez."),
          { status: 409 },
        );
      state.intake.imap ??= { accounts: {}, lastRun: null };
      state.intake.imap.accounts ??= {};
      let imported = 0,
        duplicates = 0;
      const skipped: string[] = [];
      const at = new Date().toISOString();
      let high =
        cursor.validity === batch.validity
          ? Number.isSafeInteger(cursor.uid) && cursor.uid! >= 0
            ? cursor.uid!
            : 0
          : 0;
      for (const entry of decoded) {
        high = Math.max(high, entry.uid);
        if (!entry.mail) {
          skipped.push("UID " + entry.uid + " : " + entry.skipped);
          continue;
        }
        const key = hash(
            config.account + ":" + batch.validity + ":" + entry.uid,
          ),
          mail = entry.mail;
        if (
          state.intake.requests.some(
            (r: any) =>
              r.transport?.key === key ||
              (mail.fingerprint &&
                r.transport?.account === config.account &&
                r.transport?.fingerprint === mail.fingerprint),
          )
        ) {
          duplicates++;
          continue;
        }
        const no =
          "DE-" +
          (state.intake.requests.reduce(
            (a: number, r: any) =>
              Math.max(a, Number(String(r.no).replace(/\D/g, "")) || 0),
            800,
          ) +
            1);
        state.intake.requests.unshift({
          id: "RQ" + key.slice(0, 24),
          no,
          at,
          channel: "email",
          from: mail.from,
          raw: mail.raw,
          demo: false,
          status: "À traiter",
          missionId: null,
          fields: null,
          transport: {
            provider: "imap",
            account: config.account,
            key,
            fingerprint: mail.fingerprint,
            uid: entry.uid,
            uidValidity: batch.validity,
            attachmentsIgnored: mail.attachmentsIgnored,
          },
          history: [
            {
              at,
              text: "Reçu par IMAP en lecture seule ; mission à confirmer par le bureau.",
              by: "imap",
            },
          ],
        });
        imported++;
      }
      state.intake.imap.accounts[config.account] = {
        validity: batch.validity,
        uid: high,
      };
      state.intake.imap.lastRun = {
        at,
        imported,
        duplicates,
        skipped,
        more: batch.more,
      };
      state.intake.channels.email = true;
      const snapshot = this.store.write(state, latest.revision);
      return { snapshot, report: state.intake.imap.lastRun };
    } finally {
      this.busy = false;
    }
  }
}
