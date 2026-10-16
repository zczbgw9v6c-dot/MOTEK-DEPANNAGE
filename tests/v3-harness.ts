// Charge le socle de données MOTEK v3 (motek/js/01-socle…) dans une VM Node, avec un
// localStorage et un serveur en mémoire, pour tester les règles métier sans navigateur.
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../motek/js/01-socle-de-donnes-partag.js", import.meta.url), "utf8");
// Clé de cache déclarée par le socle (diffère entre MOTEK garage et MOTEK Dépannage).
export const KEY = (source.match(/const KEY = "([^"]+)"/) || [, "motek-v3"])[1];

export type Remote = { state: any; revision: number; conflictOnce?: boolean };

export function loadCore(opts: { cached?: any; revision?: number; remote?: Remote; sleepless?: boolean } = {}) {
  const values = new Map<string, string>();
  if (opts.cached) {
    values.set(KEY, JSON.stringify(opts.cached));
    values.set(KEY + ":rev", String(opts.revision ?? 0));
  }
  const remote: Remote = opts.remote || { state: null, revision: 0 };
  const posts: any[] = [];
  const ctx: any = {
    console, performance, Date, Math, JSON, Intl,
    setTimeout: opts.sleepless ? () => 1 : setTimeout,
    clearTimeout: opts.sleepless ? () => {} : clearTimeout,
    localStorage: {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => values.set(k, v),
      removeItem: (k: string) => values.delete(k),
    },
    EventSource: class { onmessage: any; onerror: any; },
    fetch: async (url: string, init?: any) => {
      if (init?.method === "POST" && url.endsWith("/state")) {
        const data = JSON.parse(init.body);
        posts.push(data);
        if (remote.conflictOnce) { remote.conflictOnce = false; return { status: 409, ok: false, json: async () => ({ error: "conflit" }) }; }
        if (!Number.isInteger(data.revision)) return { status: 400, ok: false, json: async () => ({ error: "révision manquante" }) };
        if (data.revision !== remote.revision) return { status: 409, ok: false, json: async () => ({ error: "conflit" }) };
        remote.state = structuredClone(data.state);
        remote.revision++;
        return { status: 200, ok: true, json: async () => ({ revision: remote.revision }) };
      }
      if (init?.method === "POST") return { status: 200, ok: true, json: async () => ({ revision: 0 }) };
      return { ok: true, status: 200, json: async () => structuredClone({ state: remote.state, revision: remote.revision }) };
    },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(source, ctx);
  return { CX: ctx.CX, posts, remote, values };
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
