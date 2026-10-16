// Charge le socle MOTEK Dépann et les modules métier du dépannage (missions, parc,
// mandats, facturation, commandes, agent, tableau de bord) dans une VM Node, avec
// des coquilles minimales pour APP / BO / UI, afin de tester les règles sans navigateur.
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { loadCore } from "./v3-harness.ts";

const read = (f: string) => readFileSync(new URL("../motek/js/" + f, import.meta.url), "utf8");
const MODULES = ["30-missions.js", "32-parc.js", "34-mandats-assurances.js", "35-facturation-depannage.js", "36-commandes-fournisseurs.js", "37-agent-depannage.js", "38-parametres-depannage.js", "33-tableau-de-bord-depannage.js"];

export function loadDepannage() {
  const h = loadCore({ sleepless: true });
  const ctx: any = (h.CX as any).__ctx || null;
  // loadCore ne rend pas son contexte : on en recrée un qui partage le même CX.
  const toasts: string[] = [];
  const registered: any[] = [];
  const sandbox: any = {
    console, Date, Math, JSON, Intl, performance, setTimeout: () => 1, clearTimeout: () => {},
    CX: h.CX,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { webdriver: true },
    document: { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ addEventListener() {}, insertAdjacentElement() {}, remove() {}, style: {} }), body: { appendChild() {} }, addEventListener() {} },
    location: { hash: "", href: "" },
    innerWidth: 1400,
    APP: { register: (m: any) => registered.push(m), open() {}, refresh() {}, setParams() {}, modules: () => registered, onMode() {}, focusHandlers: [], setMode() {}, get mode() { return "bo"; } },
    UI: { toast: (t: string, s: string) => toasts.push(t + (s ? " · " + s : "")), icon: () => "", modal() {}, carPic: () => "", plate: () => "", av: () => "", truckIcon: () => "", logo: () => "" },
    BO: { icon: () => "", now() {}, formModal() {}, confirm() {}, compose() {}, drawer() {}, chip: () => "", plate: () => "", kpi: () => "", head: () => "", seg: () => "", tabs: () => "", table() {}, empty: () => "", dt: () => "", num: (x: number) => String(x), tvaLbl: () => "20 %", bindSeg() {}, bindSearch() {}, bindTabs() {}, micBtn: () => "", preview() {}, printHtml: () => "", pbar: () => "", download() {} },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of MODULES) vm.runInContext(read(f), sandbox, { filename: f });
  return { CX: h.CX as any, DEP: sandbox.DEP, toasts, registered, posts: h.posts };
}
