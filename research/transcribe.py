from faster_whisper import WhisperModel
from pathlib import Path
import wave,numpy as np
model=WhisperModel('base',device='cpu',compute_type='int8',download_root='/private/tmp/autohub-whisper-models',cpu_threads=4)
for i,name in enumerate(['WhatsApp Video 2026-10-13 at 02.17.31.mp4','WhatsApp Video 2026-10-13 at 02.17.41.mp4'],1):
 with wave.open(f'/private/tmp/autohub-reel-{i}.wav') as w: audio=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
 segments,info=model.transcribe(audio,language='fr',beam_size=5,vad_filter=True)
 lines=[f'[{s.start:05.1f}–{s.end:05.1f}] {s.text.strip()}' for s in segments]
 Path(f'research/transcription-reel-{i}.txt').write_text('\n'.join(lines),encoding='utf-8')
 print(f'REEL {i}\n'+ '\n'.join(lines),flush=True)
