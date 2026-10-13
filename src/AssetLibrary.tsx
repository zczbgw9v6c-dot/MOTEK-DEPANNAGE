import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  MagnifyingGlass,
  ShieldCheck,
  Cube,
  DownloadSimple,
  ArrowRight,
  WarningCircle,
} from "@phosphor-icons/react";
import { loadVehicleAsset, disposeObject, type Asset } from "./assets";
import { record, updateVehicle, type DB } from "./domain";
export function ModelPreview({ id }: { id: string }) {
  const host = useRef<HTMLDivElement>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!host.current) return;
    const node = host.current;
    let disposed = false;
    let frame = 0;
    let group: THREE.Group | null = null;
    setError("");
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      setError("Aperçu 3D indisponible.");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setSize(node.clientWidth, node.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    node.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e5ece7");
    const camera = new THREE.PerspectiveCamera(
      42,
      node.clientWidth / node.clientHeight,
      0.1,
      100,
    );
    camera.position.set(6, 3.8, 6);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.7, 0);
    controls.enableDamping = true;
    controls.maxDistance = 20;
    controls.minDistance = 3;
    scene.add(new THREE.HemisphereLight("#ffffff", "#718578", 3));
    const light = new THREE.DirectionalLight("#ffffff", 3);
    light.position.set(-4, 6, 5);
    scene.add(light);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: "#d5dfd6", roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.03;
    scene.add(floor);
    loadVehicleAsset(id)
      .then((g) => {
        if (disposed) {
          disposeObject(g);
          return;
        }
        group = g;
        scene.add(g);
      })
      .catch(() => setError("Chargement du GLB impossible."));
    const ro = new ResizeObserver(() => {
      camera.aspect = node.clientWidth / Math.max(node.clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(node.clientWidth, node.clientHeight);
    });
    ro.observe(node);
    const render = () => {
      if (disposed) return;
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      if (group) disposeObject(group);
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [id]);
  return (
    <div className="model-preview" ref={host}>
      {error && <span>{error}</span>}
    </div>
  );
}
export function AssetLibrary({
  db,
  commit,
}: {
  db: DB;
  commit: (fn: (db: DB) => DB, message?: string) => void;
}) {
  const [assets, setAssets] = useState<Asset[]>([]),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [selected, setSelected] = useState("kenney-sedan"),
    [vehicle, setVehicle] = useState(db.vehicles[0]?.id || "");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/models/manifest.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((m) => setAssets(m.entries))
      .catch((e) => {
        if (e.name !== "AbortError")
          setError("Le manifeste local est indisponible.");
      });
    return () => controller.abort();
  }, []);
  const available = assets.filter((a) => a.status === "imported"),
    item = assets.find((a) => a.id === selected),
    disabled = db.assetDisabled || [];
  const shown = assets.filter(
    (a) =>
      (a.name + " " + a.make).toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" ||
        (filter === "imported" && a.status === "imported") ||
        (filter === "review" && a.licenseStatus !== "verified")),
  );
  return (
    <section className="asset-library">
      <div className="catalogue-stats">
        <div>
          <strong>{assets.length}</strong>
          <span>Références recensées</span>
        </div>
        <div>
          <strong>{available.length}</strong>
          <span>GLB locaux importés</span>
        </div>
        <div>
          <strong>
            {assets.filter((a) => a.licenseStatus === "verified").length}
          </strong>
          <span>Licences vérifiées</span>
        </div>
        <div>
          <strong>
            0 <small>/ 100</small>
          </strong>
          <span>Véhicules de marque importés</span>
        </div>
      </div>
      <div className="subtle-note">
        <ShieldCheck />
        <span>
          Dix fichiers génériques Kenney CC0, dont des variantes de carrosserie.
          Ils ne constituent pas dix modèles de marques connues. Les dix liens
          Sketchfab fournis restent non téléchargés et leurs licences non
          vérifiées.
        </span>
      </div>
      {error && <div className="notice">{error}</div>}
      <div className="library-layout">
        <section className="content-card">
          <div className="section-head">
            <div className="search">
              <MagnifyingGlass size={18} />
              <input
                aria-label="Rechercher un modèle 3D"
                placeholder="Nom, marque…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Filtrer les actifs"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous les actifs</option>
              <option value="imported">GLB importés</option>
              <option value="review">Licences à vérifier</option>
            </select>
          </div>
          <div className="asset-grid">
            {shown.map((a) => (
              <button
                className={
                  "asset-tile " + (selected === a.id ? "selected" : "")
                }
                key={a.id}
                onClick={() => setSelected(a.id)}
              >
                {a.preview ? (
                  <img src={a.preview} alt={a.name} />
                ) : (
                  <span className="asset-placeholder">
                    <Cube size={40} />
                  </span>
                )}
                <strong>{a.name}</strong>
                <span>{a.make}</span>
                <small
                  className={
                    a.status === "imported" ? "text-green" : "text-amber"
                  }
                >
                  {a.status === "imported"
                    ? disabled.includes(a.id)
                      ? "Désactivé"
                      : "GLB local · CC0"
                    : "Source à vérifier"}
                </small>
              </button>
            ))}
          </div>
        </section>
        <aside className="content-card asset-detail">
          {item && (
            <>
              {item.status === "imported" ? (
                <ModelPreview id={item.id} />
              ) : (
                <div className="asset-blocked">
                  <WarningCircle size={38} />
                  <p>Aucun fichier local. L’actif n’est pas publié.</p>
                </div>
              )}
              <span className="eyebrow">
                {item.generic ? "ILLUSTRATION GÉNÉRIQUE" : "MODÈLE À VÉRIFIER"}
              </span>
              <h2>{item.name}</h2>
              <dl>
                <dt>Créateur</dt>
                <dd>{item.creator || "Non vérifié"}</dd>
                <dt>Licence</dt>
                <dd>
                  {item.license}
                  {item.licenseStatus !== "verified"
                    ? " · annoncée, non vérifiée"
                    : ""}
                </dd>
                <dt>Vérification</dt>
                <dd>{item.verifiedAt || "À effectuer"}</dd>
                <dt>Triangles</dt>
                <dd>
                  {item.triangles.toLocaleString("fr-FR")}
                  {item.status !== "imported" ? " environ" : ""}
                </dd>
                <dt>Taille locale</dt>
                <dd>
                  {item.bytes
                    ? Math.round(item.bytes / 1024) + " Ko"
                    : "Aucun fichier"}
                </dd>
                <dt>NoAI</dt>
                <dd>
                  {item.noAI
                    ? "Restriction annoncée à conserver"
                    : "Non signalé"}
                </dd>
              </dl>
              <a
                className="text-button"
                href={item.source}
                target="_blank"
                rel="noreferrer"
              >
                Fiche source
                <ArrowRight />
              </a>
              {item.licenseProof && (
                <a
                  className="text-button"
                  href={item.licenseProof}
                  target="_blank"
                  rel="noreferrer"
                >
                  Licence conservée
                </a>
              )}
              {item.sha256 && (
                <p className="asset-hash">SHA-256 : {item.sha256}</p>
              )}
              {item.status === "imported" && (
                <>
                  <a className="secondary full" href={item.url!} download>
                    <DownloadSimple size={18} />
                    Télécharger le GLB
                  </a>
                  <label>
                    Associer à un dossier
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                    >
                      {db.vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.make} {v.model} · {v.plate}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="primary full"
                    disabled={disabled.includes(item.id) || !vehicle}
                    onClick={() =>
                      commit(
                        (d) => updateVehicle(d, vehicle, { assetId: item.id }),
                        "Modèle générique associé au dossier.",
                      )
                    }
                  >
                    Confirmer la représentation 3D
                  </button>
                  <button
                    className="secondary full"
                    onClick={() =>
                      commit(
                        (d) =>
                          record(
                            {
                              ...d,
                              assetDisabled: disabled.includes(item.id)
                                ? disabled.filter((id) => id !== item.id)
                                : [...disabled, item.id],
                            },
                            "catalogue",
                            disabled.includes(item.id)
                              ? "Actif 3D réactivé"
                              : "Actif 3D désactivé",
                          ),
                        "Catalogue mis à jour.",
                      )
                    }
                  >
                    {disabled.includes(item.id)
                      ? "Réactiver cet actif"
                      : "Désactiver cet actif"}
                  </button>
                </>
              )}
              <p className="warning-small">
                La représentation 3D ne confirme jamais une compatibilité de
                pièce.{" "}
                {item.attribution ||
                  "Licence et droits SaaS à vérifier avant utilisation."}
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
