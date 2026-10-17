/* ==========================================================================
   MOTEK — socle de données partagé (atelier 3D + back-office)
   window.CX : état S (localStorage), événements, actions métier, calculs.
   Toute modification passe par une action CX.* qui émet un événement :
   la carte 3D et le back-office restent synchronisés.
   ========================================================================== */
(function () {
  const KEY = "motek-dep-v1";

  /* ---------------- helpers dates / formats ---------------- */
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) =>
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const today = () => iso(new Date());
  const parse = (s) => {
    const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d, 12);
  };
  const addDays = (s, n) => {
    const d = parse(s);
    d.setDate(d.getDate() + n);
    return iso(d);
  };
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
  const weekStart = (s) => {
    const d = parse(s);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return iso(d);
  };
  const isWeekend = (s) => {
    const g = parse(s).getDay();
    return g === 0 || g === 6;
  };
  /** prochain jour ouvré à partir de today()+n (n peut être négatif) */
  const wd = (n) => {
    let d = today(),
      k = 0;
    const st = n >= 0 ? 1 : -1;
    if (n === 0) return d;
    while (k < Math.abs(n)) {
      d = addDays(d, st);
      if (!isWeekend(d)) k++;
    }
    return d;
  };
  const fmtDate = (s, o = { day: "numeric", month: "short" }) =>
    s ? parse(s).toLocaleDateString("fr-FR", o) : "—";
  const fmtD = (s) =>
    s
      ? parse(s).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";
  const hm = (m) => pad(Math.floor(m / 60)) + ":" + pad(Math.floor(m % 60));
  const toMin = (s) => {
    const [h, m] = String(s).split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const chf = (n) => Math.round(n || 0).toLocaleString("fr-FR") + " €";
  const chf2 = (n) =>
    (Math.round((n || 0) * 100) / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €";
  const chfK = (n) =>
    Math.abs(n) >= 1e4
      ? (Math.round(n / 100) / 10).toLocaleString("fr-FR") + " k€"
      : chf(n);
  const round5 = (n) => Math.round((n || 0) * 100) / 100; // arrondi au centime (ex-au centime)
  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  let uidN = 0;
  const uid = (p) =>
    (p || "x") +
    Date.now().toString(36).slice(-5) +
    (uidN++).toString(36) +
    Math.random().toString(36).slice(2, 5);
  const hash = (s) => {
    let h = 2166136261;
    for (const c of String(s)) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  const rng = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  /* ---------------- horloge simulée (partagée carte / back-office) ---------------- */
  const T0 = performance.now(),
    SIM0 = (() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; })(); // heure réelle de l'appareil
  const nowMin = () => SIM0 + (performance.now() - T0) / 60000;
  const now = () => today() + " " + hm(nowMin()); // 'YYYY-MM-DD HH:MM'
  const dt = (off, t) => wd(off) + " " + t; // jour ouvré relatif + heure
  const dtc = (off, t) => addDays(today(), off) + " " + t; // jour calendaire relatif
  const dOf = (s) => String(s || "").slice(0, 10);
  const tOf = (s) => String(s || "").slice(11, 16);

  /* ---------------- référentiels ---------------- */
  const TVA = 0.2;
  const STAGES = [
    { k: "rdv", l: "Rendez-vous", s: "RDV", ic: "cal", map: 0, c: "#8a919a" },
    {
      k: "recep",
      l: "Réception / expertise",
      s: "Réception",
      ic: "key",
      map: 1,
      c: "#6b7280",
    },
    { k: "devis", l: "Devis", s: "Devis", ic: "file", map: 1, c: "#6b7280" },
    {
      k: "accord",
      l: "Accord assurance / client",
      s: "Accord",
      ic: "shield",
      map: 1,
      c: "#b96400",
    },
    {
      k: "pieces",
      l: "Commande pièces",
      s: "Pièces",
      ic: "box",
      map: 2,
      c: "#b96400",
    },
    {
      k: "demont",
      l: "Démontage",
      s: "Démontage",
      ic: "wrench",
      map: 2,
      c: "#1768ee",
    },
    {
      k: "tole",
      l: "Tôlerie / marbre",
      s: "Tôlerie",
      ic: "hammer",
      map: 2,
      c: "#1768ee",
    },
    {
      k: "prep",
      l: "Préparation",
      s: "Prépa",
      ic: "layers",
      map: 3,
      c: "#1768ee",
    },
    {
      k: "peint",
      l: "Peinture (cabine)",
      s: "Peinture",
      ic: "spray",
      map: 3,
      c: "#1157c4",
    },
    {
      k: "remont",
      l: "Remontage",
      s: "Remontage",
      ic: "wrench",
      map: 4,
      c: "#1768ee",
    },
    {
      k: "cq",
      l: "Contrôle qualité",
      s: "CQ",
      ic: "check",
      map: 4,
      c: "#4b5563",
    },
    { k: "lavage", l: "Lavage", s: "Lavage", ic: "drop", map: 4, c: "#4b5563" },
    {
      k: "pret",
      l: "Prêt / livraison",
      s: "Prêt",
      ic: "car",
      map: 5,
      c: "#1b8a4b",
    },
    {
      k: "facture",
      l: "Facturé",
      s: "Facturé",
      ic: "invoice",
      map: 5,
      c: "#22252b",
    },
  ];
  const ST = Object.fromEntries(STAGES.map((s, i) => [s.k, i]));
  const MAP_STAGES = [
    "Réception",
    "Expertise",
    "Carrosserie",
    "Peinture",
    "Contrôle",
    "Restitution",
  ];

  const OPS = {
    E: "Remplacer",
    I: "Réparer",
    L: "Peindre",
    DM: "Démonter / remonter",
    F: "Forfait",
  };
  const CATS = {
    T1: "T1 · Mécanique / démontage",
    T2: "T2 · Tôlerie",
    T3: "T3 · Structure / marbre / alu",
  };

  /** Zones du schéma de carrosserie (vue de dessus, avant en haut). */
  const CAR_ZONES = [
    ["pcav", "Pare-chocs AV"],
    ["capot", "Capot"],
    ["pb", "Pare-brise"],
    ["toit", "Toit"],
    ["lun", "Lunette AR"],
    ["hayon", "Hayon / coffre"],
    ["pcar", "Pare-chocs AR"],
    ["ailavg", "Aile AV G"],
    ["ailavd", "Aile AV D"],
    ["ptavg", "Porte AV G"],
    ["ptavd", "Porte AV D"],
    ["ptarg", "Porte AR G"],
    ["ptard", "Porte AR D"],
    ["ailarg", "Aile AR G"],
    ["ailard", "Aile AR D"],
    ["bcg", "Bas de caisse G"],
    ["bcd", "Bas de caisse D"],
    ["retg", "Rétroviseur G"],
    ["retd", "Rétroviseur D"],
    ["phavg", "Phare AV G"],
    ["phavd", "Phare AV D"],
    ["feuarg", "Feu AR G"],
    ["feuard", "Feu AR D"],
    ["struct", "Structure / longerons"],
  ];
  const ZONE = Object.fromEntries(CAR_ZONES);
  const DMG_TYPES = {
    R: "Rayure",
    B: "Bosse",
    F: "Fissure / casse",
    E: "Éclat",
    G: "Grêle",
  };

  /** Emplacements physiques de l'atelier (occupés par un véhicule au maximum). */
  const SLOTS = {
    P1: { l: "Poste 01", kind: "pont" },
    P2: { l: "Poste 02", kind: "pont" },
    P3: { l: "Poste 03", kind: "pont" },
    P4: { l: "Poste 04", kind: "pont" },
    P5: { l: "Poste 05 · Marbre", kind: "marbre" },
    P6: { l: "Poste 06", kind: "pont" },
    BOOTH: { l: "Cabine 01", kind: "cabine" },
    BQ: { l: "File d’attente cabine", kind: "attente" },
    RECV: { l: "Réception véhicules", kind: "reception" },
    PARK0: { l: "Parking · place 02", kind: "pret" },
    PARK1: { l: "Parking · place 03", kind: "pret" },
    PARK2: { l: "Parking · place 04", kind: "pret" },
    PARK3: { l: "Parking · place 05", kind: "park" },
    PARK4: { l: "Parking · place 06", kind: "park" },
    PARK5: { l: "Parking · place 07", kind: "park" },
    PARK6: { l: "Parking · place 08", kind: "park" },
    PARK8: { l: "Parking · place 10", kind: "park" },
    ROAD: { l: "En approche", kind: "off" },
    OUT: { l: "Restitué", kind: "off" },
  };
  const ONSITE = (s) => s && s !== "ROAD" && s !== "OUT";
  const POSTE_IDS = ["P1", "P2", "P3", "P4", "P5", "P6"];

  /** Ressources du planning (postes de travail). cap = heures / jour */
  const RESOURCES = [
    {
      id: "P1",
      l: "Poste 01",
      type: "Pont 2 colonnes · 3.5 t",
      kind: "pont",
      cap: 9,
    },
    {
      id: "P2",
      l: "Poste 02",
      type: "Pont 2 colonnes · 3.5 t",
      kind: "pont",
      cap: 9,
    },
    {
      id: "P3",
      l: "Poste 03",
      type: "Pont 2 colonnes · 4 t",
      kind: "pont",
      cap: 9,
    },
    {
      id: "P4",
      l: "Poste 04",
      type: "Pont 2 colonnes · 3.5 t",
      kind: "pont",
      cap: 9,
    },
    {
      id: "P5",
      l: "Poste 05 · Marbre",
      type: "Marbre de redressage · 4 t",
      kind: "marbre",
      cap: 9,
    },
    {
      id: "P6",
      l: "Poste 06",
      type: "Pont 2 colonnes · 3.5 t",
      kind: "pont",
      cap: 9,
    },
    {
      id: "PREP",
      l: "Zone préparation",
      type: "Aire de ponçage aspirée · 2 places",
      kind: "prepa",
      cap: 18,
    },
    {
      id: "BOOTH",
      l: "Cabine 01",
      type: "Cabine peinture / cuisson 60 °C",
      kind: "cabine",
      cap: 9,
    },
  ];

  /** Activités du garage : chaque client active ce qui existe chez lui (réglages). Pilote la navigation,
      les indicateurs et, à terme, les zones de l’atelier live. */
  const ACTIVITIES = [
    { k: "carrosserie", l: "Carrosserie", d: "Tôlerie, redressage, débosselage", core: true },
    { k: "peinture", l: "Peinture", d: "Cabine, préparation, formules de teinte" },
    { k: "mecanique", l: "Mécanique & entretien", d: "Révisions, freinage, diagnostic" },
    { k: "pneus", l: "Pneus & entretien rapide", d: "Montage, équilibrage, géométrie, vidange" },
    { k: "vitrage", l: "Vitrage", d: "Pare-brise, calibrage caméra" },
    { k: "assurances", l: "Sinistres & assurances", d: "Dossiers assureurs, expertises, cession de créance" },
    { k: "courtesy", l: "Véhicules de remplacement", d: "Flotte de courtoisie et prêts" },
    { k: "showroom", l: "Showroom / vente", d: "Véhicules d’occasion et neufs exposés" },
    { k: "intelligence", l: "Garage intelligent", d: "Cas similaires, assistant vocal, scan de plaque" },
    { k: "agent", l: "Agent IA", d: "Relances assureurs, frais de gardiennage, standard téléphonique (mode simulé)" },
    { k: "atelier", l: "Atelier de réparation", d: "Ordres de réparation, postes, planning atelier, pièces, qualité" },
    { k: "depannage", l: "Dépannage & remorquage", d: "Missions, camions, chauffeurs, mandats assureurs" },
    { k: "parc", l: "Parc de gardiennage", d: "Niveaux, places, entrées / sorties, frais de garde" },
  ];
  const ACTIVITY_PROFILES = {
    carrosserie: { l: "Carrosserie-peinture", on: ["carrosserie", "peinture", "vitrage", "assurances", "courtesy", "intelligence", "agent"] },
    garage: { l: "Garage toutes activités", on: ["carrosserie", "peinture", "mecanique", "pneus", "vitrage", "assurances", "courtesy", "intelligence", "agent"] },
    concession: { l: "Concession", on: ["carrosserie", "peinture", "mecanique", "pneus", "vitrage", "assurances", "courtesy", "showroom", "intelligence", "agent"] },
    centre: { l: "Centre auto / entretien rapide", on: ["mecanique", "pneus", "vitrage", "courtesy", "intelligence", "agent"] },
    depannage: { l: "Dépanneur-remorqueur", on: ["depannage", "parc", "assurances", "agent"] },
  };
  const defaultActivities = (profile = "garage") => Object.fromEntries(ACTIVITIES.map((a) => [a.k, ACTIVITY_PROFILES[profile].on.includes(a.k)]));
  const activityOn = (k) => { const a = S && S.company && S.company.activities; return !a || a[k] !== false; };

  const ROLES = {
    chef: { l: "Chef d’atelier", prod: false },
    carrossier: { l: "Carrossier (CAP)", prod: true },
    mecatro: { l: "Mécatronicien (Bac pro)", prod: true },
    peintre: { l: "Peintre en carrosserie", prod: true },
    prepa: { l: "Préparateur peinture", prod: true },
    apprenti: { l: "Apprenti·e", prod: true },
    mag: { l: "Magasinier", prod: false },
    recep: { l: "Réceptionniste", prod: false },
  };

  /* ==========================================================================
     SEED — données de démonstration (cohérentes avec la carte 3D)
     ========================================================================== */
  // Dépannage : camions, chauffeurs, parc souterrain (3 niveaux), missions et gardes fictifs.
  function commercialCatalog() { return [{"id": "depanneuse", "label": "Dépanneuse", "missionKind": "Dépannage auto", "variants": [{"label": "Intervention standard", "fromTtc": 90}, {"label": "Intervention renforcée", "fromTtc": 170}, {"label": "Intervention + contrôle", "fromTtc": 280}], "source": "https://depanneuse.net/depanneuse", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}, {"id": "remorquage-voiture", "label": "Remorquage voiture", "missionKind": "Remorquage simple", "variants": [{"label": "Intervention standard", "fromTtc": 90}, {"label": "Intervention renforcée", "fromTtc": 160}, {"label": "Intervention + contrôle", "fromTtc": 250}], "source": "https://depanneuse.net/remorquage-voiture", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}, {"id": "depannage-moto", "label": "Dépannage moto", "missionKind": "Remorquage moto", "variants": [{"label": "Intervention standard", "fromTtc": 80}, {"label": "Intervention renforcée", "fromTtc": 120}, {"label": "Intervention + contrôle", "fromTtc": 180}], "source": "https://depanneuse.net/depannage-moto", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}, {"id": "depannage-batterie", "label": "Dépannage batterie", "missionKind": "Panne batterie", "variants": [{"label": "Intervention standard", "fromTtc": 70}, {"label": "Intervention renforcée", "fromTtc": 110}, {"label": "Intervention + contrôle", "fromTtc": 160}], "source": "https://depanneuse.net/depannage-batterie", "checkedAt": "2026-10-16", "priceType": "from", "issue": "Tableaux à 70 € TTC, texte et FAQ à 80 € TTC : montant à confirmer avec Joseph.", "approved": false}, {"id": "depannage-crevaison", "label": "Dépannage crevaison", "missionKind": "Crevaison", "variants": [{"label": "Intervention standard", "fromTtc": 90}, {"label": "Intervention renforcée", "fromTtc": 130}, {"label": "Intervention + contrôle", "fromTtc": 190}], "source": "https://depanneuse.net/depannage-crevaison", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}, {"id": "depannage-panne-dessence", "label": "Dépannage panne d’essence", "missionKind": "Panne carburant", "variants": [{"label": "Intervention standard", "fromTtc": 90}, {"label": "Intervention renforcée", "fromTtc": 140}, {"label": "Intervention + contrôle", "fromTtc": 210}], "source": "https://depanneuse.net/depannage-panne-dessence", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}, {"id": "depannage-auto", "label": "Dépannage auto", "missionKind": "Dépannage auto", "variants": [{"label": "Intervention standard", "fromTtc": 90}, {"label": "Intervention renforcée", "fromTtc": 150}, {"label": "Intervention + contrôle", "fromTtc": 240}], "source": "https://depanneuse.net/depannage-auto", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}, {"id": "remorquage-pas-cher", "label": "Remorquage économique", "missionKind": "Remorquage simple", "variants": [{"label": "Intervention standard", "fromTtc": 80}, {"label": "Intervention renforcée", "fromTtc": 130}, {"label": "Intervention + contrôle", "fromTtc": 190}], "source": "https://depanneuse.net/remorquage-pas-cher", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}, {"id": "depannage-autoroute", "label": "Dépannage autoroute", "missionKind": "Dépannage autoroute", "variants": [{"label": "Intervention standard", "fromTtc": 144}, {"label": "Intervention renforcée", "fromTtc": 250}, {"label": "Intervention + contrôle", "fromTtc": 380}], "source": "https://depanneuse.net/depannage-autoroute", "checkedAt": "2026-10-16", "priceType": "from", "issue": "Montant publié sur le site uniquement ; conditions d’intervention et tarif applicable à vérifier avant proposition.", "approved": false}, {"id": "depanneur-voiture", "label": "Dépanneur voiture", "missionKind": "Dépannage auto", "variants": [{"label": "Intervention standard", "fromTtc": 90}, {"label": "Intervention renforcée", "fromTtc": 180}, {"label": "Intervention + contrôle", "fromTtc": 290}], "source": "https://depanneuse.net/depanneur-voiture", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}, {"id": "remorquage-voiture-prix", "label": "Remorquage voiture — page prix", "missionKind": "Remorquage simple", "variants": [{"label": "Intervention standard", "fromTtc": 90}, {"label": "Intervention renforcée", "fromTtc": 190}, {"label": "Intervention + contrôle", "fromTtc": 310}], "source": "https://depanneuse.net/remorquage-voiture-prix", "checkedAt": "2026-10-16", "priceType": "from", "issue": "Tableaux à 90 € TTC ; un paragraphe évoque 80 € TTC : montant à confirmer.", "approved": false}, {"id": "depanneuse-pas-cher", "label": "Dépanneuse économique", "missionKind": "Remorquage simple", "variants": [{"label": "Intervention standard", "fromTtc": 50}, {"label": "Intervention renforcée", "fromTtc": 80}, {"label": "Intervention + contrôle", "fromTtc": 120}], "source": "https://depanneuse.net/depanneuse-pas-cher", "checkedAt": "2026-10-16", "priceType": "from", "issue": "Tableaux à 50 € TTC, texte et FAQ à 80 € TTC : montant à confirmer avec Joseph.", "approved": false}, {"id": "demarrage-voiture", "label": "Démarrage voiture", "missionKind": "Démarrage batterie", "variants": [{"label": "Intervention standard", "fromTtc": 50}, {"label": "Intervention renforcée", "fromTtc": 90}, {"label": "Intervention + contrôle", "fromTtc": 130}], "source": "https://depanneuse.net/demarrage-voiture", "checkedAt": "2026-10-16", "priceType": "from", "issue": "Tableaux à 50 € TTC, texte et FAQ à 80 € TTC : montant à confirmer avec Joseph.", "approved": false}, {"id": "ouverture-de-porte-voiture", "label": "Ouverture de porte voiture", "missionKind": "Ouverture de porte", "variants": [{"label": "Intervention standard", "fromTtc": 80}, {"label": "Intervention renforcée", "fromTtc": 140}, {"label": "Intervention + contrôle", "fromTtc": 220}], "source": "https://depanneuse.net/ouverture-de-porte-voiture", "checkedAt": "2026-10-16", "priceType": "from", "issue": "", "approved": false}]; }
  function migrateCommercial(st) {
    if (!st || !st.missions) return;
    st.serviceCatalog ??= commercialCatalog();
    st.commercial ??= { version: 1, source: 'https://depanneuse.net/nos-tarifs', checkedAt: '2026-10-16', brand: 'Dan Dépanne', website: 'https://depanneuse.net', departments: [{code:'60',name:'Oise'},{code:'75',name:'Paris'},{code:'77',name:'Seine-et-Marne'},{code:'78',name:'Yvelines'},{code:'91',name:'Essonne'},{code:'92',name:'Hauts-de-Seine'},{code:'93',name:'Seine-Saint-Denis'},{code:'94',name:'Val-de-Marne'},{code:'95',name:'Val-d’Oise'}], identityNote: 'Dan Dépanne confirmé par le gérant du projet ; les autres entreprises et identités du site ne sont pas importées.', storageRateStatus: 'demo-unconfirmed', storageSource: null, history: [] };
    st.marketing ??= { campaigns: [], leads: [], history: [], connections: {google:false,meta:false} };
    if (!st.commercial.teamApplied) {
      const names=['Dylan','Laurent','Trump'];
      st.legacyDrivers ??= (st.drivers || []).filter(d=>!names.includes(d.first));
      st.drivers=names.map((first,i)=>({id:'D'+(i+1),first,last:'',name:first,ini:first.slice(0,2).toUpperCase(),role:'chauffeur',title:'Dépanneur',phone:'',email:'',skills:[],color:['#1768ee','#0e7490','#b45309'][i],astreinte:false}));
      (st.trucks || []).forEach((t,i)=>{t.driverId=i<3?'D'+(i+1):null;});
      st.legacyOffice ??= st.office || [];
      st.office=[{id:'B1',first:'Moïse',last:'',name:'Moïse',ini:'MO',role:'bureau',title:'Administration',access:['missions','planning-dep','parc','mandats','acquisition'],color:'#0e7490',phone:'',email:''},{id:'B2',first:'Florence',last:'',name:'Florence',ini:'FL',role:'bureau',title:'Administration',access:['parc','mandats','invoices','acquisition'],color:'#b45309',phone:'',email:''}];
      st.commercial.teamApplied=true;
    }
    if(st.company.name==='Dan Dépann')st.company.name='Dan Dépanne';
    st.company.web='depanneuse.net';
    st.company.hours='24h/24 · 7j/7 · Île-de-France et Oise (zones publiées sur le site)';
    (st.gardes || []).forEach(g=>{g.rateStatus ??= 'demo-unconfirmed';});
    st.missions.forEach(m=>{m.serviceId ??= null;m.priceConfirmed ??= !m.serviceId;m.priceSource ??= null;m.priceConfirmation ??= null;m.department ??= '';});
  }
  function seedDepannage(S) {
    const t = today();
    const mkT = (i, v) => Object.assign({ id: "T" + (i + 1), status: "Disponible", driverId: null, km: 0, ct: addDays(t, 200), notes: "" }, v);
    const trucks = [
      mkT(0, { plate: "GA-101-DP", name: "Camion 01", kind: "Plateau", brand: "Iveco Daily 35C16", year: 2021, km: 142300, driverId: "D1", status: "En mission" }),
      mkT(1, { plate: "GA-102-DP", name: "Camion 02", kind: "Plateau", brand: "Renault Master", year: 2022, km: 98500, driverId: "D2", status: "En mission" }),
      mkT(2, { plate: "GB-203-DP", name: "Panier 03", kind: "Panier", brand: "Toyota Hilux", year: 2025, km: 11800, driverId: "D3" }),
      mkT(3, { plate: "GB-204-DP", name: "Camion 04", kind: "Plateau", brand: "Mercedes Sprinter", year: 2020, km: 176200, driverId: "D4" }),
      mkT(4, { plate: "GC-305-DP", name: "Camion 05", kind: "Porte-voitures", brand: "Iveco Eurocargo", year: 2019, km: 302100, driverId: "D5", status: "En mission" }),
      mkT(5, { plate: "GC-306-DP", name: "Panier 06", kind: "Panier", brand: "Toyota Hilux", year: 2025, km: 9400, driverId: "D6" }),
      mkT(6, { plate: "GD-407-DP", name: "Panier 07", kind: "Panier", brand: "Toyota Hilux", year: 2025, km: 14200, driverId: "D7", status: "En mission" }),
      mkT(7, { plate: "GD-408-DP", name: "Camion 08", kind: "Plateau", brand: "Iveco Daily 35C16", year: 2023, km: 69900, driverId: "D8", status: "En mission" }),
      mkT(8, { plate: "GE-509-DP", name: "Panier 09", kind: "Panier", brand: "Toyota Hilux", year: 2025, km: 7600, driverId: "D9" }),
      mkT(9, { plate: "GE-510-DP", name: "Camion 10", kind: "Plateau", brand: "Mercedes Sprinter", year: 2018, km: 268700, driverId: null, status: "Entretien", notes: "Révision + freins, retour prévu " + fmtD(addDays(t, 1)) }),
      mkT(10, { plate: "GF-611-DP", name: "Panier 11", kind: "Panier", brand: "Toyota Hilux", year: 2025, km: 12900, driverId: "D10" }),
      mkT(11, { plate: "GF-612-DP", name: "Camion 12", kind: "Porte-voitures", brand: "Iveco Eurocargo", year: 2020, km: 255600, driverId: "D11", status: "En mission" }),
    ];
    const drivers = ['Dylan','Laurent','Trump'].map((first,i)=>({id:'D'+(i+1),first,last:'',name:first,ini:first.slice(0,2).toUpperCase(),role:'chauffeur',title:'Dépanneur',phone:'',email:'',skills:[],color:['#1768ee','#0e7490','#b45309'][i],astreinte:false}));
    trucks.forEach((t,i)=>{t.driverId=i<3?'D'+(i+1):null;});
    const parc = { levels: [{ id: "N1", name: "Niveau -1", slots: 40 }, { id: "N2", name: "Niveau -2", slots: 40 }, { id: "N3", name: "Niveau -3", slots: 36 }], dailyFee: 18, adminFee: 45 };
    const MANDANTS = ["AXA", "MAIF", "Allianz", "Macif", "Groupama", "Matmut", "Particulier", "Police municipale", "Leasing Arval"];
    const KINDS = ["Panne batterie", "Remorquage moto", "Démarrage batterie", "Remorquage simple", "Crevaison", "Panne carburant", "Ouverture de porte", "Dépannage auto"];
    const CARS = [["Peugeot", "208", "#f2b31c"], ["Renault", "Clio V", "#c9ced6"], ["Citroën", "C3", "#8aa7c4"], ["Volkswagen", "Golf", "#1d2a44"], ["Toyota", "Yaris", "#d7261e"], ["Dacia", "Sandero", "#f4f5f6"], ["BMW", "Série 1", "#121418"], ["Tesla", "Model 3", "#e9ebee"], ["Fiat", "500", "#9fd0c3"], ["Audi", "A3", "#5b6670"], ["Mercedes", "Classe A", "#2b2f36"], ["Kia", "Picanto", "#e35d2b"]];
    const STREETS = ["rue du Faubourg-Saint-Martin", "boulevard de Magenta", "rue de Paradis", "quai de Valmy", "rue La Fayette", "avenue Parmentier", "rue d’Hauteville", "boulevard de Strasbourg", "rue Bichat", "rue de Lancry", "place de la République", "rue Beaurepaire"];
    const rnd = rng(hash("dep" + t));
    const plate = (i) => String.fromCharCode(65 + (i * 7) % 26) + String.fromCharCode(65 + (i * 11) % 26) + "-" + pad(100 + (i * 37) % 900).slice(-3) + "-" + String.fromCharCode(65 + (i * 5) % 26) + String.fromCharCode(65 + (i * 13) % 26);
    const missions = [], gardes = [];
    let mno = 2610;
    const STATUSES = ["Demandée", "Affectée", "En route", "Sur place", "Remorquage", "Déposée au parc", "Terminée", "Facturée"];
    for (let i = 0; i < 14; i++) {
      const c = CARS[i % CARS.length], k = KINDS[i % KINDS.length], st = i === 2 ? "Affectée" : i === 4 ? "En route" : i < 11 ? "Demandée" : i < 13 ? "Déposée au parc" : "Terminée";
      const pool = trucks.filter((x) => x.status !== "Entretien"); const truck = st === "Demandée" ? null : pool[i === 2 ? 0 : i === 4 ? 1 : i % 3];
      missions.push({ id: "M" + (i + 1), no: "MI-" + (mno + i), at: t + " " + hm(7 * 60 + i * 38), mandant: MANDANTS[i % MANDANTS.length], ref: MANDANTS[i % MANDANTS.length] === "Particulier" ? "" : "SIN-" + (48100 + i * 17), kind: k, status: st, address: (3 + (i * 7) % 90) + " " + STREETS[i % STREETS.length] + ", 750" + (10 + (i % 5)) + " Paris", vehicle: { plate: plate(i), make: c[0], model: c[1], hex: c[2], color: "" }, customer: { name: ["Nadia Benhamou", "Marc Lefèvre", "Sophie Girard", "Julien Moreau", "Aïcha Diop", "Thomas Petit", "Clara Fontaine", "Hugo Lambert", "Inès Roux", "Léo Garnier", "Camille Picard", "Nour Chevalier", "Paul Renard", "Emma Marchand"][i], phone: "+33 6 " + pad(20 + i) + " 11 22 " + pad(10 + i) }, truckId: truck ? truck.id : null, driverId: truck ? truck.driverId : null, eta: t + " " + hm(7 * 60 + i * 38 + 35), arrivedAt: ["Sur place", "Remorquage", "Déposée au parc", "Terminée"].includes(st) ? t + " " + hm(7 * 60 + i * 38 + 31) : null, doneAt: ["Déposée au parc", "Terminée"].includes(st) ? t + " " + hm(7 * 60 + i * 38 + 95) : null, destination: ["Remorquage", "Déposée au parc"].includes(st) ? "Parc Dan Dépanne" : k === "Panne batterie" || k === "Crevaison" ? "Sur place" : "Garage du client", price: [120, 95, 180, 260, 150, 90, 110, 140][i % 8], notes: "", photos: [], history: [{ at: t + " " + hm(7 * 60 + i * 38), text: "Mission créée (" + MANDANTS[i % MANDANTS.length] + ")" }] });
    }
    missions.forEach(m=>{const svc=commercialCatalog().find(x=>x.missionKind===m.kind);if(svc){m.serviceId=svc.id;m.price=Math.round(svc.variants[0].fromTtc/(1+(S.company.tvaRate ?? .2))*100)/100;m.priceConfirmed=true;m.priceSource=svc.source;m.priceConfirmation={mode:'demo',at:m.at,note:'Prix accepté simulé pour le jeu de démonstration, à partir du tableau publié.'};}});
    // statut des camions déduit des missions (sur la route = en mission ; sinon disponible, sauf entretien)
    trucks.forEach((tr) => { if (tr.status === "Entretien") return; tr.status = missions.some((m) => m.truckId === tr.id && ["Affectée", "En route", "Sur place", "Remorquage"].includes(m.status)) ? "En mission" : "Disponible"; });
    // gardes : véhicules au parc, certains depuis longtemps (frais, relances)
    const slotOf = (lvl, n) => lvl + "-" + pad(n);
    for (let i = 0; i < 46; i++) {
      const c = CARS[(i * 5) % CARS.length], days = [1, 2, 3, 4, 6, 8, 11, 15, 19, 24, 33, 41, 58, 77, 95][i % 15], lvl = parc.levels[i % 3].id;
      gardes.push({ id: "G" + (i + 1), no: "GA-" + (5100 + i), since: addDays(t, -days), mandant: MANDANTS[i % MANDANTS.length], ref: "SIN-" + (47000 + i * 29), vehicle: { plate: plate(100 + i), make: c[0], model: c[1], hex: c[2] }, reason: ["Accident – expertise en attente", "Panne moteur – attente de décision", "Remorquage – véhicule immobilisé", "Panne – attente du garage réparateur", "Véhicule en attente de restitution"][i % 5], level: lvl, slot: slotOf(lvl, 1 + Math.floor(i / 3) * 2 + (i % 2)), status: days > 60 ? "Abandon présumé" : days > 30 ? "Relance à faire" : "En garde", owner: { name: "Propriétaire " + (i + 1), phone: "+33 6 " + pad(30 + i) + " 00 11 " + pad(22 + i) }, dailyFee: parc.dailyFee, outAt: null, paid: 0, history: [], step: days <= 2 ? "Non traité" : days <= 12 ? "Expertise en attente" : days <= 30 ? (i % 3 ? "Expertisé" : "Décision assureur") : i % 4 === 0 ? "Épave — enlèvement" : "Décision assureur", insurance: MANDANTS[i % MANDANTS.length] === "Particulier" ? undefined : { status: days > 45 ? "Accordée" : days > 10 ? (i % 4 === 0 ? "Prise en charge demandée" : "Accordée") : "À déclarer", history: days > 10 ? [{ at: addDays(t, -days + 2) + " 10:00", text: "Prise en charge demandée par e-mail", by: "U1" }] : [] } });
    }
    // Chaque dépôt est relié à une garde réelle, avec une place distincte.
    missions.filter(m => m.status === "Déposée au parc").forEach((m, i) => {
      const g = { id: "GM" + m.id, no: "GA-" + (5200 + i), since: t, mandant: m.mandant, ref: m.ref, vehicle: { ...m.vehicle }, reason: m.kind + " — mission " + m.no, level: "N3", slot: "N3-" + pad(35 + i), status: "En garde", step: "Non traité", owner: { ...m.customer }, dailyFee: parc.dailyFee, adminFee: parc.adminFee, outAt: null, paid: 0, missionId: m.id, history: [] };
      m.gardeId = g.id; gardes.push(g);
    });
    // boîte mail assureurs (simulée) : courriels liés aux mandats ci-dessus
    const insMail = [
      { id: "ml1", at: t + " 08:12", from: "sinistres@axa-demo.fr", subject: "Accord de prise en charge — SIN-48100", ref: "SIN-48100", plate: missions[0].vehicle.plate, intent: "accord", amount: 120, body: "Bonjour,\nNous vous confirmons la prise en charge du dépannage de notre assuré (SIN-48100) pour un montant de 120 € HT.\nCordialement, Service sinistres AXA", summary: "Accord de prise en charge pour la mission MI-2610 (120 € HT) → passer le mandat en « Accordée »." },
      { id: "ml2", at: t + " 09:40", from: "gestion@maif-demo.fr", subject: "Dossier SIN-48117 — pièces manquantes", ref: "SIN-48117", plate: missions[1].vehicle.plate, intent: "pieces", asked: "photos de la moto et PV d'intervention", body: "Bonjour,\nPour instruire le dossier SIN-48117, merci de nous transmettre les photos de la moto et le PV d'intervention signé.\nMAIF Gestion sinistres", summary: "Demande de pièces (photos, PV) sur MI-2611 → à joindre, le mandat reste « en attente »." },
      { id: "ml3", at: addDays(t, -1) + " 16:05", from: "comptabilite@groupama-demo.fr", subject: "Avis de virement — frais de gardiennage SIN-47377", ref: "SIN-47377", plate: gardes.filter((g) => g.ref === "SIN-47377").map((g) => g.vehicle.plate)[0] || "", intent: "paiement", amount: 1449, body: "Bonjour,\nUn virement de 1 449,00 € a été émis ce jour en règlement des frais de gardiennage du dossier SIN-47377.\nGroupama Comptabilité", summary: "Virement de 1 449 € annoncé pour la garde SIN-47377 → consigner l’annonce ; règlement à vérifier sur le relevé bancaire." },
      { id: "ml4", at: addDays(t, -1) + " 11:20", from: "expertise@allianz-demo.fr", subject: "Refus — SIN-48134 (assistance non couverte)", ref: "SIN-48134", plate: missions[2].vehicle.plate, intent: "refus", reason: "garantie assistance non souscrite", body: "Bonjour,\nLe contrat de l'assuré ne comporte pas la garantie assistance : nous ne pouvons prendre en charge l'intervention SIN-48134. Merci de facturer directement le propriétaire.\nAllianz Expertise", summary: "Refus de prise en charge sur MI-2612 → mandat « Refusée », facturer le propriétaire." },
    ];
    // bureau : trois collaborateurs avec un accès à MOTEK
    const office = [{id:'B1',first:'Moïse',last:'',name:'Moïse',ini:'MO',role:'bureau',title:'Administration',access:['missions','planning-dep','parc','mandats','acquisition'],color:'#0e7490',phone:'',email:''},{id:'B2',first:'Florence',last:'',name:'Florence',ini:'FL',role:'bureau',title:'Administration',access:['parc','mandats','invoices','acquisition'],color:'#b45309',phone:'',email:''}];
    // fournisseurs du dépanneur (batteries, pneus, carburant) — fictifs
    const depSuppliers = [
      { id: "DS1", name: "Batteries Distribution Paris (démo)", kind: "Batteries", email: "commandes@bdp-demo.fr", phone: "+33 1 00 00 00 21", delay: "J+1 avant 10 h", terms: "30 j fin de mois" },
      { id: "DS2", name: "Pneus Express Île-de-France (démo)", kind: "Pneumatiques", email: "pro@pneus-express-demo.fr", phone: "+33 1 00 00 00 22", delay: "24–48 h", terms: "comptant" },
      { id: "DS3", name: "Carburants & lubrifiants Nord (démo)", kind: "Carburant / AdBlue", email: "livraison@cln-demo.fr", phone: "+33 1 00 00 00 23", delay: "48 h", terms: "30 j" },
    ];
    const BATT = ["Batterie 12 V 60 Ah L2 (Clio, 208, C3)", "Batterie 12 V 70 Ah L3 (Golf, 308)", "Batterie AGM 12 V 80 Ah L4 (start-stop)", "Batterie EFB 12 V 70 Ah L3", "Batterie 12 V 95 Ah L5 (utilitaires)"];
    const supplyOrders = [];
    missions.filter((m) => m.kind === "Panne batterie").forEach((m, i) => {
      supplyOrders.push({ id: "SO" + (i + 1), no: "CB-" + (1040 + i), at: m.at, supplierId: "DS1", item: BATT[i % BATT.length], qty: 1, price: [89, 119, 169, 139, 149][i % 5], missionId: m.id, plate: m.vehicle.plate, status: ["À commander", "Commandée", "Reçue", "Posée"][i % 4], history: [{ at: m.at, text: "Besoin relevé sur la mission " + m.no }] });
    });
    supplyOrders.push({ id: "SO9", no: "CB-1050", at: addDays(t, -2) + " 09:10", supplierId: "DS1", item: "Stock camion : 4 × batterie 60 Ah L2 + 2 × 70 Ah L3", qty: 6, price: 98, missionId: null, plate: "", status: "Commandée", history: [{ at: addDays(t, -2) + " 09:10", text: "Réassort du stock des paniers" }] });
    // WhatsApp clients : journal simulé (aucun envoi réel sans WhatsApp Business raccordé)
    const waMsgs = [
      { id: "wa1", at: addDays(t, -1) + " 17:42", to: gardes[6].owner.phone, plate: gardes[6].vehicle.plate, dir: "out", text: "Bonjour, votre véhicule " + gardes[6].vehicle.plate + " est disponible au parc Dan Dépann (25 av. Claude Vellefaux). Merci de venir le récupérer avec une pièce d’identité et la carte grise. Frais de garde à ce jour : " + (DEP_fees(gardes[6])) + " €.", status: "envoyé", kind: "recuperer" },
      { id: "wa2", at: t + " 08:05", to: gardes[6].owner.phone, plate: gardes[6].vehicle.plate, dir: "in", text: "Bonjour, je passe demain matin vers 9 h. Merci.", status: "reçu", kind: "reponse" },
      { id: "wa3", at: t + " 09:30", to: missions[3].customer.phone, plate: missions[3].vehicle.plate, dir: "out", text: "Bonjour " + missions[3].customer.name.split(" ")[0] + ", votre " + missions[3].vehicle.make + " " + missions[3].vehicle.model + " a été déposée au garage agréé. Vous serez contacté par le garage sous 48 h. Dan Dépann.", status: "envoyé", kind: "depose" },
    ];
    function DEP_fees(g) { const d = Math.max(1, diffDays(g.since, t) + 1); return d * parc.dailyFee + parc.adminFee; }
    // factures du dépanneur : missions facturées et gardes restituées
    const dinvoices = [];
    missions.filter((m) => m.status === "Facturée").forEach((m, i) => { const ht = m.price; dinvoices.push({ id: "DI" + (i + 1), no: "FD-" + (2026 * 1000 + 410 + i), at: dOf(m.at), due: addDays(dOf(m.at), 30), payer: m.mandant, ref: m.ref, kind: "mission", srcId: m.id, plate: m.vehicle.plate, label: m.kind + " · " + m.address, ht, tva: Math.round(ht * TVA * 100) / 100, ttc: Math.round(ht * (1 + TVA) * 100) / 100, paid: i % 3 === 0 ? Math.round(ht * (1 + TVA) * 100) / 100 : 0, status: i % 3 === 0 ? "Payée" : "Émise", lines: [{ label: m.kind === "Remorquage simple" ? "Remorquage — " + m.address + " → " + m.destination : m.kind === "Panne batterie" ? "Dépannage sur place — démarrage / remplacement batterie" : m.kind + " — intervention et remorquage", qty: 1, price: ht }] }); });
    [[12, "AXA"], [25, "MAIF"], [41, "Macif"]].forEach(([days, payer], i) => { const ht = days * parc.dailyFee + parc.adminFee, pl = plate(300 + i); dinvoices.push({ id: "DG" + (i + 1), no: "FD-" + (2026 * 1000 + 380 + i), at: addDays(t, -(20 + i * 9)), due: addDays(t, 10 - i * 9), payer, ref: "SIN-" + (46500 + i * 31), kind: "garde", srcId: null, plate: pl, label: "Gardiennage " + days + " j · " + pl, ht, tva: Math.round(ht * TVA * 100) / 100, ttc: Math.round(ht * (1 + TVA) * 100) / 100, paid: i === 1 ? Math.round(ht * (1 + TVA) * 100) / 100 : 0, status: i === 1 ? "Payée" : "Émise", lines: [{ label: "Gardiennage " + days + " jours × " + parc.dailyFee + " €", qty: days, price: parc.dailyFee }, { label: "Frais de dossier", qty: 1, price: parc.adminFee }] }); });
    dinvoices.forEach((invoice, i) => {
      invoice.history = invoice.history || [];
      if (invoice.status === "Payée") invoice.paidAt = invoice.at;
      if (invoice.kind === "garde" && !invoice.srcId) {
        const g = { id: "GARCH" + i, no: "GA-" + (5300 + i), since: addDays(invoice.at, -invoice.lines[0].qty + 1), outAt: invoice.at + " 16:00", vehicle: { plate: invoice.plate, make: "Renault", model: "Clio", hex: "#c9ced6" }, mandant: invoice.payer, ref: invoice.ref, level: "N1", slot: "N1-01", reason: "Gardiennage clôturé (démo)", status: "Restitué", step: "Prêt à sortir", owner: { name: "Propriétaire fictif", phone: "" }, dailyFee: parc.dailyFee, adminFee: parc.adminFee, paid: invoice.paid, total: invoice.ht, history: [], insurance: { status: invoice.status === "Payée" ? "Payée" : "Facturée", history: [] } };
        invoice.srcId = g.id; gardes.push(g);
      }
    });
    return { trucks, drivers, parc, missions, gardes, missionSeq: mno + 14, insMail, office, depSuppliers, supplyOrders, waMsgs, dinvoices };
  }
  // Mémoire de diagnostic : cas fictifs (symptômes, codes, cause, preuve, réparation).
  function seedCases() {
    const t = today();
    const rows = [
      ["VW", "Golf VIII 1.5 eTSI", "Démarrage difficile à froid", "P0562", "Batterie faible", "Tension de démarrage mesurée à 8,7 V.", "Batterie remplacée après confirmation du défaut.", true, 9],
      ["Renault", "Clio V 1.0 TCe", "Décharge de batterie à l’arrêt", "B1318", "Consommation parasite", "Consommation de repos 260 mA ; relais isolé lors du test.", "Relais remplacé puis consommation contrôlée (18 mA).", true, 21],
      ["Peugeot", "308 SW 1.5 BlueHDi", "Voyant batterie, charge insuffisante", "P0620", "Régulateur d’alternateur", "Tension de charge mesurée : 11,9 V.", "Alternateur remplacé après contrôle du circuit.", true, 34],
      ["Toyota", "Yaris 1.5 Hybride", "Voyant ABS intermittent", "C0035", "Capteur de roue AV G", "Signal absent sur la roue avant gauche au relevé.", "Capteur et connectique contrôlés, capteur remplacé.", true, 47],
      ["BMW", "Série 3 Touring 320d", "Calage moteur à chaud", "P0335", "Capteur de vilebrequin", "Signal du capteur absent à chaud.", "Capteur remplacé et essai de redémarrage concluant.", true, 55],
      ["Dacia", "Sandero 1.0 ECO-G", "Température moteur élevée", "P0217", "Thermostat bloqué (hypothèse)", "Test d’ouverture non effectué ; cause à vérifier.", "Aucune réparation confirmée.", false, 6],
      ["Peugeot", "208 1.2 PureTech", "Fuite de liquide de refroidissement", "", "Durite inférieure fendue", "Fuite visible sous pression à 1,2 bar.", "Durite remplacée, circuit purgé.", true, 70],
      ["VW", "Golf VIII 1.5 eTSI", "À-coups à l’accélération, voyant moteur", "P0300 P0302", "Bobine d’allumage cylindre 2", "Ratés comptés sur cylindre 2 au diagnostic.", "Bobine remplacée, bougies contrôlées.", true, 88],
      ["Tesla", "Model 3", "Bruit de roulement AR D à vitesse stabilisée", "", "Roulement de roue AR D", "Jeu mesurable à la roue, bruit localisé au stéthoscope.", "Roulement remplacé.", true, 102],
      ["Mercedes", "Classe C 220 d", "Vibrations au freinage", "", "Disques AV voilés", "Voile mesuré 0,12 mm au comparateur.", "Disques et plaquettes AV remplacés.", true, 120],
      ["Renault", "Trafic III 2.0 dCi", "Perte de puissance, mode dégradé", "P0401", "Vanne EGR encrassée", "Vanne bloquée à 40 % d’ouverture.", "Vanne EGR nettoyée puis remplacée.", true, 140],
      ["Audi", "A3 35 TFSI", "Climatisation inefficace", "", "Charge réfrigérant insuffisante (hypothèse)", "Pression BP basse ; recherche de fuite à programmer.", "Aucune réparation confirmée.", false, 3],
    ];
    return rows.map(([make, model, symptoms, codes, cause, proof, repair, resolved, ago], i) => ({
      id: "CAS-" + String(i + 1).padStart(3, "0"),
      at: addDays(t, -ago),
      make,
      model,
      vehicleId: null,
      roId: null,
      symptoms,
      codes: codes.split(" ").filter(Boolean),
      cause,
      proof,
      repair,
      resolved,
      recurred: false,
      by: "E3",
      demo: true,
    }));
  }
  function seedAgent() {
    return {
      settings: { quoteDays: 3, serviceMonths: 12, serviceKm: 15000, ctDays: 60, inactiveMonths: 18, reviewDays: 2, autoDraft: true, voiceBrowser: false },
      log: [],
      done: {},
      phone: { provider: null, number: "", greeting: "MOTEK Garage, bonjour. Je suis l’assistant du garage : je peux prendre un rendez-vous, donner l’avancement d’une réparation ou transmettre un message." },
    };
  }
  // Entretiens fictifs (vidange, révision) pour alimenter les rappels d’entretien.
  function seedMaintenance(S) {
    const t = today();
    const add = (vid, ago, label, detail, km) => {
      const v = S.vehicles.find((x) => x.id === vid);
      if (!v) return;
      v.hist = v.hist || [];
      if (!v.hist.some((h) => /vidange|r[ée]vision|entretien/i.test(h[1]))) v.hist.push([addDays(t, -ago), label, detail]);
      if (km) v.lastServiceKm = km;
    };
    // Véhicules sans dossier ouvert : les rappels d'entretien ont un sens.
    add("V17", 740, "Vidange + filtres", "Huile 5W30, filtre à huile, filtre habitacle", 81000);
    add("V19", 430, "Révision 60 000 km", "Vidange, filtres, liquide de frein", 59800);
    add("V20", 95, "Vidange", "Huile 0W20", 29100);
    add("V21", 800, "Révision 90 000 km", "Vidange, courroie accessoires, filtres", 90500);
    add("V24", 380, "Vidange + filtres", "Huile 5W30", 109000);
    add("V28", 200, "Révision", "Vidange, filtres, plaquettes AV", 116000);
    add("V30", 150, "Vidange", "Huile 5W40", 123500);
    const ct = (vid, days) => { const v = S.vehicles.find((x) => x.id === vid); if (v && !v.nextCT) v.nextCT = addDays(t, days); };
    ct("V18", 25); ct("V22", -12); ct("V25", 48); ct("V27", 160);
  }
  // Véhicules exposés à la vente : fiches de démonstration (fictives).
  function seedShowroom() {
    const t = today();
    const mk = (i, v) =>
      Object.assign(
        {
          id: "SR-" + (i + 1),
          status: "En vente",
          hands: 1,
          gearbox: "Manuelle",
          fuel: "Essence",
          warranty: 12,
          photos: 6,
          leads: 0,
          customerId: null,
          soldAt: null,
          soldPrice: null,
          notes: "",
        },
        v,
      );
    return [
      mk(0, { make: "Peugeot", model: "208", version: "1.2 PureTech 100 Allure", year: 2022, km: 31200, price: 16990, buyPrice: 14200, hands: 1, color: "#f2b31c", colorName: "Jaune Faro", plate: "GB-412-TR", ct: addDays(t, 540), entry: addDays(t, -18), leads: 3 }),
      mk(1, { make: "Renault", model: "Clio V", version: "1.0 TCe 90 Intens", year: 2021, km: 44800, price: 14490, buyPrice: 12100, hands: 2, color: "#c9ced6", colorName: "Gris Highland", plate: "FY-207-LM", ct: addDays(t, 320), entry: addDays(t, -41), leads: 5 }),
      mk(2, { make: "Volkswagen", model: "Golf VIII", version: "2.0 TDI 150 Life DSG", year: 2021, km: 68500, price: 21900, buyPrice: 19000, hands: 1, fuel: "Diesel", gearbox: "Automatique", color: "#1d2a44", colorName: "Bleu Atlantique", plate: "FW-981-QA", ct: addDays(t, 410), entry: addDays(t, -9), leads: 2 }),
      mk(3, { make: "Toyota", model: "Yaris", version: "1.5 Hybride 116 Design", year: 2023, km: 12300, price: 20490, buyPrice: 17900, hands: 1, fuel: "Hybride", gearbox: "Automatique", color: "#d7261e", colorName: "Rouge Émotion", plate: "GK-558-PE", ct: addDays(t, 980), entry: addDays(t, -4), leads: 1 }),
      mk(4, { make: "Dacia", model: "Sandero", version: "1.0 ECO-G 100 Stepway", year: 2022, km: 39700, price: 13290, buyPrice: 11300, hands: 1, fuel: "GPL", color: "#f4f5f6", colorName: "Blanc Glacier", plate: "GE-134-ZN", ct: addDays(t, 600), entry: addDays(t, -27), leads: 4 }),
      mk(5, { make: "BMW", model: "Série 1", version: "118i 136 M Sport", year: 2020, km: 58900, price: 23900, buyPrice: 20800, hands: 2, color: "#121418", colorName: "Noir Saphir", plate: "FR-740-HS", ct: addDays(t, 200), entry: addDays(t, -63), leads: 6, status: "Réservé", customerId: "C3" }),
      mk(6, { make: "Citroën", model: "C3", version: "1.2 PureTech 83 Feel", year: 2019, km: 81200, price: 9990, buyPrice: 8200, hands: 3, color: "#8aa7c4", colorName: "Bleu Eden", plate: "FG-316-WJ", ct: addDays(t, 95), entry: addDays(t, -88), leads: 2 }),
      mk(7, { make: "Tesla", model: "Model 3", version: "Standard Range Plus", year: 2021, km: 47600, price: 27900, buyPrice: 24500, hands: 1, fuel: "Électrique", gearbox: "Automatique", color: "#e9ebee", colorName: "Blanc Nacré", plate: "FV-622-KC", ct: addDays(t, 365), entry: addDays(t, -12), leads: 7 }),
      mk(8, { make: "Peugeot", model: "3008", version: "1.5 BlueHDi 130 GT EAT8", year: 2022, km: 36100, price: 28490, buyPrice: 25200, hands: 1, fuel: "Diesel", gearbox: "Automatique", color: "#5b6670", colorName: "Gris Platinium", plate: "GC-905-FD", ct: addDays(t, 700), entry: addDays(t, -2), leads: 0, status: "Préparation" }),
      mk(9, { make: "Fiat", model: "500", version: "1.0 Hybrid 70 Dolcevita", year: 2021, km: 26400, price: 11990, buyPrice: 10100, hands: 1, color: "#9fd0c3", colorName: "Vert Rugiada", plate: "FX-089-RB", ct: addDays(t, 450), entry: addDays(t, -120), leads: 3, status: "Vendu", customerId: "C7", soldAt: addDays(t, -3), soldPrice: 11500 }),
    ];
  }
  function seed() {
    const S = seedData();
    S.pristine = true;
    return S;
  }
  function seedData() {
    const S = { v: 1, created: Date.now(), ext: {} };
    S.company = {
      name: "Dan Dépann",
      address: "25 avenue Claude Vellefaux, 75010 Paris",
      hours: "24h/24 · 7j/7 · Paris intra-muros et petite couronne",
      phone: "+33 4 72 634 12 00",
      email: "contact@dandepann-demo.fr",
      siret: "123 456 789 00012",
      tvaIntra: "FR12 123456789",
      iban: "FR76 3000 6000 0112 3456 7890 189",
      bic: "BNPAFRPP",
      bank: "Banque de démonstration",
      web: "motek-demo.fr",
      rates: { T1: 62, T2: 72, T3: 85, P: 70 },
      paintMat: 28,
      smallPct: 0.03,
      smallMax: 60,
      tvaRate: TVA,
      hoursDay: 8.4,
      terms: 30,
      warrantyMonths: 24,
      review: "https://g.page/r/motek-demo/review",
      activities: defaultActivities("depannage"),
      profile: "depannage",
    };
    S.meId = "E1";

    /* ---------- assureurs ---------- */
    S.insurers = [
      [
        "axa",
        "AXA",
        "AXA France IARD",
        "#00008f",
        "09 70 80 81 82",
        "sinistres.auto@axa.fr",
        ["Philippe Gander", "Nadia Weber"],
        21,
      ],
      [
        "mob",
        "MAIF",
        "MAIF",
        "#e3001b",
        "09 72 72 15 15",
        "sinistres@maif.fr",
        ["Christophe Moreau", "Anne Python"],
        15,
      ],
      [
        "all",
        "Allianz",
        "Allianz France",
        "#003781",
        "09 69 32 02 03",
        "sinistres.auto@allianz.fr",
        ["Marco Steiner"],
        25,
      ],
      [
        "zur",
        "Macif",
        "Macif",
        "#2167ae",
        "09 69 39 49 49",
        "sinistres@macif.fr",
        ["Sébastien Bovet", "Ivana Kovac"],
        20,
      ],
      [
        "hel",
        "Groupama",
        "Groupama Rhône-Alpes Auvergne",
        "#00a0af",
        "09 69 39 66 66",
        "sinistres@groupama.fr",
        ["Jean-Daniel Favre"],
        18,
      ],
      [
        "gen",
        "Generali",
        "Generali France",
        "#c21b17",
        "09 69 32 21 21",
        "sinistres@generali.fr",
        ["Lorenzo Conti"],
        24,
      ],
      [
        "bal",
        "Matmut",
        "Matmut",
        "#0014aa",
        "02 35 03 68 68",
        "sinistres@matmut.fr",
        ["Urs Meier"],
        22,
      ],
      [
        "vau",
        "MMA",
        "MMA IARD",
        "#007a4d",
        "02 43 39 11 11",
        "sinistres@mma.fr",
        ["Pascal Mettraux", "Céline Dutoit"],
        14,
      ],
      [
        "tcs",
        "GMF",
        "GMF Assurances",
        "#ffcc00",
        "09 70 80 90 90",
        "sinistres@gmf.fr",
        ["Karim Haddad"],
        20,
      ],
      [
        "smi",
        "Leocare",
        "Leocare (assurance en ligne)",
        "#f05a28",
        "01 76 49 00 00",
        "sinistres@leocare.fr",
        ["Expertise photo en ligne"],
        12,
      ],
    ].map(([id, short, name, color, phone, email, experts, payDays]) => ({
      id,
      short,
      name,
      color,
      phone,
      email,
      experts,
      payDays,
      convention: id !== "smi",
    }));

    /* ---------- équipe ---------- */
    const E = (id, first, last, role, since, phone, extra = {}) =>
      Object.assign(
        {
          id,
          first,
          last,
          name: first + " " + last,
          ini: first[0] + last[0],
          role,
          since,
          phone,
          email:
            (first[0] + "." + last)
              .toLowerCase()
              .normalize("NFD")
              .replace(/[̀-ͯ]/g, "")
              .replace(/[^a-z.]/g, "") + "@motek-demo.fr",
          status: "present",
          weeklyH: 42,
          costH: 58,
          skills: [],
        },
        extra,
      );
    S.staff = [
      E("E1", "Joseph", "Dan Dépann", "chef", 2004, "+33 6 00 00 00 01", {
        title: "Gérant",
        costH: 74,
        skills: [
          "BTS après-vente automobile",
          "Expertise sinistres",
          "ADAS",
          "Gestion équipe",
        ],
        color: "#2a2e35",
      }),
      E("E2", "Luca", "Bianchi", "carrossier", 2014, "+33 68 622 10 57", {
        title: "Carrossier-tôlier (CAP/Bac pro)",
        costH: 62,
        skills: ["Soudure MIG/MAG", "Aluminium", "Marbre Celette", "Rivetage"],
        color: "#1768ee",
      }),
      E("E3", "Julien", "Morand", "carrossier", 2016, "+33 69 845 20 03", {
        title: "Carrossier (CAP)",
        costH: 58,
        skills: ["Débosselage PDR", "Pare-brise", "Plastiques"],
        color: "#1157c4",
      }),
      E("E4", "Nuno", "Ferreira", "mecatro", 2019, "+33 66 330 91 26", {
        title: "Mécatronicien (Bac pro)",
        costH: 57,
        skills: ["Diagnostic", "Haute tension (HV2)", "Géométrie", "ADAS"],
        color: "#3a3f47",
      }),
      E("E5", "Kevin", "Petit", "carrossier", 2021, "+33 69 512 67 40", {
        title: "Carrossier (CAP)",
        costH: 54,
        skills: ["Grêle / PDR", "Expertise photo", "Plastiques"],
        color: "#59606b",
      }),
      E("E6", "Yannick", "Perrin", "peintre", 2012, "+33 68 909 14 82", {
        title: "Peintre en carrosserie",
        costH: 61,
        skills: ["Colorimétrie", "Base eau", "Vernis 2K", "Spot-repair"],
        color: "#b96400",
      }),
      E("E10", "Diego", "Santos", "prepa", 2022, "+33 67 205 63 11", {
        title: "Préparateur peinture",
        costH: 49,
        skills: ["Ponçage", "Masquage", "Apprêts"],
        color: "#868c96",
      }),
      E("E7", "Hugo", "Crettenand", "mag", 2018, "+33 69 233 58 90", {
        title: "Magasinier",
        costH: 46,
        skills: ["Commandes", "Inventaire", "Réception livraisons"],
        color: "#5b616b",
      }),
      E("E8", "Léa", "Marchand", "recep", 2020, "+33 4 72 634 12 00", {
        title: "Réceptionniste",
        costH: 44,
        skills: ["Planning", "Facturation", "Assurances"],
        color: "#9aa0a8",
      }),
      E("E9", "Sarah", "Pasche", "apprenti", 2025, "+33 67 418 33 26", {
        title: "Apprentie carrossière (2e)",
        costH: 18,
        weeklyH: 32,
        status: "ecole",
        skills: ["Préparation", "Masquage"],
        color: "#d16a6e",
      }),
    ];

    /* ---------- clients ---------- */
    const C = (
      id,
      type,
      name,
      city,
      addr,
      phone,
      email,
      since,
      insurerId,
      pref,
      rating,
      note,
      extra = {},
    ) =>
      Object.assign(
        {
          id,
          type,
          name,
          ini: name
            .split(/[\s-]+/)
            .filter((w) => /^[A-ZÉÈ]/.test(w))
            .slice(0, 2)
            .map((w) => w[0])
            .join(""),
          city,
          addr,
          phone,
          email,
          since,
          insurerId,
          pref,
          rating,
          note,
          hist: [],
          comms: [],
          fleet: null,
          contact: "",
        },
        extra,
      );
    S.customers = [
      C(
        "C1",
        "prive",
        "Nathalie Favre",
        "69007 Lyon",
        "58 avenue Jean-Jaurès",
        "+33 69 412 38 61",
        "n.favre@orange.fr",
        2017,
        "mob",
        "SMS",
        5,
        "Préfère être contactée après 17h. Véhicule de remplacement souhaité.",
        {
          hist: [
            ["2025-03-14", "Remplacement pare-brise", 1180],
            ["2023-11-02", "Débosselage portière AR G (PDR)", 640],
            ["2021-06-19", "Grêle — 18 impacts", 2350],
          ],
        },
      ),
      C(
        "C2",
        "prive",
        "Pierre-Alain Girardin",
        "69200 Vénissieux",
        "12 chemin des Vignes",
        "+33 69 207 55 14",
        "pa.gillieron@gmail.com",
        2022,
        "hel",
        "Appel",
        4,
        "Sur place — signe le devis grêle.",
        { hist: [["2024-05-08", "Rétroviseur ext. D", 412]] },
      ),
      C(
        "C3",
        "prive",
        "Sandrine Rey",
        "69100 Villeurbanne",
        "Rue de Lyon 31",
        "+33 68 640 72 09",
        "sandrine.rey@free.fr",
        2015,
        "axa",
        "SMS",
        5,
        "Cliente fidèle — attend la restitution de sa Clio.",
        {
          hist: [
            ["2025-09-21", "Pare-chocs AR + capteurs", 1940],
            ["2024-01-11", "Révision + pneus hiver", 860],
            ["2022-07-03", "Aile AV G + peinture", 2210],
          ],
        },
      ),
      C(
        "C4",
        "prive",
        "Thomas Weber",
        "69300 Caluire-et-Cuire",
        "104 avenue de Saxe",
        "+33 69 158 90 37",
        "t.weber@sfr.fr",
        2019,
        "axa",
        "E-mail",
        4,
        "Voiture de remplacement en cours (Fiat 500 · GH-031-KD).",
        { hist: [["2024-10-16", "Pare-brise + caméra", 1420]] },
      ),
      C(
        "C5",
        "prive",
        "Fatima Benali",
        "69009 Lyon",
        "7 chemin des Peupliers",
        "+33 66 532 18 44",
        "f.benali@outlook.com",
        2023,
        "zur",
        "SMS",
        5,
        "Prévenir dès réception du pare-brise.",
      ),
      C(
        "C6",
        "prive",
        "Olivier Monnier",
        "69500 Bron",
        "22 route de Grenoble",
        "+33 69 380 61 25",
        "olivier.monnier@orange.fr",
        2020,
        "vau",
        "Appel",
        4,
        "Dossier assurance validé. Véhicule de remplacement Toyota Yaris.",
        { hist: [["2023-08-30", "Portière AV D", 1780]] },
      ),
      C(
        "C7",
        "prive",
        "Claire Jacquet",
        "69600 Oullins",
        "9 quai Claude-Bernard",
        "+33 68 211 47 62",
        "claire.jaquet@icloud.com",
        2018,
        null,
        "SMS",
        5,
        "Paiement par carte à la restitution.",
        {
          hist: [
            ["2025-02-12", "Polissage + céramique", 690],
            ["2023-06-07", "Spot-repair pare-chocs", 380],
          ],
        },
      ),
      C(
        "C8",
        "prive",
        "Marco Rossi",
        "69007 Lyon",
        "41 avenue Berthelot",
        "+33 69 666 02 18",
        "m.rossi@gmail.com",
        2016,
        "gen",
        "Appel",
        5,
        "Sur place — restitution Classe C.",
        {
          hist: [
            ["2025-04-18", "Capot + calandre", 2980],
            ["2023-12-09", "Pneus + géométrie", 1150],
          ],
        },
      ),
      C(
        "C9",
        "prive",
        "Élodie Perret",
        "69330 Meyzieu",
        "18 Grande Rue",
        "+33 68 455 39 70",
        "elodie.perret@orange.fr",
        2021,
        "smi",
        "SMS",
        5,
        "Restitution prévue ce matin.",
        { hist: [["2024-11-22", "Pare-chocs AV", 1260]] },
      ),
      C(
        "C10",
        "prive",
        "Stéphane Bernier",
        "69800 Saint-Priest",
        "6 rue Pasteur",
        "+33 69 724 81 33",
        "s.burnier@laposte.net",
        2026,
        "all",
        "SMS",
        0,
        "Nouveau client — recommandé par Allianz.",
      ),
      C(
        "C11",
        "entreprise",
        "Rhône Services SAS",
        "69100 Villeurbanne",
        "40 rue Garibaldi",
        "+33 4 72 555 40 40",
        "flotte@romandie-services.fr",
        2014,
        "zur",
        "E-mail",
        4,
        "Contrat cadre — facturation mensuelle.",
        {
          contact: "Sylvie Aebischer (gestionnaire flotte)",
          fleet: {
            size: 24,
            contract: "Contrat cadre 2024-2027",
            discount: 8,
            terms: 45,
            billing: "Mensuelle",
            sla: "Devis < 24 h · immobilisation < 5 j",
          },
          hist: [
            ["2026-09-02", "Trafic #12 — porte latérale", 2140],
            ["2026-08-14", "Kangoo #7 — pare-chocs", 980],
            ["2026-07-29", "Master #3 — rétroviseurs", 760],
          ],
        },
      ),
      C(
        "C12",
        "entreprise",
        "Lyon Leasing SAS",
        "69002 Lyon",
        "5 rue de la Part-Dieu",
        "+33 4 72 310 77 00",
        "remarketing@leman-leasing.fr",
        2019,
        "bal",
        "E-mail",
        4,
        "Remise en état fin de leasing. Accord préalable obligatoire > 1 500 €.",
        {
          contact: "Jérôme Vuilleumier (remarketing)",
          fleet: {
            size: 310,
            contract: "Accord-cadre remise en état",
            discount: 10,
            terms: 30,
            billing: "Par dossier",
            sla: "Rapport photo sous 48 h",
          },
        },
      ),
      C(
        "C13",
        "entreprise",
        "Garage des Monts SARL",
        "69120 Vaulx-en-Velin",
        "14 route de Vienne",
        "+33 4 72 652 18 18",
        "atelier@garage-des-alpes.fr",
        2012,
        null,
        "Appel",
        5,
        "Garage partenaire : nous sous-traite la carrosserie de ses clients.",
        {
          contact: "Fabrice Chappuis (chef d’atelier)",
          fleet: {
            size: 0,
            contract: "Partenariat sous-traitance",
            discount: 12,
            terms: 30,
            billing: "Mensuelle",
            sla: "Prise en charge J+1",
          },
        },
      ),
      C(
        "C14",
        "prive",
        "Julie Moreau",
        "69003 Lyon",
        "33 chemin des Cerisiers",
        "+33 68 902 44 10",
        "julie.rochat@gmail.com",
        2024,
        "tcs",
        "SMS",
        5,
        "",
        { hist: [["2025-11-04", "Spot-repair aile AR D", 520]] },
      ),
      C(
        "C15",
        "prive",
        "Antoine Mercier",
        "69130 Écully",
        "3 route de Paris",
        "+33 69 118 73 52",
        "a.mercier@proton.me",
        2026,
        "bal",
        "E-mail",
        0,
        "Nouveau client — trouvé via Google.",
      ),
      C(
        "C16",
        "prive",
        "Laura Gomes",
        "69700 Givors",
        "9 avenue Gambetta",
        "+33 66 744 20 81",
        "laura.gomes@orange.fr",
        2022,
        "mob",
        "SMS",
        4,
        "",
      ),
      C(
        "C17",
        "prive",
        "Patrick Zbinden",
        "69960 Corbas",
        "21 chemin du Vallon",
        "+33 69 640 55 93",
        "p.zbinden@orange.fr",
        2018,
        "axa",
        "Appel",
        5,
        "Collectionneur — exigeant sur les raccords de teinte.",
      ),
    ];

    /* ---------- véhicules (V1-V11 = véhicules visibles dans l'atelier 3D) ---------- */
    const V = (
      id,
      customerId,
      make,
      model,
      plate,
      year,
      km,
      colorName,
      colorCode,
      hex,
      vin,
      extra = {},
    ) =>
      Object.assign(
        {
          id,
          customerId,
          make,
          model,
          plate,
          year,
          km,
          colorName,
          colorCode,
          hex,
          vin,
          fuel: "Essence",
          build: {},
          hist: [],
          nextCT: null,
        },
        extra,
      );
    S.vehicles = [
      V(
        "V1",
        "C1",
        "VW",
        "Golf VIII 1.5 eTSI",
        "MB-118-CC",
        2022,
        38420,
        "Blanc pur",
        "LC9A",
        "#f2f3f4",
        "WVWZZZCDZNW118452",
        {
          build: { primer: "front" },
          hist: [
            [
              "2025-03-14",
              "Remplacement pare-brise",
              "Pare-brise + calibrage caméra",
            ],
            ["2023-11-02", "Débosselage portière AR G", "Sans peinture (PDR)"],
          ],
          nextCT: addDays(today(), 210),
        },
      ),
      V(
        "V2",
        "C4",
        "BMW",
        "Série 3 Touring 320d",
        "ZR-903-JT",
        2021,
        64110,
        "Gris minéral",
        "B39",
        "#4a4f57",
        "WBA8K510X0FJ71290",
        {
          fuel: "Diesel",
          build: { primer: "side" },
          hist: [
            ["2024-10-16", "Pare-brise + caméra", "Remplacement & calibrage"],
          ],
          nextCT: addDays(today(), 95),
        },
      ),
      V(
        "V3",
        "C5",
        "Tesla",
        "Model 3 Long Range",
        "XC-446-HT",
        2023,
        21870,
        "Rouge multicouche",
        "PPMR",
        "#b8242b",
        "5YJ3E7EB0PF207446",
        { fuel: "Électrique", nextCT: addDays(today(), 800) },
      ),
      V(
        "V4",
        "C6",
        "Škoda",
        "Octavia Combi 2.0 TDI",
        "PH-412-LM",
        2020,
        97300,
        "Argent brillant",
        "8E8E",
        "#c4c8ce",
        "TMBJJ7NX5L0884120",
        {
          fuel: "Diesel",
          build: { primer: "front" },
          hist: [["2023-08-30", "Portière AV D", "Remplacement + peinture"]],
          nextCT: addDays(today(), 41),
        },
      ),
      V(
        "V5",
        "C7",
        "Audi",
        "A3 Sportback 35 TFSI",
        "KZ-031-HF",
        2024,
        12640,
        "Blanc glacier",
        "LS9R",
        "#f4f5f6",
        "WAUZZZGY4RA590031",
        {
          build: { masked: true },
          hist: [["2025-02-12", "Polissage + céramique", "Traitement 3 ans"]],
          nextCT: addDays(today(), 1200),
        },
      ),
      V(
        "V6",
        "C2",
        "Toyota",
        "Yaris 1.5 Hybrid",
        "SW-980-XK",
        2021,
        45010,
        "Blanc nacré",
        "070",
        "#eef0f1",
        "VNKKAAD320A144980",
        {
          fuel: "Hybride",
          hist: [["2024-05-08", "Rétroviseur ext. D", "Remplacement"]],
          nextCT: addDays(today(), 160),
        },
      ),
      V(
        "V7",
        "C3",
        "Renault",
        "Clio V E-Tech",
        "FJ-554-BN",
        2022,
        29300,
        "Gris titanium",
        "KPN",
        "#9aa0a8",
        "VF1RJA00X68318554",
        {
          fuel: "Hybride",
          hist: [
            [
              "2025-09-21",
              "Pare-chocs AR + capteurs",
              "Remplacement + peinture",
            ],
          ],
          nextCT: addDays(today(), 18),
        },
      ),
      V(
        "V8",
        "C8",
        "Mercedes",
        "Classe C 220d",
        "KB-227-JT",
        2023,
        31900,
        "Noir obsidienne",
        "197",
        "#1f2125",
        "W1K2060161R403227",
        {
          fuel: "Diesel",
          hist: [["2025-04-18", "Capot + calandre", "Remplacement"]],
          nextCT: addDays(today(), 600),
        },
      ),
      V(
        "V9",
        "C9",
        "VW",
        "Tiguan 2.0 TSI 4Motion",
        "BD-841-TR",
        2022,
        52780,
        "Blanc pur",
        "LC9A",
        "#eef0f2",
        "WVGZZZ5NZNW266841",
        {
          build: { type: "suv" },
          hist: [["2024-11-22", "Pare-chocs AV", "Réparation plastique"]],
          nextCT: addDays(today(), 330),
        },
      ),
      V(
        "V10",
        "C11",
        "Renault",
        "Trafic L2 · flotte #18",
        "XS-330-HW",
        2020,
        148200,
        "Blanc glacier",
        "369",
        "#f3f4f5",
        "VF1FL000X64581330",
        {
          fuel: "Diesel",
          build: { type: "van" },
          hist: [["2026-09-02", "Porte latérale (#12)", "Flotte"]],
          nextCT: addDays(today(), 12),
        },
      ),
      V(
        "V11",
        "C10",
        "Peugeot",
        "308 SW Hybrid",
        "FX-207-PB",
        2024,
        8930,
        "Gris platinium",
        "EVL",
        "#8d939b",
        "VR3F4DGZTRY611207",
        {
          fuel: "Hybride",
          build: { primer: "rear" },
          nextCT: addDays(today(), 1300),
        },
      ),
      V(
        "V12",
        "C15",
        "Mazda",
        "CX-5 2.5 AWD",
        "DC-015-WG",
        2023,
        26400,
        "Soul Red Crystal",
        "46V",
        "#a3121e",
        "JMZKF6W1A00778015",
        { build: { type: "suv" } },
      ),
      V(
        "V13",
        "C12",
        "VW",
        "ID.4 Pro (leasing #4471)",
        "BB-912-HT",
        2023,
        61200,
        "Gris lune",
        "2R2R",
        "#aeb3b8",
        "WVGZZZE2ZPP330912",
        { fuel: "Électrique", build: { type: "suv" } },
      ),
      V(
        "V14",
        "C14",
        "Kia",
        "Niro HEV",
        "KG-664-HT",
        2022,
        33100,
        "Bleu Gravity",
        "B4U",
        "#2f3d55",
        "KNACC81CVN5102664",
        { fuel: "Hybride" },
      ),
      V(
        "V15",
        "C16",
        "Fiat",
        "500e La Prima",
        "MW-870-NV",
        2023,
        14200,
        "Vert Ocean",
        "5AF",
        "#4e7c74",
        "ZFAEFAC39PX455870",
        { fuel: "Électrique" },
      ),
      V(
        "V16",
        "C17",
        "Porsche",
        "911 Carrera (992)",
        "PK-017-KF",
        2021,
        22800,
        "Gris craie",
        "M7S",
        "#c9c7c0",
        "WP0ZZZ99ZMS911017",
        {},
      ),
      V(
        "V17",
        "C11",
        "Renault",
        "Kangoo · flotte #7",
        "TB-307-VZ",
        2021,
        98500,
        "Blanc glacier",
        "369",
        "#f3f4f5",
        "VF1KW000X65581307",
        { fuel: "Diesel", build: { type: "van" } },
      ),
      V(
        "V18",
        "C13",
        "Volvo",
        "XC60 B4 (client garage)",
        "KR-288-KK",
        2022,
        47300,
        "Bleu Denim",
        "720",
        "#40516b",
        "YV1UZK1V3N1640288",
        { fuel: "Hybride", build: { type: "suv" } },
      ),
      V(
        "V19",
        "C3",
        "Renault",
        "Captur TCe 140",
        "KV-990-RN",
        2020,
        61000,
        "Orange Atacama",
        "EOD",
        "#d7642a",
        "VF1RJB00X63318990",
        {},
      ),
      V(
        "V20",
        "C1",
        "Mini",
        "Cooper SE",
        "XJ-990-ZF",
        2021,
        30100,
        "Noir Midnight",
        "B45",
        "#22252a",
        "WMWXP3102M2452990",
        { fuel: "Électrique" },
      ),
    ];

    /* ---------- sinistres ---------- */
    const CL = (
      id,
      no,
      insurerId,
      vehicleId,
      kind,
      cover,
      franchise,
      extra = {},
    ) =>
      Object.assign(
        {
          id,
          no,
          insurerId,
          vehicleId,
          customerId: S.vehicles.find((v) => v.id === vehicleId).customerId,
          kind,
          cover,
          franchise,
          date: wd(-4),
          declaredAt: wd(-3),
          expert: null,
          expertiseAt: null,
          expertiseMode: "Sur place",
          report: null,
          approval: "Déclaré",
          approvedAmount: null,
          cession: false,
          cessionAt: null,
          reminders: [],
          notes: "",
          log: [],
        },
        extra,
      );
    S.claims = [
      CL("K1", "26-418 552", "mob", "V1", "Collision", "Tous risques", 500, {
        date: wd(-3),
        expert: "Christophe Moreau",
        expertiseAt: dt(-2, "10:45"),
        report: "Reçu",
        approval: "Accordé",
        approvedAmount: 3438,
        cession: true,
        cessionAt: dt(-2, "08:20"),
      }),
      CL(
        "K2",
        "9.402.118",
        "axa",
        "V2",
        "Collision (tiers identifié)",
        "RC adverse",
        0,
        {
          date: wd(-2),
          expert: "Philippe Gander",
          expertiseAt: dt(-1, "09:15"),
          report: "Reçu",
          approval: "Accordé",
          approvedAmount: 4180,
          cession: true,
          cessionAt: dt(-1, "07:50"),
        },
      ),
      CL(
        "K3",
        "31-0077-26",
        "zur",
        "V3",
        "Bris de glace",
        "Tiers étendu",
        200,
        {
          date: wd(-4),
          expert: "Expertise photo",
          expertiseMode: "Photos",
          expertiseAt: dt(-3, "15:00"),
          report: "Reçu",
          approval: "Accordé",
          approvedAmount: 1760,
          cession: true,
          cessionAt: dt(-3, "14:30"),
        },
      ),
      CL(
        "K4",
        "77-26-1190",
        "vau",
        "V4",
        "Collision frontale",
        "Tous risques",
        1000,
        {
          date: wd(-2),
          expert: "Pascal Mettraux",
          expertiseAt: dt(-1, "15:20"),
          report: "Reçu",
          approval: "Accordé",
          approvedAmount: 5980,
          cession: true,
          cessionAt: dt(-1, "13:10"),
          notes:
            "Supplément D-24819-2 (traverse cachée) envoyé, en attente de validation.",
        },
      ),
      CL("K6", "26-55821", "hel", "V6", "Grêle", "Tiers étendu", 0, {
        date: wd(-6),
        declaredAt: wd(-5),
        expert: "Jean-Daniel Favre",
        expertiseAt: dt(0, "11:30"),
        approval: "Expertise planifiée",
        cession: false,
      }),
      CL(
        "K7",
        "9.398.557",
        "axa",
        "V7",
        "Accrochage parking",
        "Tous risques",
        500,
        {
          date: wd(-7),
          expert: "Nadia Weber",
          expertiseAt: dt(-4, "09:10"),
          report: "Reçu",
          approval: "Accordé",
          approvedAmount: 2360,
          cession: true,
          cessionAt: dt(-4, "08:05"),
        },
      ),
      CL("K8", "44-20187", "gen", "V8", "Collision", "Tous risques", 300, {
        date: wd(-8),
        expert: "Lorenzo Conti",
        expertiseAt: dt(-5, "11:00"),
        report: "Reçu",
        approval: "Accordé",
        approvedAmount: 2985,
        cession: true,
        cessionAt: dt(-5, "10:35"),
      }),
      CL("K9", "SM-26-0442", "smi", "V9", "Collision", "Tous risques", 500, {
        date: wd(-9),
        expert: "Expertise photo en ligne",
        expertiseMode: "Photos",
        expertiseAt: dt(-6, "09:00"),
        report: "Reçu",
        approval: "Accordé",
        approvedAmount: 1940,
        cession: true,
        cessionAt: dt(-6, "08:00"),
      }),
      CL(
        "K11",
        "AZ-7741-26",
        "all",
        "V11",
        "Accrochage parking",
        "Tous risques",
        500,
        {
          date: wd(-1),
          declaredAt: wd(-1),
          approval: "Déclaré",
          notes: "Client envoyé par Allianz (garage partenaire).",
        },
      ),
      CL(
        "K13",
        "BA-26-88015",
        "bal",
        "V13",
        "Dégâts fin de leasing",
        "Hors assurance (bailleur)",
        0,
        {
          date: wd(-2),
          approval: "Déclaré",
          notes:
            "Accord du bailleur (Léman Leasing) requis — pas d’expert assureur.",
        },
      ),
      CL("K14", "TCS-26-30441", "tcs", "V14", "Grêle", "Tiers étendu", 0, {
        date: wd(-12),
        declaredAt: wd(-10),
        approval: "Déclaré",
        notes: "Expertise grêle à planifier — client disponible le matin.",
      }),
      CL("K16", "27-118 004", "mob", "V15", "Vandalisme", "Tous risques", 200, {
        date: wd(-5),
        expert: "Anne Python",
        expertiseAt: dt(-3, "14:00"),
        report: "Reçu",
        approval: "Partiel",
        approvedAmount: 1180,
        notes:
          "Accord partiel : l’assureur refuse le remplacement de la jante (réparation demandée).",
        cession: true,
        cessionAt: dt(-3, "13:40"),
      }),
    ];

    /* ---------- devis (lignes façon chiffrage Audatex / GT Motive) ---------- */
    let lid = 0;
    const L = (
      zone,
      piece,
      op,
      cat,
      h,
      ph,
      ref = "",
      price = 0,
      qty = 1,
      disc = 0,
      extra = {},
    ) =>
      Object.assign(
        { id: "l" + ++lid, zone, piece, op, cat, h, ph, ref, price, qty, disc },
        extra,
      );
    const F = (label, price) => ({
      id: "l" + ++lid,
      zone: "",
      piece: label,
      op: "F",
      cat: "",
      h: 0,
      ph: 0,
      ref: "",
      price,
      qty: 1,
      disc: 0,
    });
    const Q = (id, no, vehicleId, claimId, status, lines, extra = {}) =>
      Object.assign(
        {
          id,
          no,
          vehicleId,
          customerId: S.vehicles.find((v) => v.id === vehicleId).customerId,
          claimId,
          status,
          lines,
          date: wd(-2),
          sentAt: null,
          decidedAt: null,
          roId: null,
          notes: "",
          author: "E1",
          version: 1,
        },
        extra,
      );
    S.quotes = [
      Q(
        "D1",
        "D-24817",
        "V1",
        "K1",
        "Accordé",
        [
          L(
            "pcav",
            "Pare-chocs AV",
            "E",
            "T1",
            1.2,
            2.2,
            "5H0 807 221 GRU",
            486,
          ),
          L(
            "phavd",
            "Phare LED AV D",
            "E",
            "T1",
            0.6,
            0,
            "5H1 941 006 B",
            1120,
          ),
          L("ailavd", "Aile AV D", "I", "T2", 3.2, 1.8),
          L("", "Kit clips & fixations", "E", "T1", 0, 0, "CL-50U", 38.5),
          F("Calibrage caméra ADAS (forfait)", 180),
        ],
        { date: wd(-2), sentAt: dt(-2, "11:30"), decidedAt: dt(-1, "08:31") },
      ),
      Q(
        "D2",
        "D-24821",
        "V2",
        "K2",
        "Accordé",
        [
          L("ptarg", "Porte AR G", "I", "T2", 4.5, 2.2),
          L(
            "bcg",
            "Bas de caisse G",
            "E",
            "T3",
            4.5,
            2.8,
            "41 00 7 486 041",
            612,
          ),
          L(
            "ptarg",
            "Joint de porte AR G",
            "E",
            "T1",
            0.4,
            0,
            "51 72 7 485 812",
            96,
          ),
          L("", "Mastic d’étanchéité", "E", "", 0, 0, "MS-290", 42),
          F("Protection corps creux (forfait)", 95),
        ],
        { date: wd(-1), sentAt: dt(-1, "10:00"), decidedAt: dt(-1, "16:40") },
      ),
      Q(
        "D3",
        "D-24812",
        "V3",
        "K3",
        "Accordé",
        [
          L(
            "pb",
            "Pare-brise (avec capteur pluie)",
            "E",
            "T1",
            2.5,
            0,
            "1081 768-00-D",
            1385,
          ),
          L("", "Kit collage PU", "E", "", 0, 0, "PU-310", 64),
          F("Calibrage caméra Autopilot", 160),
        ],
        { date: wd(-3), sentAt: dt(-3, "15:30"), decidedAt: dt(-2, "08:30") },
      ),
      Q(
        "D4",
        "D-24819",
        "V4",
        "K4",
        "Accordé",
        [
          L("struct", "Mise sur marbre & mesures", "DM", "T3", 3, 0),
          L("struct", "Longeron AV G (redressage)", "I", "T3", 6.5, 0),
          L("pcav", "Traverse AV", "E", "T2", 2.5, 0, "5E0 805 588 C", 742),
          L("ailavg", "Aile AV G", "E", "T2", 1.5, 2.4, "5E3 821 021", 318),
          L("capot", "Capot", "E", "T2", 1.0, 3.0, "5E0 823 031 E", 690),
          L("pcav", "Calandre", "E", "T1", 0.4, 0, "5E3 853 653", 214),
          F("Géométrie 4 roues", 160),
        ],
        { date: wd(-1), sentAt: dt(-1, "14:00"), decidedAt: dt(-1, "17:05") },
      ),
      Q(
        "D4b",
        "D-24819-2",
        "V4",
        "K4",
        "Envoyé",
        [
          L(
            "pcav",
            "Absorbeur de choc AV (dégât caché)",
            "E",
            "T2",
            1.5,
            0,
            "5E0 807 550",
            286,
          ),
          L(
            "struct",
            "Support radiateur",
            "E",
            "T3",
            2.5,
            0.6,
            "5E0 805 594",
            214,
          ),
        ],
        {
          date: wd(0),
          sentAt: dt(0, "08:15"),
          notes: "Supplément suite au démontage : dégâts cachés constatés.",
          version: 2,
        },
      ),
      Q(
        "D5",
        "D-24808",
        "V5",
        null,
        "Accordé",
        [
          L("hayon", "Hayon (rayures)", "I", "T2", 1.5, 2.0),
          L("pcar", "Pare-chocs AR", "I", "T2", 1.0, 1.5),
          L("", "Lustrage complet", "F", "", 0, 0, "", 0),
        ],
        { date: wd(-2), decidedAt: dt(-2, "09:30") },
      ),
      Q(
        "D6",
        "D-24823",
        "V6",
        "K6",
        "Envoyé",
        [
          L("capot", "Capot — 14 impacts grêle (PDR)", "I", "T2", 5.5, 0),
          L("toit", "Toit — 18 impacts grêle (PDR)", "I", "T2", 7.0, 0),
          L("toit", "Dépose ciel de toit", "DM", "T1", 2.0, 0),
          L("pb", "Joint pare-brise", "E", "T1", 0, 0, "75533-0D010", 96),
          F("Cartographie impacts (scanner grêle)", 220),
        ],
        { date: wd(0), sentAt: dt(0, "09:30") },
      ),
      Q(
        "D7",
        "D-24809",
        "V7",
        "K7",
        "Accordé",
        [
          L(
            "ptavd",
            "Porte AV D (nue)",
            "E",
            "T2",
            2.5,
            3.2,
            "801006283R",
            920,
          ),
          L(
            "retd",
            "Rétroviseur ext. D",
            "E",
            "T1",
            0.5,
            0.6,
            "963019577R",
            388,
          ),
        ],
        { date: wd(-5), sentAt: dt(-5, "10:00"), decidedAt: dt(-4, "09:00") },
      ),
      Q(
        "D8",
        "D-24806",
        "V8",
        "K8",
        "Accordé",
        [
          L("pcav", "Pare-chocs AV", "E", "T1", 1.2, 2.4, "A206 885 0401", 820),
          L("pcav", "Calandre AMG", "E", "T1", 0.5, 0, "A206 888 2300", 540),
        ],
        { date: wd(-6), decidedAt: dt(-5, "11:00") },
      ),
      Q(
        "D9",
        "D-24802",
        "V9",
        "K9",
        "Accordé",
        [
          L("pcav", "Pare-chocs AV", "E", "T1", 1.2, 2.2, "5NA 807 221", 560),
          L("pcav", "Antibrouillard D", "E", "T1", 0.3, 0, "5NA 941 700", 145),
        ],
        { date: wd(-7), decidedAt: dt(-6, "10:00") },
      ),
      Q(
        "D10",
        "D-24828",
        "V10",
        null,
        "Envoyé",
        [
          L("ptard", "Porte latérale coulissante D", "I", "T2", 4.0, 2.4),
          L(
            "ptard",
            "Rail de porte coulissante",
            "E",
            "T1",
            1.0,
            0,
            "82 00 012 845",
            284,
          ),
        ],
        {
          date: wd(0),
          sentAt: dt(-4, "08:45"),
          notes: "Contrat cadre Romandie Services — remise 8 % sur pièces.",
        },
      ),
      Q(
        "D11",
        "D-24826",
        "V11",
        "K11",
        "Brouillon",
        [
          L("ailard", "Aile AR D", "I", "T2", 3.5, 2.6),
          L("feuard", "Feu AR D LED", "E", "T1", 0.6, 0, "98 249 712 80", 465),
          L("pcar", "Pare-chocs AR (raccord)", "L", "", 0, 1.0),
        ],
        { date: wd(0) },
      ),
      Q(
        "D13",
        "D-24833",
        "V13",
        "K13",
        "Envoyé",
        [
          L("pcav", "Pare-chocs AV (rayures)", "I", "T2", 1.5, 1.8),
          L("ptavg", "Porte AV G (bosse)", "I", "T2", 2.0, 0),
          F("Rapport photo fin de leasing", 60),
        ],
        { date: wd(-1), sentAt: dt(-1, "16:10") },
      ),
      Q(
        "D16",
        "D-24829",
        "V15",
        "K16",
        "Accordé",
        [
          L("ptavg", "Porte AV G (rayures profondes)", "I", "T2", 1.5, 2.2),
          L("ptarg", "Porte AR G", "L", "", 0, 1.6),
          L("", "Jante AV G (réparation)", "I", "T1", 1.0, 0, "", 0, 1, 0, {
            client: false,
          }),
        ],
        { date: wd(-3), sentAt: dt(-3, "16:00"), decidedAt: dt(-1, "10:20") },
      ),
      Q(
        "D17",
        "D-24834",
        "V16",
        null,
        "Brouillon",
        [
          L("ailavg", "Aile AV G (éclat gravillon)", "L", "", 0, 1.2),
          F("Polissage céramique (option client)", 450),
        ],
        { date: wd(0) },
      ),
    ];

    /* ---------- ordres de réparation ---------- */
    const R = (id, no, vehicleId, stage, slot, extra = {}) => {
      const v = S.vehicles.find((x) => x.id === vehicleId);
      return Object.assign(
        {
          id,
          no,
          vehicleId,
          customerId: v.customerId,
          claimId: null,
          quoteId: null,
          stage,
          slot,
          posteId: null,
          lead: null,
          team: [],
          damage: "",
          prog: 0,
          marbre: false,
          apptAt: null,
          inAt: null,
          dueAt: null,
          outAt: null,
          stageLog: [],
          tasks: [],
          photos: [],
          history: [],
          checkin: null,
          qc: null,
          notified: false,
          review: null,
          courtesyId: null,
          planned: {},
          waitingParts: false,
          priority: "normale",
          notes: "",
        },
        extra,
      );
    };
    const T = (...a) => a.map(([l, p]) => ({ l, p }));
    const SL = (...a) => a.map(([k, at]) => ({ stage: ST[k], at }));
    S.ros = [
      R("R1", "OR-24817", "V1", ST.tole, "P1", {
        claimId: "K1",
        quoteId: "D1",
        posteId: "P1",
        lead: "E3",
        team: ["E3", "E6"],
        damage: "Choc avant droit — aile, pare-chocs, phare",
        prog: 58,
        apptAt: dt(-2, "08:00"),
        inAt: dt(-2, "08:10"),
        dueAt: dt(1, "16:30"),
        courtesyId: null,
        stageLog: SL(
          ["recep", dt(-2, "08:10")],
          ["devis", dt(-2, "10:45")],
          ["accord", dt(-2, "11:30")],
          ["pieces", dt(-1, "08:31")],
          ["demont", dt(-1, "09:00")],
          ["tole", dt(0, "08:02")],
        ),
        tasks: T(
          ["Démontage pare-chocs AV", 1],
          ["Remplacement phare LED AV D", 1],
          ["Redressage aile AV D", 0.6],
          ["Apprêt & peinture aile + pare-chocs", 0],
          ["Calibrage caméra ADAS", 0],
        ),
        planned: { tole: 6.5, prep: 1.5, peint: 4, montage: 1.5 },
      }),
      R("R2", "OR-24821", "V2", ST.tole, "P2", {
        claimId: "K2",
        quoteId: "D2",
        posteId: "P2",
        lead: "E4",
        team: ["E4", "E6"],
        damage: "Enfoncement porte AR G + bas de caisse",
        prog: 41,
        apptAt: dt(-1, "07:30"),
        inAt: dt(-1, "07:40"),
        dueAt: dt(2, "17:00"),
        courtesyId: "L1",
        stageLog: SL(
          ["recep", dt(-1, "07:40")],
          ["devis", dt(-1, "09:15")],
          ["accord", dt(-1, "10:00")],
          ["pieces", dt(-1, "16:40")],
          ["demont", dt(-1, "17:00")],
          ["tole", dt(0, "09:30")],
        ),
        tasks: T(
          ["Dépose garnitures porte AR G", 1],
          ["Découpe bas de caisse", 1],
          ["Soudure bas de caisse neuf", 0.3],
          ["Mastic & apprêt", 0],
          ["Peinture porte + bas de caisse", 0],
        ),
        planned: { tole: 9, prep: 2, peint: 5, montage: 1 },
      }),
      R("R3", "OR-24812", "V3", ST.pieces, "P3", {
        claimId: "K3",
        quoteId: "D3",
        posteId: "P3",
        lead: "E5",
        team: ["E5"],
        damage: "Pare-brise fissuré + capteur pluie",
        prog: 35,
        waitingParts: true,
        apptAt: dt(-3, "14:00"),
        inAt: dt(-3, "14:20"),
        dueAt: dt(0, "17:30"),
        stageLog: SL(
          ["recep", dt(-3, "14:20")],
          ["devis", dt(-2, "08:30")],
          ["accord", dt(-2, "08:30")],
          ["pieces", dt(-1, "10:00")],
        ),
        tasks: T(
          ["Dépose pare-brise endommagé", 1],
          ["Nettoyage & préparation cadre", 1],
          ["Pose pare-brise neuf", 0],
          ["Calibrage caméra Autopilot", 0],
        ),
        planned: { tole: 2.5, montage: 1 },
      }),
      R("R4", "OR-24819", "V4", ST.tole, "P5", {
        claimId: "K4",
        quoteId: "D4",
        posteId: "P5",
        lead: "E2",
        team: ["E2", "E6", "E10"],
        marbre: true,
        damage: "Choc frontal — longeron AV G",
        prog: 30,
        apptAt: dt(-1, "13:00"),
        inAt: dt(-1, "13:00"),
        dueAt: dt(4, "16:00"),
        courtesyId: "L2",
        stageLog: SL(
          ["recep", dt(-1, "13:00")],
          ["devis", dt(-1, "15:20")],
          ["accord", dt(-1, "17:05")],
          ["pieces", dt(-1, "17:10")],
          ["demont", dt(0, "07:35")],
          ["tole", dt(0, "08:40")],
        ),
        tasks: T(
          ["Mise sur marbre & mesures", 1],
          ["Redressage longeron AV G", 0.45],
          ["Remplacement traverse AV", 0],
          ["Aile AV G + capot", 0],
          ["Peinture", 0],
          ["Géométrie", 0],
        ),
        planned: { tole: 16, prep: 2, peint: 7, montage: 2 },
      }),
      R("R5", "OR-24808", "V5", ST.peint, "BOOTH", {
        quoteId: "D5",
        posteId: "BOOTH",
        lead: "E6",
        team: ["E10", "E6"],
        damage: "Rayures hayon + pare-chocs AR",
        prog: 74,
        apptAt: dt(-2, "09:00"),
        inAt: dt(-2, "09:00"),
        dueAt: dt(0, "16:00"),
        stageLog: SL(
          ["recep", dt(-2, "09:00")],
          ["devis", dt(-2, "09:40")],
          ["accord", dt(-2, "09:40")],
          ["demont", dt(-1, "08:10")],
          ["tole", dt(-1, "09:00")],
          ["prep", dt(-1, "13:30")],
          ["peint", dt(0, "09:05")],
        ),
        tasks: T(
          ["Ponçage & mastic hayon", 1],
          ["Apprêt", 1],
          ["Base + vernis", 1],
          ["Cuisson 60 °C", 0.6],
          ["Lustrage", 0],
        ),
        planned: { tole: 2.5, prep: 3, peint: 3.5 },
      }),
      R("R6", "OR-24823", "V6", ST.recep, "P4", {
        claimId: "K6",
        quoteId: "D6",
        posteId: "P4",
        lead: "E5",
        team: ["E5"],
        damage: "Grêle — capot & toit (32 impacts)",
        prog: 12,
        apptAt: dt(0, "08:30"),
        inAt: dt(0, "08:45"),
        dueAt: dt(5, "12:00"),
        stageLog: SL(["recep", dt(0, "08:45")]),
        tasks: T(
          ["Photos & cartographie impacts", 1],
          ["Rapport expertise Groupama", 0.5],
          ["Débosselage sans peinture", 0],
        ),
        planned: { tole: 12.5, montage: 2 },
      }),
      R("R7", "OR-24809", "V7", ST.pret, "PARK0", {
        claimId: "K7",
        quoteId: "D7",
        posteId: "P1",
        lead: "E3",
        team: ["E3", "E6"],
        damage: "Porte AV D + rétroviseur",
        prog: 100,
        apptAt: dt(-4, "08:00"),
        inAt: dt(-4, "08:00"),
        dueAt: dt(0, "10:00"),
        notified: true,
        stageLog: SL(
          ["recep", dt(-4, "08:00")],
          ["devis", dt(-4, "09:10")],
          ["accord", dt(-4, "09:10")],
          ["tole", dt(-3, "08:00")],
          ["peint", dt(-2, "13:40")],
          ["cq", dt(-1, "16:20")],
          ["pret", dt(0, "08:15")],
        ),
        tasks: T(
          ["Porte AV D", 1],
          ["Rétroviseur", 1],
          ["Peinture", 1],
          ["Contrôle qualité", 1],
          ["Lavage", 1],
        ),
        planned: { tole: 3, peint: 3.8, montage: 1.5 },
      }),
      R("R8", "OR-24806", "V8", ST.pret, "PARK1", {
        claimId: "K8",
        quoteId: "D8",
        posteId: "P2",
        lead: "E2",
        team: ["E2", "E6"],
        damage: "Pare-chocs AV + calandre",
        prog: 100,
        apptAt: dt(-5, "10:30"),
        inAt: dt(-5, "10:30"),
        dueAt: dt(0, "10:30"),
        notified: true,
        stageLog: SL(
          ["recep", dt(-5, "10:30")],
          ["devis", dt(-5, "11:00")],
          ["tole", dt(-4, "08:00")],
          ["peint", dt(-2, "09:00")],
          ["cq", dt(-1, "15:00")],
          ["pret", dt(0, "08:40")],
        ),
        tasks: T(
          ["Pare-chocs AV", 1],
          ["Calandre", 1],
          ["Peinture", 1],
          ["Contrôle qualité", 1],
        ),
        planned: { tole: 1.7, peint: 2.4, montage: 1 },
      }),
      R("R9", "OR-24802", "V9", ST.pret, "PARK2", {
        claimId: "K9",
        quoteId: "D9",
        posteId: "P1",
        lead: "E3",
        team: ["E3", "E6"],
        damage: "Pare-chocs AV + antibrouillard",
        prog: 100,
        apptAt: dt(-6, "08:00"),
        inAt: dt(-6, "08:00"),
        dueAt: dt(0, "10:15"),
        notified: false,
        stageLog: SL(
          ["recep", dt(-6, "08:00")],
          ["devis", dt(-6, "09:00")],
          ["tole", dt(-5, "08:00")],
          ["peint", dt(-3, "10:00")],
          ["cq", dt(-1, "14:00")],
          ["pret", dt(0, "08:00")],
        ),
        tasks: T(
          ["Pare-chocs AV", 1],
          ["Antibrouillard", 1],
          ["Peinture", 1],
          ["Contrôle qualité", 1],
        ),
        planned: { tole: 1.5, peint: 2.2, montage: 1 },
      }),
      R("R10", "OR-24828", "V10", ST.accord, "PARK5", {
        quoteId: "D10",
        lead: "E2",
        team: ["E2"],
        damage: "Porte latérale coulissante",
        prog: 6,
        apptAt: dt(0, "08:30"),
        inAt: dt(0, "08:30"),
        dueAt: dt(3, "17:00"),
        stageLog: SL(
          ["recep", dt(0, "08:30")],
          ["devis", dt(0, "08:40")],
          ["accord", dt(0, "08:45")],
        ),
        tasks: T(
          ["Prise en charge", 1],
          ["Expertise porte latérale", 0],
          ["Commande rail de porte", 0],
        ),
        planned: { tole: 5, peint: 2.4, montage: 1 },
      }),
      R("R11", "OR-24826", "V11", ST.rdv, "ROAD", {
        claimId: "K11",
        quoteId: "D11",
        lead: "E5",
        team: ["E5"],
        damage: "Aile AR D + feu (accrochage parking)",
        prog: 0,
        apptAt: dt(0, "09:55"),
        dueAt: dt(3, "17:00"),
        tasks: T(
          ["Accueil & état des lieux", 0],
          ["Photos réception", 0],
          ["Expertise", 0],
        ),
        planned: { tole: 4, peint: 3.6, montage: 1 },
      }),
      R("R12", "OR-24830", "V12", ST.rdv, "ROAD", {
        damage: "Pare-chocs AR enfoncé (marche arrière)",
        apptAt: dt(1, "08:00"),
        dueAt: dt(4, "17:00"),
        tasks: T(["Accueil & état des lieux", 0], ["Devis", 0]),
        planned: { tole: 3, peint: 2.5 },
      }),
      R("R13", "OR-24833", "V13", ST.accord, "ROAD", {
        claimId: "K13",
        quoteId: "D13",
        damage: "Remise en état fin de leasing",
        apptAt: dt(2, "08:00"),
        dueAt: dt(5, "17:00"),
        tasks: T(["Rapport photo", 1], ["Accord bailleur", 0]),
        planned: { tole: 3.5, peint: 1.8 },
      }),
      R("R14", "OR-24831", "V14", ST.rdv, "ROAD", {
        claimId: "K14",
        damage: "Grêle — capot, toit, coffre",
        apptAt: dt(3, "08:00"),
        dueAt: dt(8, "17:00"),
        tasks: T(["Expertise grêle", 0]),
        planned: { tole: 14 },
      }),
      R("R15", "OR-24829", "V15", ST.pieces, "ROAD", {
        claimId: "K16",
        quoteId: "D16",
        damage: "Vandalisme — rayures côté G",
        apptAt: dt(1, "10:00"),
        dueAt: dt(4, "17:00"),
        waitingParts: false,
        tasks: T(["Accord assurance (partiel)", 1], ["Commande jante", 0]),
        planned: { tole: 2.5, prep: 1.5, peint: 3.8 },
        notes: "Véhicule laissé chez le client jusqu’à réception des pièces.",
      }),
      R("R16", "OR-24834", "V16", ST.devis, "ROAD", {
        quoteId: "D17",
        damage: "Éclat gravillon aile AV G + polissage",
        apptAt: dt(4, "09:00"),
        dueAt: dt(6, "17:00"),
        priority: "haute",
        tasks: T(["Devis", 0.5]),
        planned: { peint: 1.2, prep: 1 },
      }),
    ];
    S.quotes.forEach((q) => {
      const r = S.ros.find((x) => x.quoteId === q.id);
      if (r) q.roId = r.id;
    });
    S.claims.forEach((k) => {
      const r = S.ros.find((x) => x.claimId === k.id);
      if (r) k.roId = r.id;
    });
    S.ros.forEach((r) => {
      if (!r.history.length)
        r.history = r.stageLog
          .map((s) => ({
            at: s.at,
            by: s.stage === ST.recep ? "E8" : r.lead || "E1",
            text: "Étape : " + STAGES[s.stage].l,
          }))
          .reverse();
    });
    // check-in et photos des véhicules déjà sur site
    S.ros
      .filter((r) => r.inAt)
      .forEach((r) => {
        const v = S.vehicles.find((x) => x.id === r.vehicleId),
          rr = rng(hash(r.id));
        const zones =
          {
            R1: { pcav: "F", ailavd: "B", phavd: "F" },
            R2: { ptarg: "B", bcg: "B" },
            R3: { pb: "F" },
            R4: { pcav: "F", capot: "B", ailavg: "B", struct: "B" },
            R5: { hayon: "R", pcar: "R" },
            R6: { capot: "G", toit: "G" },
            R7: { ptavd: "B", retd: "F" },
            R8: { pcav: "F" },
            R9: { pcav: "F" },
            R10: { ptard: "B" },
          }[r.id] || {};
        r.checkin = {
          at: r.inAt,
          km: v.km,
          fuel: Math.round(2 + rr() * 6) / 8,
          damages: zones,
          notes: "État des lieux contradictoire signé à la réception.",
          signed: true,
          by: "E8",
          objects: rr() > 0.5 ? "Siège enfant, câble de recharge" : "",
          photos: 6 + Math.floor(rr() * 10),
        };
        r.photos = [
          ["Avant", "avant"],
          ["3/4 AV D", "avant"],
          ["Dégâts", "avant"],
          ["Compteur", "avant"],
        ].map(([l, k]) => ({ id: uid("ph"), l, k, at: r.inAt }));
        if (r.stage >= ST.cq)
          r.photos.push(
            {
              id: uid("ph"),
              l: "Après — 3/4",
              k: "apres",
              at: r.stageLog[r.stageLog.length - 1].at,
            },
            {
              id: uid("ph"),
              l: "Après — détail",
              k: "apres",
              at: r.stageLog[r.stageLog.length - 1].at,
            },
          );
      });
    S.ros
      .filter((r) => r.stage >= ST.cq && r.stage < ST.facture)
      .forEach((r) => {
        r.qc = {
          items: Object.fromEntries(QC_ITEMS.map((x, i) => [i, true])),
          by: "E1",
          at: r.stageLog.find((s) => s.stage === ST.cq).at,
          ok: true,
          note: "",
        };
      });

    /* ---------- historique : OR clôturés (pour CA / statistiques) ---------- */
    const closed = [
      [
        "OR-24790",
        "V19",
        "axa",
        "Aile AR G + pare-chocs AR",
        2860,
        -18,
        500,
        "E3",
      ],
      [
        "OR-24792",
        "V17",
        "zur",
        "Pare-chocs AV (flotte #7)",
        980,
        -16,
        0,
        "E2",
      ],
      [
        "OR-24794",
        "V20",
        "mob",
        "Portière AV D + rétroviseur",
        2140,
        -14,
        300,
        "E5",
      ],
      [
        "OR-24795",
        "V18",
        null,
        "Capot + optique (client garage)",
        3420,
        -12,
        0,
        "E2",
      ],
      ["OR-24797", "V16", null, "Spot-repair pare-chocs AR", 690, -9, 0, "E6"],
      ["OR-24798", "V14", "tcs", "Hayon (rayures)", 1480, -8, 200, "E5"],
      ["OR-24799", "V12", null, "Jante + bas de caisse", 1160, -6, 0, "E4"],
      [
        "OR-24800",
        "V13",
        "bal",
        "Remise en état leasing #4402",
        1890,
        -4,
        0,
        "E3",
      ],
      ["OR-24801", "V17", "zur", "Porte AR (flotte #7)", 1740, -2, 0, "E2"],
      ["OR-24803", "V19", "axa", "Pare-brise + caméra", 1620, -1, 200, "E5"],
      [
        "OR-24804",
        "V18",
        null,
        "Pare-chocs AV (client garage)",
        1980,
        0,
        0,
        "E3",
      ],
      ["OR-24805", "V20", "mob", "Grêle léger (8 impacts)", 2450, 0, 0, "E5"],
      ["OR-24807", "V15", null, "Polissage + lustrage", 640, 0, 0, "E6"],
    ];
    // clientèle « historique » générée (OR clôturés ce mois-ci)
    const HV = [
      ["VW", "Polo 1.0 TSI", "#c9cdd3"],
      ["Toyota", "C-HR Hybrid", "#b8242b"],
      ["Škoda", "Kodiaq 2.0 TDI", "#3a3f47"],
      ["BMW", "X1 sDrive20i", "#eef0f2"],
      ["Audi", "Q3 35 TFSI", "#59606b"],
      ["Mercedes", "GLA 200", "#1f2125"],
      ["Hyundai", "Tucson HEV", "#2f3d55"],
      ["Ford", "Kuga PHEV", "#9aa0a8"],
      ["Volvo", "V60 B4", "#7a8590"],
      ["Seat", "Leon ST 1.5", "#f2f3f4"],
      ["Opel", "Corsa-e", "#d7642a"],
      ["Peugeot", "2008 PureTech", "#4a4f57"],
      ["Tesla", "Model Y", "#f4f5f6"],
      ["Dacia", "Duster 4x4", "#6b7a5a"],
      ["Citroën", "C5 Aircross", "#8d939b"],
      ["Subaru", "Outback 2.5", "#40516b"],
    ];
    const HN = [
      "Michel Girard",
      "Isabelle Lefebvre",
      "Yves Moreau",
      "Sophie Blanc",
      "Daniel Garnier",
      "Catherine Fontaine",
      "Nicolas Picard",
      "Valérie Lambert",
      "Bruno Chevalier",
      "Martine Mercier",
      "Alain Roux",
      "Céline Guérin",
      "Frédéric Renard",
      "Nadia Marchand",
      "Grégoire Collin",
      "Aline Duc",
    ];
    const HC = [
      "69007 Lyon",
      "69200 Vénissieux",
      "69100 Villeurbanne",
      "69300 Caluire-et-Cuire",
      "69009 Lyon",
      "69330 Meyzieu",
      "1052 Le Mont",
      "1023 Saint-Priest",
      "1028 Préverenges",
      "69960 Corbas",
      "69003 Lyon",
      "69700 Givors",
      "69130 Écully",
      "1026 Echandens",
      "1030 Bussigny",
      "1005 Lyon",
    ];
    const HI = [
      "axa",
      "mob",
      "zur",
      "hel",
      "gen",
      "bal",
      "vau",
      "all",
      "tcs",
      null,
      "axa",
      "mob",
      "zur",
      "vau",
      null,
      "hel",
    ];
    const HL = [
      "Pare-chocs AV + calandre",
      "Porte AV G + aile",
      "Hayon + feu AR",
      "Grêle — 22 impacts (PDR)",
      "Aile AR D + bas de caisse",
      "Capot + optique",
      "Rétroviseur + porte AR D",
      "Pare-brise + caméra ADAS",
      "Spot-repair pare-chocs AR",
      "Choc latéral G (2 portes)",
    ];
    const hr = rng(hash("hist" + today()));
    HN.forEach((nm, i) => {
      const cid = "C" + (20 + i),
        vid = "V" + (21 + i),
        [mk, md, hex] = HV[i];
      S.customers.push(
        C(
          cid,
          "prive",
          nm,
          HC[i],
          (3 + ((i * 7) % 40)) +
            " " +
            [
              "rue des Vignes",
              "avenue de la Gare",
              "rue du Bourg",
              "chemin du Levant",
              "route de Vienne",
            ][i % 5],
          "+33 6 " +
            pad(10 + ((i * 7) % 80)) +
            " " +
            pad(10 + ((i * 3) % 89)) +
            " " +
            pad(20 + ((i * 7) % 79)) +
            " " +
            pad(10 + ((i * 11) % 89)),
          nm
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(" ", ".") + "@orange.fr",
          2015 + (i % 10),
          HI[i],
          i % 3 ? "SMS" : "E-mail",
          4 + (i % 2),
          "",
        ),
      );
      S.vehicles.push(
        V(
          vid,
          cid,
          mk,
          md,
          "BCDFGHJKLMNPRSTVWXZ"[Math.floor(hr() * 19)] +
            "BCDFGHJKLMNPRSTVWXZ"[Math.floor(hr() * 19)] +
            "-" +
            (100 + Math.floor(hr() * 899)) +
            "-" +
            "BCDFGHJKLMNPRSTVWXZ"[Math.floor(hr() * 19)] +
            "BCDFGHJKLMNPRSTVWXZ"[Math.floor(hr() * 19)],
          2016 + (i % 9),
          20000 + Math.floor(hr() * 120000),
          "Teinte d’origine",
          "ZZ" + i,
          hex,
          "ZZZ" + String(hash(vid)).padStart(14, "0").slice(0, 14),
        ),
      );
    });
    for (let i = 0; i < 20; i++) {
      const k = i % 16,
        off = i < 4 ? 0 : -1 - Math.floor((i * 11) / 20),
        ttc = Math.round((1400 + hr() * 5200) / 10) * 10,
        insr = HI[k];
      closed.push([
        "OR-" + (24760 + i),
        "V" + (21 + k),
        insr,
        HL[i % HL.length],
        ttc,
        off,
        insr ? [0, 200, 300, 500, 1000][i % 5] : 0,
        ["E2", "E3", "E5", "E4"][i % 4],
      ]);
    }
    S.invoices = [];
    S.payments = [];
    closed.forEach(([no, vid, ins, label, ttc, off, fr, lead], i) => {
      const id = "RC" + i,
        v = S.vehicles.find((x) => x.id === vid),
        qid = "DC" + i,
        kid = ins ? "KC" + i : null,
        out = dt(off, off === 0 ? ["07:45", "08:20", "09:10"][i % 3] : "16:30");
      const ht = round5(ttc / (1 + TVA)),
        parts = round5(ht * 0.38),
        lab = Math.round(((ht * 0.3) / S.company.rates.T2) * 10) / 10,
        ph =
          Math.round(
            ((ht * 0.2) / (S.company.rates.P + S.company.paintMat)) * 10,
          ) / 10;
      const lines = [
        L(
          "",
          label.split(" (")[0],
          "E",
          "T2",
          lab,
          ph,
          "DIV-" + (100 + i),
          parts,
        ),
      ];
      const q = Q(qid, "D-" + no.slice(3), vid, kid, "Converti", lines, {
        date: wd(off - 5),
        decidedAt: dt(off - 4, "10:00"),
        roId: id,
      });
      S.quotes.push(q);
      if (ins)
        S.claims.push(
          CL(
            kid,
            ins.toUpperCase() + "-26-" + (40100 + i * 37),
            ins,
            vid,
            "Collision",
            "Tous risques",
            fr,
            {
              date: wd(off - 7),
              expert: S.insurers.find((x) => x.id === ins).experts[0],
              expertiseAt: dt(off - 5, "10:00"),
              report: "Reçu",
              approval: "Accordé",
              approvedAmount: ttc,
              cession: true,
              cessionAt: dt(off - 5, "09:00"),
              roId: id,
            },
          ),
        );
      S.ros.push(
        R(id, no, vid, ST.facture, "OUT", {
          claimId: kid,
          quoteId: qid,
          lead,
          team: [lead],
          damage: label,
          prog: 100,
          apptAt: dt(off - 5, "08:00"),
          inAt: dt(off - 3 - (i % 4), "08:00"),
          dueAt: dt(off - (i % 7 === 3 ? 1 : 0), "17:00"),
          outAt: out,
          notified: true,
          review:
            i % 3 === 0
              ? { sentAt: out, rating: 5 }
              : i % 3 === 1
                ? { sentAt: out }
                : null,
          stageLog: SL(
            ["recep", dt(off - 5, "08:00")],
            ["tole", dt(off - 4, "08:00")],
            ["peint", dt(off - 2, "09:00")],
            ["cq", dt(off - 1, "14:00")],
            ["pret", dt(off - 1, "16:00")],
            ["facture", out],
          ),
          tasks: T(
            ["Travaux carrosserie", 1],
            ["Peinture", 1],
            ["Contrôle qualité", 1],
          ),
          planned: { tole: lab, peint: ph },
        }),
      );
    });
    // factures des OR clôturés (calculées à partir des devis → répartition assurance / client)
    S.ros
      .filter((r) => r.stage === ST.facture)
      .forEach((r, i) => {
        const t = quoteTotalsRaw(
            S,
            S.quotes.find((q) => q.id === r.quoteId),
          ),
          date = dOf(r.outAt),
          cust = S.customers.find((c) => c.id === r.customerId);
        const terms = cust.fleet ? cust.fleet.terms : 30;
        const mk = (kind, payer, amount, n) => {
          const inv = {
            id: "I" + r.id + kind[0],
            no: "F-2026-" + String(388 + i * 2 + n).padStart(4, "0"),
            roId: r.id,
            kind,
            payerType: kind === "assurance" ? "insurer" : "customer",
            payerId: payer,
            amount: round5(amount),
            ht: round5(amount / (1 + TVA)),
            date,
            due: addDays(date, kind === "assurance" ? 30 : terms),
            status: "Émise",
            paid: 0,
            reminders: [],
            label: r.no + " · " + r.damage,
          };
          S.invoices.push(inv);
          return inv;
        };
        const k = r.claimId ? S.claims.find((c) => c.id === r.claimId) : null;
        if (k && t.insurer > 0) {
          const a = mk("assurance", k.insurerId, t.insurer, 0);
          const old = diffDays(a.date, today());
          if (old > 12 || (i % 4 === 0 && old > 3))
            pay(
              a,
              a.amount,
              addDays(a.date, Math.min(old, 9 + (i % 5))),
              "Virement",
            );
        }
        if (t.client > 0) {
          const c = mk("client", r.customerId, t.client, 1);
          const old = diffDays(c.date, today());
          if (!cust.fleet || old > 10) {
            if (i !== 2 && i !== 6)
              pay(
                c,
                c.amount,
                old === 0 ? today() : addDays(c.date, Math.min(old, 2)),
                old === 0 ? "Carte sans contact" : "Carte",
              );
          }
        }
      });
    function pay(inv, amount, date, method) {
      inv.paid = round5((inv.paid || 0) + amount);
      inv.status = inv.paid >= inv.amount - 0.01 ? "Payée" : "Partiel";
      S.payments.push({
        id: uid("pay"),
        invoiceId: inv.id,
        date,
        amount,
        method,
      });
    }
    // acompte sur l'OR privé en cours (Audi A3)
    S.invoices.push({
      id: "IACC1",
      no: "F-2026-" + String(388 + closed.length * 2).padStart(4, "0"),
      roId: "R5",
      kind: "acompte",
      payerType: "customer",
      payerId: "C7",
      amount: 500,
      ht: round5(500 / (1 + TVA)),
      date: wd(-2),
      due: wd(-2),
      status: "Payée",
      paid: 500,
      reminders: [],
      label: "Acompte OR-24808 · peinture hayon",
    });
    S.payments.push({
      id: uid("pay"),
      invoiceId: "IACC1",
      date: wd(-2),
      amount: 500,
      method: "Carte",
    });
    // facture client en retard (relance)
    const lateI = S.invoices.find(
      (i) =>
        i.kind === "client" &&
        i.status !== "Payée" &&
        diffDays(i.due, today()) > -40,
    );
    S.invoices.forEach((i) => {
      if (i.status !== "Payée" && diffDays(i.due, today()) > 0)
        i.status = "En retard";
    });
    if (lateI) {
      lateI.due = wd(-6);
      lateI.status = "En retard";
    }

    /* ---------- fournisseurs, stock, commandes ---------- */
    S.suppliers = [
      [
        "SU1",
        "Volkswagen Group France — pièces",
        "Agent de marque",
        "pieces@vwgroup-demo.fr",
        "+33 14 846 20 00",
        1,
      ],
      [
        "SU2",
        "BMW France — pièces",
        "Agent de marque",
        "pieces@bmw-demo.fr",
        "+33 18 269 11 11",
        2,
      ],
      [
        "SU3",
        "Tesla Service Lyon",
        "Agent de marque",
        "service-lyon@tesla-demo.fr",
        "+33 4 72 510 10 10",
        2,
      ],
      [
        "SU4",
        "Distributeur Toyota · Mercedes — pièces",
        "Agent de marque",
        "pieces@distrib-demo.fr",
        "+33 4 72 631 21 21",
        1,
      ],
      [
        "SU5",
        "Autodistribution",
        "Grossiste pièces",
        "commande@autodistribution-demo.fr",
        "+33 14 838 18 18",
        0,
      ],
      [
        "SU6",
        "Alliance Automotive",
        "Grossiste pièces",
        "lyon@alliance-demo.fr",
        "+33 4 72 637 44 44",
        0,
      ],
      [
        "SU7",
        "Peintures Axalta (Standox)",
        "Peinture & ingrédients",
        "commandes@axalta-demo.fr",
        "+33 4 72 701 33 33",
        1,
      ],
      [
        "SU8",
        "Würth France",
        "Consommables",
        "service@wurth-demo.fr",
        "+33 11 705 91 11",
        1,
      ],
      [
        "SU9",
        "Stellantis &You — pièces",
        "Agent de marque",
        "pieces.lyon@stellantis-demo.fr",
        "+33 4 72 641 50 50",
        2,
      ],
      [
        "SU10",
        "Renault Retail Group — pièces",
        "Agent de marque",
        "pieces.lyon@renault-demo.fr",
        "+33 4 72 621 21 00",
        1,
      ],
    ].map(([id, name, kind, email, phone, lead]) => ({
      id,
      name,
      kind,
      email,
      phone,
      leadDays: lead,
      rating: 4 + (id.length % 2) * 0.5,
    }));
    const P = (
      id,
      ref,
      name,
      cat,
      rack,
      loc,
      qty,
      min,
      unit,
      cost,
      supplierId,
      extra = {},
    ) =>
      Object.assign(
        {
          id,
          ref,
          name,
          cat,
          rack,
          loc,
          qty,
          min,
          unit,
          cost,
          price: round5(cost * 1.35),
          supplierId,
          reserved: 0,
          roId: null,
        },
        extra,
      );
    S.parts = [
      P(
        "PT1",
        "5H0 807 221 GRU",
        "Pare-chocs AV · Golf VIII (apprêté)",
        "Carrosserie",
        "A",
        "A-01",
        2,
        0,
        "pce",
        486,
        "SU1",
        { reserved: 1, roId: "R1" },
      ),
      P(
        "PT2",
        "5H1 941 006 B",
        "Phare LED AV D · Golf VIII",
        "Carrosserie",
        "A",
        "A-02",
        1,
        0,
        "pce",
        1120,
        "SU1",
        { reserved: 1, roId: "R1" },
      ),
      P(
        "PT3",
        "5E3 821 021",
        "Aile AV G · Octavia IV",
        "Carrosserie",
        "A",
        "A-04",
        1,
        0,
        "pce",
        318,
        "SU1",
        { reserved: 1, roId: "R4" },
      ),
      P(
        "PT4",
        "51 16 7 474 141",
        "Rétroviseur ext. G · BMW G21",
        "Carrosserie",
        "A",
        "A-06",
        0,
        0,
        "pce",
        402,
        "SU2",
      ),
      P(
        "PT5",
        "1081 768-00-D",
        "Pare-brise · Tesla Model 3",
        "Vitrage",
        "A",
        "A-08",
        0,
        0,
        "pce",
        1385,
        "SU3",
        { roId: "R3" },
      ),
      P(
        "PT6",
        "CL-50U",
        "Clips de fixation universels ×50",
        "Consommables",
        "A",
        "A-11",
        14,
        5,
        "boîte",
        24,
        "SU8",
      ),
      P(
        "PT7",
        "90-A997",
        "Base eau teinte mère · 1 L",
        "Peinture",
        "B",
        "B-01",
        18,
        8,
        "L",
        92,
        "SU7",
      ),
      P(
        "PT8",
        "VHS-2K5",
        "Vernis HS 2K · 5 L",
        "Peinture",
        "B",
        "B-02",
        3,
        4,
        "bidon",
        189,
        "SU7",
      ),
      P(
        "PT9",
        "APG-35",
        "Apprêt garnissant gris · 3.5 L",
        "Peinture",
        "B",
        "B-03",
        9,
        4,
        "bidon",
        118,
        "SU7",
      ),
      P(
        "PT10",
        "MP-2K",
        "Mastic polyester · 2 kg",
        "Consommables",
        "B",
        "B-05",
        11,
        4,
        "pot",
        36,
        "SU8",
      ),
      P(
        "PT11",
        "P400-100",
        "Disques abrasifs P400 ×100",
        "Consommables",
        "B",
        "B-07",
        4,
        6,
        "boîte",
        58,
        "SU8",
      ),
      P(
        "PT12",
        "PM-45",
        "Papier de masquage 45 cm",
        "Consommables",
        "B",
        "B-09",
        22,
        8,
        "rouleau",
        19,
        "SU8",
      ),
      P(
        "PT13",
        "MQB-PLQ",
        "Plaquettes de frein AV · VW MQB",
        "Mécanique",
        "C",
        "C-01",
        6,
        2,
        "jeu",
        89,
        "SU5",
      ),
      P(
        "PT14",
        "5W30-60",
        "Huile 5W-30 · fût 60 L",
        "Mécanique",
        "C",
        "C-03",
        2,
        1,
        "fût",
        540,
        "SU6",
      ),
      P(
        "PT15",
        "G13-5",
        "Liquide de refroidissement G13 · 5 L",
        "Mécanique",
        "C",
        "C-04",
        7,
        3,
        "bidon",
        32,
        "SU5",
      ),
      P(
        "PT16",
        "WB-600",
        "Balais d’essuie-glace 600/475",
        "Mécanique",
        "C",
        "C-06",
        0,
        4,
        "jeu",
        44,
        "SU6",
      ),
      P(
        "PT17",
        "DIL-WB5",
        "Diluant base eau · 5 L",
        "Peinture",
        "B",
        "B-04",
        6,
        3,
        "bidon",
        74,
        "SU7",
      ),
      P(
        "PT18",
        "DUR-HS1",
        "Durcisseur HS · 2.5 L",
        "Peinture",
        "B",
        "B-06",
        2,
        3,
        "bidon",
        96,
        "SU7",
      ),
      P(
        "PT19",
        "P800-100",
        "Disques abrasifs P800 ×100",
        "Consommables",
        "B",
        "B-08",
        9,
        6,
        "boîte",
        61,
        "SU8",
      ),
      P(
        "PT20",
        "FIL-CAB",
        "Filtres plafond cabine (jeu)",
        "Peinture",
        "B",
        "B-10",
        1,
        1,
        "jeu",
        420,
        "SU7",
      ),
      P(
        "PT21",
        "PU-310",
        "Colle PU vitrage · 310 ml",
        "Vitrage",
        "C",
        "C-08",
        5,
        3,
        "cart.",
        28,
        "SU6",
      ),
      P(
        "PT22",
        "MS-290",
        "Mastic d’étanchéité carrosserie",
        "Consommables",
        "A",
        "A-12",
        7,
        3,
        "cart.",
        21,
        "SU8",
      ),
    ];
    const O = (
      id,
      no,
      supplierId,
      roId,
      status,
      lines,
      date,
      eta,
      extra = {},
    ) =>
      Object.assign(
        {
          id,
          no,
          supplierId,
          roId,
          status,
          lines: lines.map(([ref, label, qty, price, partId]) => ({
            ref,
            label,
            qty,
            price,
            partId: partId || null,
          })),
          date,
          eta,
          receivedAt: null,
          notes: "",
          by: "E7",
        },
        extra,
      );
    S.orders = [
      O(
        "O1",
        "CMD-2026-118",
        "SU3",
        "R3",
        "Commandée",
        [
          ["1081 768-00-D", "Pare-brise Model 3", 1, 1385, "PT5"],
          ["PU-310", "Kit collage PU", 1, 64],
        ],
        wd(-1),
        dtc(0, "14:00"),
        { notes: "Livraison annoncée 14:00 par transporteur." },
      ),
      O(
        "O2",
        "CMD-2026-119",
        "SU2",
        "R2",
        "Reçue",
        [
          ["41 00 7 486 041", "Bas de caisse G (OE)", 1, 612],
          ["51 72 7 485 812", "Joint de porte AR G", 1, 96],
        ],
        wd(-1),
        dtc(0, "08:00"),
        { receivedAt: dt(0, "08:52") },
      ),
      O(
        "O3",
        "CMD-2026-120",
        "SU1",
        "R4",
        "Commandée",
        [
          ["5E0 805 588 C", "Traverse AV", 1, 742],
          ["5E0 823 031 E", "Capot", 1, 690],
          ["5E3 853 653", "Calandre", 1, 214],
        ],
        wd(0),
        dtc(1, "08:00"),
      ),
      O(
        "O4",
        "CMD-2026-117",
        "SU2",
        null,
        "Commandée",
        [["51 16 7 474 141", "Rétroviseur ext. G · BMW G21", 1, 402, "PT4"]],
        wd(-2),
        dtc(1, "10:00"),
        { notes: "Réassort stock." },
      ),
      O(
        "O5",
        "CMD-2026-114",
        "SU9",
        "R11",
        "En retard",
        [["98 249 712 80", "Feu AR D LED · 308 SW", 1, 465]],
        wd(-4),
        dtc(-1, "10:00"),
        { notes: "Rupture fournisseur — nouvelle date non confirmée." },
      ),
      O(
        "O6",
        "CMD-2026-121",
        "SU7",
        null,
        "Brouillon",
        [
          ["VHS-2K5", "Vernis HS 2K · 5 L", 4, 189, "PT8"],
          ["DUR-HS1", "Durcisseur HS · 2.5 L", 3, 96, "PT18"],
        ],
        wd(0),
        null,
        { notes: "Proposition automatique (stock bas)." },
      ),
      O(
        "O7",
        "CMD-2026-112",
        "SU4",
        "R8",
        "Reçue",
        [
          ["A206 885 0401", "Pare-chocs AV", 1, 820],
          ["A206 888 2300", "Calandre AMG", 1, 540],
        ],
        wd(-6),
        dtc(-4, "08:00"),
        { receivedAt: dt(-4, "09:20") },
      ),
      O(
        "O8",
        "CMD-2026-116",
        "SU10",
        "R15",
        "En retard",
        [["403006832R", 'Jante alu 17" (réparation refusée)', 1, 398]],
        wd(-3),
        dtc(-1, "16:00"),
      ),
    ];

    /* ---------- peinture : cabine, mélanges ---------- */
    S.paint = {
      booth: {
        temp: 60.2,
        humidity: 38,
        filtersH: 41,
        cycleMin: 30,
        energy: 42,
      },
      mixes: [
        {
          id: "MX1",
          roId: "R5",
          code: "LS9R",
          name: "Blanc glacier",
          qty: 0.85,
          cost: 112,
          at: dt(0, "09:12"),
          status: "Appliqué",
          by: "E6",
          layers: "Base eau + vernis HS 2K",
        },
        {
          id: "MX2",
          roId: "R1",
          code: "LC9A",
          name: "Blanc pur",
          qty: 0.6,
          cost: 74,
          at: null,
          status: "Planifié",
          by: "E6",
          layers: "Base eau + vernis HS 2K",
        },
        {
          id: "MX3",
          roId: "R2",
          code: "B39",
          name: "Gris minéral métallisé",
          qty: 0.7,
          cost: 118,
          at: null,
          status: "Planifié",
          by: "E6",
          layers: "Base eau métal + vernis",
        },
        {
          id: "MX4",
          roId: "R4",
          code: "8E8E",
          name: "Argent brillant",
          qty: 1.1,
          cost: 141,
          at: null,
          status: "Planifié",
          by: "E6",
          layers: "Base eau métal + vernis",
        },
        {
          id: "MX5",
          roId: "R7",
          code: "KPN",
          name: "Gris titanium",
          qty: 0.9,
          cost: 126,
          at: dt(-2, "13:40"),
          status: "Appliqué",
          by: "E6",
          layers: "Base eau métal + vernis",
        },
        {
          id: "MX6",
          roId: "R8",
          code: "197",
          name: "Noir obsidienne",
          qty: 0.8,
          cost: 109,
          at: dt(-2, "09:00"),
          status: "Appliqué",
          by: "E6",
          layers: "Base eau + vernis anti-rayures",
        },
        {
          id: "MX7",
          roId: "R9",
          code: "LC9A",
          name: "Blanc pur",
          qty: 0.7,
          cost: 81,
          at: dt(-3, "10:00"),
          status: "Appliqué",
          by: "E6",
          layers: "Base eau + vernis HS 2K",
        },
      ],
    };

    /* ---------- planning atelier (réservations ressource × créneau) ---------- */
    const B = (roId, res, off, start, dur, tech) => ({
      id: uid("bk"),
      roId,
      res,
      date: wd(off),
      start: toMin(start),
      dur,
      tech: tech || null,
    });
    S.bookings = [
      B("R1", "P1", 0, "07:30", 4.5, "E3"),
      B("R1", "P1", 0, "13:00", 2, "E3"),
      B("R1", "BOOTH", 0, "13:00", 2.5, "E6"),
      B("R1", "P1", 1, "07:30", 1.5, "E3"),
      B("R2", "P2", 0, "09:30", 2.5, "E4"),
      B("R2", "P2", 0, "13:00", 4, "E4"),
      B("R2", "PREP", 1, "07:30", 2, "E10"),
      B("R2", "BOOTH", 1, "09:30", 3, "E6"),
      B("R2", "P2", 2, "07:30", 2, "E4"),
      B("R3", "P3", 0, "14:15", 2.5, "E5"),
      B("R3", "P3", 1, "07:30", 1, "E5"),
      B("R4", "P5", 0, "07:35", 4.5, "E2"),
      B("R4", "P5", 0, "13:00", 4.5, "E2"),
      B("R4", "P5", 1, "07:30", 8.5, "E2"),
      B("R4", "PREP", 2, "07:30", 2, "E10"),
      B("R4", "BOOTH", 2, "10:00", 4, "E6"),
      B("R4", "P5", 3, "07:30", 4, "E2"),
      B("R5", "BOOTH", 0, "09:00", 3, "E6"),
      B("R5", "PREP", -1, "13:30", 3, "E10"),
      B("R6", "P4", 0, "09:30", 2.5, "E5"),
      B("R6", "P4", 0, "13:00", 4, "E5"),
      B("R6", "P4", 1, "07:30", 8.5, "E5"),
      B("R6", "P4", 2, "07:30", 4, "E5"),
      B("R10", "P6", 1, "07:30", 5, "E2"),
      B("R10", "BOOTH", 2, "07:30", 2.5, "E6"),
      B("R11", "P6", 0, "10:30", 3, "E5"),
      B("R12", "P3", 2, "08:00", 3, "E3"),
    ];

    /* ---------- demandes de pièces émises depuis l'atelier (comptoir magasin) ---------- */
    S.partRequests = [];

    /* ---------- dépannage : missions, camions, parc de gardiennage ---------- */
    Object.assign(S, seedDepannage(S));

    /* ---------- garage intelligent & agent IA ---------- */
    S.cases = seedCases();
    S.agent = seedAgent();
    seedMaintenance(S);

    /* ---------- showroom / véhicules à vendre (activité concession) ---------- */
    S.showroom = seedShowroom();

    /* ---------- véhicules de remplacement ---------- */
    S.courtesy = [
      {
        id: "K-1",
        plate: "GH-031-KD",
        model: "Fiat 500 1.0 Hybrid",
        km: 28410,
        fuel: 0.5,
        state: "Bon état",
        status: "Prêté",
        color: "#e9e2d6",
        nextService: addDays(today(), 64),
        cat: "Citadine",
      },
      {
        id: "K-2",
        plate: "GH-032-KD",
        model: "VW Polo 1.0 TSI",
        km: 41200,
        fuel: 1,
        state: "Bon état",
        status: "Disponible",
        color: "#d5d8dd",
        nextService: addDays(today(), 120),
        cat: "Compacte",
      },
      {
        id: "K-3",
        plate: "GH-033-KD",
        model: "Toyota Yaris Hybrid",
        km: 35780,
        fuel: 0.75,
        state: "Rayure pare-chocs AR (connue)",
        status: "Prêté",
        color: "#eef0f1",
        nextService: addDays(today(), 22),
        cat: "Compacte",
      },
      {
        id: "K-4",
        plate: "GH-034-KD",
        model: "Škoda Fabia Combi",
        km: 66020,
        fuel: 0.25,
        state: "Service en cours",
        status: "Entretien",
        color: "#7a8590",
        nextService: today(),
        cat: "Break",
      },
      {
        id: "K-5",
        plate: "GH-035-KD",
        model: "Renault Zoe R135",
        km: 19870,
        fuel: 0.9,
        state: "Bon état",
        status: "Disponible",
        color: "#3b6fa8",
        nextService: addDays(today(), 200),
        cat: "Électrique",
      },
    ];
    S.loans = [
      {
        id: "L1",
        carId: "K-1",
        customerId: "C4",
        roId: "R2",
        from: wd(-1),
        to: wd(2),
        kmOut: 28140,
        kmIn: null,
        fuelOut: 1,
        fuelIn: null,
        signed: true,
        status: "En cours",
        fee: 0,
        notes: "Pris en charge par AXA (RC adverse).",
      },
      {
        id: "L2",
        carId: "K-3",
        customerId: "C6",
        roId: "R4",
        from: wd(-1),
        to: wd(4),
        kmOut: 35590,
        kmIn: null,
        fuelOut: 1,
        fuelIn: null,
        signed: true,
        status: "En cours",
        fee: 0,
        notes: "",
      },
      {
        id: "L3",
        carId: "K-2",
        customerId: "C9",
        roId: "R9",
        from: wd(-6),
        to: wd(-1),
        kmOut: 40820,
        kmIn: 41200,
        fuelOut: 1,
        fuelIn: 1,
        signed: true,
        status: "Rendu",
        fee: 0,
        notes: "",
      },
      {
        id: "L4",
        carId: "K-5",
        customerId: "C1",
        roId: "R1",
        from: wd(1),
        to: wd(2),
        kmOut: null,
        kmIn: null,
        fuelOut: null,
        fuelIn: null,
        signed: false,
        status: "Réservé",
        fee: 0,
        notes: "Cliente souhaite un véhicule dès demain matin.",
      },
    ];

    /* ---------- agenda ---------- */
    const A = (date, time, dur, kind, roId, title, extra = {}) => {
      const r = roId ? S.ros.find((x) => x.id === roId) : null;
      return Object.assign(
        {
          id: uid("ap"),
          date,
          time: toMin(time),
          dur,
          kind,
          roId,
          customerId: r ? r.customerId : null,
          vehicleId: r ? r.vehicleId : null,
          title,
          who: "E8",
          status: "Prévu",
          notes: "",
        },
        extra,
      );
    };
    S.appts = [
      A(wd(0), "08:30", 30, "Réception", "R10", "Dépôt Trafic flotte #18", {
        status: "Fait",
      }),
      A(wd(0), "08:45", 30, "Réception", "R6", "Dépôt Yaris (grêle)", {
        status: "Fait",
      }),
      A(
        wd(0),
        "09:55",
        30,
        "Réception",
        "R11",
        "Dépôt sinistre Allianz — Peugeot 308 SW",
      ),
      A(wd(0), "10:15", 20, "Livraison", "R9", "Restitution VW Tiguan"),
      A(wd(0), "10:30", 20, "Livraison", "R8", "Restitution Classe C"),
      A(
        wd(0),
        "11:30",
        60,
        "Expertise",
        "R6",
        "Expert Groupama — grêle Yaris",
        { expert: "Jean-Daniel Favre" },
      ),
      A(
        wd(0),
        "14:00",
        20,
        "Pièces",
        "R3",
        "Livraison pare-brise Tesla Model 3",
      ),
      A(wd(0), "16:00", 20, "Livraison", "R5", "Restitution Audi A3"),
      A(wd(0), "17:00", 20, "Livraison", "R7", "Restitution Clio (S. Rey)"),
      A(wd(1), "08:00", 30, "Réception", "R12", "Nouveau client — Mazda CX-5"),
      A(
        wd(1),
        "10:00",
        40,
        "Expertise",
        "R15",
        "Contre-expertise jante (MAIF)",
        { expert: "Anne Python" },
      ),
      A(wd(1), "16:30", 20, "Livraison", "R3", "Restitution Tesla Model 3"),
      A(wd(2), "08:00", 30, "Réception", "R13", "Dépôt ID.4 fin de leasing"),
      A(wd(2), "17:00", 20, "Livraison", "R2", "Restitution BMW Série 3"),
      A(
        wd(3),
        "08:00",
        45,
        "Expertise",
        "R14",
        "Expertise grêle Kia Niro (GMF)",
        { expert: "Karim Haddad", status: "À confirmer" },
      ),
      A(wd(3), "17:00", 20, "Livraison", "R10", "Restitution Trafic #18"),
      A(wd(4), "09:00", 30, "Devis", "R16", "Devis sur place — Porsche 911"),
      A(wd(4), "16:00", 20, "Livraison", "R4", "Restitution Octavia"),
    ];

    /* ---------- pointage (temps passés par OR) ---------- */
    S.time = [];
    const TT = (emp, roId, off, poste, h, ok = true) =>
      S.time.push({
        id: uid("tm"),
        emp,
        roId,
        date: wd(off),
        poste,
        h,
        validated: ok,
        note: "",
      });
    [
      [
        "E3",
        "R1",
        [
          [-1, "demont", 1.5],
          [-1, "tole", 1.8],
          [0, "tole", 1.4],
        ],
      ],
      [
        "E4",
        "R2",
        [
          [-1, "demont", 3],
          [-1, "tole", 4],
          [0, "tole", 1.5],
        ],
      ],
      [
        "E5",
        "R3",
        [
          [-3, "montage", 1.5],
          [-2, "montage", 1.6],
        ],
      ],
      [
        "E2",
        "R4",
        [
          [-1, "tole", 3.5],
          [0, "tole", 2],
        ],
      ],
      ["E10", "R5", [[-1, "prep", 3.4]]],
      [
        "E6",
        "R5",
        [
          [-1, "peint", 1],
          [0, "peint", 2.6],
        ],
      ],
      ["E5", "R6", [[0, "tole", 1.1]]],
      [
        "E3",
        "R7",
        [
          [-4, "tole", 3.2],
          [-3, "tole", 1],
          [-1, "montage", 1.4],
        ],
      ],
      ["E6", "R7", [[-2, "peint", 3.6]]],
      ["E2", "R8", [[-4, "tole", 1.9]]],
      ["E6", "R8", [[-2, "peint", 2.2]]],
      [
        "E3",
        "R9",
        [
          [-5, "tole", 1.8],
          [-1, "montage", 1.2],
        ],
      ],
      ["E6", "R9", [[-3, "peint", 2.5]]],
      ["E5", "R11", []],
      ["E2", "R10", [[0, "tole", 0.5]]],
    ].forEach(([e, r, rows]) =>
      rows.forEach(([off, poste, h]) => TT(e, r, off, poste, h, off < 0)),
    );
    // semaine précédente (validée) pour l'efficacité
    S.ros
      .filter((r) => r.stage === ST.facture)
      .forEach((r, ix) => {
        const q = S.quotes.find((x) => x.id === r.quoteId),
          t = quoteTotalsRaw(S, q);
        const h = t.hours.T1 + t.hours.T2 + t.hours.T3,
          off = -2 - (ix % 15);
        const spread = (e, h2, o, p) => {
          let k = 0;
          while (h2 > 0.1) {
            const x = Math.min(3, h2);
            TT(e, r.id, o - k, p, Math.round(x * 4) / 4);
            h2 -= x;
            k++;
          }
        };
        spread(r.lead, h * (0.86 + (hash(r.id) % 30) / 100), off, "tole");
        if (t.paintH)
          spread(
            ix % 3 ? "E6" : "E10",
            t.paintH * (0.9 + (hash(r.no) % 25) / 100),
            off - 1,
            ix % 3 ? "peint" : "prep",
          );
      });

    /* ---------- qualité : réclamations / retouches ---------- */
    S.complaints = [
      {
        id: "Q1",
        roId: "RC0",
        customerId: "C3",
        date: wd(-3),
        type: "Retouche garantie",
        desc: "Grain de poussière dans le vernis — aile AR G.",
        status: "Planifiée",
        warranty: true,
        cost: 0,
        due: wd(2),
        by: "E6",
      },
      {
        id: "Q2",
        roId: "RC4",
        customerId: "C17",
        date: wd(-7),
        type: "Réclamation",
        desc: "Léger écart de teinte pare-chocs AR à la lumière du jour.",
        status: "Résolue",
        warranty: true,
        cost: 140,
        due: wd(-4),
        by: "E6",
        resolution: "Raccord repris en cabine, client satisfait.",
      },
      {
        id: "Q3",
        roId: "RC1",
        customerId: "C11",
        date: wd(-1),
        type: "Réclamation",
        desc: "Retard de restitution (1 jour) — SLA flotte dépassé.",
        status: "Ouverte",
        warranty: false,
        cost: 0,
        due: wd(1),
        by: "E1",
      },
    ];

    /* ---------- CRM : rappels & communications ---------- */
    S.reminders = [
      {
        id: "RM1",
        customerId: "C3",
        vehicleId: "V7",
        kind: "Contrôle technique",
        due: addDays(today(), 18),
        status: "À faire",
        note: "Proposer le contrôle technique avec contrôle préalable.",
      },
      {
        id: "RM2",
        customerId: "C11",
        vehicleId: "V10",
        kind: "Contrôle technique",
        due: addDays(today(), 12),
        status: "À faire",
        note: "Trafic #18 — profiter de l’immobilisation.",
      },
      {
        id: "RM3",
        customerId: "C6",
        vehicleId: "V4",
        kind: "Contrôle technique",
        due: addDays(today(), 41),
        status: "À faire",
        note: "",
      },
      {
        id: "RM4",
        customerId: "C3",
        vehicleId: "V19",
        kind: "Retouche garantie",
        due: wd(2),
        status: "Planifié",
        note: "Lié à la réclamation Q1.",
      },
      {
        id: "RM5",
        customerId: "C14",
        vehicleId: "V14",
        kind: "Pneus hiver",
        due: addDays(today(), 8),
        status: "À faire",
        note: "Stockage pneus — 4 jantes alu.",
      },
      {
        id: "RM6",
        customerId: "C9",
        vehicleId: "V9",
        kind: "Avis Google",
        due: today(),
        status: "À faire",
        note: "Après restitution du Tiguan.",
      },
    ];
    S.customers.forEach((c) => {
      const L = {
        C1: [8420, 6],
        C2: [1260, 2],
        C3: [11380, 9],
        C4: [5730, 4],
        C5: [980, 1],
        C6: [3120, 3],
        C7: [6950, 7],
        C8: [14260, 11],
        C9: [4410, 3],
        C10: [0, 0],
        C11: [86240, 58],
        C12: [41800, 37],
        C13: [63400, 52],
      }[c.id];
      c.legacy = L
        ? { spent: L[0], visits: L[1] }
        : {
            spent: c.hist.reduce((a, h) => a + h[2], 0),
            visits: c.hist.length,
          };
    });
    S.customers.forEach((c) => {
      const rr = rng(hash(c.id));
      if (["C1", "C3", "C4", "C11"].includes(c.id))
        c.comms = [
          {
            at: dt(0, "08:30"),
            ch: "SMS",
            dir: "out",
            text: "Avancement des travaux envoyé",
            by: "E8",
          },
          {
            at: dt(-2, "11:30"),
            ch: "E-mail",
            dir: "out",
            text: "Devis envoyé",
            by: "E8",
          },
          {
            at: dt(-3, "16:10"),
            ch: "Appel",
            dir: "in",
            text: "Appel entrant — 3 min",
            by: "E8",
          },
        ];
      else if (rr() > 0.4)
        c.comms = [
          {
            at: dt(-1 - Math.floor(rr() * 5), "10:20"),
            ch: c.pref === "E-mail" ? "E-mail" : "SMS",
            dir: "out",
            text: "Confirmation de rendez-vous",
            by: "E8",
          },
        ];
    });

    S.activity = [];
    S.feed = [
      {
        id: uid("fd"),
        at: dt(0, "08:52"),
        ic: "box",
        tone: "green",
        t: "Pièce reçue",
        s: "Bas de caisse BMW → OR-24821",
        target: { type: "ro", id: "R2" },
      },
      {
        id: uid("fd"),
        at: dt(0, "08:31"),
        ic: "shield",
        tone: "slate",
        t: "Devis accepté · MAIF",
        s: "OR-24817 · VW Golf · 3 438 €",
        target: { type: "ro", id: "R1" },
      },
      {
        id: uid("fd"),
        at: dt(0, "08:05"),
        ic: "alert",
        tone: "amber",
        t: "Stock bas",
        s: "Vernis HS 2K · 3 bidons restants",
        target: { type: "part", id: "PT8" },
      },
    ];
    S.ext.months = [
      ["Mai", 168200],
      ["Juin", 181900],
      ["Juil.", 142700],
      ["Août", 129300],
      ["Sept.", 176400],
    ];
    return S;
  }

  const QC_ITEMS = [
    "Jeux & affleurements conformes",
    "Teinte et raccords contrôlés (lampe colorimétrique)",
    "Absence de coulures, grains, peau d’orange",
    "Éclairage, feux & clignotants fonctionnels",
    "Capteurs / ADAS calibrés et testés",
    "Serrage des roues au couple",
    "Essai routier effectué",
    "Nettoyage intérieur & extérieur",
    "Objets personnels restitués / protections retirées",
    "Photos après réparation prises",
  ];

  /* ==========================================================================
     CALCULS — devis / OR
     ========================================================================== */
  function quoteTotalsRaw(S, q) {
    const co = S.company,
      rates = co.rates,
      z = {
        hours: { T1: 0, T2: 0, T3: 0 },
        lab: { T1: 0, T2: 0, T3: 0 },
        labAmt: 0,
        paintH: 0,
        paintAmt: 0,
        mat: 0,
        parts: 0,
        forf: 0,
        small: 0,
        ht: 0,
        tva: 0,
        ttc: 0,
        franchise: 0,
        insurer: 0,
        client: 0,
        clientExtra: 0,
        approved: null,
      };
    if (!q) return z;
    let clientHT = 0;
    (q.lines || []).forEach((l) => {
      let amt = 0;
      if (l.op === "F") {
        amt = (+l.price || 0) * (+l.qty || 1);
        z.forf += amt;
      } else {
        const c = rates[l.cat] ? l.cat : null,
          h = +l.h || 0,
          ph = +l.ph || 0;
        if (c) {
          z.hours[c] += h;
          z.lab[c] += h * rates[c];
          z.labAmt += h * rates[c];
          amt += h * rates[c];
        }
        if (ph) {
          z.paintH += ph;
          z.paintAmt += ph * rates.P;
          z.mat += ph * co.paintMat;
          amt += ph * (rates.P + co.paintMat);
        }
        const p = (+l.price || 0) * (+l.qty || 0) * (1 - (+l.disc || 0) / 100);
        z.parts += p;
        amt += p;
      }
      if (l.client) clientHT += amt;
    });
    z.small = Math.min(co.smallMax, (z.labAmt + z.paintAmt) * co.smallPct);
    z.ht = round5(z.labAmt + z.paintAmt + z.mat + z.parts + z.forf + z.small);
    const rate = co.tvaRate != null ? co.tvaRate : TVA;
    z.tva = round5(z.ht * rate);
    z.ttc = round5(z.ht + z.tva);
    z.clientExtra = round5(clientHT * (1 + rate));
    const k = q.claimId ? S.claims.find((c) => c.id === q.claimId) : null;
    const covered = k && !/hors assurance/i.test(k.cover || "");
    if (covered) {
      z.franchise = Math.min(k.franchise || 0, z.ttc);
      const base = z.ttc - z.clientExtra;
      let ins = Math.max(0, base - z.franchise);
      if (k.approval === "Partiel" && k.approvedAmount != null)
        ins = Math.min(ins, k.approvedAmount);
      z.insurer = round5(ins);
      z.approved = k.approvedAmount;
    }
    z.client = round5(z.ttc - z.insurer);
    return z;
  }

  /* ==========================================================================
     ÉTAT / ÉVÉNEMENTS
     ========================================================================== */
  let S = null;
  const listeners = {};
  const on = (evt, fn) => {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return () => {
      listeners[evt] = listeners[evt].filter((f) => f !== fn);
    };
  };
  const emit = (evt, data) => {
    (listeners[evt] || []).forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        console.error(e);
      }
    });
    if (evt !== "change")
      (listeners.change || []).forEach((fn) => {
        try {
          fn({ evt, data });
        } catch (e) {
          console.error(e);
        }
      });
  };
  /* ---------- persistance : cache navigateur + serveur MOTEK (SQLite, partagé entre écrans) ---------- */
  const sync = {
    revision: 0,
    online: null,
    pushing: false,
    dirty: false,
    timer: null,
  };
  const cache = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
      localStorage.setItem(KEY + ":rev", String(sync.revision));
    } catch (e) {}
  };
  const setOnline = (v) => {
    if (sync.online !== v) {
      sync.online = v;
      emit("sync", { online: v, revision: sync.revision });
    }
  };
  /** Envoi débouncé de l’état complet ; en cas de conflit (409) l’état serveur plus récent est rechargé. */
  const push = () => {
    sync.dirty = true;
    clearTimeout(sync.timer);
    sync.timer = setTimeout(async () => {
      if (sync.pushing) {
        sync.dirty = true;
        return;
      }
      sync.pushing = true;
      sync.dirty = false;
      try {
        const r = await fetch("/api/v3/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: S, revision: sync.revision }),
        });
        if (r.status === 409) {
          await conflict();
        } else if (r.ok) {
          sync.revision = (await r.json()).revision;
          cache();
          sync.lastError = null;
          setOnline(true);
          emit("sync", { online: true, revision: sync.revision, saved: true });
        } else {
          let msg = "Erreur " + r.status;
          try { msg = (await r.json()).error || msg; } catch (x) {}
          sync.lastError = msg;
          sync.dirty = true; // on réessaiera à la prochaine modification
          setOnline(false);
          emit("sync", { online: false, revision: sync.revision, error: msg });
        }
      } catch (e) {
        sync.lastError = "Serveur injoignable";
        sync.dirty = true;
        setOnline(false);
      } finally {
        sync.pushing = false;
        if (sync.dirty) push();
      }
    }, 250);
  };
  /** Recharge l’état serveur s’il est plus récent ; un état d’un autre jour est régénéré (dates réalistes). */
  /** Jeu de démonstration intact et d'un autre jour : on le régénère pour garder des dates réalistes. Jamais sur des données modifiées. */
  const staleDemo = (st) => !!(st && st.pristine && st.day !== today());
  const pull = async () => {
    try {
      const r = await fetch("/api/v3/state");
      if (!r.ok) {
        setOnline(false);
        return;
      }
      const snap = await r.json();
      setOnline(true);
      if (snap.state && snap.state.v === 1 && !staleDemo(snap.state)) {
        if (snap.revision !== sync.revision) {
          if (sync.dirty || sync.pushing) return; // des modifications locales partent : le POST tranchera (409 → conflit)
          S = migrate(snap.state);
          sync.revision = snap.revision;
          cache();
          emit("remote", S);
          emit("change", { evt: "remote" });
        }
      } else {
        // Serveur vide ou démonstration périmée : l'état local (ou une nouvelle démo) devient la référence.
        if (staleDemo(S) || !S) { S = seed(); S.day = today(); migrate(S); }
        sync.revision = snap.revision || 0;
        cache();
        push();
      }
    } catch (e) {
      setOnline(false);
    }
  };
  /** Conflit (409) : l'état local est mis de côté, l'état serveur rechargé, et l'utilisateur choisit. */
  const conflict = async () => {
    const local = JSON.stringify(S);
    try { localStorage.setItem(KEY + ":conflict", local); } catch (e) {}
    sync.conflict = { at: now(), local };
    await pullForce();
    emit("sync", { online: true, revision: sync.revision, conflict: true });
  };
  const pullForce = async () => {
    const r = await fetch("/api/v3/state");
    if (!r.ok) throw new Error("serveur");
    const snap = await r.json();
    if (snap.state && snap.state.v === 1) { S = migrate(snap.state); sync.revision = snap.revision; cache(); emit("remote", S); emit("change", { evt: "remote" }); }
  };
  /** Résolution d'un conflit : "serveur" (abandonner le local) ou "local" (réappliquer et écraser). */
  const resolveConflict = (choice) => {
    const c = sync.conflict;
    if (!c) return;
    if (choice === "local") {
      try { S = migrate(JSON.parse(c.local)); } catch (e) { return; }
      cache();
      push();
      emit("change", { evt: "conflict-local" });
    }
    sync.conflict = null;
    try { localStorage.removeItem(KEY + ":conflict"); } catch (e) {}
    emit("sync", { online: sync.online, revision: sync.revision, conflict: false });
  };
  const save = () => {
    // Première modification réelle : l'état n'est plus un jeu de démonstration intact.
    if (S && S.pristine) S.pristine = false;
    cache();
    push();
  };
  // Complète un état (local ou serveur) créé avant l’ajout d’un champ.
  const migrate = (st) => {
    if (st && st.company && !st.company.activities) {
      st.company.activities = defaultActivities("depannage");
      st.company.profile = "depannage";
    }
    if (st && !st.missions) Object.assign(st, seedDepannage(st));
    if (st && st.missions && !st.office) { const d = seedDepannage(st); st.office = d.office; st.depSuppliers = d.depSuppliers; st.supplyOrders = st.supplyOrders || d.supplyOrders; st.waMsgs = st.waMsgs || d.waMsgs; st.dinvoices = st.dinvoices || d.dinvoices; (st.trucks || []).forEach((tr) => { const n = d.trucks.find((x) => x.id === tr.id); if (n && !tr.year) { tr.year = n.year; tr.brand = n.brand; tr.kind = n.kind; tr.name = n.name; } }); (st.gardes || []).forEach((g) => { if (!g.step) g.step = "Expertisé"; }); }
    if (st && st.missions) {
      migrateCommercial(st);
      st.missions.forEach(m => { m.durationMin ??= 60; m.photos ??= []; m.history ??= []; });
      (st.gardes || []).forEach(g => { g.adminFee ??= st.parc.adminFee; g.release ??= null; g.history ??= []; });
      (st.dinvoices || []).forEach(i => { i.history ??= []; i.payments ??= i.paid > 0 && i.paidAt ? [{ amount:i.paid, date:i.paidAt, ref:'Règlement historique déclaré' }] : []; i.credited ??= 0; });
      st.depDeposits ??= [];
      const reservedTrucks = new Set(), reservedDrivers = new Set();
      const running = ["Affectée", "En route", "Sur place", "Remorquage"];
      [...st.missions].filter(m=>running.includes(m.status)).sort((a,b)=>running.indexOf(b.status)-running.indexOf(a.status)).forEach(m=>{
        const t=(st.trucks || []).find(t=>t.id===m.truckId), d=(st.drivers || []).find(d=>d.id===m.driverId);
        if(!t || !d || t.status==="Entretien" || reservedTrucks.has(t.id) || reservedDrivers.has(d.id)) {
          m.history.unshift({at:now(),text:"Ancienne affectation incompatible : camion/chauffeur indisponible ou déjà engagé. Mission remise en attente de réaffectation."});
          m.status="Demandée";m.truckId=null;m.driverId=null;
        } else {reservedTrucks.add(t.id);reservedDrivers.add(d.id);}
      });
      (st.trucks || []).forEach(t=>{if(t.status!=="Entretien")t.status=reservedTrucks.has(t.id)?"En mission":"Disponible";});

      [...st.missions, ...(st.gardes || [])].forEach(x=>{ if (x.insurance && ['Facturée','Payée'].includes(x.insurance.status) && !(st.dinvoices || []).some(i=>i.srcId===x.id)) { x.insurance.history ??= []; x.insurance.history.unshift({at:now(),text:'Statut ancien sans facture liée : prise en charge à vérifier.'}); x.insurance.status='Prise en charge demandée'; } });
      // Migration non destructive : une ancienne mention facturée sans pièce revient à facturer.
      st.missions.forEach(m => { if (m.status === "Facturée" && !(st.dinvoices || []).some(i => i.kind === "mission" && i.srcId === m.id)) m.status = m.gardeId ? "Déposée au parc" : "Terminée"; });
    }
    if (st && !st.showroom) st.showroom = seedShowroom();
    if (st && !st.cases) st.cases = seedCases();
    if (st && !st.agent) st.agent = seedAgent();
    if (st && !st.partRequests) st.partRequests = [];
    if (st && st.company && st.company.activities && st.company.activities.agent === undefined) st.company.activities.agent = true;
    if (st && st.vehicles && !st.vehicles.some((v) => (v.hist || []).some((h) => /vidange|r[ée]vision|entretien/i.test(h[1])))) seedMaintenance(st);
    return st;
  };
  const load = () => {
    try {
      S = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (e) {
      S = null;
    }
    if (!S || S.v !== 1 || staleDemo(S)) {
      S = seed();
      S.day = today();
      cache();
    } else {
      // Révision serveur déjà reçue par cet onglet : évite de croire à un
      // changement distant (et un rechargement) à chaque ouverture.
      sync.revision = Number(localStorage.getItem(KEY + ":rev")) || 0;
    }
    migrate(S);
    pull();
    try {
      const es = new EventSource("/api/v3/events");
      es.onmessage = (e) => {
        try {
          const { revision } = JSON.parse(e.data);
          if (revision !== sync.revision && !sync.pushing && !sync.dirty) pull();
        } catch (x) {}
      };
      es.onerror = () => setOnline(false);
    } catch (e) {}
    return S;
  };
  /** Réinitialisation de la démonstration : le serveur doit l'accepter (refusée en production sans MOTEK_ALLOW_RESET). */
  const reset = async () => {
    let ok = false, msg = "";
    try {
      const r = await fetch("/api/v3/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      ok = r.ok;
      if (!ok) { try { msg = (await r.json()).error || ""; } catch (e) {} }
    } catch (e) { msg = "Serveur injoignable"; }
    if (!ok) { emit("sync", { online: sync.online, revision: sync.revision, error: msg || "Réinitialisation refusée" }); return false; }
    S = seed();
    S.day = today();
    // Comme au chargement : catalogue des prestations, équipe et champs commerciaux.
    migrate(S);
    sync.revision = 0;
    sync.conflict = null;
    cache();
    push();
    emit("reset", S);
    return true;
  };

  /* ---------- accès ---------- */
  const by = (coll, id) =>
    id == null ? null : (S[coll] || []).find((x) => x.id === id) || null;
  const ro = (id) => by("ros", id),
    veh = (id) => by("vehicles", id),
    cust = (id) => by("customers", id),
    emp = (id) => by("staff", id),
    ins = (id) => by("insurers", id),
    claim = (id) => by("claims", id),
    quote = (id) => by("quotes", id),
    part = (id) => by("parts", id),
    supplier = (id) => by("suppliers", id),
    order = (id) => by("orders", id),
    invoice = (id) => by("invoices", id),
    car = (id) => by("courtesy", id);
  const roByNo = (no) => S.ros.find((r) => r.no === no) || null;
  /** OR « courant » d'un véhicule (le plus avancé non facturé, sinon le dernier) */
  const roOfVehicle = (vid) => {
    const rs = S.ros.filter((r) => r.vehicleId === vid);
    return (
      rs
        .filter((r) => r.stage < ST.facture)
        .sort((a, b) => b.stage - a.stage)[0] ||
      rs.filter((r) => r.slot !== "OUT")[0] ||
      rs.sort((a, b) => String(b.outAt).localeCompare(String(a.outAt)))[0] ||
      null
    );
  };
  const slotRO = (slot) =>
    S.ros.find(
      (r) =>
        r.slot === slot &&
        r.stage < ST.facture + 1 &&
        r.slot !== "OUT" &&
        r.slot !== "ROAD",
    ) || null;
  const slotFree = (slot) => !S.ros.some((r) => r.slot === slot);
  // Un devis accepté ou converti garde les tarifs et la TVA du moment de l'accord
  // (q.frozen) : un changement de paramètres ne modifie plus son montant.
  const quoteTotals = (qq) => {
    const q = typeof qq === "string" ? quote(qq) : qq;
    if (q && q.frozen) return quoteTotalsRaw({ company: Object.assign({}, S.company, q.frozen), claims: S.claims }, q);
    return quoteTotalsRaw(S, q);
  };
  const freezeQuote = (q) => {
    if (!q || q.frozen) return;
    const co = S.company;
    q.frozen = { rates: Object.assign({}, co.rates), paintMat: co.paintMat, smallPct: co.smallPct, smallMax: co.smallMax, tvaRate: co.tvaRate != null ? co.tvaRate : TVA, at: now() };
  };
  const roQuote = (r) =>
    r
      ? quote(r.quoteId) ||
        S.quotes.find((q) => q.roId === r.id && q.status !== "Refusé")
      : null;
  const roTotals = (r) => quoteTotals(roQuote(r));
  const roSpent = (r, poste) =>
    S.time
      .filter((t) => t.roId === r.id && (!poste || t.poste === poste))
      .reduce((a, t) => a + t.h, 0);
  const roSold = (r) => {
    const t = roTotals(r);
    return t.hours.T1 + t.hours.T2 + t.hours.T3 + t.paintH;
  };
  const vlabel = (v) =>
    v ? v.make + " " + v.model.split(" ").slice(0, 2).join(" ") : "—";
  const custName = (id) => (cust(id) || {}).name || "—";
  const stageOf = (r) => STAGES[r.stage] || STAGES[0];
  const isLate = (r) => r.stage < ST.pret && r.dueAt && r.dueAt < now();
  const slotLabel = (s) => (SLOTS[s] || {}).l || s || "—";

  /** statut lisible (compatible carte) */
  function statusOf(r) {
    if (!r) return "Planifié";
    if (r.slot === "OUT" || r.stage === ST.facture) return "Restitué";
    if (r.stage === ST.rdv)
      return r.slot === "ROAD"
        ? dOf(r.apptAt) === today()
          ? "En approche"
          : "Planifié"
        : "Planifié";
    if (r.waitingParts && r.stage <= ST.remont) return "Attente pièces";
    const k = r.claimId ? claim(r.claimId) : null;
    switch (r.stage) {
      case ST.recep:
        return k && /expertise/i.test(k.approval) ? "Expertise" : "Réception";
      case ST.devis:
        return "Devis";
      case ST.accord:
        return "Attente accord";
      case ST.pieces:
        return "Attente pièces";
      case ST.prep:
        return "Préparation";
      case ST.peint:
        return r.prog >= 70 ? "Cuisson" : "Peinture";
      case ST.cq:
        return "Contrôle";
      case ST.lavage:
        return "Lavage";
      case ST.pret:
        return "Prêt";
      default:
        return "En réparation";
    }
  }
  const TONE = {
    "En réparation": "red",
    Préparation: "red",
    Peinture: "red",
    "Attente pièces": "amber",
    Cuisson: "amber",
    "Attente accord": "amber",
    Prêt: "green",
    Expertise: "slate",
    Planifié: "slate",
    "En approche": "slate",
    Réception: "slate",
    Devis: "slate",
    Contrôle: "slate",
    Lavage: "slate",
    Restitué: "dark",
  };
  const toneOf = (s) => TONE[s] || "slate";

  /* ==========================================================================
     ACTIONS MÉTIER
     ========================================================================== */
  const log = (r, text, by) => {
    if (r) {
      r.history = r.history || [];
      r.history.unshift({ at: now(), by: by || S.meId, text });
    }
    S.activity.unshift({
      id: uid("a"),
      at: now(),
      text: (r ? r.no + " · " : "") + text,
      roId: r ? r.id : null,
    });
    S.activity = S.activity.slice(0, 80);
  };
  function feed(n) {
    S.feed.unshift(Object.assign({ id: uid("fd"), at: now() }, n));
    S.feed = S.feed.slice(0, 40);
    emit("feed", n);
  }

  /** Choisit l'emplacement physique adapté à l'étape (gestion des occupations). */
  function autoSlot(r, stage) {
    const cur = r.slot,
      free = (s) => s === cur || slotFree(s);
    const park = (ready) => {
      const ord = ready
        ? [
            "PARK0",
            "PARK1",
            "PARK2",
            "PARK3",
            "PARK4",
            "PARK6",
            "PARK8",
            "PARK5",
          ]
        : ["PARK3", "PARK4", "PARK5", "PARK6", "PARK8"];
      return ord.find(free) || null;
    };
    const poste = () => {
      if (POSTE_IDS.includes(cur)) return cur;
      const pref = [];
      if (r.posteId && POSTE_IDS.includes(r.posteId)) pref.push(r.posteId);
      if (r.marbre) pref.push("P5");
      pref.push("P1", "P2", "P3", "P4", "P6", "P5");
      return pref.find(free) || null;
    };
    if (stage === ST.facture) return "OUT";
    if (stage === ST.rdv) return cur;
    if (stage <= ST.pieces) {
      if (ONSITE(cur)) return cur;
      return null;
    } // le véhicule reste où il est (ou chez le client)
    if (stage === ST.peint)
      return free("BOOTH")
        ? "BOOTH"
        : free("BQ")
          ? "BQ"
          : cur === "BOOTH"
            ? cur
            : null;
    if (stage === ST.lavage)
      return ["PARK3", "PARK4", "PARK6", "PARK8", "PARK5"].find(free) || cur;
    if (stage === ST.pret)
      return /^PARK[0-2]$/.test(cur) ? cur : park(true) || cur;
    return poste();
  }

  function setSlot(r, slot, source) {
    if (!slot || slot === r.slot) return false;
    const from = r.slot;
    r.slot = slot;
    if (POSTE_IDS.includes(slot) || slot === "BOOTH") r.posteId = slot;
    if (!r.inAt && ONSITE(slot)) r.inAt = now();
    emit("ro:move", {
      roId: r.id,
      vehicleId: r.vehicleId,
      from,
      to: slot,
      source: source || "bo",
    });
    // la cabine se libère : le véhicule en file d'attente y entre
    if (from === "BOOTH" && source !== "story") {
      const q = S.ros.find((x) => x.slot === "BQ" && x.stage === ST.peint);
      if (q) {
        log(q, "Entrée en cabine (file d’attente)");
        setSlot(q, "BOOTH", source);
      }
    }
    return true;
  }

  /** Avance / recule un OR dans le workflow. opts: {source, slot, silent} */
  function setStage(roId, stage, opts = {}) {
    const r = ro(roId);
    if (!r) return null;
    stage = Math.max(0, Math.min(STAGES.length - 1, stage));
    const prev = r.stage;
    if (prev === stage && !opts.slot) return r;
    let target = opts.slot !== undefined ? opts.slot : autoSlot(r, stage);
    if (stage > ST.pieces && stage < ST.facture && !ONSITE(r.slot) && !target) {
      // véhicule pas encore sur site : il arrive (réception puis poste)
      target =
        stage >= ST.pret
          ? "PARK3"
          : slotFree("RECV")
            ? "RECV"
            : ["PARK3", "PARK4", "PARK6", "PARK8"].find(slotFree);
    }
    if (
      stage > ST.rdv &&
      stage <= ST.pieces &&
      !ONSITE(r.slot) &&
      (opts.arrive || stage === ST.recep)
    )
      target = slotFree("RECV")
        ? "RECV"
        : ["PARK3", "PARK4", "PARK6", "PARK8"].find(slotFree);
    // Garde-fous : un dossier ne devient « prêt » ou « facturé » qu'après un contrôle
    // qualité validé, sauf dérogation explicite et motivée (opts.override).
    if (stage >= ST.pret && prev < ST.pret && !(r.qc && r.qc.ok) && !opts.override) {
      emit("ro:refused", { roId: r.id, stage, reason: "qc" });
      return null;
    }
    if (opts.override && stage >= ST.pret && prev < ST.pret)
      log(r, "Dérogation : " + STAGES[stage].l + " sans contrôle qualité validé — " + opts.override, opts.by);
    r.stage = stage;
    // Journal des étapes conservé intégralement, retours compris.
    r.stageLog = r.stageLog || [];
    r.stageLog.push({ stage, at: now(), back: prev > stage || undefined });
    r.prog = progressOf(r);
    if (stage >= ST.prep) r.waitingParts = false;
    // La sortie du véhicule (outAt) est enregistrée par la remise des clés (deliver), pas par la facturation.
    let warn = null;
    if (
      target === null &&
      stage > ST.pieces &&
      stage < ST.facture &&
      ONSITE(r.slot) === false
    )
      warn = "Aucun emplacement libre pour " + r.no;
    else if (
      target === null &&
      stage >= ST.demont &&
      stage <= ST.cq &&
      !POSTE_IDS.includes(r.slot) &&
      r.slot !== "BOOTH" &&
      r.slot !== "BQ"
    )
      warn =
        "Aucun poste libre : " +
        r.no +
        " reste " +
        slotLabel(r.slot).toLowerCase();
    log(
      r,
      "Étape : " + STAGES[stage].l + (prev > stage ? " (retour)" : ""),
      opts.by,
    );
    save();
    emit("ro:stage", { roId: r.id, prev, stage, source: opts.source || "bo" });
    if (target) setSlot(r, target, opts.source);
    if (stage === ST.pret && prev < ST.pret)
      feed({
        ic: "check",
        tone: "green",
        t: "Véhicule prêt",
        s:
          r.no +
          " · " +
          vlabel(veh(r.vehicleId)) +
          (r.notified ? "" : " · client à prévenir"),
        target: { type: "ro", id: r.id },
      });
    if (stage === ST.facture && prev < ST.facture) {
      const made = ensureInvoices(r.id);
      if (made.length)
        feed({
          ic: "invoice",
          tone: "green",
          t: "Factures émises",
          s: r.no + " · " + chf(made.reduce((a, i) => a + i.amount, 0)) + " · règlement et remise des clés à enregistrer",
          target: { type: "ro", id: r.id },
        });
    }
    if (
      !warn &&
      stage === ST.peint &&
      !target &&
      r.slot !== "BOOTH" &&
      r.slot !== "BQ"
    )
      warn =
        "Cabine et file d’attente occupées : " +
        r.no +
        " reste " +
        slotLabel(r.slot).toLowerCase();
    if (warn) emit("notice", { kind: "warn", text: warn });
    save();
    emit("ro", { roId: r.id });
    return r;
  }

  function assignTech(roId, empId, opts = {}) {
    const r = ro(roId),
      e = emp(empId);
    if (!r || !e) return;
    const prev = r.lead;
    r.lead = empId;
    if (!r.team.includes(empId)) r.team.push(empId);
    log(r, "Responsable : " + e.name, opts.by);
    save();
    emit("ro:tech", { roId, empId, prev, source: opts.source || "bo" });
  }
  function unassignTech(roId, empId) {
    const r = ro(roId);
    if (!r) return;
    r.team = r.team.filter((x) => x !== empId);
    if (r.lead === empId) r.lead = r.team[0] || null;
    log(r, "Retrait équipe : " + (emp(empId) || {}).name);
    save();
    emit("ro", { roId });
  }
  function moveRO(roId, slot, opts = {}) {
    const r = ro(roId);
    if (!r) return;
    if (slot !== r.slot && !slotFree(slot)) {
      emit("notice", {
        kind: "warn",
        text: slotLabel(slot) + " est déjà occupé",
      });
      return false;
    }
    log(r, "Déplacé vers " + slotLabel(slot));
    setSlot(r, slot, opts.source);
    save();
    emit("ro", { roId });
    return true;
  }
  /** Progression déterministe : étape du dossier + tâches réellement terminées. */
  function progressOf(r) {
    if (r.stage >= ST.pret) return 100;
    const base = Math.round((r.stage / ST.pret) * 70);
    const tasks = r.tasks || [];
    const done = tasks.length ? tasks.reduce((a, t) => a + Math.min(1, Math.max(0, +t.p || 0)), 0) / tasks.length : 0;
    return Math.min(99, Math.round(base + done * 30));
  }
  function bumpProgress(roId, dp) {
    const r = ro(roId);
    if (!r || r.prog >= 95) return;
    r.prog += dp;
    const tk = r.tasks.find((x) => x.p > 0 && x.p < 1);
    if (tk) tk.p = Math.min(0.95, tk.p + 0.03);
    save();
    emit("progress", { roId });
  }
  function setTask(roId, i, p) {
    const r = ro(roId);
    if (!r || !r.tasks[i]) return;
    r.tasks[i].p = p;
    r.prog = progressOf(r);
    log(r, (p >= 1 ? "Tâche terminée : " : "Tâche rouverte : ") + r.tasks[i].l);
    save();
    emit("ro", { roId });
  }
  function addTask(roId, l) {
    const r = ro(roId);
    if (!r || !l) return;
    r.tasks.push({ l, p: 0 });
    r.prog = progressOf(r);
    log(r, "Tâche ajoutée : " + l);
    save();
    emit("ro", { roId });
  }
  /**
   * Trace d'un contact client. `m.status` : "manuel" (déclaré envoyé par l'opérateur depuis
   * un autre outil, valeur par défaut), "envoye" (accusé d'un fournisseur raccordé),
   * "brouillon" (préparé, non envoyé). Seuls « manuel » et « envoye » marquent le dossier prévenu.
   */
  function notifyCustomer(roId, channel, text, m = {}) {
    const r = ro(roId);
    if (!r) return;
    const c = cust(r.customerId);
    if (!c) return;
    const status = m.status || "manuel";
    const entry = { id: uid("cm"), at: now(), ch: channel, dir: "out", status, to: m.to || "", subject: m.subject || "", text: m.body || text, label: text, by: S.meId, provider: m.provider || null };
    c.comms = c.comms || [];
    c.comms.unshift(entry);
    if (status !== "brouillon" && r.stage >= ST.pret) r.notified = true;
    log(r, channel + (status === "envoye" ? " envoyé au client" : status === "manuel" ? " déclaré envoyé au client (hors MOTEK)" : " préparé (brouillon)"));
    save();
    emit("comms", { roId, customerId: c.id });
    if (status !== "brouillon")
      feed({
        ic: "msg",
        tone: "green",
        t: channel + (status === "envoye" ? " envoyé" : " déclaré envoyé"),
        s: c.name + " · " + text.slice(0, 60),
        target: { type: "customer", id: c.id },
      });
    return entry;
  }
  function requestReview(roId) {
    const r = ro(roId);
    if (!r) return;
    r.review = { sentAt: now() };
    const c = cust(r.customerId);
    c.comms.unshift({
      at: now(),
      ch: "SMS",
      dir: "out",
      text: "Demande d’avis Google",
      by: S.meId,
    });
    log(r, "Demande d’avis Google envoyée");
    const rm = S.reminders.find(
      (x) =>
        x.kind === "Avis Google" &&
        x.vehicleId === r.vehicleId &&
        x.status !== "Fait",
    );
    if (rm) rm.status = "Fait";
    save();
    emit("comms", { roId });
  }

  /** Création d'un OR (depuis un devis, la réception ou le CRM). */
  function createRO(data) {
    const max = S.ros.reduce(
      (m, r) => Math.max(m, +String(r.no).replace(/\D/g, "") || 0),
      24834,
    );
    const v = veh(data.vehicleId);
    const r = Object.assign(
      {
        id: uid("R"),
        no: "OR-" + (max + 1),
        vehicleId: data.vehicleId,
        customerId: v ? v.customerId : data.customerId,
        claimId: null,
        quoteId: null,
        stage: ST.rdv,
        slot: "ROAD",
        posteId: null,
        lead: null,
        team: [],
        damage: "",
        prog: 0,
        marbre: false,
        apptAt: null,
        inAt: null,
        dueAt: null,
        outAt: null,
        stageLog: [{ stage: ST.rdv, at: now() }],
        tasks: [],
        photos: [],
        history: [],
        checkin: null,
        qc: null,
        notified: false,
        review: null,
        courtesyId: null,
        planned: {},
        waitingParts: false,
        priority: "normale",
        notes: "",
      },
      data,
    );
    if (!r.tasks.length)
      r.tasks = [
        { l: "Accueil & état des lieux", p: 0 },
        { l: "Photos réception", p: 0 },
      ];
    S.ros.push(r);
    log(r, "OR créé");
    save();
    emit("ro:new", { roId: r.id });
    return r;
  }

  /** Réception (check-in) : km, carburant, dégâts, signature → étape Réception, véhicule sur site. */
  function checkin(roId, data) {
    const r = ro(roId);
    if (!r) return;
    r.checkin = Object.assign({ at: now(), by: S.meId }, data);
    const v = veh(r.vehicleId);
    if (v && data.km) v.km = data.km;
    r.photos = r.photos || [];
    for (let i = 0; i < (data.photos || 0); i++)
      r.photos.push({
        id: uid("ph"),
        l: [
          "Avant",
          "3/4 AV G",
          "3/4 AV D",
          "Arrière",
          "Compteur",
          "Dégâts",
          "Intérieur",
          "Dégâts (détail)",
        ][i % 8],
        k: "avant",
        at: now(),
      });
    const t = r.tasks.find((x) => /accueil|état des lieux/i.test(x.l));
    if (t) t.p = 1;
    const t2 = r.tasks.find((x) => /photos/i.test(x.l));
    if (t2 && data.photos) t2.p = 1;
    log(
      r,
      "Réception : état des lieux signé (" +
        Object.keys(data.damages || {}).length +
        " dégât·s)",
    );
    if (r.stage < ST.recep)
      setStage(roId, ST.recep, { arrive: true, source: data.source || "bo" });
    else {
      save();
      emit("ro", { roId });
    }
    if (!ONSITE(r.slot)) {
      setSlot(
        r,
        slotFree("RECV")
          ? "RECV"
          : ["PARK3", "PARK4", "PARK6", "PARK8"].find(slotFree),
        data.source,
      );
      save();
    }
    const ap = S.appts.find(
      (a) => a.roId === roId && a.kind === "Réception" && a.status !== "Fait",
    );
    if (ap) ap.status = "Fait";
    save();
    emit("checkin", { roId });
  }

  /* ---------- devis ---------- */
  function nextQuoteNo() {
    const max = S.quotes.reduce(
      (m, q) =>
        Math.max(m, +String(q.no).replace(/^D-/, "").split("-")[0] || 0),
      24834,
    );
    return "D-" + (max + 1);
  }
  function saveQuote(q) {
    const i = S.quotes.findIndex((x) => x.id === q.id);
    if (i >= 0) S.quotes[i] = Object.assign(S.quotes[i], q);
    else {
      q.id = q.id || uid("D");
      q.no = q.no || nextQuoteNo();
      q.date = q.date || today();
      S.quotes.unshift(q);
    }
    const r = q.roId ? ro(q.roId) : null;
    if (r && !r.quoteId) r.quoteId = q.id;
    save();
    emit("quote", { qId: q.id });
    return q;
  }
  function setQuoteStatus(qId, status, opts = {}) {
    const q = quote(qId);
    if (!q) return;
    const prev = q.status;
    q.status = status;
    if (status === "Envoyé") q.sentAt = now();
    if (status === "Accordé" || status === "Refusé") q.decidedAt = now();
    const r = q.roId ? ro(q.roId) : null,
      k = q.claimId ? claim(q.claimId) : null;
    if (status === "Accordé") {
      freezeQuote(q);
      if (k && opts.amount != null) {
        k.approval = opts.partial ? "Partiel" : "Accordé";
        k.approvedAmount = opts.amount;
        k.log = k.log || [];
        k.log.unshift({ at: now(), text: "Accord " + chf(opts.amount) });
      }
      if (r && r.stage < ST.pieces) setStage(r.id, ST.pieces);
      feed({
        ic: "shield",
        tone: "green",
        t: "Devis accepté" + (k ? " · " + (ins(k.insurerId) || {}).short : ""),
        s: q.no + " · " + chf(quoteTotals(q).ttc),
        target: { type: "quote", id: q.id },
      });
    }
    if (status === "Refusé" && k) {
      k.approval = "Refusé";
      k.log = k.log || [];
      k.log.unshift({ at: now(), text: "Refus de prise en charge" });
    }
    if (status === "Envoyé" && r && r.stage < ST.accord)
      setStage(r.id, ST.accord);
    if (r) log(r, "Devis " + q.no + " : " + prev + " → " + status);
    save();
    emit("quote", { qId, status });
  }
  /** Convertit un devis en OR (crée l'OR si besoin). */
  function convertQuote(qId) {
    const q = quote(qId);
    if (!q) return null;
    let r = q.roId ? ro(q.roId) : null;
    if (!r) {
      const t = quoteTotals(q);
      r = createRO({
        vehicleId: q.vehicleId,
        claimId: q.claimId,
        quoteId: q.id,
        damage:
          q.lines
            .filter((l) => l.op !== "F")
            .map((l) => l.piece)
            .slice(0, 3)
            .join(", ") || "Travaux selon devis " + q.no,
        dueAt:
          wd(
            Math.max(
              2,
              Math.ceil((t.hours.T1 + t.hours.T2 + t.hours.T3 + t.paintH) / 6),
            ),
          ) + " 17:00",
        apptAt: wd(1) + " 08:00",
        tasks: q.lines
          .filter((l) => l.op !== "F")
          .map((l) => ({ l: (OPS[l.op] || "") + " — " + l.piece, p: 0 }))
          .concat([{ l: "Contrôle qualité", p: 0 }]),
        planned: {
          tole: t.hours.T1 + t.hours.T2 + t.hours.T3,
          peint: t.paintH,
        },
      });
      q.roId = r.id;
      if (q.claimId) {
        const k = claim(q.claimId);
        if (k) k.roId = r.id;
      }
    }
    if (q.status !== "Accordé") q.status = "Converti";
    else q.status = "Accordé";
    r.quoteId = q.id;
    if (r.stage < ST.devis) {
      r.stage = ST.devis;
      r.stageLog.push({ stage: ST.devis, at: now() });
    }
    if (q.status === "Accordé" && r.stage < ST.pieces)
      setStage(r.id, ST.pieces);
    log(r, "Créé depuis le devis " + q.no);
    save();
    emit("quote", { qId });
    emit("ro", { roId: r.id });
    return r;
  }

  /* ---------- sinistres ---------- */
  function updateClaim(id, patch, text) {
    const k = claim(id);
    if (!k) return;
    Object.assign(k, patch);
    k.log = k.log || [];
    if (text) k.log.unshift({ at: now(), text });
    const r = k.roId ? ro(k.roId) : null;
    if (r && text) log(r, "Sinistre : " + text);
    save();
    emit("claim", { claimId: id });
    return k;
  }
  function planExpertise(id, at, expert, mode) {
    const k = updateClaim(
      id,
      {
        expertiseAt: at,
        expert,
        expertiseMode: mode || "Sur place",
        approval: "Expertise planifiée",
      },
      "Expertise planifiée le " +
        fmtD(dOf(at)) +
        " à " +
        tOf(at) +
        " (" +
        expert +
        ")",
    );
    if (k) {
      const r = k.roId ? ro(k.roId) : null;
      S.appts.push({
        id: uid("ap"),
        date: dOf(at),
        time: toMin(tOf(at)),
        dur: 45,
        kind: "Expertise",
        roId: k.roId,
        customerId: k.customerId,
        vehicleId: k.vehicleId,
        title:
          "Expert " +
          ((ins(k.insurerId) || {}).short || "") +
          " — " +
          vlabel(veh(k.vehicleId)),
        who: "E1",
        status: "Prévu",
        notes: "",
        expert,
      });
      save();
      emit("appt", {});
      if (r) emit("ro", { roId: r.id });
    }
  }
  function decideClaim(id, decision, amount, note) {
    const k = claim(id);
    if (!k) return;
    const txt =
      decision === "Refusé"
        ? "Refus de l’assureur"
        : (decision === "Partiel" ? "Accord partiel " : "Accord ") +
          chf(amount);
    updateClaim(
      id,
      {
        approval: decision,
        approvedAmount: decision === "Refusé" ? 0 : amount,
        report: "Reçu",
        notes: note || k.notes,
      },
      txt + (note ? " — " + note : ""),
    );
    const q = S.quotes.find(
      (x) =>
        x.claimId === id && (x.status === "Envoyé" || x.status === "Brouillon"),
    );
    if (q) {
      q.status = decision === "Refusé" ? "Refusé" : "Accordé";
      q.decidedAt = now();
    }
    const r = k.roId ? ro(k.roId) : null;
    if (r && decision !== "Refusé" && r.stage < ST.pieces)
      setStage(r.id, ST.pieces);
    feed({
      ic: "shield",
      tone: decision === "Refusé" ? "red" : "green",
      t:
        (decision === "Refusé" ? "Refus · " : "Accord · ") +
        (ins(k.insurerId) || {}).short,
      s:
        "Sinistre " + k.no + (decision !== "Refusé" ? " · " + chf(amount) : ""),
      target: { type: "claim", id },
    });
    save();
    emit("claim", { claimId: id });
  }

  /* ---------- facturation ---------- */
  function nextInvNo() {
    const max = S.invoices.reduce(
      (m, i) => Math.max(m, +String(i.no).split("-")[2] || 0),
      400,
    );
    return (
      "F-" + new Date().getFullYear() + "-" + String(max + 1).padStart(4, "0")
    );
  }
  /** Crée les factures d'un OR (répartition assurance / franchise client), déduit les acomptes. */
  function ensureInvoices(roId) {
    const r = ro(roId);
    if (!r) return [];
    if (S.invoices.some((i) => i.roId === roId && i.kind !== "acompte"))
      return [];
    const t = roTotals(r),
      k = r.claimId ? claim(r.claimId) : null,
      c = cust(r.customerId),
      out = [];
    const terms = c && c.fleet ? c.fleet.terms : S.company.terms;
    const dep = S.invoices
      .filter((i) => i.roId === roId && i.kind === "acompte")
      .reduce((a, i) => a + i.paid, 0);
    const mk = (kind, payerType, payerId, amount, label) => {
      const inv = {
        id: uid("I"),
        no: nextInvNo(),
        roId,
        kind,
        payerType,
        payerId,
        amount: round5(amount),
        ht: round5(amount / (1 + (S.company.tvaRate || TVA))),
        date: today(),
        due: addDays(today(), kind === "assurance" ? 30 : terms),
        status: "Émise",
        paid: 0,
        reminders: [],
        label,
      };
      S.invoices.unshift(inv);
      out.push(inv);
      return inv;
    };
    if (k && t.insurer > 0)
      mk(
        "assurance",
        "insurer",
        k.insurerId,
        t.insurer,
        r.no + " · sinistre " + k.no + " (cession de créance)",
      );
    const cl = t.client - dep;
    if (cl > 0.04) {
      const i = mk(
        "client",
        "customer",
        r.customerId,
        cl,
        r.no +
          " · " +
          (t.insurer > 0
            ? "franchise" + (t.clientExtra ? " + travaux hors sinistre" : "")
            : "travaux de carrosserie") +
          (dep ? " (acompte déduit)" : ""),
      );
    }
    log(r, out.length + " facture·s émise·s");
    save();
    emit("invoice", { roId });
    return out;
  }
  /** Remise des clés : exige des factures émises et soit un solde client réglé, soit un crédit accordé explicitement. */
  function deliver(roId, opts = {}) {
    const r = ro(roId);
    if (!r) return null;
    if (r.stage < ST.pret) {
      emit("ro:refused", { roId, reason: "stage" });
      return null;
    }
    if (r.stage < ST.facture) {
      const ok = setStage(roId, ST.facture, opts);
      if (!ok) return null;
    }
    const due = S.invoices.filter((i) => i.roId === roId && i.payerType === "customer" && i.kind !== "acompte" && i.status !== "Payée").reduce((a, i) => a + i.amount - i.paid, 0);
    const c = cust(r.customerId);
    if (due > 0.04 && !(c && c.fleet) && !opts.credit) {
      emit("ro:refused", { roId, reason: "unpaid", due });
      return null;
    }
    if (due > 0.04 && opts.credit) log(r, "Remise des clés avec solde dû " + chf2(due) + " — " + opts.credit, opts.by);
    r.outAt = now();
    r.deliveredBy = opts.by || S.meId;
    log(r, "Véhicule remis au client", opts.by);
    save();
    emit("ro", { roId });
    feed({ ic: "key", tone: "green", t: "Véhicule remis", s: r.no + " · " + vlabel(veh(r.vehicleId)), target: { type: "ro", id: r.id } });
    return r;
  }
  function createDeposit(roId, amount) {
    const r = ro(roId);
    if (!r || !(amount > 0)) return null;
    const inv = {
      id: uid("I"),
      no: nextInvNo(),
      roId,
      kind: "acompte",
      payerType: "customer",
      payerId: r.customerId,
      amount: round5(amount),
      ht: round5(amount / (1 + TVA)),
      date: today(),
      due: addDays(today(), 10),
      status: "Émise",
      paid: 0,
      reminders: [],
      label: "Acompte " + r.no,
    };
    S.invoices.unshift(inv);
    log(r, "Acompte demandé " + chf(amount));
    save();
    emit("invoice", { roId });
    return inv;
  }
  function payInvoice(id, amount, method, quiet, opts = {}) {
    const i = invoice(id);
    if (!i) return;
    amount = Math.min(
      amount == null ? i.amount - i.paid : amount,
      i.amount - i.paid,
    );
    if (!(amount > 0)) return;
    const valueDate = /^\d{4}-\d{2}-\d{2}$/.test(opts.date || "") ? opts.date : today();
    i.paid = round5(i.paid + amount);
    i.status = i.paid >= i.amount - 0.01 ? "Payée" : "Partiel";
    S.payments.unshift({
      id: uid("pay"),
      invoiceId: id,
      date: valueDate,
      recordedAt: now(),
      amount,
      method: method || "Virement",
      by: S.meId,
    });
    const r = ro(i.roId);
    if (r) log(r, "Paiement reçu " + chf2(amount) + " (" + i.no + ")" + (valueDate !== today() ? " · valeur " + fmtD(valueDate) : ""));
    // Acompte payé après l'émission de la facture finale : il vient en déduction de celle-ci.
    if (i.kind === "acompte" && r) {
      const fin = S.invoices.find((x) => x.roId === i.roId && x.kind === "client" && x.status !== "Payée");
      if (fin) {
        const apply = Math.min(amount, fin.amount - fin.paid);
        if (apply > 0) {
          fin.paid = round5(fin.paid + apply);
          fin.status = fin.paid >= fin.amount - 0.01 ? "Payée" : "Partiel";
          fin.deposits = (fin.deposits || []).concat([{ invoiceId: i.id, amount: apply, at: now() }]);
          log(r, "Acompte " + i.no + " imputé sur " + fin.no + " : " + chf2(apply));
        }
      }
    }
    save();
    emit("payment", { invoiceId: id, amount });
    if (!quiet)
      feed({
        ic: "coins",
        tone: "green",
        t: "Paiement reçu",
        s: i.no + " · " + chf2(amount),
        target: { type: "invoice", id },
      });
  }
  function remindInvoice(id, level) {
    const i = invoice(id);
    if (!i) return;
    i.reminders.push({ at: now(), level });
    const r = ro(i.roId);
    if (r) log(r, "Relance " + level + " · " + i.no);
    save();
    emit("invoice", { id });
  }

  /* ---------- pièces / commandes ---------- */
  function nextOrderNo() {
    const max = S.orders.reduce(
      (m, o) => Math.max(m, +String(o.no).split("-")[2] || 0),
      100,
    );
    return "CMD-" + new Date().getFullYear() + "-" + (max + 1);
  }
  function saveOrder(o) {
    const i = S.orders.findIndex((x) => x.id === o.id);
    if (i >= 0) Object.assign(S.orders[i], o);
    else {
      o.id = uid("O");
      o.no = nextOrderNo();
      o.date = o.date || today();
      o.by = o.by || "E7";
      S.orders.unshift(o);
    }
    const r = o.roId ? ro(o.roId) : null;
    if (r && o.status !== "Reçue" && o.status !== "Brouillon") {
      r.waitingParts = true;
      log(
        r,
        "Commande " + o.no + " (" + (supplier(o.supplierId) || {}).name + ")",
      );
    }
    save();
    emit("order", { id: o.id });
    return o;
  }
  function setOrderStatus(id, status) {
    const o = order(id);
    if (!o) return;
    o.status = status;
    if (status === "Commandée" && !o.eta)
      o.eta =
        addDays(
          today(),
          Math.max(1, (supplier(o.supplierId) || {}).leadDays || 1),
        ) + " 08:00";
    save();
    emit("order", { id });
  }
  function receiveOrder(id) {
    const o = order(id);
    if (!o || o.status === "Reçue") return;
    o.status = "Reçue";
    o.receivedAt = now();
    o.lines.forEach((l) => {
      const p =
        (l.partId && part(l.partId)) || S.parts.find((x) => x.ref === l.ref);
      if (p) {
        p.qty += l.qty;
        if (o.roId) reservePart(p, o.roId, l.qty, "Réception " + o.no);
      }
    });
    const r = o.roId ? ro(o.roId) : null;
    if (r) {
      const pending = S.orders.some(
        (x) =>
          x.roId === r.id &&
          x.id !== o.id &&
          !["Reçue", "Annulée", "Brouillon"].includes(x.status),
      );
      if (!pending) r.waitingParts = false;
      log(r, "Pièces reçues (" + o.no + ")");
    }
    feed({
      ic: "box",
      tone: "green",
      t: "Pièces reçues",
      s:
        o.no +
        " · " +
        o.lines
          .map((l) => l.label)
          .join(", ")
          .slice(0, 60) +
        (r ? " → " + r.no : ""),
      target: r ? { type: "ro", id: r.id } : { type: "order", id },
    });
    save();
    emit("order", { id, received: true });
    if (r) emit("ro", { roId: r.id });
  }
  /** Réservations ventilées par dossier : p.reservations = [{roId, qty}], p.reserved = somme, p.roId = dernier (compatibilité). */
  function reservePart(p, roId, qty, reason) {
    if (!p || !roId || !(qty > 0)) return;
    p.reservations = p.reservations || [];
    const ex = p.reservations.find((x) => x.roId === roId);
    if (ex) ex.qty += qty;
    else p.reservations.push({ roId, qty });
    p.reserved = p.reservations.reduce((a, x) => a + x.qty, 0);
    p.roId = roId;
    p.moves = (p.moves || []).concat([{ at: now(), kind: "reservation", roId, qty, reason: reason || "" }]).slice(-60);
  }
  /** Consommation ou libération d'une réservation (qty > 0 consomme le stock, release=true libère sans consommer). */
  function releasePart(partId, roId, qty, release) {
    const p = part(partId);
    if (!p) return;
    p.reservations = p.reservations || [];
    const ex = p.reservations.find((x) => x.roId === roId);
    if (!ex) return;
    const n = Math.min(ex.qty, qty == null ? ex.qty : qty);
    ex.qty -= n;
    if (ex.qty <= 0) p.reservations = p.reservations.filter((x) => x !== ex);
    p.reserved = p.reservations.reduce((a, x) => a + x.qty, 0);
    if (!release) p.qty = Math.max(0, p.qty - n);
    p.roId = p.reservations.length ? p.reservations[p.reservations.length - 1].roId : null;
    p.moves = (p.moves || []).concat([{ at: now(), kind: release ? "liberation" : "consommation", roId, qty: n }]).slice(-60);
    const r = ro(roId);
    if (r) log(r, (release ? "Réservation libérée : " : "Pièce consommée : ") + n + " × " + p.name);
    save();
    emit("part", { id: partId });
  }
  /** Demande de pièce depuis l'atelier : le magasin la voit au comptoir, le dossier garde la tâche. */
  function requestPart(roId, label, qty, note, by) {
    const r = ro(roId);
    if (!r || !label) return null;
    const q = {
      id: uid("pr"),
      roId,
      label: String(label).trim(),
      qty: Math.max(1, Math.round(+qty || 1)),
      note: note || "",
      by: by || S.meId,
      at: now(),
      status: "À servir",
      servedAt: null,
      orderId: null,
    };
    S.partRequests = S.partRequests || [];
    S.partRequests.unshift(q);
    r.tasks.push({ l: "Pièce demandée au magasin : " + q.qty + " × " + q.label, p: 0, requestId: q.id });
    r.waitingParts = true;
    r.prog = progressOf(r);
    log(r, "Pièce demandée au magasin : " + q.qty + " × " + q.label + (note ? " — " + note : ""), by);
    save();
    emit("ro", { roId });
    emit("partRequest", { id: q.id });
    feed({ ic: "box", tone: "amber", t: "Pièce demandée · " + r.no, s: q.qty + " × " + q.label + " · " + ((emp(q.by) || {}).first || ""), target: { type: "ro", id: r.id } });
    return q;
  }
  /** Le magasin sert (au comptoir) ou commande la pièce demandée. */
  function setPartRequest(id, status, extra = {}) {
    const q = (S.partRequests || []).find((x) => x.id === id);
    if (!q) return null;
    q.status = status;
    if (status === "Servi") q.servedAt = now();
    if (extra.orderId) q.orderId = extra.orderId;
    const r = ro(q.roId);
    if (r) {
      const t = r.tasks.find((x) => x.requestId === id);
      if (t && status === "Servi") { t.l = "Pièce servie au comptoir : " + q.qty + " × " + q.label; t.p = 1; }
      if (status === "Servi" && !(S.partRequests || []).some((x) => x.roId === r.id && x.status !== "Servi")) r.waitingParts = false;
      r.prog = progressOf(r);
      log(r, (status === "Servi" ? "Pièce servie au comptoir : " : status === "Commandé" ? "Pièce commandée : " : "Demande de pièce : ") + q.qty + " × " + q.label);
    }
    save();
    emit("partRequest", { id });
    if (status === "Servi" && r) feed({ ic: "check", tone: "green", t: "Pièce prête au comptoir · " + r.no, s: q.qty + " × " + q.label, target: { type: "ro", id: r.id } });
    return q;
  }
  function adjustStock(partId, delta, reason) {
    const p = part(partId);
    if (!p) return;
    p.qty = Math.max(0, p.qty + delta);
    S.activity.unshift({
      id: uid("a"),
      at: now(),
      text:
        "Stock " +
        p.ref +
        " " +
        (delta > 0 ? "+" : "") +
        delta +
        (reason ? " (" + reason + ")" : ""),
    });
    save();
    emit("stock", { partId });
  }
  const stockState = (p) => {
    const onOrder = S.orders.some(
      (o) =>
        !["Reçue", "Annulée", "Brouillon"].includes(o.status) &&
        o.lines.some((l) => l.partId === p.id || l.ref === p.ref),
    );
    if (p.qty <= 0) return onOrder ? ["Commandé", "amber"] : ["Rupture", "red"];
    if (p.reserved >= p.qty) return ["Réservé", "slate"];
    if (p.qty <= p.min) return ["Stock bas", "amber"];
    return ["En stock", "green"];
  };

  /* ---------- véhicules de remplacement ---------- */
  function lendCar(data) {
    const k = car(data.carId);
    if (!k) return;
    const l = Object.assign(
      {
        id: uid("L"),
        status: "En cours",
        signed: true,
        kmIn: null,
        fuelIn: null,
        fee: 0,
        notes: "",
      },
      data,
    );
    if (l.status === "En cours") {
      k.status = "Prêté";
      l.kmOut = l.kmOut || k.km;
      l.fuelOut = l.fuelOut != null ? l.fuelOut : k.fuel;
    }
    S.loans.unshift(l);
    const r = ro(l.roId);
    if (r) {
      r.courtesyId = l.id;
      log(
        r,
        "Véhicule de remplacement " +
          k.plate +
          (l.status === "Réservé" ? " réservé" : " remis au client"),
      );
    }
    save();
    emit("loan", { id: l.id });
    return l;
  }
  function startLoan(id) {
    const l = by("loans", id),
      k = l && car(l.carId);
    if (!l) return;
    l.status = "En cours";
    l.from = today();
    l.kmOut = k.km;
    l.fuelOut = k.fuel;
    l.signed = true;
    k.status = "Prêté";
    save();
    emit("loan", { id });
  }
  function returnCar(id, kmIn, fuelIn, notes, fee) {
    const l = by("loans", id);
    if (!l) return;
    const k = car(l.carId);
    l.status = "Rendu";
    l.kmIn = kmIn;
    l.fuelIn = fuelIn;
    l.to = today();
    l.fee = fee || 0;
    if (notes) l.notes = notes;
    if (k) {
      k.km = kmIn || k.km;
      k.fuel = fuelIn != null ? fuelIn : k.fuel;
      k.status = "Disponible";
    }
    const r = ro(l.roId);
    if (r)
      log(
        r,
        "Véhicule de remplacement rendu (" +
          ((kmIn || 0) - (l.kmOut || 0)) +
          " km)",
      );
    save();
    emit("loan", { id });
  }

  /* ---------- temps ---------- */
  function addTime(e) {
    const t = Object.assign({ id: uid("tm"), validated: false, note: "" }, e);
    S.time.unshift(t);
    const r = ro(t.roId);
    if (r) {
      log(r, (emp(t.emp) || {}).name + " : " + t.h + " h " + t.poste, t.emp);
    }
    save();
    emit("time", { id: t.id });
    return t;
  }
  function validateTimes(ids) {
    S.time.forEach((t) => {
      if (ids.includes(t.id)) t.validated = true;
    });
    save();
    emit("time", {});
  }

  /* ---------- qualité ---------- */
  function setQC(roId, items, note) {
    const r = ro(roId);
    if (!r) return;
    r.qc = Object.assign(r.qc || {}, {
      items,
      note: note || "",
      by: S.meId,
      at: now(),
    });
    save();
    emit("ro", { roId });
  }
  function qcDecision(roId, ok, note) {
    const r = ro(roId);
    if (!r) return;
    r.qc = Object.assign(r.qc || { items: {} }, {
      ok,
      note: note || "",
      by: S.meId,
      at: now(),
    });
    log(
      r,
      ok
        ? "Contrôle qualité validé"
        : "Contrôle qualité refusé — " + (note || "retouche"),
    );
    if (ok) setStage(roId, ST.lavage);
    else setStage(roId, ST.remont);
  }

  /* ---------- générique ---------- */
  function upsert(coll, obj, evt) {
    const arr = S[coll];
    const i = arr.findIndex((x) => x.id === obj.id);
    if (i >= 0) arr[i] = Object.assign(arr[i], obj);
    else arr.unshift(Object.assign({ id: uid(coll[0].toUpperCase()) }, obj));
    save();
    emit(evt || coll, { id: obj.id });
    return i >= 0 ? arr[i] : arr[0];
  }
  function remove(coll, id, evt) {
    S[coll] = S[coll].filter((x) => x.id !== id);
    save();
    emit(evt || coll, { id, removed: true });
  }
  function touch(evt, data) {
    save();
    emit(evt || "touch", data || {});
  }

  /* ==========================================================================
     INDICATEURS & ALERTES
     ========================================================================== */
  function kpis() {
    const t = today(),
      m = t.slice(0, 7);
    const inv = S.invoices.filter(
      (i) => i.date.slice(0, 7) === m && i.kind !== "acompte",
    );
    const caMonth = inv.reduce((a, i) => a + i.ht, 0);
    const invToday = S.invoices.filter(
      (i) => i.date === t && i.kind !== "acompte",
    );
    const caToday = invToday.reduce((a, i) => a + i.amount, 0);
    const insShare = inv.length
      ? inv
          .filter((i) => i.kind === "assurance")
          .reduce((a, i) => a + i.ht, 0) / Math.max(1, caMonth)
      : 0;
    // marge brute ≈ CA HT − coût MO (temps passés × coût horaire) − coût pièces & ingrédients
    const closedM = S.ros.filter(
      (r) => r.stage === ST.facture && dOf(r.outAt).slice(0, 7) === m,
    );
    let rev = 0,
      cost = 0;
    closedM.forEach((r) => {
      const tt = roTotals(r);
      rev += tt.ht;
      cost +=
        tt.parts * 0.74 +
        tt.mat * 0.55 +
        S.time
          .filter((x) => x.roId === r.id)
          .reduce((a, x) => a + x.h * ((emp(x.emp) || {}).costH || 55), 0);
    });
    const margin = rev ? (rev - cost) / rev : 0;
    const onsite = S.ros.filter((r) => ONSITE(r.slot) && r.stage < ST.facture);
    const postes =
      POSTE_IDS.filter((p) => !slotFree(p)).length +
      (slotFree("BOOTH") ? 0 : 1);
    const occ = postes / (POSTE_IDS.length + 1);
    const closed = S.ros.filter(
      (r) => r.stage === ST.facture && r.inAt && r.outAt,
    );
    const imm = closed.length
      ? closed.reduce(
          (a, r) => a + Math.max(1, diffDays(dOf(r.inAt), dOf(r.outAt))),
          0,
        ) / closed.length
      : 0;
    const ontime = closed.length
      ? closed.filter((r) => r.outAt <= r.dueAt).length / closed.length
      : 1;
    return {
      caMonth,
      caToday,
      invToday: invToday.length,
      insShare,
      margin,
      onsite: onsite.length,
      ready: onsite.filter((r) => r.stage === ST.pret).length,
      occ,
      postes,
      imm,
      ontime,
      late: S.ros.filter(isLate).length,
    };
  }

  /** CA cumulé et visites d'un client (historique + OR du système) */
  function custStats(cid) {
    const c = cust(cid) || {},
      rs = S.ros.filter((r) => r.customerId === cid),
      ids = new Set(rs.map((r) => r.id));
    const inv = S.invoices.filter(
      (i) => ids.has(i.roId) && i.kind !== "acompte",
    );
    return {
      spent:
        ((c.legacy || {}).spent || 0) + inv.reduce((a, i) => a + i.amount, 0),
      visits:
        ((c.legacy || {}).visits || 0) +
        rs.filter((r) => r.stage === ST.facture).length,
      open: rs.filter((r) => r.stage < ST.facture).length,
      last:
        rs
          .map((r) => dOf(r.outAt || r.inAt || r.apptAt))
          .filter(Boolean)
          .sort()
          .pop() || (c.hist && c.hist[0] ? c.hist[0][0] : null),
    };
  }
  /** Efficacité d'un technicien = temps vendus (répartis au prorata) / temps passés, sur les OR dont le travail est terminé. */
  const POSTE_GRP = {
    demont: "tole",
    tole: "tole",
    montage: "tole",
    prep: "peint",
    peint: "peint",
  };
  function effOf(empId, from) {
    let sold = 0,
      spent = 0;
    const rs = new Set(
      S.time
        .filter((t) => t.emp === empId && (!from || t.date >= from))
        .map((t) => t.roId),
    );
    rs.forEach((rid) => {
      const r = ro(rid);
      if (!r || r.stage < ST.cq) return;
      const tt = roTotals(r),
        soldG = {
          tole: tt.hours.T1 + tt.hours.T2 + tt.hours.T3,
          peint: tt.paintH,
        };
      ["tole", "peint"].forEach((g) => {
        const all = S.time.filter(
            (t) => t.roId === rid && POSTE_GRP[t.poste] === g,
          ),
          mine = all.filter((t) => t.emp === empId);
        const a = all.reduce((x, t) => x + t.h, 0),
          m = mine.reduce((x, t) => x + t.h, 0);
        if (a > 0 && m > 0) {
          sold += (soldG[g] * m) / a;
          spent += m;
        }
      });
    });
    return spent ? sold / spent : null;
  }

  function alerts() {
    const out = [],
      t = today(),
      n = now();
    const A = (id, level, kind, title, text, target, action) =>
      out.push({ id, level, kind, title, text, target, action });
    S.ros
      .filter((r) => r.stage === ST.pret && !r.notified)
      .forEach((r) =>
        A(
          "ready-" + r.id,
          "high",
          "ready",
          "Véhicule prêt — client non prévenu",
          r.no +
            " · " +
            vlabel(veh(r.vehicleId)) +
            " · " +
            custName(r.customerId),
          { type: "ro", id: r.id },
          "notify",
        ),
      );
    S.claims
      .filter((k) => k.roId && ro(k.roId) && ro(k.roId).stage < ST.facture)
      .forEach((k) => {
        const r = ro(k.roId);
        if (
          !k.expertiseAt &&
          !["Accordé", "Refusé", "Partiel"].includes(k.approval) &&
          !/hors assurance/i.test(k.cover)
        )
          A(
            "exp-" + k.id,
            "mid",
            "expertise",
            "Expertise à planifier",
            (ins(k.insurerId) || {}).short +
              " · sinistre " +
              k.no +
              " · " +
              vlabel(veh(k.vehicleId)),
            { type: "claim", id: k.id },
            "expertise",
          );
        const q = S.quotes.find(
          (x) => x.claimId === k.id && x.status === "Envoyé",
        );
        if (
          q &&
          q.sentAt &&
          diffDays(dOf(q.sentAt), t) >= 0 &&
          r.stage <= ST.accord
        )
          A(
            "acc-" + q.id,
            diffDays(dOf(q.sentAt), t) >= 2 ? "high" : "mid",
            "accord",
            "Accord en attente",
            (ins(k.insurerId) || {}).short +
              " · " +
              q.no +
              " · envoyé " +
              (dOf(q.sentAt) === t
                ? "aujourd’hui " + tOf(q.sentAt)
                : "le " + fmtD(dOf(q.sentAt))),
            { type: "quote", id: q.id },
            "relance",
          );
      });
    S.quotes
      .filter((q) => q.status === "Envoyé" && !q.claimId)
      .forEach((q) =>
        A(
          "accc-" + q.id,
          "mid",
          "accord",
          "Accord client en attente",
          q.no +
            " · " +
            custName(q.customerId) +
            " · " +
            chf(quoteTotals(q).ttc),
          { type: "quote", id: q.id },
          "relance",
        ),
      );
    S.orders
      .filter(
        (o) =>
          o.status === "En retard" ||
          (o.status === "Commandée" &&
            o.eta &&
            o.eta < n.slice(0, 10) + " 00:00"),
      )
      .forEach((o) =>
        A(
          "ord-" + o.id,
          "high",
          "parts",
          "Pièces en retard",
          o.no +
            " · " +
            (supplier(o.supplierId) || {}).name +
            (o.roId ? " · " + (ro(o.roId) || {}).no : ""),
          { type: "order", id: o.id },
          "order",
        ),
      );
    S.ros
      .filter(isLate)
      .forEach((r) =>
        A(
          "late-" + r.id,
          "high",
          "late",
          "OR en retard",
          r.no +
            " · prévu " +
            fmtD(dOf(r.dueAt)) +
            " " +
            tOf(r.dueAt) +
            " · " +
            STAGES[r.stage].s,
          { type: "ro", id: r.id },
        ),
      );
    S.ros
      .filter((r) => r.stage === ST.cq && !(r.qc && r.qc.ok))
      .forEach((r) =>
        A(
          "qc-" + r.id,
          "mid",
          "qc",
          "Contrôle qualité à faire",
          r.no + " · " + vlabel(veh(r.vehicleId)),
          { type: "ro", id: r.id },
          "qc",
        ),
      );
    S.invoices
      .filter((i) => i.status !== "Payée" && i.due < t)
      .forEach((i) =>
        A(
          "inv-" + i.id,
          "mid",
          "invoice",
          "Facture échue",
          i.no +
            " · " +
            chf2(i.amount - i.paid) +
            " · " +
            (i.payerType === "insurer"
              ? (ins(i.payerId) || {}).short
              : custName(i.payerId)),
          { type: "invoice", id: i.id },
          "remind",
        ),
      );
    S.parts
      .filter(
        (p) =>
          p.qty <= p.min &&
          !S.orders.some(
            (o) =>
              !["Reçue", "Annulée"].includes(o.status) &&
              o.lines.some((l) => l.partId === p.id || l.ref === p.ref),
          ),
      )
      .forEach((p) =>
        A(
          "stk-" + p.id,
          "low",
          "stock",
          p.qty <= 0 ? "Rupture de stock" : "Stock bas",
          p.name + " · " + p.qty + " " + p.unit,
          { type: "part", id: p.id },
          "reorder",
        ),
      );
    S.loans
      .filter((l) => l.status === "En cours" && l.to < t)
      .forEach((l) =>
        A(
          "loan-" + l.id,
          "mid",
          "loan",
          "Véhicule de remplacement à récupérer",
          (car(l.carId) || {}).plate +
            " · " +
            custName(l.customerId) +
            " · retour prévu " +
            fmtD(l.to),
          { type: "loan", id: l.id },
        ),
      );
    S.complaints
      .filter((c) => c.status === "Ouverte")
      .forEach((c) =>
        A(
          "cpl-" + c.id,
          "mid",
          "complaint",
          c.type + " ouverte",
          custName(c.customerId) + " · " + c.desc,
          { type: "complaint", id: c.id },
        ),
      );
    return out;
  }

  window.CX = {
    get S() {
      return S;
    },
    KEY,
    load,
    save,
    reset,
    on,
    emit,
    seed,
    STAGES,
    ST,
    MAP_STAGES,
    OPS,
    CATS,
    CAR_ZONES,
    ZONE,
    DMG_TYPES,
    SLOTS,
    ONSITE,
    POSTE_IDS,
    RESOURCES,
    ROLES,
    QC_ITEMS,
    TVA,
    ro,
    veh,
    cust,
    emp,
    ins,
    claim,
    quote,
    part,
    supplier,
    order,
    invoice,
    car,
    roByNo,
    roOfVehicle,
    slotRO,
    slotFree,
    slotLabel,
    quoteTotals,
    roQuote,
    roTotals,
    roSpent,
    roSold,
    vlabel,
    custName,
    stageOf,
    statusOf,
    toneOf,
    isLate,
    stockState,
    setStage,
    assignTech,
    unassignTech,
    moveRO,
    bumpProgress,
    setTask,
    addTask,
    notifyCustomer,
    requestReview,
    createRO,
    checkin,
    saveQuote,
    setQuoteStatus,
    convertQuote,
    nextQuoteNo,
    updateClaim,
    planExpertise,
    decideClaim,
    ensureInvoices,
    createDeposit,
    payInvoice,
    remindInvoice,
    saveOrder,
    setOrderStatus,
    receiveOrder,
    adjustStock,
    lendCar,
    seedShowroom,
    seedDepannage,
    commercialCatalog,
    seedCases,
    seedAgent,
    startLoan,
    returnCar,
    addTime,
    validateTimes,
    setQC,
    qcDecision,
    upsert,
    remove,
    touch,
    deliver,
    progressOf,
    freezeQuote,
    reservePart,
    releasePart,
    requestPart,
    setPartRequest,
    resolveConflict,
    log,
    feed,
    kpis,
    alerts,
    custStats,
    effOf,
    now,
    sync,
    pull,
    ACTIVITIES,
    ACTIVITY_PROFILES,
    defaultActivities,
    activityOn,
    util: {
      pad,
      iso,
      today,
      parse,
      addDays,
      diffDays,
      weekStart,
      isWeekend,
      wd,
      fmtDate,
      fmtD,
      hm,
      toMin,
      chf,
      chf2,
      chfK,
      round5,
      esc,
      uid,
      hash,
      rng,
      nowMin,
      now,
      dt,
      dOf,
      tOf,
    },
  };
  load();
})();
