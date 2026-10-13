import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, HF_HUB_DISABLE_IMPLICIT_TOKEN: "1" },
  });
  if (result.status !== 0) process.exit(result.status || 1);
};
mkdirSync(".data", { recursive: true });
run("python3", ["-m", "venv", ".speech-venv"]);
run(".speech-venv/bin/python3", [
  "-m",
  "pip",
  "install",
  "faster-whisper==1.2.1",
]);
run(".speech-venv/bin/python3", [
  "-c",
  "from faster_whisper import WhisperModel; from pathlib import Path; import shutil; m=WhisperModel('base',device='cpu',compute_type='int8',download_root='.data/whisper-cache'); p=next(Path('.data/whisper-cache/models--Systran--faster-whisper-base/snapshots').glob('*/config.json')).parent; shutil.copytree(p,'.data/speech-model',dirs_exist_ok=True)",
]);
console.log(
  "Reconnaissance française installée localement. Aucun service vocal payant.",
);
