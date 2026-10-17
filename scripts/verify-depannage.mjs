// Vérification navigateur de MOTEK Dépann.
// Prérequis : `npx playwright install chromium`, puis AUTOHUB_DB=.data/verify-dep.sqlite npm run dev
// Usage : node scripts/verify-depannage.mjs [http://127.0.0.1:5173]
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
const base = process.argv[2] || "http://127.0.0.1:5173";
const out = ".data/verify-depannage";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const results = [];
const step = async (name, fn) => {
  if (
    process.env.VERIFY_DEP_STEP &&
    !name.includes(process.env.VERIFY_DEP_STEP)
  )
    return;
  try {
    await page.evaluate(() => {
      UI.closeModals();
      BO.closeDrawer();
    });
    await fn();
    results.push([true, name]);
    console.log("✓ " + name);
  } catch (e) {
    results.push([false, name, e.message]);
    console.log("✗ " + name + " " + e.message.split("\n")[0]);
    await page.screenshot({path:`${out}/failure-${results.length}.png`}).catch(()=>{});
    await page.mouse.up().catch(()=>{});
    await page.keyboard.press("Escape").catch(()=>{});
    await page.setViewportSize({width:1500,height:1000}).catch(()=>{});
  }
};
const ev = (fn, arg) => page.evaluate(fn, arg);
const shot = (n) => page.screenshot({ path: `${out}/${n}.png` });
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const top = () =>
  ev(() => {
    const c = document.querySelector("#bo-content");
    if (c) c.scrollTop = 0;
  });

await page.goto(base + "/motek/");
await page.waitForTimeout(2500);
await ev(() => {
  localStorage.clear();
});
await Promise.all([
  page.waitForNavigation({ timeout: 20000 }).catch(() => {}),
  ev(() => {
    CX.reset();
    return true;
  }).catch(() => {}),
]);
await page.waitForTimeout(3000);

await step(
  "Parc live 3D : carte par défaut, véhicules gardés et dépôt des camions",
  async () => {
    await page.waitForFunction(
      () => window.PARC3D && PARC3D.counts && PARC3D.counts().cars > 0,
      null,
      { timeout: 15000 },
    );
    const s = await ev(() => ({
      mode: APP.mode,
      nomap: document.body.classList.contains("no-map"),
      map: !!document.querySelector("#view-map canvas"),
      ...PARC3D.counts(),
      park: DEP.inPark().length,
      trucks: CX.S.trucks.length,
    }));
    expect(
      s.mode === "map" && !s.nomap && s.map,
      "carte 3D affichée par défaut : " + JSON.stringify(s),
    );
    expect(
      s.cars === Math.min(s.park, 120) && s.trucks === 12,
      "véhicules du parc et camions dessinés : " + JSON.stringify(s),
    );
    const canvas = await ev(() => {
      const c = document.querySelector("#scene canvas");
      return { w: c.width, cw: c.clientWidth, sw: c.style.width };
    });
    expect(
      canvas.sw && canvas.cw === 1500,
      "canvas dimensionné à la fenêtre : " + JSON.stringify(canvas),
    );
    await shot("00-parc-live");
    const g = await ev(() => DEP.inPark()[0]);
    await ev((id) => PARC3D.select({ kind: "garde", id }), g.id);
    await page.waitForTimeout(400);
    expect(
      (await ev(() => document.querySelector("#detail").innerText)).includes(
        g.vehicle.plate,
      ),
      "fiche du véhicule sélectionné",
    );
    const t = await ev(() => CX.S.trucks[0]);
    await ev((id) => PARC3D.select({ kind: "truck", id }), t.id);
    await page.waitForTimeout(400);
    expect(
      (await ev(() => document.querySelector("#detail").innerText)).includes(
        t.name || t.plate,
      ),
      "fiche du camion sélectionné",
    );
    await ev(() => PARC3D.select({ kind: "office" }));
    await page.waitForTimeout(400);
    expect(
      /Moïse|Florence/.test(
        await ev(() => document.querySelector("#detail").innerText),
      ),
      "fiche du bureau avec les collaborateurs",
    );
    const steps = await ev(() => {
      const g = DEP.inPark().find((x) => x.step === "Non traité");
      PARC3D.select({ kind: "garde", id: g.id });
      document
        .querySelector('#detail [data-step="Expertise en attente"]')
        .click();
      return DEP.garde(g.id).step;
    });
    expect(
      steps === "Expertise en attente",
      "étape du dossier changée depuis la fiche 3D",
    );
    for (const z of ["N2", "DEPOT", "ALL"])
      await ev((z) => PARC3D.setPlace(z), z);
    const tabs = await ev(() =>
      [...document.querySelectorAll("#tabs [data-tab]")].map(
        (b) => b.dataset.tab,
      ),
    );
    expect(
      tabs.join() === "relance,new,missions,mails,fleet",
      "onglets du panneau : " + tabs.join(),
    );
    await ev(() => document.querySelector('#tabs [data-tab="fleet"]').click());
    expect(
      (await ev(() => document.querySelectorAll("#blist .ft").length)) === 12,
      "flotte visuelle dans le panneau",
    );
    expect(
      /\d+\/\d+/.test(
        await ev(() => document.querySelector("#track .trk-nav b").textContent),
      ),
      "défilement des missions en cours",
    );
    const kinds = await ev(
      () =>
        CX.S.trucks.filter(
          (t) =>
            t.kind === "Panier" && /Hilux/.test(t.brand) && t.year === 2025,
        ).length,
    );
    expect(kinds === 5, "cinq paniers Toyota Hilux 2025 : " + kinds);
    await ev(() => APP.setMode("bo"));
    await page.waitForTimeout(600);
  },
);

