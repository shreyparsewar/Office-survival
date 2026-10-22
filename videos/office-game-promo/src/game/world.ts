import { employees } from "./roster"
export type Point = [number, number]
export const rooms = [{ name: "SCRANTON OFFICE", x: 1, z: 1, w: 16, d: 13, color: "#b2b7a6" }]
export const stations: {
  id: string
  name: string
  position: Point
  kind: string
  description: string
}[] = [
  {
    id: "computer",
    name: "Your workstation",
    position: [4, 12.5],
    kind: "computer",
    description: "Email, calendar, files and a spreadsheet that needs you.",
  },
  {
    id: "coffee",
    name: "Coffee station",
    position: [6.7, 1.8],
    kind: "coffee",
    description:
      "Pour a real cup. Your energy depends on getting the fill right.",
  },
  {
    id: "printer",
    name: "Office printer",
    position: [5.25, 8.8],
    kind: "printer",
    description: "Print reports or open the trays and clear a paper jam.",
  },
  {
    id: "plant",
    name: "Reception plant",
    position: [2, 5.5],
    kind: "plant",
    description: "Clean the leaves and water it carefully.",
  },
  {
    id: "lunch",
    name: "Kitchen fridge",
    position: [16.15, 2.15],
    kind: "lunch",
    description:
      "Build a sandwich after 11:45. Lunch restores energy and patience.",
  },
  {
    id: "break",
    name: "Break room table",
    position: [2.6, 2.4],
    kind: "break",
    description:
      "Take a short memory-game break. Repeated breaks attract attention.",
  },
  {
    id: "floppy",
    name: "Backup drive",
    position: [4.5, 12.5],
    kind: "floppy",
    description:
      "Copy and verify your documents before the next office mishap.",
  },
  {
    id: "phone",
    name: "Reception phone",
    position: [14.15, 8],
    kind: "phone",
    description: "Dial IT on 104 or answer a call with a real decision.",
  },
  {
    id: "clock",
    name: "Office clock",
    position: [8.05, 5.47],
    kind: "clock",
    description: "Review the day's meetings. The clock advances when you act.",
  },
]
// Navigation follows furniture and the manager's open doorway in the interior.
const obstacles = new Set(employees.filter(e => !["michael","pam","jim"].includes(e.id)).map(e => `${Math.round(e.home[0])},${Math.round(e.home[1]-1)}`))
for(const cell of ["10,2","4,12","10,13","13,8","14,8","15,8","5,9","6,1"]) obstacles.add(cell)
export function walkable(x:number,z:number) {
  if(x < 1 || x > 17 || z < 1 || z > 14) return false
  if(x === 8 && z <= 5) return false
  if(z === 5 && x >= 8 && x <= 14 && x !== 11) return false
  return !obstacles.has(`${x},${z}`)
}
// Includes shoulders, swinging arms and the forward reach of seated legs.
export const characterClearance = 1.35
export function movementClear(from: Point, to: Point, occupied: Point[]): boolean {
  const dx = to[0] - from[0], dz = to[1] - from[1]
  const lengthSquared = dx * dx + dz * dz
  return occupied.every(([x, z]) => {
    const projection = lengthSquared
      ? Math.max(0, Math.min(1, ((x - from[0]) * dx + (z - from[1]) * dz) / lengthSquared))
      : 0
    return Math.hypot(x - from[0] - projection * dx, z - from[1] - projection * dz) >= characterClearance
  })
}
export function findPath(from: Point, to: Point, occupied: Point[] = []): Point[] {
  const start: Point = [Math.round(from[0]), Math.round(from[1])]
  let goal: Point = [Math.round(to[0]), Math.round(to[1])]
  if (goal[0] < 1 || goal[0] > 17 || goal[1] < 1 || goal[1] > 14) return []
  if (!walkable(...goal)) {
    const alternatives: Point[] = [
      [goal[0] - 1, goal[1]],
      [goal[0] + 1, goal[1]],
      [goal[0], goal[1] - 1],
      [goal[0], goal[1] + 1],
    ]
    goal = alternatives.find((p) => walkable(...p)) ?? start
  }
  const key = (p: Point) => p.join(",")
  const queue: Point[] = [start]
  const previous = new Map<string, Point | null>([[key(start), null]])
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i]
    if (!occupied.length && key(p) === key(goal)) break
    for (const next of [
      [p[0] + 1, p[1]],
      [p[0] - 1, p[1]],
      [p[0], p[1] + 1],
      [p[0], p[1] - 1],
    ] as Point[]) {
      if (walkable(...next) && !previous.has(key(next)) && movementClear(i === 0 ? from : p, next, occupied)) {
        previous.set(key(next), p)
        queue.push(next)
      }
    }
  }
  if (occupied.length) {
    // Select the closest reachable approach point, never somebody's body.
    goal = queue.reduce((best, p) =>
      Math.hypot(p[0] - to[0], p[1] - to[1]) < Math.hypot(best[0] - to[0], best[1] - to[1]) ? p : best, start)
  }
  if (!previous.has(key(goal))) return []
  const path: Point[] = []
  let cursor: Point | null = goal
  while (cursor && key(cursor) !== key(start)) {
    path.unshift(cursor)
    cursor = previous.get(key(cursor)) ?? null
  }
  return path
}
