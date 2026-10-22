import "@fontsource/press-start-2p/400.css";
import "./8bit-compiled.css";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/8bit/card";
import { Badge } from "@/components/ui/8bit/badge";
import { Button } from "@/components/ui/8bit/button";
import { Progress } from "@/components/ui/8bit/progress";
import { CinemaWorld, CUTS, shotAt } from "./CinemaWorld";
import type { CSSProperties } from "react";

const ink = "#102a39", paper = "#f8f3df", green = "#378457", amber = "#d6a64f";
const pixel = '"Press Start 2P", monospace';
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const reveal = (local: number, at = .22) => interpolate(local, [at, at + .13], [0, 1], clamp);

const TitleCard = ({ label, lines, local, style, size = 38 }: { label: string; lines: string[]; local: number; style?: CSSProperties; size?: number }) => <div style={{ position: "absolute", left: 90, bottom: 110, width: 805, opacity: reveal(local), ...style }}>
  <Card className="w-full border-foreground py-0 gap-0 shadow-none">
    <CardHeader style={{ background: ink, color: paper, padding: "20px 28px" }}><CardTitle style={{ fontSize: 17, fontWeight: 400, letterSpacing: .5 }}>{label}</CardTitle></CardHeader>
    <CardContent style={{ padding: "30px 28px 32px", fontFamily: pixel, fontSize: size, lineHeight: 1.65, letterSpacing: .5 }}>
      {lines.map((line, i) => <div key={line} style={{ opacity: reveal(local, .28 + i * .09), color: i === lines.length - 1 ? green : ink, whiteSpace: "nowrap" }}>{line}</div>)}
    </CardContent>
  </Card>
</div>;