await step("Profil dépanneur : navigation sans modules atelier", async () => {
  const s = await ev(() => ({
    nav: document.querySelector(".bo-nav").innerText.replace(/\n+/g, " | "),
    profile: CX.S.company.profile,
    name: CX.S.company.name,
  }));
  for (const l of [
    "Missions",
    "Flotte & chauffeurs",
    "Parc de gardiennage",
    "Mandats & assurances",
    "Commandes fournisseurs",
    "Facturation",
    "Agent IA",
  ])
    expect(s.nav.includes(l), "module manquant : " + l);
  expect(
    /Joseph/.test(
      await ev(() => document.querySelector("header .user .un").textContent),
    ),
    "utilisateur Joseph",
  );
  for (const l of [
    "Ordres de réparation",
    "Peinture",
    "Showroom",
    "Poste technicien",
    "Planning atelier",
  ])
    expect(!s.nav.includes(l), "module atelier visible : " + l);
  expect(
    s.profile === "depannage" && /Dan Dépann/.test(s.name),
    "profil et société",
  );
  await top();
  await shot("01-tableau-de-bord");
});

await step("Tableau de bord : journée du dépanneur et assistant", async () => {
  const k = await ev(() =>
    [...document.querySelectorAll(".kpis.today .kpi .lb")].map(
      (x) => x.textContent,
    ),
  );
  for (const l of [
    "Missions en attente",
    "Camions sur la route",
    "Camions disponibles",
    "Véhicules au parc",
    "Terminées aujourd’hui",
    "Gardes à relancer",
  ])
    expect(k.includes(l), "indicateur manquant : " + l);
  const plate = await ev(() => DEP.inPark()[0].vehicle.plate);
  await page.fill("[data-voice] [data-vq]", "Où est la " + plate + " ?");
  await ev(() => document.querySelector("[data-voice] [data-vgo]").click());
  await page.waitForTimeout(300);
  expect(
    /place/.test(
      await ev(() => document.querySelector("[data-vout]").textContent),
    ),
    "l’assistant localise un véhicule au parc",
  );
  await page.fill("[data-voice] [data-vq]", "Camions disponibles");
  await ev(() => document.querySelector("[data-voice] [data-vgo]").click());
  await page.waitForTimeout(300);
  expect(
    /disponible/.test(
      await ev(() => document.querySelector("[data-vout]").textContent),
    ),
    "camions disponibles",
  );
});

