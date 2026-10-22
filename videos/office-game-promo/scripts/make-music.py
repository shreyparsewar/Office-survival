"""Make the original 20-second retro instrumental used by the promo."""

from pathlib import Path
import wave

import numpy as np


SAMPLE_RATE = 44_100
DURATION = 20
BEAT = 0.5
audio = np.zeros(SAMPLE_RATE * DURATION, dtype=np.float64)
rng = np.random.default_rng(1999)


def hz(midi: int) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


def add_tone(start: float, length: float, midi: int, level: float, voice: str) -> None:
    first = round(start * SAMPLE_RATE)
    count = min(round(length * SAMPLE_RATE), len(audio) - first)
    if count <= 0:
        return
    t = np.arange(count) / SAMPLE_RATE
    phase = (t * hz(midi)) % 1
    if voice == "bass":
        wave_data = 2 * phase - 1
        envelope = np.minimum(t / 0.012, 1) * np.minimum((length - t) / 0.08, 1)
        envelope *= np.exp(-t * 1.3)
    elif voice == "chord":
        wave_data = 1 - 4 * np.abs(phase - 0.5)
        envelope = np.minimum(t / 0.045, 1) * np.minimum((length - t) / 0.12, 1)
    else:
        wave_data = np.where(phase < 0.5, 1, -1) * 0.7 + (1 - 4 * np.abs(phase - 0.5)) * 0.3
        envelope = np.minimum(t / 0.006, 1) * np.minimum((length - t) / 0.085, 1)
        envelope *= np.exp(-t * 1.4)
    audio[first:first + count] += wave_data * np.maximum(envelope, 0) * level


def add_drum(start: float, kind: str) -> None:
    length = 0.22 if kind == "kick" else 0.12
    first = round(start * SAMPLE_RATE)
    count = min(round(length * SAMPLE_RATE), len(audio) - first)
    t = np.arange(count) / SAMPLE_RATE
    if kind == "kick":
        signal = np.sin(2 * np.pi * (63 * t + 26 * (1 - np.exp(-t * 35)) / 35))
        signal *= np.exp(-t * 23) * 0.28
    elif kind == "snare":
        signal = rng.uniform(-1, 1, count) * np.exp(-t * 33) * 0.12
    else:
        signal = rng.uniform(-1, 1, count) * np.exp(-t * 85) * 0.035
    audio[first:first + count] += signal


# Four-bar harmonic loop: a small optimistic office-computer theme.
chords = [
    (45, (57, 60, 64), (69, 72, 76, 72)),  # Am
    (41, (53, 57, 60), (69, 72, 77, 72)),  # F
    (36, (60, 64, 67), (67, 72, 76, 72)),  # C
    (43, (55, 59, 62), (67, 71, 74, 71)),  # G
]

for bar in range(10):
    start = bar * 2.0
    root, chord, arp = chords[bar % 4]
    for note in chord:
        add_tone(start, 1.88, note, 0.027, "chord")
    for beat in range(4):
        at = start + beat * BEAT
        add_tone(at, 0.36, root if beat < 2 else root + 12, 0.13, "bass")
        add_drum(at, "kick" if beat % 2 == 0 else "snare")
        add_drum(at + 0.25, "hat")
        for subdivision in range(2):
            note = arp[(beat * 2 + subdivision) % 4]
            add_tone(at + subdivision * 0.25, 0.18, note, 0.044, "lead")

# A short terminal accent for the title card, with a gentle tail.
for offset, note in ((0.0, 76), (0.16, 79), (0.32, 81)):
    add_tone(17.1 + offset, 0.42, note, 0.085, "lead")

fade = np.ones_like(audio)
fade[:round(0.08 * SAMPLE_RATE)] = np.linspace(0, 1, round(0.08 * SAMPLE_RATE))
fade[-round(0.48 * SAMPLE_RATE):] = np.linspace(1, 0, round(0.48 * SAMPLE_RATE))
audio *= fade
audio = np.tanh(audio * 1.35) * 0.82
samples = (audio * 32767).astype("<i2")

output = Path(__file__).parents[1] / "public" / "audio" / "office-beat.wav"
output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(output), "wb") as target:
    target.setnchannels(1)
    target.setsampwidth(2)
    target.setframerate(SAMPLE_RATE)
    target.writeframes(samples.tobytes())
print(f"{output} ({DURATION}s, {SAMPLE_RATE} Hz)")
