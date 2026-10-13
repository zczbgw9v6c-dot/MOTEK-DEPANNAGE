import { DatabaseSync } from "node:sqlite";
import { seed, loadDB, type DB } from "../src/domain.ts";
import {
  toggleWork,
  pauseWork,
  finishWork,
  approveRequest,
  resolveIssue,
  reportIssue,
  requestPart,
} from "../src/workshop-domain.ts";
import { applyVoice, proposeVoice } from "../src/voice-domain.ts";
import { planningAlerts } from "../src/planning-domain.ts";
function activeDemo() {
  const db = seed();
  const now = Date.now();
  for (const [index, id] of ["v1", "v5", "v6"].entries()) {
    const state = db.workshop![id];
    state.elapsed = 0;
    state.runningSince = new Date(now - (20 + index * 7) * 60000).toISOString();
    state.events = [
      {
        type: "start",
        at: state.runningSince,
        reason: "Session de démonstration fictive",
      },
    ];
  }
  return db;
}
export type Snapshot = { db: DB; revision: number; serverNow: number };
export class Store {
  sql: DatabaseSync;
  constructor(file: string, initial: () => DB = activeDemo) {
    this.sql = new DatabaseSync(file);
    this.sql.exec(
      "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS state(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY, response TEXT NOT NULL); CREATE TABLE IF NOT EXISTS history(revision INTEGER PRIMARY KEY,payload TEXT NOT NULL,at TEXT NOT NULL);",
    );
    if (!this.sql.prepare("SELECT id FROM state WHERE id=1").get())
      this.sql
        .prepare("INSERT INTO state VALUES(1,0,?)")
        .run(JSON.stringify(initial()));
  }
  read(): Snapshot {
    const row = this.sql
      .prepare("SELECT revision,payload FROM state WHERE id=1")
      .get()!;
    return {
      db: loadDB(String(row.payload)),
      revision: Number(row.revision),
      serverNow: Date.now(),
    };
  }
  change(
    request: {
      requestId: string;
      revision: number;
      type: string;
      vehicle?: string;
      payload?: any;
    },
    now = Date.now(),
  ): Snapshot {
    if (!/^[a-zA-Z0-9-]{5,100}$/.test(request.requestId))
      throw Error("Identifiant de requête invalide.");
    const oldReceipt = this.sql
      .prepare("SELECT response FROM receipts WHERE id=?")
      .get(request.requestId);
    if (oldReceipt)
      return { ...JSON.parse(String(oldReceipt.response)), serverNow: now };
    this.sql.exec("BEGIN IMMEDIATE");
    try {
      const previous = this.read();
      if (previous.revision !== request.revision)
        throw Object.assign(
          Error(
            "Les données ont changé sur un autre écran. Actualisez avant de confirmer.",
          ),
          { status: 409 },
        );
      let next = previous.db;
      const id = request.vehicle || "",
        p = request.payload || {};
      if (request.type === "snapshot") {
        next = loadDB(JSON.stringify(p.db));
        for (const v of previous.db.vehicles) {
          const old = previous.db.workshop?.[v.id],
            updated = next.workshop?.[v.id];
          if (
            old &&
            updated &&
            (old.runningSince !== updated.runningSince ||
              old.elapsed !== updated.elapsed)
          )
            throw Error(
              "Utilisez une action atelier pour modifier le chronomètre serveur.",
            );
        }
        for (const a of planningAlerts(next)) {
          if (
            ["technician_conflict", "resource_conflict", "skill"].includes(
              a.code,
            ) &&
            !planningAlerts(previous.db).some(
              (old) => old.code === a.code && old.appointment === a.appointment,
            )
          )
            throw Error(a.message);
        }
      } else if (request.type === "start") {
        if (!next.workshop?.[id]?.runningSince)
          next = toggleWork(next, id, now);
      } else if (request.type === "pause")
        next = pauseWork(
          next,
          id,
          String(p.reason || "Pause manuelle"),
          false,
          now,
        );
      else if (request.type === "finish") next = finishWork(next, id, now);
      else if (request.type === "voice")
        next = applyVoice(
          next,
          id,
          String(p.text || ""),
          String(p.mode || "command"),
          p.confirmed === true,
          now,
        );
      else if (request.type === "request")
        next = requestPart(
          next,
          id,
          String(p.part || ""),
          Number(p.quantity || 1),
          now,
        );
      else if (request.type === "issue")
        next = reportIssue(
          next,
          id,
          String(p.text || ""),
          "Incident mécanique",
          now,
        );
      else if (request.type === "approve")
        next = approveRequest(
          next,
          id,
          String(p.requestId || ""),
          p.compatibilityConfirmed === true,
          now,
        );
      else if (request.type === "resolve")
        next = resolveIssue(
          next,
          id,
          String(p.issueId || ""),
          String(p.decision || ""),
          now,
        );
      else if (request.type === "import") next = loadDB(JSON.stringify(p.db));
      else if (request.type === "reset") next = activeDemo();
      else throw Error("Action inconnue.");
      const previousAudit = new Set(previous.db.audit.map((a) => a.id));
      next = {
        ...next,
        audit: next.audit.map((a) =>
          previousAudit.has(a.id)
            ? a
            : { ...a, at: new Date(now).toISOString() },
        ),
      };
      next = loadDB(JSON.stringify(next));
      for (const vehicle of next.vehicles) {
        if (
          ["Prêt à livrer", "Livré"].includes(vehicle.status) &&
          !vehicle.quality
        )
          throw Error("Contrôle qualité requis avant restitution.");
        const old = previous.db.vehicles.find((v) => v.id === vehicle.id);
        if (
          request.type !== "import" &&
          request.type !== "reset" &&
          vehicle.status === "Livré" &&
          old &&
          old.status !== "Prêt à livrer" &&
          old.status !== "Livré"
        )
          throw Error(
            "Le véhicule doit passer en prêt à livrer avant livraison.",
          );
      }
      const bays = next.vehicles
        .filter(
          (v) => v.present !== false && v.status !== "Livré" && v.bay !== null,
        )
        .map((v) => v.bay);
      if (new Set(bays).size !== bays.length)
        throw Error("Un pont physique ne peut pas accueillir deux véhicules.");
      for (const p of next.parts)
        if (p.stock < 0 || p.reserved < 0 || p.reserved > p.stock)
          throw Error("Mouvement de stock invalide.");
      const result = {
        db: next,
        revision: previous.revision + 1,
        serverNow: now,
      };
      this.sql
        .prepare("INSERT INTO history VALUES(?,?,?)")
        .run(
          previous.revision,
          JSON.stringify(previous.db),
          new Date(now).toISOString(),
        );
      this.sql
        .prepare("DELETE FROM history WHERE revision < ?")
        .run(Math.max(0, result.revision - 20));
      this.sql
        .prepare("UPDATE state SET revision=?,payload=? WHERE id=1")
        .run(result.revision, JSON.stringify(next));
      this.sql
        .prepare("INSERT INTO receipts VALUES(?,?)")
        .run(request.requestId, JSON.stringify(result));
      this.sql.exec(
        "DELETE FROM receipts WHERE rowid IN (SELECT rowid FROM receipts ORDER BY rowid DESC LIMIT -1 OFFSET 256)",
      );
      this.sql.exec("COMMIT");
      return result;
    } catch (e) {
      this.sql.exec("ROLLBACK");
      throw e;
    }
  }
  close() {
    this.sql.close();
  }
}
