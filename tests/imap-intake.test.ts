import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ImapIntake,
  imapConfig,
  operatorAllowed,
  decodeMail,
  readImap,
  type MailBatch,
} from "../server/imap-intake.ts";
import { V3Store } from "../server/v3-store.ts";
import { createApiHandler } from "../server/plugin.ts";
import { loadCore } from "./v3-harness.ts";
const config = () =>
  imapConfig({
    MOTEK_IMAP_ENABLED: "1",
    MOTEK_IMAP_HOST: "mail.invalid",
    MOTEK_IMAP_USER: "bureau@example.invalid",
    MOTEK_IMAP_PASSWORD: "secret-never-log",
    MOTEK_IMAP_OPERATOR_TOKEN: "operator-token-for-test-000000",
    MOTEK_IMAP_SINCE: "2026-10-01",
  });
const source = (
  text = "Panne batterie AB-123-CD\nClient : Exemple\nTéléphone : 0600000000\n10 rue Exemple, 75010 Paris",
  id = "first",
) =>
  Buffer.from(
    "From: Bureau <bureau@example.invalid>\r\nSubject: =?UTF-8?B?RMOpcGFubmFnZQ==?=\r\nMessage-ID: <" +
      id +
      "@example.invalid>\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n" +
      text,
  );
const batch = (uid = 1, validity = "10"): MailBatch => ({
  validity,
  messages: [{ uid, source: source() }],
  more: false,
});
const state = () =>
  JSON.parse(JSON.stringify(loadCore({ sleepless: true }).CX.S));
function fixture(read = async () => batch()) {
  const store = new V3Store(":memory:");
  store.write(state(), 0);
  return { store, service: new ImapIntake(store, read, config) };
}

