"""Check decoded frame cadence and motion in a delivery MP4."""
from pathlib import Path
import json
import subprocess
import sys
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).parents[1]
source = root / (sys.argv[1] if len(sys.argv) > 1 else 'out/office-survival-1999-promo-v2.mp4')
binary = root / 'node_modules/@remotion/compositor-win32-x64-msvc'
probe = json.loads(subprocess.check_output([str(binary/'ffprobe.exe'), '-v', 'error', '-count_frames', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,duration', '-of', 'json', str(source)]))
timestamps = json.loads(subprocess.check_output([str(binary/'ffprobe.exe'), '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=best_effort_timestamp_time', '-of', 'json', str(source)]))
times = np.array([float(f['best_effort_timestamp_time']) for f in timestamps['frames']])
decoded = root/'out/v2-audit-frames'
decoded.mkdir(exist_ok=True)
subprocess.run([str(binary/'ffmpeg.exe'), '-v', 'error', '-i', str(source), '-vf', 'scale=160:90', '-y', str(decoded/'frame-%04d.png')], check=True)
frames = np.stack([np.asarray(Image.open(path).convert('RGB')) for path in sorted(decoded.glob('frame-*.png'))])
differences = np.abs(np.diff(frames.astype(np.int16), axis=0)).mean(axis=(1,2,3))
duplicates = np.flatnonzero(differences == 0).tolist()
near_still = differences < .025
longest = current = 0
for still in near_still:
    current = current + 1 if still else 0
    longest = max(longest, current)
result = {'streams': probe['streams'], 'decoded_frames': len(frames), 'consecutive_duplicate_frames': duplicates, 'longest_near_static_run_seconds': longest/60, 'frame_interval_min': float(np.diff(times).min()), 'frame_interval_max': float(np.diff(times).max()), 'mean_frame_difference': float(differences.mean()), 'file_bytes': source.stat().st_size}
(root/'out/v2-audit.json').write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))

# Contact sheets use frames decoded from the finished MP4, not a separate preview render.
sets = {
    'motion': [2.4,2.6,2.8,3.0,9.5,9.7,9.9,10.1,18.0,18.2,18.4,18.6],
    'transitions': [cut+offset for cut in [2,4.5,7,9,12,14.5,17] for offset in [-.15,-.04,.05,.18]],
}
for name, samples in sets.items():
    sheet=Image.new('RGB',(1280,202*((len(samples)+3)//4)), '#09212a')
    draw=ImageDraw.Draw(sheet)
    for i, at in enumerate(samples):
        frame = np.clip(round(at*60), 0, len(frames)-1)
        thumb=Image.fromarray(frames[frame]).resize((320,180))
        x=(i%4)*320;y=(i//4)*202
        sheet.paste(thumb,(x,y+22))
        draw.text((x+8,y+5),f'{at:.2f}s / frame {frame}',fill='#d7ff43')
    sheet.save(root/f'out/v2-{name}-review.jpg')
