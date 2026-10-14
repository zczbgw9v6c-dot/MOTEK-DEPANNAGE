import { useState } from "react";
import type { DB } from "./domain";
export function MessageComposer({
  db,
  id,
  onAction,
}: {
  db: DB;
  id: string;
  onAction: (type: string, p: any) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const messages = db.messages.filter((m) => m.vehicle === id);
  return (
    <details className="core-section core-disclosure">
      <summary>
        SMS / WhatsApp · préparer un envoi
        {messages.length ? ` (${messages.length})` : ""}
      </summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          try {
            const value = String(f.get("at") || "");
            if (
              await onAction("core.message", {
                kind: f.get("kind"),
                channel: f.get("channel"),
                plannedAt: value ? new Date(value).toISOString() : undefined,
              })
            )
              setNotice(
                "Message enregistré. Envoi à effectuer : aucun fournisseur connecté.",
              );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Message
          <select name="kind">
            <option value="quote">Envoyer le devis</option>
            <option value="pickup">Véhicule prêt à récupérer</option>
            <option value="closing">Rappeler les horaires de fermeture</option>
          </select>
        </label>
        <label>
          Canal
          <select name="channel">
            <option>SMS</option>
            <option>WhatsApp</option>
          </select>
        </label>
        <label>
          Date souhaitée (facultatif)
          <input name="at" type="datetime-local" />
        </label>
        <button disabled={busy}>Préparer le message</button>
        <small>
          Programmation locale uniquement : l’envoi automatique nécessite un
          fournisseur connecté.
        </small>
      </form>
      {notice && <p role="status">{notice}</p>}
      {messages.map((m) => (
        <article className="message" key={m.id}>
          <strong>{m.channel || "Message"} · À envoyer</strong>
          {m.plannedAt && (
            <p>Souhaité le {new Date(m.plannedAt).toLocaleString("fr-FR")}</p>
          )}
          <p>{m.text}</p>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(m.text);
                setNotice("Texte copié.");
              } catch {
                setNotice(
                  "Copie indisponible : sélectionnez le texte du message.",
                );
              }
            }}
          >
            Copier le texte
          </button>
        </article>
      ))}
    </details>
  );
}