await step(
  "Missions : création, affectation, sur place, remorquage, dépôt au parc, facturation",
  async () => {
    await ev(() => APP.open("missions"));
    await page.waitForTimeout(500);
    const n0 = await ev(() => CX.S.missions.length);
    await ev(() => document.querySelector("[data-new]").click());
    await page.waitForTimeout(300);
    await ev(() => {
      const set = (k, v) => {
        document.querySelector(`[name="${k}"]`).value = v;
      };
      set("address", "8 rue de Paradis, 75010 Paris");
      set("plate", "ZZ-999-ZZ");
      set("make", "Renault");
      set("model", "Clio");
      set("cname", "Test Client");
      set("cphone", "+33 6 00 00 00 00");
      document.querySelector("[name=priceConfirmed]").checked = true;
      document.querySelector("[data-ok]").click();
    });
    await page.waitForTimeout(400);
    const m = await ev(() => CX.S.missions[0]);
    expect(
      (await ev(() => CX.S.missions.length)) === n0 + 1 &&
        m.status === "Demandée" &&
        m.vehicle.plate === "ZZ-999-ZZ",
      "mission créée",
    );
    await ev(
      (id) =>
        DEP.assign(id, CX.S.trucks.find((t) => t.status === "Disponible").id),
      m.id,
    );
    await ev((id) => DEP.setMissionStatus(id, "En route"), m.id);
    await ev((id) => DEP.setMissionStatus(id, "Sur place"), m.id);
    await ev((id) => DEP.setMissionStatus(id, "Remorquage"), m.id);
    const st1 = await ev(
      (id) => ({
        s: DEP.mission(id).status,
        truck: DEP.truck(DEP.mission(id).truckId).status,
        arrived: !!DEP.mission(id).arrivedAt,
      }),
      m.id,
    );
    expect(
      st1.s === "Remorquage" && st1.truck === "En mission" && st1.arrived,
      "suivi de mission : " + JSON.stringify(st1),
    );
    const before = await ev(() => DEP.inPark().length);
    await ev((id) => DEP.depositToParc(id, "N2", "N2-39"), m.id);
    const st2 = await ev(
      (id) => ({
        s: DEP.mission(id).status,
        parked: DEP.inPark().length,
        truck: DEP.truck(DEP.mission(id).truckId).status,
        g: DEP.inPark().find((g) => g.slot === "N2-39"),
      }),
      m.id,
    );
    expect(
      st2.s === "Déposée au parc" &&
        st2.parked === before + 1 &&
        st2.truck === "Disponible" &&
        st2.g &&
        st2.g.vehicle.plate === "ZZ-999-ZZ",
      "dépôt au parc : " +
        JSON.stringify({ s: st2.s, parked: st2.parked, truck: st2.truck }),
    );
    await ev((id) => DEP.setMissionStatus(id, "Facturée"), m.id);
    expect(
      (await ev((id) => DEP.mission(id).status, m.id)) === "Facturée",
      "facturée",
    );
    await ev(() => APP.refresh());
    await page.waitForTimeout(400);
    await top();
    await shot("02-missions");
  },
);

await step(
  "Parc : plan des niveaux, statuts selon la durée, sortie avec frais",
  async () => {
    await ev(() => APP.open("parc"));
    await page.waitForTimeout(500);
    const p = await ev(() => ({
      slots: document.querySelectorAll(".parc-grid .slot").length,
      busy: document.querySelectorAll(".parc-grid .slot.busy").length,
      rel: DEP.inPark().filter((g) => g.status === "Relance à faire").length,
      ab: DEP.inPark().filter((g) => g.status === "Abandon présumé").length,
    }));
    expect(
      p.slots === 40 && p.busy > 0 && p.rel > 0 && p.ab > 0,
      "plan et statuts : " + JSON.stringify(p),
    );
    await top();
    await shot("03-parc");
    const g = await ev(() => {
      const g = DEP.inPark().find((x) => DEP.gardeDays(x) > 10);
      return { id: g.id, days: DEP.gardeDays(g), fees: DEP.gardeFees(g) };
    });
    expect(
      g.fees === g.days * 18 + 45,
      "frais = jours × 18 + 45 : " + JSON.stringify(g),
    );
    await ev((id) => APP.open("parc", { id }), g.id);
    await page.waitForTimeout(400);
    await ev(() => document.querySelector("[data-out]").click());
    await page.waitForTimeout(300);
    await ev(() => {
      document.querySelector('[name="who"]').value = "M. Test";
      document.querySelector("[data-ok]").click();
    });
    await page.waitForTimeout(400);
    const o = await ev(
      (id) => ({
        out: !!DEP.garde(id).outAt,
        status: DEP.garde(id).status,
        total: DEP.garde(id).total,
      }),
      g.id,
    );
    expect(
      o.out && o.status === "Restitué" && o.total === g.fees,
      "sortie enregistrée : " + JSON.stringify(o),
    );
  },
);

