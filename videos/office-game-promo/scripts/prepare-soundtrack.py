"""Prepare the licensed funk recording and replace audio without re-encoding the approved video."""
from pathlib import Path
import json
import re
import subprocess
import wave
import numpy as np

root = Path(__file__).parents[1]
ffmpeg = root/'node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
ffprobe = root/'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'
audio = root/'public/audio'
source = audio/'funk-game-loop-kevin-macleod.mp3'
edit = root/'out/funk-edit.wav'
prepared = audio/'office-funk-v4.wav'
output = root/'out/office-survival-1999-promo-v4.mp4'

# The source file identifies its tempo as 104 BPM. Pitch-preserving time stretch
# aligns the recording with the existing 120 BPM edit; picture timing stays intact.
subprocess.run([str(ffmpeg), '-v', 'error', '-i', str(source), '-af', 'atempo=1.153846153846', '-t', '20', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', '-y', str(edit)], check=True)
with wave.open(str(edit), 'rb') as f:
    sample_rate=f.getframerate()
    samples=np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(np.float64).reshape(-1,2)/32768
samples=samples[:20*sample_rate]
envelope=np.ones(len(samples))
attack=round(.04*sample_rate)
release=round(.85*sample_rate)
envelope[:attack]=np.linspace(0,1,attack)
envelope[-release:]=np.cos(np.linspace(0,np.pi/2,release))**2
samples*=envelope[:,None]
with wave.open(str(edit),'wb') as f:
    f.setnchannels(2); f.setsampwidth(2); f.setframerate(sample_rate)
    f.writeframes((np.clip(samples,-1,1)*32767).astype('<i2').tobytes())

measurement=subprocess.run([str(ffmpeg), '-hide_banner', '-i', str(edit), '-af', 'loudnorm=I=-18:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, check=True)
stats=json.loads(re.search(r'\{\s*"input_i".*?\}',measurement.stderr,re.S).group())
normalizer=(f'loudnorm=I=-18:TP=-1.5:LRA=9:measured_I={stats["input_i"]}:measured_TP={stats["input_tp"]}:measured_LRA={stats["input_lra"]}:measured_thresh={stats["input_thresh"]}:offset={stats["target_offset"]}:linear=true:print_format=json')
subprocess.run([str(ffmpeg), '-v', 'error', '-i', str(edit), '-af', normalizer, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', '-y', str(prepared)], check=True)
credit='Music: Funk Game Loop by Kevin MacLeod (incompetech.com), CC BY 3.0 https://creativecommons.org/licenses/by/3.0/; edited, tempo adjusted and mixed.'
subprocess.run([str(ffmpeg), '-v', 'error', '-i', str(root/'out/office-survival-1999-promo-v3.mp4'), '-i', str(prepared), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', '20', '-movflags', '+faststart', '-metadata', 'comment='+credit, '-metadata', 'copyright='+credit, '-y', str(output)], check=True)

def packets(path):
    return json.loads(subprocess.check_output([str(ffprobe), '-v', 'error', '-select_streams', 'v:0', '-show_packets', '-show_data_hash', 'sha256', '-show_entries', 'packet=pts_time,dts_time,duration_time,data_hash', '-of', 'json', str(path)]))['packets']
before=packets(root/'out/office-survival-1999-promo-v3.mp4')
after=packets(output)
assert before==after, 'Video packets or timestamps changed during the audio swap.'
report={'output':str(output),'unchanged_video_packets':len(after),'video_packets_and_timestamps_identical':True,'music_source':'Funk Game Loop — Kevin MacLeod','tempo_bpm':120,'loudness_target_lufs':-18,'true_peak_target_dbtp':-1.5}
(root/'out/v4-soundtrack-check.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
