// Persistance serveur de l’état MOTEK v3 (back-office + atelier live) : un document JSON
// versionné dans la même base SQLite que l’application, partagé entre tous les écrans.
import { DatabaseSync } from "node:sqlite";

export type V3Snapshot = {
  state: unknown | null;
  revision: number;
  updatedAt: string | null;
};

const COLLECTIONS = ["customers", "vehicles", "ros", "quotes", "invoices", "payments", "parts", "orders", "appts", "staff"] as const;
const PHOTO_SRC = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
/**
 * Contrôle de forme et d’invariants simples de l’état v3. Retourne un message en cas de refus.
 * Les règles métier fines restent dans l’application ; ici on bloque les documents arbitraires,
 * les identifiants en double et les contenus de photo non issus du navigateur.
 */
export function validateState(state: unknown): string | null {
  if (!state || typeof state !== "object" || Array.isArray(state)) return "document attendu";
  const st = state as Record<string, unknown>;
  if (st.v !== 1) return "version inconnue";
  if (!st.company || typeof st.company !== "object") return "société manquante";
  for (const c of COLLECTIONS) {
    const arr = st[c];
    if (!Array.isArray(arr)) return "collection " + c + " manquante";
    const ids = new Set<string>();
    for (const item of arr as unknown[]) {
      if (!item || typeof item !== "object") return "élément invalide dans " + c;
      const id = (item as { id?: unknown }).id;
      if (typeof id !== "string" || !id || id.length > 64) return "identifiant invalide dans " + c;
      if (ids.has(id)) return "identifiant en double dans " + c + " : " + id;
      ids.add(id);
    }
  }
  for (const r of st.ros as { id: string; photos?: unknown }[]) {
    if (r.photos === undefined) continue;
    if (!Array.isArray(r.photos)) return "photos invalides sur " + r.id;
    for (const p of r.photos as { src?: unknown }[]) {
      if (p && p.src !== undefined && p.src !== null && (typeof p.src !== "string" || !PHOTO_SRC.test(p.src)))
        return "photo non reconnue sur " + r.id;
    }
  }
  for (const i of st.invoices as { id: string; amount?: unknown; paid?: unknown }[]) {
    if (typeof i.amount !== "number" || !Number.isFinite(i.amount) || i.amount < 0) return "montant invalide sur " + i.id;
    if (typeof i.paid !== "number" || !Number.isFinite(i.paid) || i.paid < -0.01 || i.paid > i.amount + 0.01) return "règlement incohérent sur " + i.id;
  }
  return null;
}

export class V3Store {
  sql: DatabaseSync;
  constructor(file: string) {
    this.sql = new DatabaseSync(file);
    this.sql.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS v3state(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS v3history(revision INTEGER PRIMARY KEY, payload TEXT NOT NULL, at TEXT NOT NULL);",
    );
  }
  read(): V3Snapshot {
    const row = this.sql
      .prepare("SELECT revision, payload, updated_at FROM v3state WHERE id=1")
      .get();
    if (!row) return { state: null, revision: 0, updatedAt: null };
    return {
      state: JSON.parse(String(row.payload)),
      revision: Number(row.revision),
      updatedAt: String(row.updated_at),
    };
  }
  /** Remplace l’état. `expected` (révision connue du client) est obligatoire : sans elle, un écran pourrait écraser un plus récent. */
  write(state: unknown, expected: number | undefined, now = Date.now()): V3Snapshot {
    if (!Number.isInteger(expected) || (expected as number) < 0)
      throw Object.assign(Error("Révision manquante : rechargez l’écran avant d’enregistrer."), { status: 400 });
    const problem = validateState(state);
    if (problem) throw Object.assign(Error("État refusé : " + problem), { status: 400 });
    const payload = JSON.stringify(state);
    if (payload.length > 12 * 1024 * 1024)
      throw Object.assign(Error("État trop volumineux."), { status: 413 });
    this.sql.exec("BEGIN IMMEDIATE");
    try {
      const current = this.read();
      if (expected !== undefined && current.revision !== expected)
        throw Object.assign(
          Error(
            "Les données ont changé sur un autre écran. Actualisez avant de confirmer.",
          ),
          { status: 409 },
        );
      const revision = current.revision + 1,
        at = new Date(now).toISOString();
      if (current.state) {
        this.sql
          .prepare("INSERT OR REPLACE INTO v3history VALUES(?,?,?)")
          .run(current.revision, JSON.stringify(current.state), at);
        this.sql
          .prepare("DELETE FROM v3history WHERE revision < ?")
          .run(Math.max(0, revision - 20));
      }
      this.sql
        .prepare(
          "INSERT INTO v3state VALUES(1,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision, payload=excluded.payload, updated_at=excluded.updated_at",
        )
        .run(revision, payload, at);
      this.sql.exec("COMMIT");
      return { state, revision, updatedAt: at };
    } catch (e) {
      this.sql.exec("ROLLBACK");
      throw e;
    }
  }
  /** Réinitialisation : l’état courant est conservé dans l’historique (restauration possible), seule la version vivante est effacée. */
  reset(now = Date.now()) {
    this.sql.exec("BEGIN IMMEDIATE");
    try {
      const current = this.read();
      if (current.state)
        this.sql
          .prepare("INSERT OR REPLACE INTO v3history VALUES(?,?,?)")
          .run(current.revision, JSON.stringify(current.state), new Date(now).toISOString());
      this.sql.exec("DELETE FROM v3state");
      this.sql.exec("COMMIT");
    } catch (e) {
      this.sql.exec("ROLLBACK");
      throw e;
    }
  }
  /** Dernières versions conservées (révision, date), la plus récente d’abord. */
  history(): { revision: number; at: string }[] {
    return this.sql
      .prepare("SELECT revision, at FROM v3history ORDER BY revision DESC LIMIT 20")
      .all()
      .map((r) => ({ revision: Number(r.revision), at: String(r.at) }));
  }
  /** Restaure une version de l’historique comme nouvel état (nouvelle révision). */
  restore(revision: number, now = Date.now()): V3Snapshot {
    const row = this.sql.prepare("SELECT payload FROM v3history WHERE revision=?").get(revision);
    if (!row) throw Object.assign(Error("Version inconnue."), { status: 404 });
    return this.write(JSON.parse(String(row.payload)), this.read().revision, now);
  }
  close() {
    this.sql.close();
  }
}
