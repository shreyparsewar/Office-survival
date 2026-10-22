import "@fontsource/press-start-2p/400.css";
import "@fontsource/anton/400.css";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CinemaWorld, CUTS, shotAt } from "./CinemaWorld";
import type { CSSProperties, ReactNode } from "react";

const ink = "#09212a", paper = "#fff7df", lime = "#d7ff43", coral = "#ff6948";
const display = '"Anton", Impact, sans-serif';
const pixel = '"Press Start 2P", monospace';
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Slam = ({ children, at = 0, size = 160, style }: { children: ReactNode; at?: number; size?: number; style?: CSSProperties }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const shot = shotAt(t);
  const f = frame - CUTS[shot] * fps - at;
  const pop = spring({ frame: f, fps, config: { damping: 17, stiffness: 190, mass: .75 } });
  return <div style={{ fontFamily: display, fontSize: size, lineHeight: .98, letterSpacing: -3, color: paper, textTransform: "uppercase", transformOrigin: "left center", opacity: f < 0 ? 0 : 1, transform: `translateY(${(1 - pop) * 80}px) scale(${.72 + .28 * pop}) rotate(${(1 - pop) * -7}deg)`, textShadow: `5px 7px 0 ${ink}`, ...style }}>{children}</div>;
};

const Tag = ({ children, color = lime }: { children: ReactNode; color?: string }) => <div style={{ display: "inline-block", background: color, color: ink, padding: "16px 22px", font: `20px ${pixel}`, letterSpacing: 1 }}>{children}</div>;

const PaperSweep = ({ progress }: { progress: number }) => <>
  {Array.from({ length: 5 }, (_, i) => <div key={i} style={{ position: "absolute", width: 720, height: 1100, left: -1000 + progress * 4000 + i * 100, top: -200 + i * 70, background: i % 2 ? lime : paper, border: `7px solid ${ink}`, transform: `rotate(${-25 + i * 9 + progress * 45}deg)`, boxShadow: `-30px 15px 45px ${ink}44`, padding: 80 }}><div style={{ font: `75px ${display}`, color: ink }}>URGENT</div>{Array.from({ length: 7 }, (_, n) => <div key={n} style={{ height: n === 0 ? 16 : 8, marginTop: 36, width: n % 2 ? "90%" : "68%", background: ink, opacity: .24 }} />)}</div>)}
</>;