await step(
  "Flotte et agent IA : camions, chauffeurs, suggestions dépannage",
  async () => {
    await ev(() => APP.open("fleet"));
    await page.waitForTimeout(400);
    const f = await ev(() => ({
      cards: document.querySelectorAll(".fleet .kcar").length,
      icons: document.querySelectorAll(".fleet .kcar svg.tic").length,
    }));
    expect(
      f.cards === 12 && f.icons === 12,
      "flotte avec pictogrammes par type : " + JSON.stringify(f),
    );
    await ev(() => APP.open("fleet", { tab: "chauffeurs" }));
    await page.waitForTimeout(300);
    expect(
      (await ev(() => document.querySelectorAll(".techs .techbtn").length)) ===
        3,
      "trois dépanneurs confirmés",
    );
    await ev(() => APP.open("fleet", { tab: "bureau" }));
    await page.waitForTimeout(300);
    expect(
      (await ev(() => document.querySelectorAll(".staff").length)) === 3,
      "bureau : Joseph, Moïse et Florence",
    );
    await shot("04-flotte");
    await ev(() => APP.open("agent"));
    await page.waitForTimeout(500);
    const kinds = await ev(() => AGENT.suggest().map((x) => x.title));
    expect(
      kinds.some((t) => /Relancer|Abandon/.test(t)) &&
        kinds.some((t) => /Facturer MI-/.test(t)),
      "suggestions dépannage : " + kinds.slice(0, 4).join(" | "),
    );
    expect(
      !kinds.some((t) => /entretien · |Contrôle technique/.test(t)),
      "pas de suggestions atelier",
    );
  },
);

await step(
  "Mandats & assurances : statuts, demande de prise en charge, boîte mail simulée",
  async () => {
    await ev(() => APP.open("mandats"));
    await page.waitForTimeout(500);
    const m = await ev(() => ({
      n: DEP.mandats().length,
      mails: CX.S.insMail.length,
    }));
    expect(
      m.n > 5 && m.mails >= 4,
      "mandats et courriels : " + JSON.stringify(m),
    );
    const first = await ev(() => {
      const x = DEP.mandats().find((x) => x.ins.status === "À déclarer");
      return x && x.id;
    });
    expect(first, "un mandat à déclarer");
    await ev(
      (id) => DEP.setMandatStatus(id, "Prise en charge demandée"),
      first,
    );
    expect(
      (await ev(
        (id) => DEP.mandats().find((x) => x.id === id).ins.status,
        first,
      )) === "Prise en charge demandée",
      "statut changé",
    );
    const mail = await ev(() =>
      CX.S.insMail.find((x) => !x.handledAt && x.intent === "accord"),
    );
    expect(mail, "un courriel d’accord à traiter");
    await ev((id) => DEP.applyMail(id), mail.id);
    await page.waitForTimeout(300);
    const after = await ev((id) => {
      const ml = CX.S.insMail.find((x) => x.id === id);
      const md = DEP.mandats().find(
        (x) => x.ref === ml.ref || (x.vehicle && x.vehicle.plate === ml.plate),
      );
      return { handled: !!ml.handledAt, status: md && md.ins.status };
    }, mail.id);
    expect(
      after.handled && after.status === "Accordée",
      "courriel appliqué : " + JSON.stringify(after),
    );
    await ev(() => APP.open("mandats", { tab: "mail" }));
    await page.waitForTimeout(400);
    await top();
    await shot("05-mandats");
  },
);

await step(
  "Facturation dépanneur : libellés métier, facture de mission, encaissement",
  async () => {
    await ev(() => APP.open("invoices"));
    await page.waitForTimeout(500);
    const t = await ev(() => document.querySelector("#bo-content").innerText);
    expect(
      /Gardiennage|Remorquage|Dépannage/.test(t) &&
        !/bas de caisse|grêle|Peinture/.test(t),
      "libellés de dépannage, pas de carrosserie",
    );
    const m = await ev(() =>
      CX.S.missions.find(
        (x) => x.status === "Terminée" || x.status === "Déposée au parc",
      ),
    );
    const inv = await ev((id) => {
      const i = DEP.billMission(DEP.mission(id));
      return {
        no: i.no,
        ttc: i.ttc,
        lines: i.lines.map((l) => l.label),
        st: DEP.mission(id).status,
      };
    }, m.id);
    expect(
      inv.ttc > 0 &&
        inv.st === "Facturée" &&
        /Remorquage|Dépannage|intervention/.test(inv.lines[0]),
      "facture de mission : " + JSON.stringify(inv),
    );
    await ev((no) => {
      const i = DEP.invoices().find((x) => x.no === no);
      DEP.payInvoice(i, i.ttc, null, "VIR-TEST");
    }, inv.no);
    expect(
      (await ev(
        (no) => DEP.invoices().find((x) => x.no === no).status,
        inv.no,
      )) === "Payée",
      "encaissement",
    );
    await ev(() => APP.refresh());
    await page.waitForTimeout(400);
    await top();
    await shot("06-facturation");
  },
);

