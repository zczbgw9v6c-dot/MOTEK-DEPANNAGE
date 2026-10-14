// Persistance serveur de l’état MOTEK v3 (back-office + atelier live) : un document JSON
// versionné dans la même base SQLite que l’application, partagé entre tous les écrans.
import { DatabaseSync } from "node:sqlite";

export type V3Snapshot = {
  state: unknown | null;
  revision: number;
  updatedAt: string | null;
};

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
  /** Remplace l’état. `expected` (révision connue du client) protège contre l’écrasement d’un écran plus récent. */
  write(state: unknown, expected?: number, now = Date.now()): V3Snapshot {
    if (!state || typeof state !== "object" || Array.isArray(state))
      throw Object.assign(Error("État invalide."), { status: 400 });
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
  reset() {
    this.sql.exec("DELETE FROM v3state; DELETE FROM v3history;");
  }
  close() {
    this.sql.close();
  }
}
