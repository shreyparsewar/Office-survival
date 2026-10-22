import { employees } from "./roster.ts"

export type Footprint = {
  id: string
  x: number
  z: number
  w: number
  d: number
  owner?: string
  kind?: "desk" | "chair"
}
export const managerWalls = [
  { id: "manager-left", x: 8.05, z: 2.9, w: 0.095, d: 5.23 },
  { id: "manager-front-left", x: 9.025, z: 5.4, w: 1.95, d: 0.095 },
  { id: "manager-front-right", x: 12.675, z: 5.4, w: 1.95, d: 0.095 },
  { id: "manager-right", x: 13.65, z: 2.9, w: 0.095, d: 5.23 },
] satisfies Footprint[]
export const partitions = [
  { id: "bullpen-back", x: 6, z: 6.8, w: 4, d: 0.12 },
  { id: "bullpen-left", x: 5.85, z: 6.9, w: 0.12, d: 0.4 },
  { id: "bullpen-right", x: 8, z: 6.9, w: 0.12, d: 0.4 },
  { id: "accounting-back", x: 9.6, z: 10.7, w: 6.2, d: 0.12 },
  { id: "sales-side", x: 2, z: 10.75, w: 0.12, d: 2 },
  { id: "workstation-back", x: 4, z: 13.22, w: 4.2, d: 0.14 },
  { id: "front-desk-back", x: 10.1, z: 14, w: 4.3, d: 0.14 },
] satisfies Footprint[]
export const receptionPosition = [14, 8.3] as const
export const deskPositions = [
  ...employees
    .filter((e) => !["michael", "pam", "jim"].includes(e.id))
    .map((e) => ({
      id: `desk-${e.id}`,
      owner: e.id,
      x: e.home[0],
      z: e.home[1] - 0.8,
    })),
  { id: "desk-michael", owner: "michael", x: 10.4, z: 2.15 },
  { id: "desk-jim", owner: "jim", x: 3, z: 5.75 },
  { id: "desk-pam", owner: "pam", x: 14, z: 6.25 },
  { id: "desk-player", x: 4, z: 12.5 },
  { id: "desk-front", x: 10, z: 13.2 },
]
export const furniture: Footprint[] = [
  ...deskPositions.map((p) => ({
    ...p,
    w: 1.9,
    d: 1.06,
    kind: "desk" as const,
  })),
  ...employees
    .filter((e) => !["michael", "pam", "jim"].includes(e.id))
    .map((e) => ({
      id: `chair-${e.id}`,
      owner: e.id,
      x: e.home[0],
      z: e.home[1] + 0.24,
      w: 0.88,
      d: 1.05,
      kind: "chair" as const,
    })),
  {
    id: "chair-jim",
    owner: "jim",
    x: 3,
    z: 6.5,
    w: 0.88,
    d: 1.05,
    kind: "chair",
  },
  {
    id: "chair-pam",
    owner: "pam",
    x: 14,
    z: 7.1,
    w: 0.88,
    d: 1.05,
    kind: "chair",
  },
  {
    id: "chair-michael",
    owner: "michael",
    x: 10.4,
    z: 2.95,
    w: 0.88,
    d: 1.05,
    kind: "chair",
  },
  {
    id: "reception",
    x: receptionPosition[0],
    z: receptionPosition[1],
    w: 3.05,
    d: 1.15,
  },
  { id: "printer", x: 5, z: 7.8, w: 1.12, d: 1.24 },
  { id: "coffee", x: 6.2, z: 1.5, w: 2.2, d: 0.72 },
  { id: "break-table", x: 2.6, z: 2.4, w: 2.6, d: 1.35 },
  { id: "break-chair-left", x: 1.5, z: 3.1, w: 0.88, d: 1.05 },
  { id: "break-chair-right", x: 2.8, z: 3.1, w: 0.88, d: 1.05 },
  { id: "fridge", x: 16.15, z: 2.15, w: 0.89, d: 0.79 },
  { id: "filing-cabinet", x: 16.25, z: 5.8, w: 0.82, d: 0.62 },
  { id: "whiteboard", x: 5.6, z: 3.8, w: 1.65, d: 0.28 },
  ...[
    [12.75, 0.84],
    [16.65, 14.35],
    [12.4, 14.45],
  ].map(([x, z], i) => ({ id: `bookshelf-${i}`, x, z, w: 1.3, d: 0.58 })),
  ...[
    [12.9, 4.8, 0.96],
    [5.6, 5.2, 0.55],
    [7.2, 5, 0.8],
    [12.8, 8.25, 1.16],
    [2, 5.5, 0.9],
    [15.8, 7.65, 0.9],
    [2, 12, 0.85],
    [16.8, 8.65, 0.9],
    [1.15, 14.45, 0.75],
  ].map(([x, z, s], i) => ({ id: `plant-${i}`, x, z, w: s * 0.7, d: s * 0.7 })),
  { id: "coat-stand", x: 12.3, z: 1.5, w: 0.65, d: 0.65 },
]
export const navigationObstacles: Footprint[] = [
  ...managerWalls,
  ...partitions,
  ...furniture,
]
