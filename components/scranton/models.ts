import * as THREE from "three"
import { employees, type Employee } from "@/lib/scranton/roster"
import { rooms, stations } from "@/lib/scranton/world"
const cube = new THREE.BoxGeometry(1, 1, 1)
const materials = new Map<string, THREE.MeshLambertMaterial>()
function material(color: string) {
  if (!materials.has(color))
    materials.set(color, new THREE.MeshLambertMaterial({ color }))
  return materials.get(color)!
}
export function box(
  parent: THREE.Object3D,
  color: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number
) {
  const mesh = new THREE.Mesh(cube, material(color))
  mesh.position.set(x, y, z)
  mesh.scale.set(w, h, d)
  mesh.castShadow = h > 0.2
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}
export type VoxelPerson = {
  group: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
  head: THREE.Group
  marker: THREE.Mesh
  work: THREE.Mesh
}
export function person(
  e: Pick<Employee, "skin" | "hair" | "shirt" | "tie" | "style">
): VoxelPerson {
  const g = new THREE.Group()
  const head = new THREE.Group()
  head.position.y = 1.45
  g.add(head)
  box(head, e.skin, 0, 0, 0, 0.48, 0.5, 0.44)
  box(head, e.hair, 0, 0.25, -0.025, 0.52, 0.13, 0.48)
  box(head, e.hair, 0, 0.04, -0.22, 0.5, 0.4, 0.08)
  if (e.style === "long") {
    box(head, e.hair, -0.245, -0.13, 0, 0.1, 0.65, 0.4)
    box(head, e.hair, 0.245, -0.13, 0, 0.1, 0.65, 0.4)
  }
  if (e.style === "bald") {
    box(head, e.skin, 0, 0.27, 0.09, 0.36, 0.14, 0.25)
  }
  box(head, "#312d28", -0.115, 0.025, 0.228, 0.06, 0.065, 0.02)
  box(head, "#312d28", 0.115, 0.025, 0.228, 0.06, 0.065, 0.02)
  box(head, e.skin, 0, -0.04, 0.25, 0.08, 0.1, 0.06)
  box(head, "#9c6652", 0, -0.14, 0.23, 0.14, 0.027, 0.02)
  if (e.style === "glasses") {
    for (const x of [-0.12, 0.12]) {
      box(head, "#393c33", x, 0.045, 0.245, 0.18, 0.035, 0.025)
      box(head, "#393c33", x, -0.04, 0.245, 0.18, 0.025, 0.025)
      for (const dx of [-0.09, 0.09])
        box(head, "#393c33", x + dx, 0.005, 0.245, 0.025, 0.09, 0.025)
    }
    box(head, "#393c33", 0, 0.02, 0.247, 0.07, 0.025, 0.025)
  }
  if (e.style === "beard") box(head, e.hair, 0, -0.17, 0.24, 0.4, 0.15, 0.025)
  box(g, e.shirt, 0, 0.98, 0, 0.55, 0.52, 0.33)
  box(g, "#ede8d3", 0, 1.21, 0.185, 0.24, 0.08, 0.04)
  box(g, e.tie, 0, 1.01, 0.195, 0.075, 0.31, 0.035)
  const arm = (x: number) => {
    const a = new THREE.Group()
    a.position.set(x, 1.16, 0)
    g.add(a)
    box(a, e.shirt, 0, -0.13, 0, 0.16, 0.3, 0.26)
    box(a, e.skin, 0, -0.36, 0, 0.145, 0.19, 0.22)
    return a
  }
  const leg = (x: number) => {
    const l = new THREE.Group()
    l.position.set(x, 0.73, 0)
    g.add(l)
    box(l, "#414d49", 0, -0.26, 0, 0.2, 0.48, 0.25)
    box(l, "#2c3531", 0, -0.54, 0.055, 0.23, 0.14, 0.35)
    return l
  }
  const marker = box(g, "#eec563", 0, 2.05, 0, 0.14, 0.14, 0.14)
  marker.visible = false
  const work = box(g, "#72b29c", 0.33, 1.75, 0, 0.1, 0.1, 0.1)
  work.visible = false
  return {
    group: g,
    head,
    leftArm: arm(-0.36),
    rightArm: arm(0.36),
    leftLeg: leg(-0.15),
    rightLeg: leg(0.15),
    marker,
    work,
  }
}
function desk(g: THREE.Group, x: number, z: number, rotation = 0) {
  const d = new THREE.Group()
  d.position.set(x, 0, z)
  d.rotation.y = rotation
  g.add(d)
  box(d, "#b88755", 0, 0.75, 0, 1.35, 0.13, 0.72)
  box(d, "#dec094", 0, 0.825, 0, 1.35, 0.035, 0.72)
  for (const xx of [-0.52, 0.52]) box(d, "#737d6c", xx, 0.35, 0, 0.1, 0.7, 0.55)
  box(d, "#d1d0bc", 0.1, 1.07, -0.09, 0.47, 0.42, 0.26)
  box(d, "#343c35", 0.1, 1.075, 0.05, 0.36, 0.26, 0.025)
  box(d, "#79aba2", 0.1, 1.08, 0.068, 0.3, 0.2, 0.01)
  for (let i = 0; i < 3; i++)
    box(
      d,
      "#bed3b6",
      0.01,
      1.14 - i * 0.06,
      0.076,
      0.12 + i * 0.04,
      0.018,
      0.012
    )
  box(d, "#dfddc8", 0.1, 0.88, 0.24, 0.48, 0.05, 0.14)
  box(d, "#f3eedc", -0.44, 0.86, 0.17, 0.25, 0.028, 0.3)
  box(d, "#627d70", 0.51, 0.9, 0.12, 0.13, 0.15, 0.12)
  return d
}
function chair(g: THREE.Group, x: number, z: number) {
  box(g, "#536757", x, 0.45, z, 0.55, 0.15, 0.5)
  box(g, "#536757", x, 0.76, z + 0.2, 0.55, 0.5, 0.13)
  box(g, "#39483f", x, 0.2, z, 0.07, 0.4, 0.07)
  box(g, "#39483f", x, 0.07, z, 0.6, 0.065, 0.065)
}
function plant(g: THREE.Group, x: number, z: number) {
  box(g, "#a17653", x, 0.3, z, 0.45, 0.6, 0.45)
  box(g, "#664c38", x, 0.61, z, 0.35, 0.03, 0.35)
  box(g, "#60844f", x, 1.05, z, 0.2, 0.85, 0.2)
  box(g, "#6e9860", x - 0.2, 1.14, z, 0.5, 0.2, 0.36)
  box(g, "#80a767", x + 0.16, 1.4, z, 0.48, 0.24, 0.3)
  box(g, "#557a49", x, 1.63, z, 0.3, 0.2, 0.32)
}
function wall(
  g: THREE.Group,
  x: number,
  z: number,
  w: number,
  d: number,
  h = 1.8
) {
  box(g, "#e1dfc8", x, h / 2, z, w, h, d)
  box(g, "#f2eedb", x, h + 0.025, z, w + 0.035, 0.07, d + 0.035)
  box(g, "#82927f", x, 0.16, z, w, 0.27, d + 0.035)
}
export function officeModel() {
  const g = new THREE.Group()
  for (const r of rooms) {
    box(g, "#72836e", r.x + r.w / 2, -0.25, r.z + r.d / 2, r.w, 0.5, r.d)
    box(g, r.color, r.x + r.w / 2, 0.025, r.z + r.d / 2, r.w, 0.05, r.d)
    for (let x = r.x; x < r.x + r.w; x++)
      for (let z = r.z; z < r.z + r.d; z++) {
        box(
          g,
          (x + z) % 2 ? r.color : "#ffffff",
          x + 0.5,
          0.057,
          z + 0.5,
          0.98,
          0.006,
          0.98
        ).material = material(
          (x + z) % 2 ? r.color : r.color === "#b2b7a6" ? "#afb5a2" : r.color
        )
      }
  }
  box(g, "#adb8a0", 15.5, 0.025, 8, 3, 0.05, 14)
  // Cutaway front walls leave desks and faces visible; doors stay open.
  wall(g, 7.5, 1, 13, 0.18, 2.4)
  wall(g, 19.5, 1, 5, 0.18, 2.4)
  wall(g, 22, 8, 0.18, 14, 1.1)
  wall(g, 1, 3, 0.18, 4, 2.4)
  wall(g, 6, 2.5, 0.15, 3, 2.1)
  wall(g, 14, 3, 0.15, 4, 2.1)
  for (const [x, w] of [
    [1.8, 1.6],
    [6.6, 5.5],
    [12, 1.1],
  ] as number[][])
    wall(g, x, 5, w, 0.15, 0.8)
  wall(g, 16.7, 3, 0.15, 4, 1.5)
  wall(g, 18.6, 5, 2.4, 0.15, 0.85)
  wall(g, 21.5, 5, 1, 0.15, 0.85)
  wall(g, 16.7, 8, 0.15, 3, 0.65)
  wall(g, 16.7, 13, 0.15, 4, 0.65)
  wall(g, -2, 6, 6, 0.18, 1.1)
  // Blinds along the rear wall, filing cabinets and the recognizable manager desk.
  for (const x of [2.1, 4.7, 8, 11]) {
    box(g, "#657c70", x, 1.65, 1.11, 1.8, 1.05, 0.06)
    for (let i = 0; i < 7; i++)
      box(g, "#d7d5b8", x, 1.23 + i * 0.14, 1.16, 1.8, 0.09, 0.07)
  }
  for (const e of employees) {
    if (e.room === "Conference" || e.room === "Break room") continue
    desk(g, e.home[0], e.home[1] - 0.7)
    chair(g, e.home[0], e.home[1] + 0.3)
  }
  desk(g, 3, 12.25)
  chair(g, 3, 13.5)
  // Conference table with five visitors and six spare seats.
  box(g, "#bc9260", 10, 0.75, 3.3, 4.9, 0.18, 1.4)
  box(g, "#d9b889", 10, 0.85, 3.3, 4.95, 0.035, 1.45)
  for (const x of [8, 9.3, 10.6, 12]) {
    chair(g, x, 2.4)
    chair(g, x, 4.3)
  }
  box(g, "#f4efdd", 10, 0.9, 3.3, 0.6, 0.035, 0.45)
  box(g, "#688879", 10.8, 0.97, 3.3, 0.22, 0.18, 0.22)
  // Kitchen counter, fridge and break table.
  box(g, "#c8c6ad", 20.5, 0.55, 1.65, 2.3, 1.1, 0.55)
  box(g, "#e9e3cd", 20.5, 1.12, 1.65, 2.4, 0.09, 0.65)
  box(g, "#536758", 21, 1.34, 1.65, 0.42, 0.39, 0.35)
  box(g, "#b8bdad", 21.5, 0.9, 4, 0.7, 1.8, 0.65)
  box(g, "#7d8b7d", 21.13, 1.2, 4, 0.055, 0.22, 0.08)
  box(g, "#7d8b7d", 21.13, 0.5, 4, 0.055, 0.2, 0.08)
  box(g, "#ad865e", 18.5, 0.7, 3.6, 1.8, 0.15, 1.2)
  chair(g, 18.5, 4.3)
  chair(g, 19, 3)
  // Shared printer, reception bookshelves and entry bench.
  box(g, "#a0ab99", 13, 0.5, 5.5, 0.85, 1, 0.75)
  box(g, "#e0e0c9", 13, 1.03, 5.5, 0.9, 0.25, 0.8)
  box(g, "#425749", 13, 1.18, 5.57, 0.48, 0.05, 0.3)
  box(g, "#eee8d6", 13, 1.21, 5.6, 0.4, 0.025, 0.26)
  for (const x of [2, 4, 18, 20]) {
    box(g, "#7c8b78", x, 0.65, 14.5, 1, 1.3, 0.4)
    for (let i = 0; i < 3; i++) {
      box(g, "#a6b09c", x, 0.23 + i * 0.41, 14.74, 0.88, 0.3, 0.04)
      box(g, "#536754", x, 0.3 + i * 0.41, 14.78, 0.18, 0.035, 0.04)
    }
  }
  box(g, "#638377", -1, 0.5, 8, 1.4, 0.3, 2)
  box(g, "#638377", -1.6, 0.8, 8, 0.2, 0.8, 2)
  for (const [x, z] of [
    [1, 6],
    [5.5, 1.8],
    [13, 4],
    [17.4, 1.6],
    [21.5, 14],
  ])
    plant(g, x, z)
  for (const station of stations) {
    const pick = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    pick.position.set(station.position[0], 0.9, station.position[1])
    pick.userData.station = station.id
    g.add(pick)
  }
  // Batch static scenery by material. The room remains hundreds of real voxel
  // shapes, but rendering the whole floorplan only needs one draw per color.
  g.updateMatrixWorld(true)
  const batches = new Map<
    string,
    { material: THREE.Material; shadows: boolean; matrices: THREE.Matrix4[] }
  >()
  const stationPicks: THREE.Object3D[] = []
  g.traverse((o) => {
    if (o.userData.station) stationPicks.push(o)
    else if (o instanceof THREE.Mesh && o.geometry === cube) {
      const m = o.material as THREE.Material
      const key = `${m.uuid}-${o.castShadow}`
      const batch = batches.get(key) ?? {
        material: m,
        shadows: o.castShadow,
        matrices: [],
      }
      batch.matrices.push(o.matrixWorld.clone())
      batches.set(key, batch)
    }
  })
  const optimized = new THREE.Group()
  for (const { material: mat, matrices, shadows } of batches.values()) {
    const instances = new THREE.InstancedMesh(cube, mat, matrices.length)
    matrices.forEach((matrix, i) => instances.setMatrixAt(i, matrix))
    instances.castShadow = shadows
    instances.receiveShadow = true
    optimized.add(instances)
  }
  for (const p of stationPicks) optimized.add(p)
  return optimized
}
export function disposeModels() {
  cube.dispose()
  for (const m of materials.values()) m.dispose()
  materials.clear()
}
