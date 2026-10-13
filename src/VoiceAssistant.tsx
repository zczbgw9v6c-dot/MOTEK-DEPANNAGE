import { useEffect, useRef, useState } from "react";
import {
  Microphone,
  Stop,
  CheckCircle,
  SpeakerHigh,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { proposeVoice, type VoiceProposal } from "./voice-domain";
import type { DB } from "./domain";
export function VoiceAssistant({
  db,
  vehicle,
  mode,
  onAction,
  onClose,
}: {
  db: DB;
  vehicle: string;
  mode: string;
  onAction: (type: string, payload: any) => Promise<boolean>;
  onClose: () => void;
}) {
  const [text, setText] = useState(""),
    [proposal, setProposal] = useState<VoiceProposal | null>(null),
    [recording, setRecording] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    stopper = useRef<ReturnType<typeof setTimeout> | null>(null),
    mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
      if (stopper.current) clearTimeout(stopper.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      speechSynthesis?.cancel();
    },
    [],
  );
  async function record() {
    setError("");
    if (recording) {
      if (recorder.current?.state === "recording") recorder.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(
        "Microphone indisponible dans ce navigateur. Utilisez le texte ci-dessous.",
      );
      return;
    }
    try {
      const response = await fetch("/api/speech/capabilities");
      const capabilities = await response.json();
      if (!capabilities.available) {
        setError(
          "Reconnaissance locale non installée. Lancez npm run speech:setup dans AutoHub, ou utilisez le texte. Aucun service externe ne sera utilisé.",
        );
        return;
      }
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(stream.current);
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      r.onstop = async () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        if (stopper.current) clearTimeout(stopper.current);
        if (!mounted.current) return;
        setRecording(false);
        setBusy(true);
        try {
          const result = await fetch("/api/speech/transcribe", {
            method: "POST",
            headers: { "Content-Type": r.mimeType || "audio/webm" },
            body: new Blob(chunks, { type: r.mimeType }),
          });
          const value = await result.json();
          if (!result.ok) throw Error(value.error);
          if (!mounted.current) return;
          setText(value.text);
          setProposal(proposeVoice(db, vehicle, value.text, mode));
        } catch (e) {
          if (mounted.current) setError((e as Error).message);
        } finally {
          if (mounted.current) setBusy(false);
        }
      };
      r.start();
      setRecording(true);
      stopper.current = setTimeout(() => {
        if (r.state === "recording") r.stop();
      }, 30000);
    } catch (e) {
      stream.current?.getTracks().forEach((t) => t.stop());
      setError("Microphone non accessible : " + (e as Error).message);
    }
  }
  function analyze() {
    try {
      setError("");
      setProposal(proposeVoice(db, vehicle, text, mode));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="voice-assistant content-card">
      <div className="section-head">
        <div>
          <span className="eyebrow">
            ASSISTANT VOCAL · {db.vehicles.find((v) => v.id === vehicle)?.plate}
          </span>
          <h2>
            {mode === "issue"
              ? "Que se passe-t-il ?"
              : mode === "piece"
                ? "Quelle pièce vous manque ?"
                : "Je vous écoute."}
          </h2>
        </div>
        <button
          className="secondary"
          disabled={recording || busy}
          onClick={onClose}
        >
          <X />
          Fermer
        </button>
      </div>
      <button
        className={"microphone-button " + (recording ? "recording" : "")}
        disabled={busy}
        onClick={record}
      >
        {recording ? <Stop size={35} /> : <Microphone size={35} />}
        <strong>
          {recording
            ? "Arrêter et transcrire"
            : busy
              ? "Transcription locale…"
              : "Parler à AutoHub"}
        </strong>
        <span>30 secondes maximum · audio traité sur ce Mac puis supprimé</span>
      </button>
      <label>
        Commande ou compte rendu
        <textarea
          aria-label="Commande vocale transcrite"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setProposal(null);
          }}
          maxLength={2000}
          placeholder={
            mode === "issue"
              ? "La vis de fixation est cassée, je ne peux pas remonter l’étrier."
              : mode === "piece"
                ? "Il me faut deux disques avant pour la Golf."
                : "Mets l’intervention en pause et préviens le responsable."
          }
        />
      </label>
      <button
        className="secondary"
        disabled={!text.trim() || recording || busy}
        onClick={analyze}
      >
        Comprendre et proposer
      </button>
      {error && (
        <div className="notice" role="alert">
          <WarningCircle />
          {error}
        </div>
      )}
      {proposal && (
        <div className="voice-proposal">
          <h3>À confirmer sur ce dossier</h3>
          <p>{proposal.reply}</p>
          {proposal.actions.map((a, i) => (
            <div className="proposed-action" key={i}>
              <CheckCircle size={19} />
              {a.label}
            </div>
          ))}
          {proposal.warnings.map((w) => (
            <p className="warning-small" key={w}>
              {w}
            </p>
          ))}
          <div className="voice-confirm">
            <button
              className="secondary"
              onClick={() => {
                if ("speechSynthesis" in window) {
                  speechSynthesis.cancel();
                  const utterance = new SpeechSynthesisUtterance(
                    proposal.reply,
                  );
                  const localVoice = speechSynthesis
                    .getVoices()
                    .find((v) => v.localService && v.lang.startsWith("fr"));
                  if (!localVoice) {
                    setError(
                      "Aucune voix française locale disponible : lisez le résumé à l’écran.",
                    );
                    return;
                  }
                  utterance.voice = localVoice;
                  utterance.lang = "fr-FR";
                  speechSynthesis.speak(utterance);
                }
              }}
            >
              <SpeakerHigh size={20} />
              Lire le résumé
            </button>
            <button
              className="primary"
              disabled={proposal.conflict || !proposal.actions.length || busy}
              onClick={async () => {
                setBusy(true);
                const done = await onAction("voice", {
                  text: proposal.text,
                  mode,
                  confirmed: true,
                });
                setBusy(false);
                if (done) {
                  setProposal(null);
                  setText("");
                  onClose();
                }
              }}
            >
              <CheckCircle size={23} />
              Confirmer ces actions
            </button>
          </div>
          <p className="warning-small">
            Aucune commande fournisseur payante. Les références fictives et la
            compatibilité seront vérifiées par le responsable.
          </p>
        </div>
      )}
    </section>
  );
}