await step(
  "Commandes fournisseurs : besoin batterie → commande → e-mail au fournisseur → posée",
  async () => {
    await ev(() => APP.open("supply"));
    await page.waitForTimeout(500);
    const n0 = await ev(() => DEP.orders().length);
    await ev(() => {
      const m = CX.S.missions.find((x) => /batterie/i.test(x.kind));
      DEP.orderForm(null, {
        item: "Batterie 12 V 70 Ah L3 (Golf, 308)",
        plate: m.vehicle.plate,
        missionId: m.id,
        price: 119,
      });
    });
    await page.waitForTimeout(300);
    await ev(() => document.querySelector("[data-ok]").click());
    await page.waitForTimeout(300);
    const o = await ev(() => DEP.orders()[0]);
    expect(
      (await ev(() => DEP.orders().length)) === n0 + 1 &&
        o.status === "À commander",
      "commande créée",
    );
    await ev((id) => DEP.sendOrder("DS1", [id]), o.id);
    await page.waitForTimeout(300);
    const body = await ev(() =>
      document.querySelector('.mdl textarea, .mdl [name="body"]')
        ? document.querySelector('.mdl textarea, .mdl [name="body"]').value
        : "",
    );
    expect(
      /Batterie 12 V 70 Ah/.test(body) && /Claude Vellefaux/.test(body),
      "bon de commande préparé",
    );
    await ev(() =>
      document.querySelector(".mdl [data-send], .mdl [data-ok]").click(),
    );
    await page.waitForTimeout(300);
    expect(
      (await ev((id) => DEP.orders().find((x) => x.id === id).status, o.id)) ===
        "Commandée",
      "commande envoyée",
    );
    await ev((id) => {
      DEP.setOrderStatus(id, "Reçue");
      DEP.setOrderStatus(id, "Posée");
    }, o.id);
    expect(
      (await ev((id) => DEP.orders().find((x) => x.id === id).status, o.id)) ===
        "Posée",
      "batterie posée",
    );
    await ev(() => APP.refresh());
    await page.waitForTimeout(300);
    await top();
    await shot("07-commandes");
  },
);

await step(
  "Agent IA : courriels classés, relances, WhatsApp tracé",
  async () => {
    await ev(() => APP.open("agent", { tab: "mail" }));
    await page.waitForTimeout(500);
    const t = await ev(() => document.querySelector("#bo-content").innerText);
    expect(
      /Payés|Accordés|Pièces demandées|Refus/.test(t) &&
        /Relances à faire/.test(t),
      "classement des courriels et relances",
    );
    await ev(() => APP.open("agent", { tab: "wa" }));
    await page.waitForTimeout(400);
    const n0 = await ev(() => CX.S.waMsgs.length);
    await ev(() => {
      const g = DEP.inPark().find((x) => x.owner.phone);
      DEP.whatsapp({
        phone: g.owner.phone,
        name: g.owner.name,
        plate: g.vehicle.plate,
        kind: "recuperer",
        gardeId: g.id,
      });
    });
    await page.waitForTimeout(300);
    const txt = await ev(() => document.querySelector(".mdl [data-txt]").value);
    expect(
      /Claude Vellefaux/.test(txt) && /récupérer/.test(txt),
      "message WhatsApp préparé",
    );
    await ev(() => document.querySelector(".mdl [data-sent]").click());
    await page.waitForTimeout(300);
    expect((await ev(() => CX.S.waMsgs.length)) === n0 + 1, "message tracé");
    await top();
    await shot("08-agent");
  },
);

await step("Prise en main : visite page par page", async () => {
  await ev(() => TOUR.open(0));
  await page.waitForTimeout(800);
  expect(
    (await ev(() => APP.mode)) === "map" &&
      !!(await ev(() => document.querySelector(".coach"))),
    "première étape sur la carte",
  );
  const screens = [
    "map",
    "map",
    "map",
    "map",
    "dashboard",
    "missions",
    "planning-dep",
    "chauffeur",
    "parc",
    "mandats",
    "agent",
    "supply",
    "invoices",
    "map",
  ];
  expect(
    (await ev(() => TOUR.STEPS.length)) === screens.length,
    "nombre d’étapes documenté",
  );
  for (let k = 0; k < screens.length; k++) {
    if (k) {
      await page.locator(".coach [data-next]").click();
      await page.waitForTimeout(250);
    }
    const actual = await ev(() => (APP.mode === "map" ? "map" : APP.current));
    expect(
      actual === screens[k],
      `étape ${k + 1} : ${actual} attendu ${screens[k]}`,
    );
    expect(
      (await page.locator(".coach h3").textContent()).trim().length > 0,
      "titre de l’étape",
    );
  }
  await ev(() => TOUR.close(true));
  expect(!(await ev(() => document.querySelector(".coach"))), "carte fermée");
});

