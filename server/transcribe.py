import sys,subprocess,tempfile,wave,json
import numpy as np
from faster_whisper import WhisperModel
from pathlib import Path
root=Path(__file__).resolve().parent.parent
(root/'.data/audio').mkdir(parents=True,exist_ok=True)
with tempfile.NamedTemporaryFile(suffix='.wav',dir=root/'.data/audio') as output:
 subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-i',sys.argv[1],'-t','30','-ar','16000','-ac','1',output.name],check=True,timeout=30)
 with wave.open(output.name) as w: audio=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
 model=WhisperModel(str(root/'.data/speech-model'),device='cpu',compute_type='int8',cpu_threads=4,local_files_only=True)
 segments,info=model.transcribe(audio,language='fr',beam_size=5,vad_filter=True)
 print(json.dumps({'text':' '.join(s.text.strip() for s in segments),'language':'fr','local':True},ensure_ascii=False))
