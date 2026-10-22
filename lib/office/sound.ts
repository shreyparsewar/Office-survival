export type Sound = "click" | "open" | "key" | "pour" | "paper" | "ring" | "success" | "error" | "water" | "disk" | "mail" | "alarm";
let context: AudioContext | null = null;
let enabled = false;
export function enableSound(value: boolean) {
  enabled = value;
  if (!value) return;
  try { context ??= new AudioContext(); void context.resume(); } catch { enabled = false; }
}
export function playSound(kind: Sound) {
  if (!enabled || !context) return;
  const ctx = context;
  const notes: Record<Sound, number[]> = { click: [560], open: [280, 420], key: [160, 110], pour: [210, 270, 320, 240], paper: [85, 110, 85, 130], ring: [660, 880, 660, 880], success: [392, 494, 587, 784], error: [180, 130], water: [560, 740, 610], disk: [95, 145, 180, 95], mail: [523, 659, 784], alarm: [360, 180, 360] };
  const duration = kind === "ring" ? .13 : kind === "success" ? .09 : kind === "click" || kind === "key" ? .028 : .055;
  notes[kind].forEach((frequency, i) => {
    const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); const at = ctx.currentTime + i * duration;
    oscillator.type = ["pour", "water"].includes(kind) ? "sine" : "square"; oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(kind === "click" ? .013 : .025, at + .008); gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(at); oscillator.stop(at + duration + .01); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}
