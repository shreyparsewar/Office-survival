"""Original 120 BPM electronic trailer bed and synchronized transition sound design."""
from pathlib import Path
import wave
import sys
import numpy as np

sr = 44100
duration = 20
mix = np.zeros((sr * duration, 2))
rng = np.random.default_rng(1999)
quiet = '--quiet' in sys.argv

def add(signal, at, volume=1, pan=0):
    start = round(at * sr)
    if start < 0:
        signal = signal[-start:]
        start = 0
    n = min(len(signal), len(mix) - start)
    if n <= 0:
        return
    mix[start:start+n, 0] += signal[:n] * volume * (1 - max(0, pan) * .5)
    mix[start:start+n, 1] += signal[:n] * volume * (1 + min(0, pan) * .5)

def tone(midi, length, kind):
    t = np.arange(round(length * sr)) / sr
    hz = 440 * 2 ** ((midi-69)/12)
    phase = t * hz
    if kind == 'bass':
        sound = np.sin(2*np.pi*phase) + .32*np.sin(4*np.pi*phase) + .16*np.sin(6*np.pi*phase)
        env = np.minimum(t/.008, 1) * np.minimum((length-t)/.06, 1) * np.exp(-t*2)
    elif kind == 'chord':
        sound = np.sin(2*np.pi*phase) + .22*np.sin(4*np.pi*phase) + .08*np.sin(8*np.pi*phase)
        env = np.minimum(t/.008, 1) * np.minimum((length-t)/.07, 1) * np.exp(-t*5)
    else:
        sound = np.sin(2*np.pi*phase) + .3*np.sin(4*np.pi*phase)
        env = np.minimum(t/.005, 1) * np.minimum((length-t)/.05, 1) * np.exp(-t*8)
    return sound * np.maximum(env, 0)

def drum(at, kind, vol=1):
    t = np.arange(round(.34*sr))/sr
    if kind == 'kick':
        phase = 48*t + 82*(1-np.exp(-t*34))/34
        sound = np.sin(2*np.pi*phase)*np.exp(-t*15) + rng.normal(0, .16, len(t))*np.exp(-t*180)
        add(sound, at, .42*vol)
    elif kind == 'snare':
        noise = rng.normal(0, 1, len(t))
        noise -= np.convolve(noise, np.ones(8)/8, mode='same')
        sound = noise*np.exp(-t*24)*.37 + np.sin(2*np.pi*185*t)*np.exp(-t*35)*.24
        add(sound, at, (.24 if quiet else .32)*vol)
    else:
        noise = rng.normal(0, 1, len(t))
        noise -= np.convolve(noise, np.ones(4)/4, mode='same')
        add(noise*np.exp(-t*(95 if kind == 'hat' else 30)), at, (.016 if quiet else .032)*vol, (-1 if round(at*8)%2 else 1)*.6)

chords = [(33,[57,60,64]), (29,[53,57,60]), (36,[55,60,64]), (31,[55,59,62])]
for bar in range(10):
    root, notes = chords[bar%4]
    at = bar*2
    for beat in range(4):
        drum(at+beat*.5,'kick',1 if beat%2==0 else .75)
        if beat%2:
            drum(at+beat*.5,'snare')
        for sub in range(4):
            drum(at+beat*.5+sub*.125,'hat',1 if sub%2==0 else .45)
        for sub in (0,.25,.375):
            add(tone(root+(12 if sub==.375 else 0),.20,'bass'),at+beat*.5+sub,.19)
        if beat in (0,2,3):
            for n in notes:
                add(tone(n,.32,'chord'),at+beat*.5+.25,.075, -.3)
                add(tone(n,.32,'chord'),at+beat*.5+.285,.045,.6)
        if bar not in (3,4):
            lead=notes[beat%3]+12
            add(tone(lead,.22,'pluck'),at+beat*.5,.06,.3)
            add(tone(lead,.22,'pluck'),at+beat*.5+.1875,.024,-.5)

for cut in ([] if quiet else [2,4.5,7,9,12,14.5,17]):
    length=.5
    t=np.arange(round(length*sr))/sr
    noise=rng.normal(0,1,len(t))
    filtered=np.convolve(noise,np.ones(18)/18,mode='same')
    env=np.sin(np.pi*t/length)**2
    add(filtered*env,cut-.32,.48,-.3)
    low=np.sin(2*np.pi*(42*t+45*(1-np.exp(-t*22))/22))*np.exp(-t*15)
    add(low,cut,.35)

for i,n in enumerate([69,72,76,81]):
    add(tone(n,.65,'chord'),17+i*.08,.1,.2)

fade=np.ones(len(mix))
fade[:2205]=np.linspace(0,1,2205)
fade[-17640:]=np.linspace(1,0,17640)
mix*=fade[:,None]
mix=np.tanh(mix*1.1)
mix*=.91/max(.91,float(np.max(np.abs(mix))))
out=Path(__file__).parents[1]/('public/audio/office-beat-v3.wav' if quiet else 'public/audio/office-beat-v2.wav')
with wave.open(str(out),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr)
    f.writeframes((mix*32767).astype('<i2').tobytes())
print(f'{out}: 20 seconds, stereo, peak {np.max(np.abs(mix)):.3f}')
