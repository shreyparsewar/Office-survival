import "@fontsource/press-start-2p/400.css";
import { Audio, Video } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { blurSlide } from "@remotion/transitions/blur-slide";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CSSProperties, ReactNode } from "react";

const ink = "#102a39";
const paper = "#f8f3df";
const green = "#378457";
const amber = "#d6a64f";
const pixel = '"Press Start 2P", monospace';
const mono = '"Courier New", monospace';
const limits = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const land = Easing.bezier(0.16, 1, 0.3, 1);
const progress = (frame: number, from: number, length: number) =>
  interpolate(frame, [from, from + length], [0, 1], { ...limits, easing: land });

const Photo = ({ name, style }: { name: string; style?: CSSProperties }) => (
  <Img src={staticFile(`captures/${name}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover", ...style }} />
);

const Caption = ({ children, top, left, delay, size, color = ink }: {
  children: ReactNode; top: number; left: number; delay: number; size: number; color?: string;
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, delay, 15);
  return <div style={{
    position: "absolute", top, left, color, font: `${size}px/1.35 ${pixel}`,
    whiteSpace: "nowrap", letterSpacing: -2, opacity: p,
    translate: `${(1 - p) * -56}px 0`, filter: `blur(${(1 - p) * 8}px)`,
  }}>{children}</div>;
};

const Band = ({ top, height, width, from = "left", fill = paper, delay = 0 }: {
  top: number; height: number; width: number; from?: "left" | "right"; fill?: string; delay?: number;
}) => {
  const p = progress(useCurrentFrame(), delay, 18);
  return <div style={{
    position: "absolute", top, [from]: 0, width: width * p, height,
    background: fill, borderTop: `9px solid ${ink}`, borderBottom: `9px solid ${ink}`,
    boxShadow: `12px 12px 0 ${ink}80`,
  }} />;
};

const Opening = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: paper, overflow: "hidden" }}>
    <Photo name="office-clean" style={{ scale: interpolate(frame, [0, 105], [1.02, 1.1], limits) }} />
    <Band top={388} height={278} width={1660} delay={0} />
    <Caption top={420} left={108} delay={8} size={95}>MONDAY.</Caption>
    <Caption top={536} left={108} delay={22} size={95}>SCRANTON.</Caption>
    <div style={{
      position: "absolute", right: 170, top: 574, background: green, color: paper,
      padding: "24px 30px", border: `6px solid ${ink}`, boxShadow: `8px 8px 0 ${ink}`,
      font: `27px ${pixel}`, opacity: progress(frame, 48, 14),
    }}>CLOCK IN ↗</div>
  </AbsoluteFill>;
};

const Coworkers = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <AbsoluteFill style={{ background: ink, overflow: "hidden" }}>
    <Video src={staticFile("captures/gameplay.webm")} trimBefore={12 * fps} durationInFrames={125}
      muted objectFit="cover" style={{ width: "100%", height: "100%", scale: 1.2 }} />
    <Band top={713} height={245} width={1230} fill={ink} delay={3} />
    <Caption top={749} left={91} delay={12} size={73} color={paper}>10 COWORKERS</Caption>
    <Caption top={856} left={94} delay={27} size={41} color={amber}>ONE VERY LONG DAY</Caption>
    <div style={{
      position: "absolute", top: 155, right: 90, padding: "19px 25px", background: paper,
      border: `6px solid ${ink}`, color: ink, font: `26px ${mono}`,
      opacity: progress(frame, 50, 12),
    }}>Click a coworker to interact</div>
  </AbsoluteFill>;
};

const Assignment = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: paper, overflow: "hidden" }}>
    <Photo name="assign" style={{
      scale: interpolate(frame, [0, 110], [1.01, 1.23], { ...limits, easing: Easing.inOut(Easing.quad) }),
      translate: "-3% -1%",
    }} />
    <Band top={47} height={171} width={1190} delay={2} />
    <Caption top={101} left={102} delay={15} size={57}>ASSIGN THE WORK</Caption>
  </AbsoluteFill>;
};

const Workday = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <AbsoluteFill style={{ background: ink, overflow: "hidden" }}>
    <Video src={staticFile("captures/gameplay.webm")} trimBefore={17 * fps} durationInFrames={125}
      muted objectFit="cover" style={{ width: "100%", height: "100%", scale: 1.2 }} />
    <Band top={405} height={241} width={1190} from="right" fill={amber} delay={2} />
    <Caption top={474} left={842} delay={16} size={62}>THE CLOCK MOVES</Caption>
    <div style={{
      position: "absolute", right: 160, bottom: 275, background: paper,
      border: `7px solid ${ink}`, color: ink, padding: "22px 30px",
      font: `43px ${pixel}`, opacity: progress(frame, 48, 14),
    }}>09:05 AM</div>
  </AbsoluteFill>;
};

const Survive = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: paper, overflow: "hidden" }}>
    <Photo name="office-clean" style={{ scale: 1.12, translate: "-3% -2%" }} />
    <div style={{
      position: "absolute", left: interpolate(frame, [0, 18], [-1300, 0], { ...limits, easing: land }),
      top: 348, width: 1280, background: paper, border: `9px solid ${ink}`,
      padding: "38px 55px", font: `69px ${pixel}`, color: ink,
    }}>MAKE IT TO</div>
    <div style={{
      position: "absolute", right: interpolate(frame, [7, 25], [-1050, 0], { ...limits, easing: land }),
      top: 555, width: 920, background: green, border: `9px solid ${ink}`,
      padding: "37px 65px", font: `89px ${pixel}`, color: paper,
    }}>5 PM.</div>
  </AbsoluteFill>;
};

const EndCard = () => {
  const frame = useCurrentFrame();
  const p = progress(frame, 0, 23);
  return <AbsoluteFill style={{ background: ink }}>
    <div style={{
      position: "absolute", top: 152, left: 145, width: 1590 * p, height: 578,
      background: paper, border: `11px solid ${amber}`, boxShadow: "20px 20px 0 #071b25",
    }} />
    <Caption top={254} left={235} delay={12} size={85}>OFFICE</Caption>
    <Caption top={379} left={235} delay={20} size={85}>SURVIVAL</Caption>
    <Caption top={510} left={235} delay={28} size={85} color={green}>1999</Caption>
    <div style={{
      position: "absolute", top: 768, left: 630, width: 660, textAlign: "center",
      background: green, border: `9px solid ${paper}`, boxShadow: "13px 13px 0 #061923",
      padding: "28px 40px", color: paper, font: `39px ${pixel}`,
      opacity: progress(frame, 38, 14), scale: interpolate(frame, [38, 52], [0.8, 1], { ...limits, easing: land }),
    }}>CLOCK IN ↗</div>
  </AbsoluteFill>;
};

export const OfficePromo: React.FC = () => (
  <>
  <Audio src={staticFile("audio/office-beat.wav")} volume={0.48} />
  <TransitionSeries>
    <TransitionSeries.Sequence name="Clock in" durationInFrames={105}><Opening /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />
    <TransitionSeries.Sequence name="Meet the team" durationInFrames={125}><Coworkers /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={blurSlide({ direction: "from-left" })} timing={linearTiming({ durationInFrames: 12 })} />
    <TransitionSeries.Sequence name="Assign the work" durationInFrames={110}><Assignment /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({ direction: "from-top" })} timing={linearTiming({ durationInFrames: 12 })} />
    <TransitionSeries.Sequence name="Advance the clock" durationInFrames={125}><Workday /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={linearTiming({ durationInFrames: 12 })} />
    <TransitionSeries.Sequence name="Make it to five" durationInFrames={90}><Survive /></TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={wipe({ direction: "from-right" })} timing={linearTiming({ durationInFrames: 12 })} />
    <TransitionSeries.Sequence name="End card" durationInFrames={105}><EndCard /></TransitionSeries.Sequence>
  </TransitionSeries>
  </>
);
