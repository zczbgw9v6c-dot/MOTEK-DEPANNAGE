import { DeliveryDeadline } from "./DeliveryDeadline";
import { layoutFor } from "./dealership-layout";
import { prepareClientMessage } from "./communication-domain";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Buildings,
  Car,
  CalendarDots,
  Users,
  Package,
  Brain,
  ChartLine,
  GearSix,
  Plus,
  MagnifyingGlass,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Clock,
  Export,
  FloppyDisk,
  MapTrifold,
  PersonSimpleWalk,
  Cube,
  ArrowsOut,
  WarningCircle,
  ShieldCheck,
  Wrench,
  Envelope,
  CheckCircle,
  Eye,
  SteeringWheel,
  ArrowCounterClockwise,
  FileText,
  Scan,
} from "@phosphor-icons/react";
import { GarageScene, type Selection, type Mode } from "./scene";
import {
  seed,
  loadDB,
  record,
  updateVehicle,
  reservePart,
  similarCases,
  statuses,
  technicians,
  zones,
  type DB,
  type Vehicle,
  type Status,
} from "./domain";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "./style.css";
import { Workshop } from "./Workshop";
import { AssetLibrary } from "./AssetLibrary";
import { Quotes } from "./Quotes";
import { ScanPanel } from "./ScanPanel";
import { changeServer, readServer, syncClock, type Snapshot } from "./api";
import { Stocks } from "./Stocks";
import { Intelligence } from "./Intelligence";
import { Planning } from "./Planning";
import { Team } from "./Team";
import { Pilotage } from "./Pilotage";
import { dashboard, isPresent } from "./dashboard-domain";
import { persistDB, STORAGE_KEY } from "./persistence";
import { duplicateVehicle, workshopFor } from "./workshop-domain";
import { identifyLocal, validVIN, type FieldEvidence } from "./identification";
const KEY = STORAGE_KEY;
function orderID() {
  try {
    return location.hash.startsWith("#ordre=")
      ? decodeURIComponent(location.hash.slice(7))
      : "";
  } catch {
    return "";
  }
}
function hasLegacyBackup() {
  try {
    return !!localStorage.getItem("autohub-local-v1");
  } catch {
    return false;
  }
}
function readInitial() {
  try {
    return { db: loadDB(localStorage.getItem(KEY)), error: "" };
  } catch {
    return {
      db: seed(),
      error:
        "La sauvegarde existante est illisible et a été conservée. Restaurez un fichier valide ou réinitialisez la démonstration dans les paramètres.",
    };
  }
}
const initial = readInitial();
const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    n,
  );