const PaperSweep = ({ progress }: { progress: number }) => <>
  {Array.from({ length: 5 }, (_, i) => <div key={i} style={{ position: "absolute", width: 720, height: 1100, left: -1000 + progress * 4000 + i * 100, top: -200 + i * 70, background: i % 2 ? "#d2d5ba" : paper, border: `7px solid ${ink}`, transform: `rotate(${-25 + i * 9 + progress * 45}deg)`, boxShadow: `-30px 15px 45px ${ink}44`, padding: 80 }}><div style={{ font: `43px ${pixel}`, color: ink }}>URGENT</div>{Array.from({ length: 7 }, (_, n) => <div key={n} style={{ height: n === 0 ? 16 : 8, marginTop: 36, width: n % 2 ? "90%" : "68%", background: ink, opacity: .24 }} />)}</div>)}
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

  return <AbsoluteFill className="promo-ui" style={{ background: ink, overflow: "hidden" }}>
    <Audio src={staticFile("audio/office-funk-v4.wav")} volume={1} />
    <AbsoluteFill style={{ transform: `scale(${1 + seam * .045}) translateX(${whip ? (1 - local / .18) ** 3 * 120 : 0}px)`, filter: `blur(${seam * (edge < .14 ? 11 : 0)}px)` }}><CinemaWorld /></AbsoluteFill>
    <AbsoluteFill style={{ background: shot === 7 ? "linear-gradient(90deg, #09212af5 0%, #09212ad9 39%, transparent 68%)" : "linear-gradient(0deg, #09212a70 0%, transparent 40%)" }} />

    <div style={{ position: "absolute", left: 90, top: 52 }}><Badge className="bg-background text-foreground text-[17px]" style={{ padding: "12px 16px" }}>OFFICE SURVIVAL / 1999</Badge></div>
    {shot < 7 && <div style={{ position: "absolute", right: 90, top: 52 }}><Badge className="bg-background text-foreground text-[20px]" style={{ padding: "12px 16px" }}>{shot < 4 ? "09:00 AM" : clockText}</Badge></div>}

    {shot === 0 && <TitleCard label="WELCOME TO MONDAY" lines={["YOUR SHIFT.", "YOUR PROBLEM."]} local={local} size={42} />}
    {shot === 1 && <TitleCard label="MEET YOUR COWORKERS" lines={["WORK HARD.", "SOCIALIZE HARDER."]} local={local} size={33} style={{ left: "auto", right: 95, bottom: 125, width: 755 }} />}
    {shot === 2 && <>
      <TitleCard label="DWIGHT / SALES" lines={["DELEGATE.", "GET IT DONE."]} local={local} size={42} />
      <div style={{ position: "absolute", right: 100, top: 175, width: 540, opacity: reveal(local, .35) }}><Card className="w-full border-foreground py-0 gap-0 shadow-none"><CardHeader style={{ padding: "23px 25px", background: ink, color: paper }}><CardTitle style={{ font: `19px ${pixel}`, fontWeight: 400 }}>CLIENT INVENTORY</CardTitle></CardHeader><CardContent style={{ padding: 27 }}><div style={{ font: `25px 'Courier New'`, marginBottom: 25 }}>Assigned to Dwight Schrute</div><Progress value={15 + Math.min(1, local / 2.1) * 85} variant="retro" className="h-5" /><div style={{ font: `17px ${pixel}`, marginTop: 27 }}>{local < 2.1 ? "IN PROGRESS" : "TASK DELIVERED"}</div></CardContent></Card></div>
    </>}
    {shot === 3 && <TitleCard label="MICHAEL WANTS A WORD" lines={["ANOTHER", "MEETING?!"]} local={local} size={44} style={{ width: 705 }} />}
    {shot === 4 && <>
      <TitleCard label="DEADLINES DON'T WAIT" lines={["KEEP", "MOVING."]} local={local} size={45} style={{ top: 170, bottom: "auto", width: 660 }} />
      {Array.from({ length: 11 }, (_, i) => { const phase = (local * .8 + i * .173) % 1; return <div key={i} style={{ position: "absolute", width: 90 + i * 7, height: 125 + i * 5, top: 800 - phase * 950, left: 1300 + Math.sin(i * 5) * 400 - phase * 420, opacity: Math.sin(phase * Math.PI) * .8, background: paper, transform: `perspective(800px) rotateX(${phase * 140}deg) rotateZ(${phase * 150 + i * 30}deg)`, boxShadow: "5px 10px 12px #09212a55" }} />; })}
    </>}
    {shot === 5 && <TitleCard label="MANAGE THE OFFICE. SURVIVE THE DAY." lines={["10 COWORKERS.", "ZERO CHILL."]} local={local} size={40} style={{ width: 875 }} />}
    {shot === 6 && <TitleCard label="ONE GOAL" lines={["MAKE IT", "TO 5 PM."]} local={local} size={48} style={{ width: 755 }} />}
    {shot === 7 && <div style={{ position: "absolute", left: 100, top: 235, width: 740, opacity: reveal(local, .22) }}><Card className="w-full border-foreground py-0 gap-0 shadow-none"><CardHeader style={{ background: ink, color: paper, padding: "23px 28px" }}><CardTitle style={{ font: `17px ${pixel}`, fontWeight: 400 }}>YOUR NEXT SHIFT IS WAITING</CardTitle></CardHeader><CardContent style={{ padding: "38px 28px 28px", font: `53px/1.65 ${pixel}`, color: ink }}><div>OFFICE</div><div>SURVIVAL</div><div style={{ color: green }}>1999</div></CardContent><CardFooter style={{ padding: "20px 30px 35px", opacity: reveal(local, .58) }}><Button style={{ width: "100%", height: 83, fontSize: 24, letterSpacing: .5, gap: 30 }}>PLAY THE GAME <span>↗</span></Button></CardFooter></Card></div>}

    {[2, 7, 12, 14.5].map((cut, i) => { const phase = (t - cut + .19) / .4; return phase > 0 && phase < 1 ? <div key={cut} style={{ position: "absolute", inset: -300, transform: i === 1 ? `translateY(${-1900 + phase * 3900}px) skewY(-8deg)` : `translateX(${-2700 + phase * 5400}px) skewX(-18deg)`, background: ink, borderLeft: `70px solid ${i === 1 ? amber : green}`, borderRight: `35px solid ${paper}`, boxShadow: `-30px 0 0 ${green}55` }} /> : null; })}
    {t > 4.24 && t < 4.78 && <PaperSweep progress={(t - 4.24) / .54} />}
    {t > 16.7 && t < 17.28 && <div style={{ position: "absolute", left: "50%", top: "50%", width: 600, height: 600, borderRadius: "50%", background: paper, border: `25px solid ${ink}`, transform: `translate(-50%, -50%) scale(${interpolate(t, [16.7, 16.99, 17.02, 17.28], [0, 4.4, 4.4, 0], clamp)})`, display: "flex", alignItems: "center", justifyContent: "center", color: ink, font: `85px ${pixel}` }}>5 PM</div>}
    <div style={{ position: "absolute", bottom: 35, left: 80, right: 80, height: 4, background: "#f8f3df33" }}><div style={{ height: 4, background: green, width: `${t / 20 * 100}%` }} /></div>
  </AbsoluteFill>;
};
