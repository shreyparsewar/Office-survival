import { employees } from "./roster.ts"
import { officeBounds } from "./camera.ts"
import {
  navigationObstacles,
  managerWalls,
  partitions,
  type Footprint,
} from "./layout.ts"
export type Point = [number, number]
export const rooms = [
  { name: "SCRANTON OFFICE", x: 1, z: 1, w: 16, d: 13, color: "#b2b7a6" },
]
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
    position: [5, 7.8],
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
    position: [14.15, 8.3],
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

export const bodyRadius = 0.52
export const characterClearance = 1.25
const step = 0.125
const cols = Math.ceil(officeBounds.right / step) + 1
const rows = Math.ceil(officeBounds.front / step) + 1
const epsilon = 1e-7
const seatOwner = (from: Point) =>
  employees.find(
    (e) => Math.hypot(e.home[0] - from[0], e.home[1] - from[1]) < 0.02
  )?.id
const padding = (box: Footprint, actorId?: string) =>
  actorId && box.owner === actorId && box.kind === "desk" ? 0.18 : bodyRadius
function inBounds([x, z]: Point) {
  return (
    Number.isFinite(x) &&
    Number.isFinite(z) &&
    x >= officeBounds.left + bodyRadius &&
    x <= officeBounds.right - bodyRadius &&
    z >= officeBounds.back + bodyRadius &&
    z <= officeBounds.front - bodyRadius
  )
}
function touchesBox(
  from: Point,
  to: Point,
  box: Footprint,
  actorId?: string,
  radius?: number
) {
  if (actorId && box.owner === actorId && box.kind === "chair") return false // A worker can enter and leave their own seat.
  const pad = (radius ?? padding(box, actorId)) - epsilon
  const min = [box.x - box.w / 2 - pad, box.z - box.d / 2 - pad]
  const max = [box.x + box.w / 2 + pad, box.z + box.d / 2 + pad]
  let enter = 0,
    leave = 1
  for (let axis = 0; axis < 2; axis++) {
    const delta = to[axis] - from[axis]
    if (Math.abs(delta) < epsilon) {
      if (from[axis] < min[axis] || from[axis] > max[axis]) return false
    } else {
      let a = (min[axis] - from[axis]) / delta,
        b = (max[axis] - from[axis]) / delta
      if (a > b) [a, b] = [b, a]
      enter = Math.max(enter, a)
      leave = Math.min(leave, b)
      if (enter > leave) return false
    }
  }
  return true
}
export function walkable(x: number, z: number, actorId?: string) {
  const point: Point = [x, z]
  return (
    inBounds(point) &&
    navigationObstacles.every((box) => !touchesBox(point, point, box, actorId))
  )
}
function peopleClear(from: Point, to: Point, occupied: Point[]) {
  const dx = to[0] - from[0],
    dz = to[1] - from[1],
    length = dx * dx + dz * dz
  return occupied.every(([x, z]) => {
    const p = length
      ? Math.max(
          0,
          Math.min(1, ((x - from[0]) * dx + (z - from[1]) * dz) / length)
        )
      : 0
    return (
      Math.hypot(x - from[0] - p * dx, z - from[1] - p * dz) >=
      characterClearance - epsilon
    )
  })
}
export function movementClear(
  from: Point,
  to: Point,
  occupied: Point[] = [],
  actorId?: string
) {
  return (
    inBounds(from) &&
    inBounds(to) &&
    peopleClear(from, to, occupied) &&
    navigationObstacles.every((box) => !touchesBox(from, to, box, actorId))
  )
}