test("IMAP : désactivé par défaut, date réelle et code opérateur requis ; aucun secret dans le statut", () => {
  assert.equal(imapConfig({}).configured, false);
  assert.equal(
    imapConfig({ ...process.env, MOTEK_IMAP_ENABLED: "0" }).configured,
    false,
  );
  assert.equal(config().configured, true);
  assert.equal(
    imapConfig({
      ...{ MOTEK_IMAP_ENABLED: "1" },
      MOTEK_IMAP_SINCE: "2026-99-99",
    }).configured,
    false,
  );
  assert.equal(
    operatorAllowed("Bearer " + config().token, config().token),
    true,
  );
  assert.equal(operatorAllowed("Bearer wrong", config().token), false);
  const { store, service } = fixture();
  assert.ok(!JSON.stringify(service.status()).includes(config().pass));
  store.close();
});
test("MIME : entêtes encodés, corps UTF-8, pièces jointes ignorées et HTML jamais exécuté", async () => {
  const text = await decodeMail(source());
  assert.ok(text.raw.includes("Dépannage"));
  assert.ok(text.raw.includes("AB-123-CD"));
  const mime = Buffer.from(
    'From: test@example.invalid\r\nSubject: Test\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=x\r\n\r\n--x\r\nContent-Type: text/html; charset=utf-8\r\n\r\n<p>Adresse : 10 rue Exemple</p><script>secret()</script><img src="https://tracking.invalid/pixel">\r\n--x\r\nContent-Type: text/plain\r\nContent-Disposition: attachment; filename="preuve.txt"\r\n\r\nPièce jointe à ne pas importer\r\n--x--',
  );
  const m = await decodeMail(mime);
  assert.equal(m.attachmentsIgnored, 1);
  assert.ok(m.raw.includes("10 rue Exemple"));
  assert.ok(!m.raw.includes("secret()"));
  assert.ok(!m.raw.includes("tracking.invalid"));
  assert.ok(!m.raw.includes("Pièce jointe à ne pas importer"));
  await assert.rejects(decodeMail(Buffer.alloc(1024 * 1024 + 1)), /volumineux/);
});
test("IMAP : import idempotent, UIDVALIDITY renouvelé et UID réutilisé ne perdent pas un nouveau message", async () => {
  let value = batch();
  const { store, service } = fixture(async () => value);
  const initial = (store.read().state as any).intake.requests.length;
  await service.sync();
  assert.equal((store.read().state as any).intake.requests.length, initial + 1);
  const second = await service.sync();
  assert.equal(second.report.duplicates, 1);
  value = batch(1, "20");
  await service.sync();
  assert.equal((store.read().state as any).intake.requests.length, initial + 1);
  value = {
    validity: "30",
    messages: [
      { uid: 1, source: source("Nouvelle demande ZZ-789-ZZ", "second") },
    ],
    more: false,
  };
  await service.sync();
  const s = store.read().state as any;
  assert.equal(s.intake.requests.length, initial + 2);
  assert.equal(s.intake.requests[0].status, "À traiter");
  assert.equal(s.intake.requests[0].fields, null);
  assert.equal(s.missions.length, state().missions.length);
  store.close();
});
test("IMAP : les modifications du bureau pendant le réseau sont conservées", async () => {
  let release!: () => void;
  const wait = new Promise<void>((r) => (release = r));
  const { store, service } = fixture(async () => {
    await wait;
    return batch();
  });
  const syncing = service.sync();
  const s = store.read();
  (s.state as any).company.name = "Modification du bureau";
  store.write(s.state, s.revision);
  release();
  await syncing;
  assert.equal(
    (store.read().state as any).company.name,
    "Modification du bureau",
  );
  store.close();
});
test("IMAP : panne et relevés concurrents ne font pas avancer le curseur", async () => {
  let reject!: (e: Error) => void;
  const { store, service } = fixture(() => new Promise((_, r) => (reject = r)));
  const pending = service.sync();
  await assert.rejects(service.sync(), /déjà/);
  reject(Error("mot-de-passe-fictif"));
  await assert.rejects(pending);
  assert.equal(service.busy, false);
  assert.equal((store.read().state as any).intake.imap.lastRun, null);
  store.close();
});
test("IMAP : messages ignorés et lot restant sont annoncés ; reset concurrent annule le lot", async () => {
  const { store, service } = fixture(async () => ({
    validity: "20",
    messages: [{ uid: 5, skipped: "Courriel supérieur à 1 Mo" }],
    more: true,
  }));
  const { report } = await service.sync();
  assert.equal(report.skipped.length, 1);
  assert.equal(report.more, true);
  assert.equal(report.imported, 0);
  assert.equal(
    (store.read().state as any).intake.imap.accounts[config().account].uid,
    5,
  );
  store.close();
  let release!: () => void;
  const wait = new Promise<void>((r) => (release = r));
  const f = fixture(async () => {
    await wait;
    return batch();
  });
  const pending = f.service.sync();
  f.store.reset();
  release();
  await assert.rejects(pending, /réinitialisé/);
  assert.equal(f.store.read().state, null);
  f.store.close();
});
test("Adaptateur IMAP : TLS, lecture seule, UID triés, source limitée et aucun téléchargement des gros messages", async () => {
  const calls: any[] = [];
  const client: any = {
    mailbox: { uidValidity: 10n },
    on: () => {},
    close: () => calls.push("close"),
    connect: async () => {},
    logout: async () => {},
    getMailboxLock: async (path: string, opts: any) => {
      calls.push({ path, ...opts });
      return { release: () => calls.push("release") };
    },
    search: async (q: any, opts: any) => {
      calls.push({ q, opts });
      return [3, 1, 2];
    },
    fetchOne: async (uid: number, q: any) => {
      calls.push({ uid, q });
      return q.source
        ? { uid, source: source() }
        : { uid, size: uid === 2 ? 2 * 1024 * 1024 : 100 };
    },
  };
  const result = await readImap(
    config(),
    { validity: "10", uid: 1 },
    (options) => {
      assert.equal(options.secure, true);
      assert.equal(options.port, 993);
      assert.equal(options.logger, false);
      return client;
    },
  );
  assert.deepEqual(
    result.messages.map((m) => m.uid),
    [2, 3],
  );
  assert.ok(result.messages[0].skipped);
  assert.equal(calls.find((x) => x.path).readOnly, true);
  assert.ok(!calls.some((x) => x.uid === 2 && x.q.source));
  assert.equal(
    calls.find((x) => x.uid === 3 && x.q.source).q.source.maxLength,
    1024 * 1024 + 1,
  );
  assert.ok(calls.includes("release"));
});
test("API IMAP : code opérateur exigé, erreurs expurgées et révision diffusée après import", async () => {
  const dir = mkdtempSync(join(tmpdir(), "motek-imap-")),
    file = join(dir, "db.sqlite");
  const st = new V3Store(file);
  st.write(state(), 0);
  st.close();
  let fail: boolean | number = false,
    calls = 0;
  const api = createApiHandler(file, {
    config,
    read: async () => {
      calls++;
      if (fail) throw Object.assign(Error(config().pass),{status:typeof fail === "number"?fail:undefined});
      return batch();
    },
  });
  async function request(method: string, path: string, auth?: string) {
    let body = "";
    const req = Object.assign(Readable.from([]), {
      method,
      url: path,
      headers: { host: "localhost", authorization: auth },
    });
    const res: any = {
      statusCode: 200,
      setHeader: () => {},
      end: (value: string) => (body = value),
    };
    await api(req as any, res);
    return { status: res.statusCode, body: JSON.parse(body) };
  }
  try {
    const status = await request("GET", "/api/v3/intake/imap/status");
    assert.equal(status.body.configured, true);
    assert.ok(!JSON.stringify(status).includes(config().pass));
    assert.equal(
      (await request("POST", "/api/v3/intake/imap/sync")).status,
      401,
    );
    assert.equal(calls, 0);
    const result = await request(
      "POST",
      "/api/v3/intake/imap/sync",
      "Bearer " + config().token,
    );
    assert.equal(result.body.imported, 1);
    assert.ok(result.body.revision > 1);
    fail = true;
    const error = await request(
      "POST",
      "/api/v3/intake/imap/sync",
      "Bearer " + config().token,
    );
    assert.equal(error.status, 503);
    assert.ok(!JSON.stringify(error).includes(config().pass));
    fail=409;const conflict=await request("POST","/api/v3/intake/imap/sync","Bearer "+config().token);assert.equal(conflict.status,409);assert.ok(!JSON.stringify(conflict).includes(config().pass));
  } finally {
    api.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("IMAP : deux courriels sans Message-ID ne sont pas fusionnés sur le seul contenu", async () => {
  const raw = source()
    .toString()
    .replace(/Message-ID:.*\r\n/, "");
  const { store, service } = fixture(async () => ({
    validity: "10",
    messages: [
      { uid: 1, source: Buffer.from(raw) },
      { uid: 2, source: Buffer.from(raw) },
    ],
    more: false,
  }));
  assert.equal((await service.sync()).report.imported, 2);
  store.close();
});
test("Migration : aucun courriel fictif ajouté à une base réelle, curseurs et transport initialisés", () => {
  const old = state();
  old.pristine = false;
  delete old.intake.imap;
  old.intake.requests.forEach((r: any) => delete r.transport);
  const migrated = loadCore({ cached: old, sleepless: true }).CX.S;
  assert.equal(migrated.intake.imap.lastRun, null);
  assert.equal(migrated.intake.requests.length, old.intake.requests.length);
  assert.ok(migrated.intake.requests.every((r: any) => r.transport === null));
});
test("Serveur : un curseur IMAP ou une origine de courriel mal formés sont refusés", async () => {
  const { validateState } = await import("../server/v3-store.ts");
  const s = state();
  s.intake.imap.accounts.bad = { uid: -1, validity: "10" };
  assert.match(validateState(s) || "", /Curseur/);
  delete s.intake.imap.accounts.bad;
  s.intake.requests[0].transport = { provider: "imap", uid: 1 };
  assert.match(validateState(s) || "", /Origine/);
});

test("MIME : le texte tronqué est signalé et le contenu MIME complet distingue deux pièces différentes", async () => {
  const long = await decodeMail(source("a".repeat(25000)));
  assert.ok(long.raw.includes("Contenu abrégé"));
  assert.ok(long.raw.length < 25000);
  const first = await decodeMail(
    source("même début" + "a".repeat(25000) + "fin A"),
  );
  const second = await decodeMail(
    source("même début" + "a".repeat(25000) + "fin B"),
  );
  assert.notEqual(first.fingerprint, second.fingerprint);
  const encoded = Buffer.from(
    "Subject: Corps encodé\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" +
      Buffer.from("Dépannage batterie à Paris").toString("base64"),
  );
  assert.ok(
    (await decodeMail(encoded)).raw.includes("Dépannage batterie à Paris"),
  );
});

test('Demandes de démonstration : heures valides et datées même avant une heure du matin',()=>{
  const s=state();for(const r of s.intake.requests){assert.match(r.at,/^\d{4}-\d{2}-\d{2} ([01]\d|2[0-3]):[0-5]\d$/);assert.ok(Number.isFinite(Date.parse(r.at.replace(' ','T'))));assert.ok(Date.parse(r.at.replace(' ','T'))<=Date.now()+60000);}
});