function Badge({ status }: { status: Status }) {
  return (
    <span
      className={
        "badge " +
        (status === "Prêt à livrer" || status === "Livré"
          ? "green"
          : status === "Devis à valider"
            ? "amber"
            : status === "En intervention"
              ? "red"
              : status === "Diagnostic"
                ? "slate"
                : "blue")
      }
    >
      <i />
      {status}
    </span>
  );
}
function App() {
  const [storageError, setStorageError] = useState(initial.error);
  const [canSave, setCanSave] = useState(!initial.error);
  const [db, setDB] = useState<DB>(initial.db);
  const dbRef = useRef(db);
  const revision = useRef(-1),
    queue = useRef<Promise<unknown>>(Promise.resolve());
  const [serverReady, setServerReady] = useState(false);
  function acceptSnapshot(snapshot: Snapshot) {
    if (snapshot.revision < revision.current) return;
    revision.current = snapshot.revision;
    syncClock(snapshot.serverNow);
    dbRef.current = snapshot.db;
    setDB(snapshot.db);
    setCanSave(true);
    setServerReady(true);
    setStorageError("");
  }
  useEffect(() => {
    let mounted = true;
    readServer()
      .then((s) => {
        if (mounted) acceptSnapshot(s);
      })
      .catch(() => {
        if (mounted)
          setStorageError(
            "Serveur AutoHub indisponible : les modifications sont bloquées jusqu’à reconnexion.",
          );
      });
    const stream = new EventSource("/api/events");
    stream.onmessage = (e) => {
      if (mounted) acceptSnapshot(JSON.parse(e.data));
    };
    stream.onerror = () => {
      if (mounted) {
        setServerReady(false);
        setStorageError(
          "Connexion serveur interrompue. Les changements ne sont pas déclarés synchronisés.",
        );
      }
    };
    return () => {
      mounted = false;
      stream.close();
    };
  }, []);
  useEffect(() => {
    dbRef.current = db;
  }, [db]);
  const [view, setView] = useState(
    location.hash.startsWith("#ordre=") ? "atelier" : "garage",
  );
  const [selection, setSelection] = useState<Selection | null>(() =>
    location.hash.startsWith("#ordre=")
      ? { kind: "vehicle", id: orderID() }
      : null,
  );
  const [mode, setMode] = useState<Mode>("overview");
  const [zone, setZone] = useState("atelier");
  const [query, setQuery] = useState("");
  const [cohort, setCohort] = useState("all");
  const live = dashboard(db);
  function cohortIDs(filter: string) {
    return filter === "ready"
      ? live.ready.map((v) => v.id)
      : filter === "blocked"
        ? live.blocked.map((v) => v.id)
        : filter === "late"
          ? live.late.map((v) => v.id)
          : filter === "running"
            ? live.running.map((v) => v.id)
            : filter === "invoiced"
              ? (db.invoices || []).map((i) => i.vehicle)
              : filter === "present"
                ? live.present.map((v) => v.id)
                : db.vehicles.map((v) => v.id);
  }
  function filterDossiers(filter: string) {
    setCohort(filter);
    setQuery("");
    setView("garage");
    setSelection(null);
  }
  function openDossier(id: string) {
    setSelection({ kind: "vehicle", id });
    setTab("dossier");
    setView("garage");
  }
  const [toast, setToast] = useState("");
  const [hint, setHint] = useState("");
  const [pos, setPos] = useState<[number, number]>([-17, 13]);
  const [tab, setTab] = useState("dossier");
  const [creation, setCreation] = useState(false);
  const [error3d, setError3d] = useState("");
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [low, setLow] = useState(false);
  const [speed, setSpeed] = useState(3.8);
  const [selectedPart, setSelectedPart] = useState("disc");
  const [inspect, setInspect] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [searched, setSearched] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<GarageScene | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const car = db.vehicles.find((v) => v.id === selection?.id);
  const visible = db.vehicles
    .filter((v) => cohortIDs(cohort).includes(v.id))
    .filter((v) =>
      (v.make + " " + v.model + " " + v.plate + " " + v.client + " " + v.phone)
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const notify = (text: string) => {
    setToast(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  };
  function transact(
    type: string,
    vehicle: string | undefined,
    payload: any,
    success?: string,
  ): Promise<boolean> {
    const task = queue.current.then(async () => {
      try {
        if (revision.current < 0)
          throw Error("Attendez la connexion au serveur.");
        const snapshot = await changeServer(
          revision.current,
          type,
          vehicle,
          payload,
        );
        acceptSnapshot(snapshot);
        if (success) notify(success);
        return true;
      } catch (e) {
        notify((e as Error).message);
        try {
          acceptSnapshot(await readServer());
        } catch {}
        return false;
      }
    });
    queue.current = task;
    return task;
  }
  function commit(fn: (db: DB) => DB, success?: string): Promise<boolean> {
    const task = queue.current.then(async () => {
      try {
        if (revision.current < 0)
          throw Error("Attendez la connexion au serveur.");
        const next = fn(dbRef.current);
        const snapshot = await changeServer(
          revision.current,
          "snapshot",
          undefined,
          { db: next },
        );
        acceptSnapshot(snapshot);
        if (success) notify(success);
        return true;
      } catch (e) {
        notify((e as Error).message);
        try {
          acceptSnapshot(await readServer());
        } catch {}
        return false;
      }
    });
    queue.current = task;
    return task;
  }
  const select = (s: Selection) => {
    if (s.kind === "part") {
      setSelectedPart(s.id);
      setTab("pieces");
      return;
    }
    setSelection(s);
    setInspect(s.kind === "wheel");
    if (s.kind === "vehicle") {
      setMode("free");
      scene.current?.focusVehicle(s.id);
    }
    if (s.kind === "wheel") setMode("free");
    setTab(s.kind === "wheel" ? "pieces" : "dossier");
    if (s.kind === "stock") setView("stocks");
    else if (s.kind === "reception") setCreation(true);
    else if (s.kind === "office")
      setView(s.id === "office" ? "devis" : "pilotage");
    else if (s.kind === "delivery") setView("dossiers");
  };
  useEffect(() => {
    if (!serverReady) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* Server is authoritative; a full browser cache does not discard persisted data. */
    }
  }, [db, serverReady]);
  useEffect(() => {
    if (view !== "garage" || !host.current) return;
    try {
      scene.current = new GarageScene(
        host.current,
        select,
        (x, z) => setPos([x, z]),
        setHint,
        setError3d,
        layoutFor(db.dealership),
      );
      scene.current.update(db.vehicles, db.assetDisabled, db.workshop);
      scene.current.setMode(mode);
      if (car && isPresent(car) && !inspect) {
        scene.current.focusVehicle(car.id);
        setMode("free");
      }
      scene.current.reduced = reduced;
      scene.current.speed = speed;
      scene.current.setQuality(low);
    } catch {
      setError3d(
        "Votre navigateur ne permet pas de démarrer la 3D. Utilisez les dossiers et le planning.",
      );
    }
    return () => {
      scene.current?.dispose();
      scene.current = null;
    };
  }, [view, db.dealership]);
  useEffect(() => {
    scene.current?.update(db.vehicles, db.assetDisabled, db.workshop);
  }, [db.vehicles, db.assetDisabled]);
  useEffect(() => {
    scene.current?.setFocusIds(cohort === "all" ? [] : cohortIDs(cohort));
  }, [cohort, db, view]);
  useEffect(() => {
    scene.current?.setSelected(car?.id || null);
    if (car) scene.current?.inspect(car.id, inspect);
  }, [selection, inspect, db.vehicles]);
  useEffect(() => {
    if (scene.current) {
      scene.current.reduced = reduced;
      scene.current.speed = speed;
      scene.current.setQuality(low);
    }
  }, [reduced, speed, low]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function changeMode(m: Mode) {
    setMode(m);
    scene.current?.setMode(m);
    setInspect(false);
  }
  function go(id: string) {
    setZone(id);
    if (mode !== "walk") setMode("free");
    scene.current?.go(id);
  }
  function exportDB() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "autohub-sauvegarde.json";
    a.click();
    URL.revokeObjectURL(url);
    notify("Sauvegarde exportée.");
  }
  function prepareMessage(v: Vehicle, kind: "pickup" | "quote" = "pickup") {
    commit(
      (d) => prepareClientMessage(d, v.id, kind),
      "Brouillon WhatsApp préparé · aucun envoi effectué.",
    );
    setTab("historique");
  }
  const occupied = live.occupied.length;
  const active = live.present;
  useEffect(() => {
    const onHash = () => {
      if (location.hash.startsWith("#ordre=")) {
        const id = orderID();
        setSelection({ kind: "vehicle", id });
        setView("atelier");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const nav = [
    ["garage", "Mon garage", Buildings],
    ["dossiers", "Dossiers véhicules", Car],
    ["atelier", "Mode atelier", Wrench],
    ["devis", "Devis & validations", FileText],
    ["planning", "Planning", CalendarDots],
    ["equipe", "Équipe", Users],
    ["stocks", "Pièces & stocks", Package],
    ["intelligence", "Garage intelligent", Brain],
    ["pilotage", "Pilotage", ChartLine],
    ["bibliotheque", "Bibliothèque 3D", Cube],
  ] as const;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          aria-label="AutoHub 3D, ouvrir le garage"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("garage");
          }}
        >
          <span className="brand-symbol">
            <Buildings size={25} weight="duotone" />
          </span>
          <span>
            autohub<span className="brand-3d">3D</span>
          </span>
        </a>
        <div className="garage-name">
          <span className="garage-monogram">AG</span>
          <div>
            <strong>Atelier Grand Parc</strong>
            <small>Garage de démonstration</small>
          </div>
          <span className="dot" />
        </div>
        <span className="nav-caption">ESPACE DE TRAVAIL</span>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-label={label}
              title={label}
              className={view === id ? "nav-item active" : "nav-item"}
              onClick={() => {
                setView(id);
                setQuery("");
              }}
            >
              <Icon size={21} />
              <span>{label}</span>
              {id === "dossiers" && (
                <span className="nav-count">{active.length}</span>
              )}
              {id === "intelligence" && <span className="new-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <ShieldCheck size={23} />
            <strong>Votre atelier, connecté.</strong>
            <p>
              Prototype local
              <br />
              Données fictives et modifiables.
            </p>
            <span>
              <i /> Base SQLite · serveur local
            </span>
          </div>
          <button
            aria-label="Paramètres"
            title="Paramètres"
            className={"nav-item " + (view === "reglages" ? "active" : "")}
            onClick={() => setView("reglages")}
          >
            <GearSix size={21} />
            Paramètres
          </button>
          <div className="user">
            <span>ÉS</span>
            <div>
              <strong>Eythan</strong>
              <small>Responsable d’atelier</small>
            </div>
            <button
              aria-label="Ouvrir les paramètres"
              onClick={() => setView("reglages")}
            >
              <ArrowUpRight size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            Atelier Grand Parc <span>/</span>{" "}
            <strong>
              {nav.find((n) => n[0] === view)?.[1] || "Paramètres"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="demo">
              <i /> Mode démonstration
            </span>
            <button
              className="icon-button"
              onClick={exportDB}
              aria-label="Exporter une sauvegarde"
            >
              <Export size={20} />
            </button>
            <span className="avatar">ÉS</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">AUTOHUB · VOTRE ESPACE AUTOMOBILE</div>
              <h1>
                {view === "garage"
                  ? "Une nouvelle perspective sur votre atelier."
                  : nav.find((n) => n[0] === view)?.[1] ||
                    "Paramètres de l’atelier"}
              </h1>
              <p>
                {view === "garage"
                  ? "Entrez dans votre garage. Chaque véhicule, chaque poste, chaque dossier à portée de main."
                  : view === "intelligence"
                    ? "Retrouvez l’expérience de votre atelier et les cas techniques similaires."
                    : "Les données de votre garage, réunies dans un espace de travail."}
              </p>
            </div>
            <button className="primary" onClick={() => setCreation(true)}>
              <Plus size={18} />
              Nouvelle réception
            </button>
          </div>
          {(storageError || error3d) && (
            <div className="notice">
              <WarningCircle />
              {storageError || error3d}
              <button onClick={() => setView("dossiers")}>
                Ouvrir les dossiers
              </button>
            </div>
          )}
          {cohort !== "all" && (
            <div className="cohort-bar">
              <span>
                {visible.length} dossiers · filtre {cohort}
              </span>
              <button className="secondary" onClick={() => setCohort("all")}>
                Afficher tous les dossiers
              </button>
            </div>
          )}
          <div className="metrics clickable-metrics">
            <button onClick={() => filterDossiers("present")}>
              <span>Véhicules présents</span>
              <strong>
                {live.present.length}
                <small>dans votre garage</small>
              </strong>
            </button>
            <button onClick={() => setView("planning")}>
              <span>Postes occupés</span>
              <strong>
                {live.occupied.length}
                <em>/ 8</em>
                <small>{8 - live.occupied.length} disponibles</small>
              </strong>
            </button>
            <button onClick={() => setView("devis")}>
              <span>Devis validés</span>
              <strong>
                {live.accepted.length}
                <small>accord enregistré</small>
              </strong>
            </button>
            <button onClick={() => filterDossiers("ready")}>
              <span>Prêts à livrer</span>
              <strong>
                {live.ready.length}
                <small className="text-green">contrôle validé</small>
              </strong>
            </button>
          </div>
          {view === "garage" ? (
            <div
              className={
                "garage-layout " +
                (mode === "walk" && !selection ? "immersive" : "")
              }
            >
              <section className="scene-card">
                <div className="scene-toolbar">
                  <div className="scene-title">
                    <span className="live-dot" />
                    <strong>{zones.find((z) => z.id === zone)?.name}</strong>
                    <span>Environnement 3D</span>
                  </div>
                  <div className="mode-switch">
                    {(
                      [
                        ["overview", MapTrifold, "Globale"],
                        ["free", Cube, "Libre"],
                        ["walk", PersonSimpleWalk, "Immersion"],
                      ] as const
                    ).map(([id, Icon, label]) => (
                      <button
                        key={id}
                        className={mode === id ? "selected" : ""}
                        onClick={() => changeMode(id)}
                        title={label}
                      >
                        <Icon size={17} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="scene-viewport">
                  <div ref={host} className="canvas-host" />
                  {car && isPresent(car) && mode !== "walk" && (
                    <div
                      className="vehicle-view-controls"
                      aria-label="Points de vue du véhicule"
                    >
                      {[false, true].map((rear) => (
                        <button
                          key={String(rear)}
                          onClick={() => {
                            setInspect(false);
                            scene.current?.inspect(car.id, false);
                            scene.current?.focusVehicle(car.id, rear);
                            setMode("free");
                          }}
                        >
                          {rear ? "Autre côté" : "Recentrer"}
                        </button>
                      ))}
                      <button onClick={() => changeMode("overview")}>
                        Vue atelier
                      </button>
                    </div>
                  )}
                  <div className="zone-menu">
                    <label htmlFor="destination">SE DÉPLACER VERS</label>
                    <select
                      id="destination"
                      value={zone}
                      onChange={(e) => go(e.target.value)}
                    >
                      {zones
                        .filter(
                          (z) =>
                            layoutFor(db.dealership).waitingRoom ||
                            z.id !== "attente",
                        )
                        .map((z) => (
                          <option value={z.id} key={z.id}>
                            {z.short}
                          </option>
                        ))}
                    </select>
                  </div>
                  {mode === "overview" && (
                    <div className="scene-welcome">
                      <span>UN ATELIER À EXPLORER</span>
                      <h2>
                        La vue d’ensemble.
                        <br />
                        Le détail à un clic.
                      </h2>
                      <p>Sélectionnez un véhicule pour ouvrir son dossier.</p>
                      <button
                        onClick={() => {
                          setSelection(null);
                          changeMode("walk");
                          setZone("accueil");
                        }}
                      >
                        <PersonSimpleWalk size={18} />
                        Entrer dans le garage
                        <ArrowRight size={17} />
                      </button>
                    </div>
                  )}
                  {mode === "walk" && (
                    <>
                      <div className="crosshair" />
                      <div className="walking-tip">
                        Cliquez dans la scène pour regarder autour de vous
                        <br />
                        <kbd>ZQSD</kbd> / <kbd>WASD</kbd> marcher · <kbd>E</kbd>{" "}
                        interagir · <kbd>Échap</kbd> libérer la souris
                      </div>
                      <div className="touch-controls">
                        {[
                          ["↑", "KeyW"],
                          ["←", "KeyA"],
                          ["↓", "KeyS"],
                          ["→", "KeyD"],
                        ].map(([label, code]) => (
                          <button
                            key={code}
                            aria-label={"Déplacement " + label}
                            onPointerDown={() =>
                              window.dispatchEvent(
                                new KeyboardEvent("keydown", { code }),
                              )
                            }
                            onPointerUp={() =>
                              window.dispatchEvent(
                                new KeyboardEvent("keyup", { code }),
                              )
                            }
                            onPointerLeave={() =>
                              window.dispatchEvent(
                                new KeyboardEvent("keyup", { code }),
                              )
                            }
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="mini-map">
                    <div>
                      <MapTrifold size={14} />
                      <span>PLAN DU GARAGE</span>
                      <button
                        aria-label="Revenir à la vue globale"
                        onClick={() => changeMode("overview")}
                      >
                        <ArrowsOut size={14} />
                      </button>
                    </div>
                    <svg
                      viewBox={`-24 ${-19 - 7 * (db.dealership?.workshopSpacing || 5)} 48 ${51 + 7 * (db.dealership?.workshopSpacing || 5)}`}
                      role="img"
                      aria-label="Plan interactif du garage"
                    >
                      <rect
                        x="-22"
                        y={-17 - 7 * (db.dealership?.workshopSpacing || 5)}
                        width="44"
                        height={35 + 7 * (db.dealership?.workshopSpacing || 5)}
                        fill="#e6ebe7"
                        stroke="#94a6a6"
                        strokeWidth=".4"
                      />
                      <path
                        d="M-12 -18V18M12 -18V18M-22 -8H-12M-22 2H-12M12 -6H22M12 6H22M-12 9H12"
                        stroke="#a4b2b0"
                        strokeWidth=".4"
                      />
                      {zones
                        .filter(
                          (z) =>
                            layoutFor(db.dealership).waitingRoom ||
                            z.id !== "attente",
                        )
                        .map((z) => (
                          <g
                            key={z.id}
                            onClick={() => go(z.id)}
                            tabIndex={0}
                            role="button"
                            aria-label={"Aller à " + z.short}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") go(z.id);
                            }}
                          >
                            <circle
                              cx={z.x}
                              cy={z.z}
                              r="2.8"
                              fill={zone === z.id ? "#477996" : "#c2cfca"}
                            />
                            <text
                              x={z.x}
                              y={z.z + 0.8}
                              textAnchor="middle"
                              fontSize="1.9"
                              fill={zone === z.id ? "white" : "#314b56"}
                            >
                              {z.short.slice(0, 3)}
                            </text>
                          </g>
                        ))}
                      {mode === "walk" && (
                        <circle
                          cx={pos[0]}
                          cy={pos[1]}
                          r=".9"
                          fill="#1f6593"
                          stroke="white"
                          strokeWidth=".5"
                        />
                      )}
                    </svg>
                  </div>
                  <button
                    className="scene-expand"
                    aria-label="Afficher la caméra libre"
                    onClick={() => changeMode("free")}
                  >
                    <ArrowsOut size={19} />
                  </button>
                </div>
                <div className="scene-footer">
                  <span>
                    <span className="dot" />{" "}
                    {hint ||
                      "Cliquez un véhicule pour le cadrer. Glissez pour tourner autour, utilisez la molette pour zoomer."}
                  </span>
                  <span>GLB génériques · freins illustratifs</span>
                </div>
              </section>
              <aside className="context-panel">
                {car ? (
                  <>
                    <div className="panel-top">
                      <span>DOSSIER VÉHICULE</span>
                      <button
                        className="icon-button"
                        aria-label="Fermer le dossier"
                        onClick={() => {
                          scene.current?.inspect(car.id, false);
                          setSelection(null);
                          setInspect(false);
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="vehicle-heading">
                      <span className="model-honesty">
                        Illustration générique · modèle exact non importé
                      </span>
                      <div
                        className="car-avatar"
                        style={{ background: car.color }}
                      >
                        <Car size={34} color="white" />
                      </div>
                      <h2>
                        {car.make} {car.model}
                      </h2>
                      <p className="warning-small">
                        Représentation 3D générique · modèle exact non importé.
                      </p>
                      <span className="plate">{car.plate}</span>
                      <Badge status={car.status} />
                    </div>
                    <div className="panel-tabs">
                      {[
                        ["dossier", "Dossier"],
                        ["pieces", "Pièces 3D"],
                        ["historique", "Activité"],
                      ].map(([id, label]) => (
                        <button
                          className={tab === id ? "on" : ""}
                          key={id}
                          onClick={() => {
                            setTab(id);
                            if (id === "pieces") {
                              setInspect(true);
                              scene.current?.inspect(car.id, true);
                              setMode("free");
                            }
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="panel-body">
                      {tab === "dossier" ? (
                        <>
                          {!isPresent(car) && (
                            <div className="subtle-note">
                              Véhicule hors du garage : le dossier reste
                              consultable.
                            </div>
                          )}
                          {car.present === false &&
                            car.status === "Réception" && (
                              <button
                                className="primary full"
                                onClick={() =>
                                  commit(
                                    (d) => ({
                                      ...updateVehicle(d, car.id, {
                                        present: true,
                                        arrivedAt: new Date().toISOString(),
                                      }),
                                      appointments: d.appointments?.map((a) =>
                                        a.vehicle === car.id
                                          ? { ...a, arrived: true }
                                          : a,
                                      ),
                                    }),
                                    "Arrivée enregistrée.",
                                  )
                                }
                              >
                                Enregistrer l’arrivée
                              </button>
                            )}
                          <div className="client-line">
                            <Users size={20} />
                            <div>
                              <strong>{car.client}</strong>
                              <small>{car.phone}</small>
                            </div>
                          </div>
                          <div className="vehicle-facts">
                            <div>
                              <span>Kilométrage</span>
                              <strong>
                                {car.km.toLocaleString("fr-FR")} km
                              </strong>
                            </div>
                            <div>
                              <span>Année</span>
                              <strong>{car.year}</strong>
                            </div>
                          </div>
                          <DeliveryDeadline db={db} vehicle={car} />
                          <label>Motif de visite</label>
                          <p className="symptoms">{car.symptoms}</p>
                          <label htmlFor="technician">Technicien affecté</label>
                          <select
                            id="technician"
                            value={car.technician}
                            onChange={(e) =>
                              commit(
                                (d) =>
                                  updateVehicle(d, car.id, {
                                    technician: e.target.value,
                                  }),
                                "Affectation sauvegardée.",
                              )
                            }
                          >
                            {technicians.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                          <label htmlFor="bay">Poste de travail</label>
                          <select
                            id="bay"
                            value={car.bay ?? ""}
                            onChange={(e) =>
                              commit(
                                (d) =>
                                  updateVehicle(d, car.id, {
                                    bay: e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  }),
                                "Poste sauvegardé.",
                              )
                            }
                          >
                            <option value="">Sans poste</option>
                            {Array.from({ length: 8 }, (_, i) => (
                              <option key={i} value={i + 1}>
                                Poste {i + 1}
                                {db.vehicles.some(
                                  (v) => v.id !== car.id && v.bay === i + 1,
                                )
                                  ? " · occupé"
                                  : ""}
                              </option>
                            ))}
                          </select>
                          <label htmlFor="status">
                            Statut de l’intervention
                          </label>
                          <select
                            id="status"
                            value={car.status}
                            onChange={(e) =>
                              commit(
                                (d) =>
                                  updateVehicle(d, car.id, {
                                    status: e.target.value as Status,
                                  }),
                                "Statut mis à jour.",
                              )
                            }
                          >
                            {statuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                          <label className="check-label">
                            <input
                              type="checkbox"
                              checked={car.quality}
                              onChange={(e) =>
                                commit(
                                  (d) =>
                                    updateVehicle(d, car.id, {
                                      quality: e.target.checked,
                                    }),
                                  "Contrôle qualité sauvegardé.",
                                )
                              }
                            />
                            Contrôle qualité validé
                          </label>
                          <button
                            className="secondary full"
                            onClick={() => setView("atelier")}
                          >
                            <Wrench size={18} />
                            Ouvrir le mode atelier
                          </button>
                          <label htmlFor="notes">Notes atelier</label>
                          <textarea
                            id="notes"
                            key={car.id}
                            defaultValue={car.notes}
                            onBlur={(e) => {
                              if (e.target.value !== car.notes)
                                commit(
                                  (d) =>
                                    updateVehicle(d, car.id, {
                                      notes: e.target.value,
                                    }),
                                  "Notes sauvegardées.",
                                );
                            }}
                            placeholder="Mesures, réparations, observations…"
                          />
                          <button
                            className="primary full"
                            onClick={() => {
                              setView("intelligence");
                              setDiagnosis(car.symptoms + " " + car.codes);
                              setSearched(true);
                            }}
                          >
                            <Brain size={18} />
                            Rechercher des cas similaires
                          </button>
                          {car.status === "Devis à valider" && (
                            <button
                              className="secondary full"
                              onClick={() => prepareMessage(car, "quote")}
                            >
                              <Envelope size={18} />
                              Préparer WhatsApp · devis
                            </button>
                          )}
                          {car.status === "Prêt à livrer" && (
                            <button
                              className="secondary full"
                              onClick={() => prepareMessage(car)}
                            >
                              <Envelope size={18} />
                              Préparer WhatsApp · restitution
                            </button>
                          )}
                        </>
                      ) : tab === "pieces" ? (
                        <>
                          <div className="subtle-note">
                            <Eye size={19} />
                            Illustration mécanique générique : roue avant gauche
                            retirée visuellement. Cliquez sur le disque ou
                            l’étrier dans la scène.
                          </div>
                          <button
                            className="secondary full"
                            onClick={() => {
                              setInspect(!inspect);
                              scene.current?.inspect(car.id, !inspect);
                            }}
                          >
                            <Wrench size={18} />
                            {inspect
                              ? "Remonter la roue"
                              : "Inspecter le freinage"}
                          </button>
                          <div className="parts-selector">
                            {db.parts
                              .filter((p) =>
                                ["disc", "pads", "caliper"].includes(p.id),
                              )
                              .map((p) => (
                                <button
                                  className={selectedPart === p.id ? "on" : ""}
                                  key={p.id}
                                  onClick={() => setSelectedPart(p.id)}
                                >
                                  {p.name}
                                </button>
                              ))}
                          </div>
                          {db.parts
                            .filter((p) => p.id === selectedPart)
                            .map((p) => (
                              <div className="part-detail" key={p.id}>
                                <span className="eyebrow">
                                  FREINAGE · AVANT GAUCHE
                                </span>
                                <h3>{p.name}</h3>
                                <code>{p.ref}</code>
                                <div className="vehicle-facts">
                                  <div>
                                    <span>Disponibles</span>
                                    <strong>
                                      {p.stock - p.reserved} unités
                                    </strong>
                                  </div>
                                  <div>
                                    <span>Emplacement</span>
                                    <strong>{p.location}</strong>
                                  </div>
                                </div>
                                <p className="warning-small">
                                  Référence et prix fictifs. Compatibilité VIN /
                                  OEM à confirmer avant toute utilisation
                                  réelle.
                                </p>
                                <strong className="part-price">
                                  {euro(p.price)} <small>prix démo HT</small>
                                </strong>
                                <button
                                  className="primary full"
                                  disabled={
                                    car.parts.includes(p.id) ||
                                    p.stock - p.reserved === 0
                                  }
                                  onClick={() =>
                                    commit(
                                      (d) => reservePart(d, car.id, p.id),
                                      "Pièce réservée pour ce véhicule.",
                                    )
                                  }
                                >
                                  <Package size={17} />
                                  {car.parts.includes(p.id)
                                    ? "Déjà réservée"
                                    : "Réserver pour ce dossier"}
                                </button>
                                <button
                                  className="secondary full"
                                  onClick={() =>
                                    commit(
                                      (d) =>
                                        record(
                                          {
                                            ...d,
                                            orders: [
                                              {
                                                id: crypto.randomUUID(),
                                                part: p.id,
                                                quantity: 1,
                                                status: "À valider",
                                              },
                                              ...d.orders,
                                            ],
                                          },
                                          car.id,
                                          "Commande préparée : " + p.name,
                                        ),
                                      "Commande préparée · validation requise, aucun envoi.",
                                    )
                                  }
                                >
                                  <Plus size={17} />
                                  Préparer une commande
                                </button>
                              </div>
                            ))}
                        </>
                      ) : (
                        <>
                          <h3>Journal du dossier</h3>
                          <div className="timeline">
                            {db.audit.filter((a) => a.vehicle === car.id)
                              .length ? (
                              db.audit
                                .filter((a) => a.vehicle === car.id)
                                .map((a) => (
                                  <div key={a.id}>
                                    <i />
                                    <strong>{a.action}</strong>
                                    <small>
                                      {new Date(a.at).toLocaleString("fr-FR")}
                                    </small>
                                  </div>
                                ))
                            ) : (
                              <p>Aucune modification enregistrée.</p>
                            )}
                          </div>
                          {db.messages
                            .filter((m) => m.vehicle === car.id)
                            .map((m) => (
                              <div className="message" key={m.id}>
                                <span>
                                  WHATSAPP · BROUILLON À RELIRE · NON ENVOYÉ
                                </span>
                                <p>{m.text}</p>
                                <button
                                  className="secondary"
                                  onClick={() =>
                                    navigator.clipboard
                                      .writeText(m.text)
                                      .then(() => notify("Brouillon copié."))
                                      .catch(() =>
                                        notify(
                                          "Copie indisponible : sélectionnez le texte.",
                                        ),
                                      )
                                  }
                                >
                                  Copier le message
                                </button>
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  </>
                ) : selection?.kind === "bay" ? (
                  <>
                    <div className="panel-top">
                      <span>POSTE DE TRAVAIL</span>
                      <button
                        className="icon-button"
                        onClick={() => setSelection(null)}
                        aria-label="Fermer"
                      >
                        <X />
                      </button>
                    </div>
                    <div className="panel-body">
                      <Wrench size={40} />
                      <h2>Pont {selection.id.padStart(2, "0")}</h2>
                      <p>
                        {db.vehicles.find((v) => v.bay === Number(selection.id))
                          ?.plate || "Poste disponible"}
                      </p>
                      <button
                        className="primary full"
                        onClick={() =>
                          scene.current?.lift(Number(selection.id))
                        }
                      >
                        Lever / abaisser le pont
                      </button>
                      <p className="warning-small">
                        Animation de démonstration, sans commande d’équipement
                        réel.
                      </p>
                      {db.vehicles
                        .filter((v) => v.bay === Number(selection.id))
                        .map((v) => (
                          <button
                            className="secondary full"
                            key={v.id}
                            onClick={() =>
                              select({ kind: "vehicle", id: v.id })
                            }
                          >
                            Ouvrir le dossier
                            <ArrowRight />
                          </button>
                        ))}
                    </div>
                  </>
                ) : selection?.kind === "technician" ? (
                  <>
                    <div className="panel-top">
                      <span>TECHNICIEN</span>
                      <button
                        aria-label="Fermer"
                        className="icon-button"
                        onClick={() => setSelection(null)}
                      >
                        <X />
                      </button>
                    </div>
                    <div className="panel-body">
                      <div className="large-avatar">
                        {selection.id
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <h2>{selection.id}</h2>
                      <p>Interventions affectées</p>
                      {db.vehicles
                        .filter(
                          (v) =>
                            v.technician === selection.id &&
                            v.status !== "Livré",
                        )
                        .map((v) => (
                          <button
                            className="vehicle-row"
                            key={v.id}
                            onClick={() =>
                              select({ kind: "vehicle", id: v.id })
                            }
                          >
                            <Car />
                            <span>
                              <strong>
                                {v.make} {v.model}
                              </strong>
                              <small>{v.plate}</small>
                            </span>
                            <Badge status={v.status} />
                          </button>
                        ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="panel-top">
                      <strong>L’atelier aujourd’hui</strong>
                      <span className="small-chip">
                        {active.length} véhicules
                      </span>
                    </div>
                    <div className="activity-intro">
                      <span className="eyebrow">TOUT EST À PORTÉE DE MAIN</span>
                      <h2>
                        Chaque voiture
                        <br />a son histoire.
                      </h2>
                      <p>
                        Ouvrez un dossier depuis l’atelier ou retrouvez un
                        véhicule ci-dessous.
                      </p>
                    </div>
                    <div className="search">
                      <MagnifyingGlass size={18} />
                      <input
                        aria-label="Rechercher un véhicule"
                        placeholder="Plaque, client, véhicule…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <div className="vehicle-list">
                      {visible.filter(isPresent).map((v) => (
                        <button
                          className="vehicle-preview"
                          key={v.id}
                          onClick={() => select({ kind: "vehicle", id: v.id })}
                        >
                          <span
                            className="preview-color"
                            style={{ background: v.color }}
                          >
                            <Car size={23} />
                          </span>
                          <div>
                            <strong>
                              {v.make} {v.model}
                            </strong>
                            <small>
                              {v.plate}{" "}
                              <span>
                                ·{" "}
                                {v.bay
                                  ? "Poste " + v.bay
                                  : v.status === "Prêt à livrer"
                                    ? "Livraison"
                                    : "Parking"}
                              </span>
                            </small>
                            <Badge status={v.status} />
                          </div>
                          <ArrowUpRight size={17} />
                        </button>
                      ))}
                      {!visible.length && (
                        <p className="empty">Aucun dossier trouvé.</p>
                      )}
                    </div>
                    <div className="panel-bottom">
                      <Clock size={18} />
                      <span>
                        Les modifications sont enregistrées en base
                        <br />
                        sur le serveur AutoHub de ce Mac.
                      </span>
                    </div>
                  </>
                )}
              </aside>
            </div>
          ) : view === "atelier" ? (
            <Workshop
              db={db}
              selected={selection?.kind === "vehicle" ? selection.id : null}
              onSelect={(id) =>
                setSelection(id ? { kind: "vehicle", id } : null)
              }
              commit={commit}
              onAction={(type, payload) =>
                transact(
                  type,
                  selection?.id,
                  payload,
                  "Action atelier enregistrée en base.",
                )
              }
              onOpen3D={(id) => {
                setSelection({ kind: "vehicle", id });
                setTab("dossier");
                setView("garage");
              }}
            />
          ) : view === "bibliotheque" ? (
            <AssetLibrary db={db} commit={commit} />
          ) : view === "devis" ? (
            <Quotes db={db} commit={commit} />
          ) : view === "dossiers" ? (
            <section className="content-card">
              <div className="section-head">
                <h2>
                  Clients & véhicules <span>{db.vehicles.length}</span>
                </h2>
                <div className="search">
                  <MagnifyingGlass />
                  <input
                    placeholder="Plaque, nom, modèle ou téléphone…"
                    aria-label="Recherche globale"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Véhicule</th>
                      <th>Client</th>
                      <th>Statut</th>
                      <th>Technicien</th>
                      <th>Poste</th>
                      <th>Fin prévue</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <strong>
                            {v.make} {v.model}
                          </strong>
                          <small>
                            {v.plate} · {v.km.toLocaleString("fr-FR")} km
                          </small>
                        </td>
                        <td>
                          {v.client}
                          <small>{v.phone}</small>
                        </td>
                        <td>
                          <Badge status={v.status} />
                        </td>
                        <td>{v.technician}</td>
                        <td>{v.bay ? String(v.bay).padStart(2, "0") : "—"}</td>
                        <td>
                          <DeliveryDeadline db={db} vehicle={v} />
                        </td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() => {
                              setView("garage");
                              select({ kind: "vehicle", id: v.id });
                            }}
                          >
                            Dossier
                            <ArrowUpRight />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!visible.length && <p className="empty">Aucun résultat.</p>}
            </section>
          ) : view === "planning" ? (
            <Planning db={db} commit={commit} onOpen={openDossier} />
          ) : view === "stocks" ? (
            <Stocks db={db} commit={commit} />
          ) : view === "intelligence" ? (
            <Intelligence
              initialVehicle={selection?.id}
              db={db}
              onOpen={openDossier}
              commit={commit}
              onAction={(id, type, payload) =>
                transact(type, id, payload, "Diagnostic enregistré.")
              }
            />
          ) : view === "equipe" ? (
            <Team db={db} onOpen={openDossier} />
          ) : view === "pilotage" ? (
            <Pilotage
              db={db}
              onAction={(id, type, payload) =>
                transact(type, id, payload, "Décision enregistrée.")
              }
              commit={commit}
              onOpen={openDossier}
              onFilter={filterDossiers}
              onView={setView}
            />
          ) : (
            <section className="content-card settings">
              <h2>Votre concession</h2>
              <p>
                Maquette inspirée de Porto : showroom en façade, atelier au
                fond, ponts à droite et parc à gauche. Adaptez les enseignes et
                la salle d’attente à votre garage.
              </p>
              {(["leftBrand", "rightBrand"] as const).map((field, i) => (
                <label key={field}>
                  {i === 0 ? "Showroom gauche" : "Showroom droit"}
                  <input
                    key={layoutFor(db.dealership)[field]}
                    maxLength={40}
                    defaultValue={layoutFor(db.dealership)[field]}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value && value !== layoutFor(db.dealership)[field])
                        commit(
                          (d) => ({
                            ...d,
                            dealership: {
                              ...layoutFor(d.dealership),
                              [field]: value,
                            },
                          }),
                          "Enseigne enregistrée.",
                        );
                    }}
                  />
                </label>
              ))}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={layoutFor(db.dealership).waitingRoom}
                  onChange={(e) => {
                    const waitingRoom = e.target.checked;
                    commit(
                      (d) => ({
                        ...d,
                        dealership: { ...layoutFor(d.dealership), waitingRoom },
                      }),
                      "Plan de la concession enregistré.",
                    );
                  }}
                />
                Salle d’attente dans la maquette
              </label>
              <label>
                Profondeur de l’atelier
                <select
                  value={db.dealership?.workshopSpacing || 5}
                  onChange={(e) => {
                    const workshopSpacing = Number(e.target.value);
                    commit(
                      (d) => ({
                        ...d,
                        dealership: {
                          ...layoutFor(d.dealership),
                          workshopSpacing,
                        },
                      }),
                      "Dimensions de la maquette enregistrées.",
                    );
                  }}
                >
                  <option value={5}>Standard · ponts espacés de 5 m</option>
                  <option value={6}>
                    Grand atelier · ponts espacés de 6 m
                  </option>
                  <option value={7}>
                    Très grand atelier · ponts espacés de 7 m
                  </option>
                </select>
              </label>
              <h2>Préférences de navigation</h2>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={reduced}
                  onChange={(e) => setReduced(e.target.checked)}
                />
                Réduire les mouvements automatiques de caméra
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={low}
                  onChange={(e) => setLow(e.target.checked)}
                />
                Qualité légère : ombres désactivées et résolution réduite
              </label>
              <label>Vitesse de déplacement : {speed.toFixed(1)} m/s</label>
              <input
                type="range"
                min="1.5"
                max="6"
                step=".1"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
              <h2>Vos données locales</h2>
              <p>
                Les dossiers et la configuration sont enregistrés sur le serveur
                AutoHub de ce Mac. Exportez régulièrement une sauvegarde.
              </p>
              <button className="secondary" onClick={exportDB}>
                <Export size={18} />
                Exporter tous les dossiers
              </button>
              {localStorage.getItem("autohub-local-v1") && (
                <button
                  className="secondary"
                  onClick={() => {
                    const raw = localStorage.getItem("autohub-local-v1");
                    if (raw) {
                      const url = URL.createObjectURL(
                        new Blob([raw], { type: "application/json" }),
                      );
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "autohub-ancienne-version-0.2.json";
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  Exporter la sauvegarde 0.2 conservée dans ce navigateur
                </button>
              )}
              <label className="import-label">
                Restaurer une sauvegarde JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const incoming = loadDB(await file.text());
                      if (
                        window.confirm(
                          "Remplacer les dossiers locaux par cette sauvegarde ?",
                        )
                      ) {
                        setCanSave(true);
                        await transact(
                          "import",
                          undefined,
                          { db: incoming },
                          "Sauvegarde restaurée sur le serveur.",
                        );
                        setSelection(null);
                        notify("Sauvegarde restaurée.");
                      }
                    } catch {
                      notify("Fichier invalide ou incompatible.");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                className="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Réinitialiser tous les dossiers locaux avec les données fictives ?",
                    )
                  ) {
                    setCanSave(true);
                    transact(
                      "reset",
                      undefined,
                      {},
                      "Démonstration V2 réinitialisée.",
                    );
                    setSelection(null);
                    notify("Démonstration réinitialisée.");
                  }
                }}
              >
                <ArrowCounterClockwise size={17} />
                Réinitialiser la démonstration
              </button>
              <h2>Fonctions à connecter</h2>
              <p>
                Identification VIN, modèles GLB sous licence, diagnostic IA,
                fournisseurs, messagerie, facturation réglementaire et
                authentification multi-garages : ces intégrations ne sont pas
                activées dans cette version.
              </p>
            </section>
          )}
          <footer className="app-footer">
            <span>
              AutoHub 3D <span>·</span> Version V2 · synchronisée
            </span>
            <span>
              <ShieldCheck size={14} />
              Données fictives · base SQLite sur ce Mac
            </span>
          </footer>
        </main>
      </div>
      {creation && (
        <Reception
          db={db}
          onExisting={(id) => {
            setCreation(false);
            setView("garage");
            select({ kind: "vehicle", id });
          }}
          onClose={() => setCreation(false)}
          onCreate={async (v) => {
            const duplicate = duplicateVehicle(db, v);
            if (duplicate) {
              notify(
                "Ce véhicule existe déjà : " +
                  duplicate.plate +
                  ". Ouvrez son dossier, sans fusion automatique.",
              );
              return;
            }
            if (v.vin && !validVIN(v.vin)) {
              notify("Vérifiez le VIN : 17 caractères sans I, O ou Q.");
              return;
            }
            const parked = db.vehicles.filter(
              (c) =>
                c.bay === null &&
                c.present !== false &&
                !["Prêt à livrer", "Livré"].includes(c.status),
            );
            if (parked.length >= 8) {
              notify(
                "Le parking de démonstration est complet (8 places). Affectez un véhicule à un poste ou livrez-le.",
              );
              return;
            }
            const saved = await commit(
              (d) =>
                record(
                  { ...d, vehicles: [...d.vehicles, v] },
                  v.id,
                  "Réception créée",
                ),
              "Véhicule réceptionné, dossier sauvegardé.",
            );
            if (!saved) return;
            setCreation(false);
            setView("garage");
            select({ kind: "vehicle", id: v.id });
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={20} />
          {toast}
          <button
            aria-label="Fermer la notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function Reception({
  onClose,
  onCreate,
  db,
  onExisting,
}: {
  onClose: () => void;
  onCreate: (v: Vehicle) => void;
  db: DB;
  onExisting: (id: string) => void;
}) {
  const [scanOpen, setScanOpen] = useState(false);
  const [scanEvidence, setScanEvidence] = useState<FieldEvidence[]>([]);
  const [identification, setIdentification] = useState<ReturnType<
    typeof identifyLocal
  > | null>(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = Array.from(
          form.current?.querySelectorAll<HTMLElement>(
            "input,select,textarea,button",
          ) || [],
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        ref={form}
        className={"modal " + (scanOpen ? "scan-open" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reception-title"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const get = (k: string) => String(data.get(k) || "").trim();
          onCreate({
            id: crypto.randomUUID(),
            client: get("client"),
            phone: get("phone"),
            email: get("email"),
            make: get("make"),
            model: get("model"),
            plate: get("plate").toUpperCase(),
            country: get("country"),
            vin: get("vin").toUpperCase(),
            registrationEvidence: scanEvidence,
            year: Number(get("year")),
            km: Number(get("km")),
            shape: get("shape") as Vehicle["shape"],
            color: "#607d8a",
            symptoms: get("symptoms"),
            codes: get("codes"),
            status: "Réception",
            technician: "Non affecté",
            bay: null,
            due: get("due"),
            quality: false,
            present: true,
            arrivedAt: new Date().toISOString(),
            estimatedMinutes: 60,
            notes: "",
            parts: [],
          });
        }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">ACCUEIL · NOUVEAU DOSSIER</span>
            <h2 id="reception-title">Réceptionner un véhicule</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            className="icon-button"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>
        <p>
          Créez le dossier client et l’intervention. Le véhicule apparaîtra au
          parking, puis pourra être affecté à un poste.
        </p>
        <div className="reception-tools">
          <button
            type="button"
            className="secondary"
            onClick={() => setScanOpen(!scanOpen)}
          >
            <Scan size={19} />
            Scanner une carte grise
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              const data = new FormData(form.current!);
              setIdentification(
                identifyLocal(db, {
                  plate: String(data.get("plate") || ""),
                  vin: String(data.get("vin") || ""),
                  country: String(data.get("country") || "FR"),
                }),
              );
            }}
          >
            Retrouver dans les dossiers
          </button>
        </div>
        {identification && (
          <div className="identification-result">
            <strong>{identification.source}</strong>
            <p>{identification.message}</p>
            {identification.matches.map((v) => (
              <button
                type="button"
                key={v.id}
                className="secondary"
                onClick={() => onExisting(v.id)}
              >
                Ouvrir {v.make} {v.model} · {v.plate}
              </button>
            ))}
          </div>
        )}
        {scanOpen && (
          <ScanPanel
            onClose={() => setScanOpen(false)}
            onApply={(fields) => {
              const mapping: Record<string, string> = {
                A: "plate",
                "D.1": "make",
                "D.3": "model",
                E: "vin",
              };
              for (const field of fields) {
                const name = mapping[field.code];
                if (name) {
                  const input = form.current?.elements.namedItem(
                    name,
                  ) as HTMLInputElement | null;
                  if (input) input.value = field.value;
                }
              }
              const yearField = fields.find((f) => f.code === "B");
              if (yearField) {
                const year = yearField.value.match(/(?:19|20)\d{2}/)?.[0];
                if (year)
                  (
                    form.current!.elements.namedItem("year") as HTMLInputElement
                  ).value = year;
              }
              (
                form.current!.elements.namedItem("country") as HTMLSelectElement
              ).value = "FR";
              setScanEvidence(fields);
              setScanOpen(false);
            }}
          />
        )}
        <div className="form-grid">
          <label>
            Pays d’immatriculation
            <select name="country">
              <option value="FR">France</option>
              <option value="PT">Portugal</option>
              <option value="ES">Espagne</option>
            </select>
          </label>
          <label>
            VIN facultatif
            <input
              name="vin"
              maxLength={17}
              placeholder="17 caractères · aucun lookup externe"
            />
          </label>
          <label>
            Nom du client
            <input
              autoFocus
              name="client"
              required
              placeholder="Prénom et nom"
              maxLength={120}
            />
          </label>
          <label>
            Téléphone
            <input
              name="phone"
              required
              type="tel"
              placeholder="06…"
              maxLength={30}
            />
          </label>
          <label>
            E-mail
            <input name="email" type="email" placeholder="Facultatif" />
          </label>
          <label>
            Immatriculation
            <input
              name="plate"
              required
              maxLength={20}
              placeholder="AB-123-CD"
            />
          </label>
          <label>
            Marque
            <input
              name="make"
              required
              maxLength={60}
              placeholder="BMW, Renault…"
            />
          </label>
          <label>
            Modèle
            <input
              name="model"
              required
              maxLength={80}
              placeholder="Série 3, Clio…"
            />
          </label>
          <label>
            Année
            <input
              name="year"
              type="number"
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              defaultValue="2020"
            />
          </label>
          <label>
            Kilométrage
            <input
              name="km"
              type="number"
              required
              min="0"
              max="2000000"
              defaultValue="80000"
            />
          </label>
          <label>
            Carrosserie
            <select name="shape">
              <option value="sedan">Berline</option>
              <option value="hatch">Compacte</option>
              <option value="suv">SUV</option>
            </select>
          </label>
          <label>
            Fin prévue
            <input name="due" type="time" required defaultValue="17:00" />
          </label>
        </div>
        <label>
          Motif de visite et symptômes
          <textarea
            name="symptoms"
            required
            maxLength={3000}
            placeholder="Décrivez la demande du client…"
          />
        </label>
        <label>
          Codes défauts
          <input
            name="codes"
            placeholder="Facultatif · P0299, P0562…"
            maxLength={500}
          />
        </label>
        <div className="modal-bottom">
          <span>
            <FloppyDisk size={16} />
            Sauvegarde locale
          </span>
          <button className="primary" type="submit">
            <Plus size={18} />
            Créer la réception
          </button>
        </div>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