class MinHeap {
  items: { index: number; cost: number }[] = []
  push(item: { index: number; cost: number }) {
    this.items.push(item)
    let i = this.items.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.items[p].cost <= item.cost) break
      this.items[i] = this.items[p]
      i = p
    }
    this.items[i] = item
  }
  pop() {
    const first = this.items[0],
      last = this.items.pop()!
    if (this.items.length) {
      let i = 0
      while (i * 2 + 1 < this.items.length) {
        let child = i * 2 + 1
        if (
          child + 1 < this.items.length &&
          this.items[child + 1].cost < this.items[child].cost
        )
          child++
        if (this.items[child].cost >= last.cost) break
        this.items[i] = this.items[child]
        i = child
      }
      this.items[i] = last
    }
    return first
  }
}
type Graph = {
  points: (Point | null)[]
  edges: { index: number; cost: number }[][]
}
const graphs = new Map<string, Graph>()
function graphFor(actorId?: string) {
  const key = actorId ?? "player"
  if (graphs.has(key)) return graphs.get(key)!
  const points = Array.from({ length: rows * cols }, (_, i): Point | null => {
    const p: Point = [(i % cols) * step, Math.floor(i / cols) * step]
    return walkable(...p, actorId) ? p : null
  })
  const edges = points.map((p, i) => {
    const result: { index: number; cost: number }[] = []
    if (p)
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const index = i + dx + dz * cols,
          next = points[index]
        if (
          next &&
          Math.abs(next[0] - p[0]) <= step + epsilon &&
          movementClear(p, next, [], actorId)
        )
          result.push({ index, cost: Math.hypot(dx, dz) * step })
      }
    return result
  })
  const graph = { points, edges }
  graphs.set(key, graph)
  return graph
}
export function prepareNavigation() {
  graphFor()
}
function smoothPath(
  from: Point,
  path: Point[],
  occupied: Point[],
  actorId?: string
) {
  const result: Point[] = []
  let start = from,
    i = 0
  while (i < path.length) {
    let last = i
    while (
      last + 1 < path.length &&
      movementClear(start, path[last + 1], occupied, actorId)
    )
      last++
    result.push(path[last])
    start = path[last]
    i = last + 1
  }
  return result
}
function search(
  from: Point,
  to: Point,
  occupied: Point[],
  actorId?: string,
  approach = false
): Point[] {
  if (!inBounds(from) || !inBounds(to)) return []
  const clearGoal = movementClear(to, to, occupied, actorId)
  if (!approach && clearGoal && movementClear(from, to, occupied, actorId))
    return Math.hypot(from[0] - to[0], from[1] - to[1]) < 0.03 ? [] : [to]
  const { points, edges } = graphFor(actorId)
  const costs = new Float64Array(points.length).fill(Infinity),
    previous = new Int32Array(points.length).fill(-2)
  const heap = new MinHeap()
  points.forEach((p, i) => {
    if (!p) return
    const distance = Math.hypot(p[0] - from[0], p[1] - from[1])
    if (distance <= 0.6 && movementClear(from, p, occupied, actorId)) {
      costs[i] = distance
      previous[i] = -1
      heap.push({ index: i, cost: distance })
    }
  })
  let best = -1,
    bestDistance = Infinity,
    bestCost = Infinity
  while (heap.items.length) {
    const current = heap.pop(),
      p = points[current.index]!
    if (current.cost > costs[current.index] + epsilon) continue
    if (
      approach &&
      Math.hypot(p[0] - to[0], p[1] - to[1]) <= 2.15 &&
      Math.hypot(p[0] - to[0], p[1] - to[1]) >= characterClearance &&
      conversationClear(p, to) &&
      movementClear(p, p, occupied, actorId)
    ) {
      best = current.index
      break
    }
    if (!approach) {
      const distance = Math.hypot(p[0] - to[0], p[1] - to[1])
      if (
        clearGoal &&
        distance <= 0.6 &&
        movementClear(p, to, occupied, actorId)
      ) {
        const total = current.cost + distance
        if (total < bestCost) {
          best = current.index
          bestCost = total
        }
      } else if (
        !clearGoal &&
        (distance < bestDistance - epsilon ||
          (Math.abs(distance - bestDistance) < epsilon &&
            current.cost < bestCost))
      ) {
        best = current.index
        bestDistance = distance
        bestCost = current.cost
      }
      if (clearGoal && current.cost > bestCost) break
    }
    for (const next of edges[current.index]) {
      const cost = current.cost + next.cost
      if (
        cost < costs[next.index] - epsilon &&
        peopleClear(p, points[next.index]!, occupied)
      ) {
        costs[next.index] = cost
        previous[next.index] = current.index
        heap.push({ index: next.index, cost })
      }
    }
  }
  if (best < 0) return []
  const path: Point[] = []
  for (let i = best; i >= 0; i = previous[i]) path.push(points[i]!)
  path.reverse()
  if (!approach && clearGoal) path.push(to)
  return smoothPath(
    from,
    path.filter((p) => Math.hypot(p[0] - from[0], p[1] - from[1]) > 0.02),
    occupied,
    actorId
  )
}
export function findPath(
  from: Point,
  to: Point,
  occupied: Point[] = [],
  actorId = seatOwner(from)
): Point[] {
  return search(from, to, occupied, actorId)
}
export function findApproachPath(
  from: Point,
  target: Point,
  occupied: Point[] = []
): Point[] {
  if (
    Math.hypot(from[0] - target[0], from[1] - target[1]) <= 2.15 &&
    conversationClear(from, target) &&
    movementClear(from, from, occupied)
  )
    return []
  return search(from, target, occupied, undefined, true)
}
function conversationClear(from: Point, to: Point) {
  return [...managerWalls, ...partitions].every(
    (box) => !touchesBox(from, to, box, undefined, 0.03)
  )
}