await step("Persistance : l’état est partagé entre deux pages", async () => {
  const p2 = await browser.newPage();
  await p2.goto(base + "/motek/");
  await p2.waitForTimeout(2500);
  expect(
    await p2.evaluate(() =>
      CX.S.missions.some((m) => m.vehicle.plate === "ZZ-999-ZZ"),
    ),
    "page B voit la mission créée",
  );
  await p2.close();
});

await step("Planning : réaffectation tactile et glisser-déposer", async () => {
  await ev(() => APP.open("planning-dep"));
  await page.waitForTimeout(300);
  expect(
    (await page.locator(".dispatch-lane").count()) === 12,
    "une ligne par camion",
  );
  const m = await ev(() => CX.S.missions.find((m) => m.status === "Affectée"));
  await page.locator(`[data-assign="${m.id}"]`).click();
  const free = await ev(() =>
    CX.S.trucks.find((t) => t.status === "Disponible"),
  );
  await page.locator('.mdl [name="truckId"]').selectOption(free.id);
  await page.locator(".mdl [data-ok]").click();
  expect(
    (await ev((id) => DEP.mission(id).truckId, m.id)) === free.id,
    "réaffectation enregistrée",
  );
  const target = await ev(() =>
    CX.S.trucks.find((t) => t.status === "Disponible"),
  );
  // Le déplacement HTML5 est piloté avec le même DataTransfer que le geste.
  // Un rerendu distant pendant un dragTo physique peut laisser Chromium en
  // session de drag et bloquer les clics des étapes suivantes.
  await ev(({id,truckId}) => {
    const card=document.querySelector(`[data-drag="${id}"]`);
    const lane=document.querySelector(`[data-truck="${truckId}"]`);
    const dataTransfer=new DataTransfer();
    card.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer}));
    lane.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer}));
    lane.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer}));
    card.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer}));
  }, {id:m.id,truckId:target.id});
  expect(
    (await ev((id) => DEP.mission(id).truckId, m.id)) === target.id,
    "déplacement entre camions",
  );
  await shot("09-planning");
});
await step(
  "Poste chauffeur : téléphone, photo locale, étapes et entrée au parc en un geste",
  async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const m = await ev(() =>
      CX.S.missions.find((m) => m.status === "Affectée"),
    );
    await ev(() => APP.open("chauffeur"));
    await page.waitForTimeout(250);
    await page.locator("[data-driver]").selectOption(m.driverId);
    expect(
      (await page.locator("#bo-content").innerText()).includes(m.vehicle.plate),
      "ses missions",
    );
    expect(
      (await page.locator('.driver-actions a[href^="tel:"]').count()) > 0,
      "appel du client",
    );
    const file = page.locator(`[data-photo="${m.id}"]`);
    await file.setInputFiles({
      name: "photo-demo.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlJkAAAAASUVORK5CYII=",
        "base64",
      ),
    });
    await page.waitForFunction((id) => DEP.mission(id).photos.length > 0, m.id);
    for (const status of ["En route", "Sur place", "Remorquage"]) {
      await page.locator(`[data-status="${m.id}|${status}"]`).click();
      await page.waitForTimeout(180);
    }
    await shot("10-chauffeur-phone");
    const n = await ev(() => DEP.inPark().length);
    await page.locator(`[data-deposit="${m.id}"]`).click();
    expect(
      (await ev(() => DEP.inPark().length)) === n + 1,
      "une seule garde créée",
    );
    expect(
      (await ev((id) => DEP.mission(id).status, m.id)) === "Déposée au parc",
      "mission déposée",
    );
    expect(
      await ev(() => document.documentElement.scrollWidth <= innerWidth),
      "pas de débordement sur téléphone",
    );
    await page.setViewportSize({ width: 1500, height: 1000 });
  },
);
await step(
  "Parc : reçu imprimable et relance groupée sans envoi automatique",
  async () => {
    const g = await ev(() => CX.S.gardes.find((g) => g.outAt && g.release));
    await ev((id) => APP.open("parc", { id }), g.id);
    await page.waitForTimeout(300);
    await page.locator("[data-receipt]").click();
    await page.waitForTimeout(200);
    expect(
      (await page.locator(".mdl").innerText()).includes("Reçu de sortie"),
      "aperçu du reçu",
    );
    await ev(() => UI.closeModals());
    await ev(() => APP.open("parc"));
    await page.locator("[data-group]").click();
    await page.locator(".mdl [data-ok]").click();
    await page.waitForTimeout(250);
    expect(
      (await page.locator(".mdl textarea").inputValue()).includes(
        "véhicules",
      ) || (await page.locator(".mdl textarea").inputValue()).includes("jours"),
      "dossiers regroupés",
    );
    await ev(() => UI.closeModals());
  },
);
await step(
  "Assureurs : synthèse par compagnie et paiement annoncé sans encaissement",
  async () => {
    await ev(() => APP.open("mandats", { tab: "compagnies" }));
    await page.waitForTimeout(250);
    const text = await page.locator("#bo-content").textContent();
    for (const label of ["Attente d’accord", "Impayés TTC", "Délai moyen"])
      expect(text.includes(label), "synthèse " + label);
    const ok = await ev(() => {
      const mail = CX.S.insMail.find(
          (m) => m.intent === "paiement" && !m.handledAt,
        ),
        before = JSON.stringify(CX.S.dinvoices);
      if (!mail) return false;
      DEP.applyMail(mail.id);
      return before === JSON.stringify(CX.S.dinvoices);
    });
    expect(ok, "aucun règlement créé par un courriel");
  },
);
await step(
  "Facturation : acompte, avoir, export équilibré et absence de doublon",
  async () => {
    const result = await ev(() => {
      const m = CX.S.missions.find(
          (m) =>
            ["Terminée", "Déposée au parc"].includes(m.status) &&
            m.insurance?.status !== "Refusée",
        ),
        a = DEP.recordDeposit(m.id, 12, CX.util.today(), "AC-TEST"),
        i = DEP.billMission(m),
        c = DEP.creditInvoice(
          i.id,
          DEP.invoiceBalance(i),
          "Erreur démonstration",
        );
      return {
        a: !!a,
        paid: i.paid,
        credit: c.ttc,
        balance: DEP.invoiceBalance(i),
        csv: DEP.accountingCSV(),
        double: DEP.billMission(m),
      };
    });
    expect(
      result.a &&
        result.paid === 12 &&
        result.credit < 0 &&
        result.balance === 0 &&
        !result.double,
      "acompte et avoir",
    );
    const rows = result.csv
        .replace(/^\uFEFF/, "")
        .split("\r\n")
        .slice(1)
        .map((r) =>
          r
            .match(/"(?:[^"]|"")*"/g)
            .map((x) => x.slice(1, -1).replace(/""/g, '"')),
        ),
      total = rows.reduce(
        (a, r) =>
          a + Number(r[5].replace(",", ".")) - Number(r[6].replace(",", ".")),
        0,
      );
    expect(Math.abs(total) < 0.01, "journal VE équilibré au centime");
    await ev(() => APP.open("invoices"));
    const download = page.waitForEvent("download");
    await page.locator("[data-export]").click();
    expect(
      (await download).suggestedFilename().endsWith(".csv"),
      "export téléchargeable",
    );
  },
);
await step("Compteurs : chaque indicateur ouvre sa liste filtrée", async () => {
  await ev(() => APP.open("dashboard"));
  await page.waitForTimeout(200);
  expect(
    (await page.locator(".kpis.today .kpi[data-open]").count()) === 6,
    "six indicateurs accessibles",
  );
  await page
    .locator(".kpis.today .kpi")
    .filter({ hasText: "Missions en attente" })
    .click();
  await page.waitForTimeout(200);
  expect((await ev(() => APP.current)) === "missions", "liste missions");
  const expected = await ev(
    () => CX.S.missions.filter((m) => m.status === "Demandée").length,
  );
  expect(
    (await page.locator(".mcard").count()) === expected,
    "filtre des demandes exact",
  );
});
await step(
  "3D : objet conservé sur une note, seul le véhicule modifié est reconstruit",
  async () => {
    const ok = await ev(() => {
      const [g1, g2] = DEP.inPark(),
        a = PARC3D.objectFor("g:" + g1.id),
        b = PARC3D.objectFor("g:" + g2.id);
      g1.history.push({ at: CX.now(), text: "Note sans changement visuel" });
      PARC3D.build();
      if (PARC3D.objectFor("g:" + g1.id) !== a) return false;
      g1.step = g1.step === "Expertisé" ? "Non traité" : "Expertisé";
      PARC3D.build();
      return (
        PARC3D.objectFor("g:" + g1.id) !== a &&
        PARC3D.objectFor("g:" + g2.id) === b
      );
    });
    expect(ok, "mise à jour différentielle");
  },
);
await step(
  "iPad paysage et portrait : carte et panneaux accessibles, sans débordement",
  async () => {
    for (const [w, h] of [
      [1180, 820],
      [820, 1180],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      await ev(() => APP.setMode("map"));
      await page.waitForTimeout(800);
      const dims = await ev(() => {
        const b = document.querySelector(".board").getBoundingClientRect(),
          header = document.querySelector("header.top").getBoundingClientRect();
        return {
          display: getComputedStyle(document.querySelector(".board")).display,
          bottom: b.bottom,
          width: b.width,
          scroll: document.documentElement.scrollWidth,
          inner: innerWidth,
          header: header.right,
        };
      });
      expect(
        dims.display !== "none" && dims.bottom <= h && dims.width <= w,
        "panneau bas visible " + JSON.stringify(dims),
      );
      expect(dims.scroll <= w, "largeur iPad " + JSON.stringify(dims));
      await shot(`11-ipad-${w}-parc`);
      await ev(() => PARC3D.setPlace("N1"));
      await page.waitForTimeout(1400);
      expect(
        await ev(() => {
          const c = PARC3D.camera;
          return [
            [-76, 11],
            [7, 11],
            [-76, 37],
            [7, 37],
          ].every(([x, z]) => {
            const p = c.position.clone().set(x, 0, z).project(c);
            return Math.abs(p.x) < 0.96 && Math.abs(p.y) < 0.8;
          });
        }),
        "niveau -1 et son panneau cadrés sur iPad",
      );

      await ev(() => APP.open("chauffeur"));
      await page.waitForTimeout(200);
      await shot(`12-ipad-${w}-chauffeur`);
    }
    await page.setViewportSize({ width: 1500, height: 1000 });
  },
);

await step(
  "Commercial : brouillon 50 €, export local, relevé et prospect distincts",
  async () => {
    await ev(() => APP.open("acquisition"));
    await page.waitForTimeout(300);
    await page.click("#bo-content [data-campaign]");
    await page.waitForSelector(".mdl [name=budget]");
    expect(
      (await page.inputValue(".mdl [name=budget]")) === "50",
      "budget total par défaut",
    );
    await page.click(".mdl [data-ok]");
    const c = await ev(() => CX.S.marketing.campaigns[0]);
    expect(
      c.budget === 50 && c.days === 5 && c.metrics === null,
      "brouillon sans statistiques inventées",
    );
    await page.click('#bo-content [data-campaign-detail="' + c.id + '"]');
    await page.click("[data-validate]");
    const download = page.waitForEvent("download");
    await page.click("[data-export]");
    const exported = await download;
    expect(
      exported.suggestedFilename() === c.id + ".json",
      "export réel du brouillon",
    );
    await shot("13-commercial-brouillon");
    await ev(() => {
      UI.closeModals();
      BO.closeDrawer();
    });
    await ev(
      (id) =>
        DEP.commercial.metrics(
          CX.S.marketing.campaigns.find((c) => c.id === id),
          {
            spend: 12,
            clicks: 24,
            source: "Relevé fictif de vérification, saisie manuelle",
          },
        ),
      c.id,
    );
    expect(
      (await ev(() => CX.S.marketing.leads.length)) === 0,
      "24 clics ne créent pas 24 prospects",
    );
    await ev(() => APP.open("acquisition", { tab: "leads" }));
    await page.click("#bo-content [data-lead]");
    await page.fill(".mdl [name=name]", "Contact de vérification");
    await page.fill(".mdl [name=phone]", "0600000000");
    await page.fill(".mdl [name=source]", "Appel fictif de vérification");
    await page.click(".mdl [data-ok]");
    await page.selectOption("[data-stage]", "À rappeler");
    expect(
      (await ev(() => CX.S.marketing.leads[0].status)) === "À rappeler",
      "suivi manuel du prospect",
    );
    await shot("14-commercial-prospects");
  },
);
await step("Commercial : catalogue sourcé et lisibilité iPad", async () => {
  await ev(() => APP.open("acquisition", { tab: "services" }));
  expect(
    (await page.locator("#bo-content [data-approve]").count()) === 14,
    "14 prestations sourcées",
  );
  for (const [width, height] of [
    [1500, 1000],
    [1180, 820],
    [820, 1180],
  ]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(250);
    expect(
      await ev(() => document.documentElement.scrollWidth <= innerWidth),
      "pas de débordement commercial",
    );
    await shot("15-commercial-catalogue-" + width);
  }
  await page.setViewportSize({ width: 1500, height: 1000 });
});

await browser.close();
const failed = results.filter((r) => !r[0]);
if (errors.length)
  console.log("Erreurs de page : " + errors.slice(0, 3).join(" | "));
console.log(
  `\n${results.length - failed.length}/${results.length} étapes réussies · captures dans ${out}/`,
);
writeFileSync(
  `${out}/results.json`,
  JSON.stringify({ results, errors }, null, 2),
);
if (failed.length || errors.length) process.exit(1);
