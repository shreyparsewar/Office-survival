import { useLayoutEffect, useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { officeModel } from "./game/interior-model";
import { person } from "./game/detailed-models";
import { employees } from "./game/roster";

export const CUTS = [0, 2, 4.5, 7, 9, 12, 14.5, 17, 20];
export const shotAt = (t: number) => Math.min(7, CUTS.findIndex((v, i) => t >= v && t < CUTS[i + 1]));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const smooth = (p: number) => p * p * (3 - 2 * p);
type V = [number, number, number];

const Set = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const shot = shotAt(t);
  const local = t - CUTS[shot];
  const p = local / (CUTS[shot + 1] - CUTS[shot]);
  const { camera, scene } = useThree();
  const world = useMemo(() => officeModel(), []);
  const actors = useMemo(() => employees.map((e) => person(e)), []);
  const player = useMemo(() => person({ skin: "#e2b995", hair: "#42382e", shirt: "#487ab9", pants: "#a58a63", tie: "#d2af5d" }), []);
  const lightTarget = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    scene.background = new THREE.Color(shot === 7 ? "#09212a" : "#b7b6a1");
    world.visible = shot !== 7;
    lightTarget.position.set(shot === 7 ? 2 : 9, 0, shot === 7 ? 0 : 7);
    actors.forEach((a, i) => {
      const e = employees[i];
      const seated = !["michael", "jim", "pam"].includes(e.id);
      a.group.visible = shot !== 7 || ["michael", "jim", "dwight"].includes(e.id);
      a.group.position.set(e.home[0], seated ? -.22 : .08, e.home[1]);
      a.group.rotation.set(0, seated ? Math.PI : .25, 0);
      a.head.rotation.set(Math.sin(t * 2 + i) * .035, seated ? -2.1 + Math.sin(t * 1.8 + i) * .22 : Math.sin(t * 1.8 + i) * .24, 0);
      a.leftArm.rotation.set(-.9 + Math.sin(t * 12 + i) * .22, 0, 0);
      a.rightArm.rotation.set(-.9 + Math.cos(t * 12 + i) * .22, 0, 0);
      a.leftLeg.rotation.x = a.rightLeg.rotation.x = seated ? -1.35 : 0;
      a.leftKnee.rotation.x = a.rightKnee.rotation.x = seated ? 1.35 : 0;
      a.marker.visible = false;
      a.work.visible = false;
      if (!seated) {
        a.leftArm.rotation.x = Math.sin(t * 3 + i) * .24;
        a.rightArm.rotation.x = -1.1 + Math.sin(t * 2.8 + i) * .35;
      }
      if (e.id === "jim" && shot === 1) {
        a.group.position.set(3 + p * .7, .08 + Math.abs(Math.sin(local * 9)) * .055, 7 + p * 1.8);
        a.group.rotation.y = .37;
        a.leftLeg.rotation.x = Math.sin(local * 9) * .62;
        a.rightLeg.rotation.x = -a.leftLeg.rotation.x;
        a.leftArm.rotation.x = -a.leftLeg.rotation.x * .7;
        a.rightArm.rotation.x = -a.leftArm.rotation.x;
        a.head.rotation.y = .2 + Math.sin(local * 2) * .15;
      }
      if (e.id === "michael") {
        a.group.rotation.y = .3;
        a.leftArm.rotation.x = -1.4 + Math.sin(t * 4) * .7;
        a.leftArm.rotation.z = -.25 + Math.sin(t * 3) * .12;
        a.rightArm.rotation.x = -1.0 + Math.sin(t * 2.3) * .25;
        a.head.rotation.y = Math.sin(t * 2) * .22;
      }
      if (shot === 7) {
        const lineup: Record<string, V> = { jim: [1.3, 0, 0], dwight: [2.65, 0, .5], michael: [4.0, 0, -.15] };
        const position = lineup[e.id];
        if (position) {
          a.group.position.set(...position);
          a.group.position.y = Math.abs(Math.sin(local * 4 + i)) * .055;
          a.group.rotation.y = -.12;
          a.leftLeg.rotation.x = Math.sin(local * 4 + i) * .13;
          a.rightLeg.rotation.x = -a.leftLeg.rotation.x;
          a.leftKnee.rotation.x = a.rightKnee.rotation.x = 0;
          a.head.rotation.y = Math.sin(local * 2 + i) * .14;
          a.rightArm.rotation.x = -2.2;
          a.rightArm.rotation.z = .3 + Math.sin(local * 7 + i) * .28;
          a.leftArm.rotation.x = -.2 + Math.sin(local * 4) * .15;
        }
      }
    });

    player.group.visible = shot !== 7;
    const running = shot === 4;
    const run = running ? local : t * .25;
    player.group.position.set(running ? 9.8 : 9.65, .08 + Math.abs(Math.sin(run * 13)) * .08, running ? 6.8 + p * 3.5 : 9.5);
    player.group.rotation.set(0, running ? .06 : -.45, running ? Math.sin(run * 13) * .025 : 0);
    player.leftLeg.rotation.x = Math.sin(run * 13) * (running ? .83 : .12);
    player.rightLeg.rotation.x = -player.leftLeg.rotation.x;
    player.leftArm.rotation.x = -player.leftLeg.rotation.x * .9;
    player.rightArm.rotation.x = -player.leftArm.rotation.x;
    player.head.rotation.y = Math.sin(t * 2) * .1;

    const cameras: [V, V, V, V, number][] = [
      [[14.5, 4.9, 14.7], [10.7, 3.4, 11.8], [7.8, 1.3, 7.4], [7.4, 1.25, 7.5], 48],
      [[5.8, 2.8, 11.7], [6.6, 2.6, 12.5], [3, 1.25, 7], [3.7, 1.3, 8.8], 40],
      [[9.6, 2.75, 10.8], [8.4, 2.4, 10.9], [7, 1.3, 8], [7, 1.35, 8], 43],
      [[10.45, 2.4, 8.3], [10.55, 2.2, 8.1], [10.5, 1.3, 4.8], [10.5, 1.5, 4.8], 44],
      [[9.4, 3.1, 10.7], [9.4, 3.1, 14.2], [9.8, 1.1, 6.8], [9.8, 1.1, 10.3], 52],
      [[15.2, 5.1, 14.6], [11.7, 4.8, 14.3], [8.6, 1.4, 8.3], [7.5, 1.4, 8.2], 52],
      [[10.7, 3.5, 13.4], [13.5, 4.5, 14.2], [7.3, 1.35, 7.3], [8.2, 1.3, 7.4], 46],
      [[0, 2.65, 8.9], [.3, 2.5, 8.7], [0, 1.35, 0], [.3, 1.35, 0], 43],
    ];
    const [start, end, targetStart, targetEnd, fov] = cameras[shot];
    const q = shot === 0 ? 1 - Math.pow(1 - p, 2) : p;
    const incoming = local < .2 ? (1 - smooth(local / .2)) : 0;
    camera.position.set(...start.map((v, i) => mix(v, end[i], q)) as V);
    camera.lookAt(new THREE.Vector3(...targetStart.map((v, i) => mix(v, targetEnd[i], q)) as V));
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = fov + (shot > 0 ? incoming * 7 : 0);
    perspective.updateProjectionMatrix();
    camera.rotateZ(shot === 4 ? -.045 + Math.sin(local * 2) * .012 : 0);
  }, [actors, camera, lightTarget, local, p, player, scene, shot, t, world]);

  return <>
    <hemisphereLight args={["#fff0d2", "#47616a", 1.65]} />
    <primitive object={lightTarget} />
    <directionalLight position={[-8, 8, -9]} target={lightTarget} intensity={4.1} color="#ffe0b2" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={22} shadow-camera-bottom={-22} shadow-normalBias={.025} shadow-bias={-.0001} />
    <directionalLight position={[14, 6, 12]} intensity={1.2} color="#b5e9ef" />
    {shot === 7 && <directionalLight position={[1, 4, 7]} intensity={2.1} color="#f7efcf" />}
    <primitive object={world} />
    {actors.map((actor, i) => <primitive key={employees[i].id} object={actor.group} />)}
    <primitive object={player.group} />
    {shot === 7 && <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -.03, 0]}><planeGeometry args={[30, 30]} /><meshStandardMaterial color="#102d36" roughness={.9} /></mesh>}
  </>;
};

export const CinemaWorld = () => {
  const { width, height } = useVideoConfig();
  return <ThreeCanvas shadows width={width} height={height} camera={{ fov: 45, near: .1, far: 80 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}><Set /></ThreeCanvas>;
};