export const OfficePromo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const shot = shotAt(t);
  const local = t - CUTS[shot];
  const length = CUTS[shot + 1] - CUTS[shot];
  const edge = Math.min(local, length - local);
  const seam = shot > 0 && local < .16 ? (1 - local / .16) : length - local < .14 && shot < 7 ? (1 - (length - local) / .14) : 0;
  const whip = [1, 3, 4, 6].includes(shot) && local < .18;
  const clock = Math.min(17 * 60, 9 * 60 + Math.floor(Math.max(0, t - 9) / 8 * 480));
  const clockText = `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`;

  return <AbsoluteFill style={{ background: ink, overflow: "hidden" }}>
    <Audio src={staticFile("audio/office-beat-v2.wav")} volume={.8} />
    <AbsoluteFill style={{ transform: `scale(${1 + seam * .045}) translateX(${whip ? (1 - local / .18) ** 3 * 120 : 0}px)`, filter: `blur(${seam * (edge < .14 ? 11 : 0)}px)` }}><CinemaWorld /></AbsoluteFill>
    <AbsoluteFill style={{ background: shot === 7 ? "linear-gradient(90deg, #09212af5 0%, #09212ad9 39%, transparent 68%)" : "linear-gradient(0deg, #09212ad9 0%, transparent 43%, #09212a22 100%)" }} />

    <div style={{ position: "absolute", left: 80, top: 52, font: `16px ${pixel}`, color: paper, letterSpacing: 1.5, textShadow: `2px 2px ${ink}` }}>OFFICE SURVIVAL / 1999</div>
    {shot < 7 && <div style={{ position: "absolute", right: 80, top: 46, display: "flex", alignItems: "center", gap: 16, color: paper, font: `24px ${pixel}`, background: ink, padding: "15px 20px" }}><span style={{ width: 12, height: 12, background: shot > 3 ? coral : lime }} />{shot < 4 ? "09:00" : clockText}</div>}

    {shot === 0 && <div style={{ position: "absolute", left: 90, bottom: 120 }}><Tag>WELCOME TO MONDAY</Tag><div style={{ marginTop: 25 }}><Slam at={8} size={190}>YOUR SHIFT.</Slam><Slam at={20} size={190} style={{ color: lime }}>YOUR PROBLEM.</Slam></div></div>}
    {shot === 1 && <div style={{ position: "absolute", right: 100, bottom: 145, width: 800 }}><Tag>MEET YOUR COWORKERS</Tag><div style={{ marginTop: 28 }}><Slam at={5} size={170}>WORK HARD.</Slam><Slam at={16} size={170} style={{ color: lime }}>SOCIALIZE<br />HARDER.</Slam></div></div>}
    {shot === 2 && <>
      <div style={{ position: "absolute", left: 90, bottom: 100 }}><Tag>DWIGHT / SALES</Tag><div style={{ marginTop: 25 }}><Slam at={5} size={155}>DELEGATE.</Slam><Slam at={18} size={155} style={{ color: lime }}>GET IT DONE.</Slam></div></div>
      <div style={{ position: "absolute", right: 100, top: 180, width: 505, background: paper, padding: 32, border: `5px solid ${ink}`, transform: `rotate(3deg) translateX(${interpolate(local, [0, .35], [800, 0], clamp)}px)`, boxShadow: `12px 12px 0 ${ink}` }}><div style={{ font: `22px ${pixel}`, color: ink, lineHeight: 1.6 }}>CLIENT INVENTORY</div><div style={{ font: `25px 'Courier New'`, color: ink, marginTop: 22 }}>Assigned to Dwight Schrute</div><div style={{ height: 24, background: "#c4cbb6", marginTop: 23 }}><div style={{ height: "100%", width: `${15 + Math.min(1, local / 2.1) * 85}%`, background: "#3d8256" }} /></div><div style={{ font: `19px ${pixel}`, color: ink, marginTop: 23 }}>{local < 2.1 ? "IN PROGRESS" : "TASK DELIVERED ✓"}</div></div>
    </>}
    {shot === 3 && <div style={{ position: "absolute", left: 95, bottom: 120 }}><Tag color={coral}>MICHAEL WANTS A WORD</Tag><div style={{ marginTop: 25 }}><Slam at={5} size={175}>ANOTHER</Slam><Slam at={16} size={175} style={{ color: coral }}>MEETING?!</Slam></div></div>}
    {shot === 4 && <>
      <div style={{ position: "absolute", left: 90, top: 165 }}><Tag color={coral}>DEADLINES DON'T WAIT</Tag><div style={{ marginTop: 25 }}><Slam at={5} size={160}>KEEP.</Slam><Slam at={17} size={160} style={{ color: lime }}>MOVING.</Slam></div></div>
      {Array.from({ length: 11 }, (_, i) => { const phase = (local * .8 + i * .173) % 1; return <div key={i} style={{ position: "absolute", width: 90 + i * 7, height: 125 + i * 5, top: 800 - phase * 950, left: 1300 + Math.sin(i * 5) * 400 - phase * 420, opacity: Math.sin(phase * Math.PI) * .8, background: paper, transform: `perspective(800px) rotateX(${phase * 140}deg) rotateZ(${phase * 150 + i * 30}deg)`, boxShadow: "5px 10px 12px #09212a55" }} />; })}
    </>}
    {shot === 5 && <div style={{ position: "absolute", left: 90, bottom: 110 }}><Tag>MANAGE THE OFFICE. SURVIVE THE DAY.</Tag><div style={{ marginTop: 24 }}><Slam at={5} size={170}>10 COWORKERS.</Slam><Slam at={18} size={170} style={{ color: lime }}>ZERO CHILL.</Slam></div></div>}
    {shot === 6 && <div style={{ position: "absolute", left: 105, bottom: 130 }}><Tag>ONE GOAL</Tag><div style={{ marginTop: 24 }}><Slam at={4} size={180}>MAKE IT</Slam><Slam at={16} size={180} style={{ color: lime }}>TO 5 PM.</Slam></div></div>}
    {shot === 7 && <div style={{ position: "absolute", left: 100, top: 220 }}><Tag>YOUR NEXT SHIFT IS WAITING</Tag><div style={{ marginTop: 36 }}><Slam at={0} size={150}>OFFICE</Slam><Slam at={7} size={150}>SURVIVAL</Slam><Slam at={14} size={125} style={{ color: lime }}>1999</Slam></div><div style={{ marginTop: 42, transform: `scale(${spring({ frame: Math.max(0, frame - 17 * fps - 25), fps, config: { damping: 16, stiffness: 170 } })})`, transformOrigin: "left center", display: "inline-flex", alignItems: "center", gap: 60, color: ink, background: lime, padding: "20px 36px", font: `48px ${display}`, boxShadow: "8px 8px 0 #fff7df" }}>PLAY THE GAME <span>↗</span></div></div>}

    {/* A fast paper occlusion carries the cut into Dwight's inventory job. */}
    {[2, 7, 12, 14.5].map((cut, i) => { const phase = (t - cut + .19) / .4; return phase > 0 && phase < 1 ? <div key={cut} style={{ position: "absolute", inset: -300, transform: i === 1 ? `translateY(${-1900 + phase * 3900}px) skewY(-8deg)` : `translateX(${-2700 + phase * 5400}px) skewX(-18deg)`, background: ink, borderLeft: `70px solid ${i === 1 ? coral : lime}`, borderRight: `35px solid ${paper}`, boxShadow: `-30px 0 0 ${i === 1 ? coral : lime}55` }} /> : null; })}
    {t > 4.24 && t < 4.78 && <PaperSweep progress={(t - 4.24) / .54} />}
    {/* A clock iris becomes the final title stage. */}
    {t > 16.7 && t < 17.28 && <div style={{ position: "absolute", left: "50%", top: "50%", width: 600, height: 600, borderRadius: "50%", background: lime, border: `25px solid ${ink}`, transform: `translate(-50%, -50%) scale(${interpolate(t, [16.7, 16.99, 17.02, 17.28], [0, 4.4, 4.4, 0], clamp)})`, display: "flex", alignItems: "center", justifyContent: "center", color: ink, font: `160px ${display}` }}>5 PM</div>}
    <div style={{ position: "absolute", bottom: 35, left: 80, right: 80, height: 4, background: "#fff7df33" }}><div style={{ height: 4, background: lime, width: `${t / 20 * 100}%` }} /></div>
  </AbsoluteFill>;
};
