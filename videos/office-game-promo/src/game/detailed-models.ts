import * as THREE from "three"
import { type Employee } from "./roster"

const cube = new THREE.BoxGeometry(1, 1, 1)
const palette = new Map<string, THREE.MeshStandardMaterial>()
const textures = new Map<string, THREE.CanvasTexture>()
function paint(color: string) {
  if (!palette.has(color))
    palette.set(
      color,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.88,
        metalness: 0.015,
      })
    )
  return palette.get(color)!
}
function shade(color: string, light: number) {
  const c = new THREE.Color(color)
  c.multiplyScalar(light)
  return `#${c.getHexString()}`
}
export function voxel(
  parent: THREE.Object3D,
  color: string | THREE.Material,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number
) {
  const m = new THREE.Mesh(
    cube,
    typeof color === "string" ? paint(color) : color
  )
  m.position.set(x, y, z)
  m.scale.set(w, h, d)
  m.castShadow = h > 0.045
  m.receiveShadow = true
  parent.add(m)
  return m
}
export function texture(
  name: string,
  draw: (ctx: CanvasRenderingContext2D) => void,
  width = 256,
  height = 256
) {
  if (textures.has(name)) return textures.get(name)!
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  draw(ctx)
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = THREE.NearestFilter
  t.minFilter = THREE.LinearMipmapLinearFilter
  textures.set(name, t)
  return t
}
function random(seed: number) {
  let n = seed
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0
    return n / 4294967296
  }
}
export function surface(kind: "wood" | "carpet" | "fabric") {
  const map = texture(kind, (ctx) => {
    const rand = random(1999)
    ctx.fillStyle =
      kind === "wood" ? "#b58044" : kind === "carpet" ? "#899990" : "#365878"
    ctx.fillRect(0, 0, 256, 256)
    for (let i = 0; i < 9000; i++) {
      const x = Math.floor(rand() * 256),
        y = Math.floor(rand() * 256)
      ctx.fillStyle =
        kind === "wood"
          ? i % 3
            ? "#c2965a"
            : "#936034"
          : kind === "carpet"
            ? i % 3
              ? "#91a197"
              : "#4e6967"
            : i % 3
              ? "#587595"
              : "#213f5c"
      ctx.globalAlpha = kind === "wood" ? 0.13 : 0.24
      ctx.fillRect(x, y, kind === "wood" ? 20 + rand() * 80 : 2, 1)
    }
    ctx.globalAlpha = 1
    if (kind === "carpet") {
      ctx.strokeStyle = "#9aab9b"
      ctx.globalAlpha = 0.17
      for (let i = 0; i < 256; i += 64) {
        ctx.strokeRect(i, 0, 64, 64)
        ctx.strokeRect(i, 128, 64, 64)
        ctx.strokeRect(i, 64, 64, 64)
        ctx.strokeRect(i, 192, 64, 64)
      }
    }
  })
  if (kind === "carpet") {
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(10, 8)
  }
  return new THREE.MeshStandardMaterial({
    map,
    roughness: 1,
    color: "#ffffff",
  })
}
export function sign(
  parent: THREE.Object3D,
  label: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  bg = "#122b36",
  fg = "#f4ce61"
) {
  const map = texture(
    `sign-${label}-${bg}`,
    (ctx) => {
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, 512, 128)
      ctx.fillStyle = fg
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.font = `bold ${label.length > 20 ? 28 : 45}px monospace`
      ctx.fillText(label, 256, 68, 480)
    },
    512,
    128
  )
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map, roughness: 1 })
  )
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}
export function batch(group: THREE.Group) {
  group.updateMatrixWorld(true)
  const inverse = group.matrixWorld.clone().invert()
  const meshes = group.children.filter(
    (o): o is THREE.Mesh =>
      o instanceof THREE.Mesh &&
      !(o instanceof THREE.InstancedMesh) &&
      o.geometry === cube &&
      !o.userData.station &&
      !o.userData.dynamic
  )
  const buckets = new Map<
    string,
    { material: THREE.Material; matrices: THREE.Matrix4[]; shadow: boolean }
  >()
  for (const mesh of meshes) {
    const mat = mesh.material as THREE.Material
    const key = `${mat.uuid}/${mesh.castShadow}`
    const b = buckets.get(key) ?? {
      material: mat,
      matrices: [],
      shadow: mesh.castShadow,
    }
    b.matrices.push(inverse.clone().multiply(mesh.matrixWorld))
    buckets.set(key, b)
    group.remove(mesh)
  }
  for (const b of buckets.values()) {
    const inst = new THREE.InstancedMesh(cube, b.material, b.matrices.length)
    b.matrices.forEach((m, i) => inst.setMatrixAt(i, m))
    inst.castShadow = b.shadow
    inst.receiveShadow = true
    group.add(inst)
  }
  return group
}

export type VoxelPerson = {
  group: THREE.Group
  head: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
  leftKnee: THREE.Group
  rightKnee: THREE.Group
  marker: THREE.Mesh
  work: THREE.Mesh
}
export function person(
  e: Pick<Employee, "skin" | "hair" | "shirt" | "tie" | "style"> & {
    pants?: string
    id?: string
  }
): VoxelPerson {
  const g = new THREE.Group()
  const head = new THREE.Group()
  head.position.set(0, 1.88, 0)
  g.add(head)
  voxel(head, e.skin, 0, 0, 0, 0.64, 0.64, 0.6)
  voxel(head, shade(e.skin, 0.82), 0, -0.12, -0.29, 0.61, 0.38, 0.055)
  for (const x of [-0.35, 0.35])
    voxel(head, e.skin, x, -0.03, 0, 0.12, 0.2, 0.22)
  voxel(head, shade(e.skin, 1.1), 0, -0.04, 0.328, 0.1, 0.15, 0.08)
  for (const x of [-0.145, 0.145]) {
    voxel(head, "#241d18", x, 0.055, 0.31, 0.075, 0.085, 0.027)
    voxel(head, e.hair, x, 0.16, 0.315, 0.15, 0.035, 0.022)
    voxel(head, shade(e.skin, 0.9), x, -0.12, 0.314, 0.16, 0.035, 0.018)
  }
  voxel(head, "#714531", 0, -0.205, 0.312, 0.16, 0.035, 0.026)
  const rand = random(parseInt(e.hair.slice(1), 16))
  // Individual stepped hair blocks remain visible in the close camera.
  for (let x = -2; x <= 2; x++)
    for (let z = -2; z <= 2; z++) {
      if (e.style === "bald" && Math.abs(x) < 2 && z >= 0) continue
      const level = 0.035 + Math.round(rand() * 2) * 0.035
      voxel(
        head,
        shade(e.hair, 0.8 + rand() * 0.3),
        x * 0.135,
        0.34 + level,
        z * 0.125,
        0.143,
        0.14 + level,
        0.14
      )
    }
  for (const x of [-0.29, 0.29])
    for (let y = 0; y < 3; y++)
      voxel(head, e.hair, x, 0.24 - y * 0.1, -0.12, 0.1, 0.12, 0.35)
  if (e.style === "long") {
    for (const x of [-0.32, 0.32])
      for (let y = 0; y < 7; y++)
        for (let z = -1; z <= 1; z++)
          voxel(
            head,
            shade(e.hair, 0.86 + (y % 3) * 0.07),
            x,
            0.2 - y * 0.12,
            z * 0.15 - 0.09,
            0.12,
            0.14,
            0.17
          )
    voxel(head, e.hair, 0, -0.18, -0.33, 0.6, 0.7, 0.12)
  }
  if (e.style === "glasses") {
    for (const x of [-0.16, 0.16]) {
      for (const y of [0.12, -0.02])
        voxel(head, "#171e1b", x, y, 0.35, 0.23, 0.035, 0.035)
      for (const dx of [-0.115, 0.115])
        voxel(head, "#171e1b", x + dx, 0.05, 0.35, 0.035, 0.17, 0.035)
    }
    voxel(head, "#171e1b", 0, 0.075, 0.355, 0.105, 0.035, 0.035)
  }
  if (e.style === "beard") {
    voxel(head, e.hair, 0, -0.25, 0.32, 0.52, 0.15, 0.035)
    for (const x of [-0.25, 0.25])
      voxel(head, e.hair, x, -0.15, 0.32, 0.07, 0.23, 0.04)
  }
  voxel(g, e.skin, 0, 1.5, 0, 0.21, 0.22, 0.21)
  voxel(g, e.shirt, 0, 1.17, 0, 0.67, 0.65, 0.44)
  voxel(g, shade(e.shirt, 0.87), 0, 1.13, -0.21, 0.65, 0.52, 0.035)
  for (const x of [-0.11, 0.11]) {
    const collar = voxel(g, "#eee9da", x, 1.47, 0.247, 0.18, 0.12, 0.055)
    collar.rotation.z = x < 0 ? -0.28 : 0.28
  }
  voxel(g, e.tie, 0, 1.33, 0.27, 0.1, 0.14, 0.055)
  voxel(g, e.tie, 0, 1.11, 0.268, 0.09, 0.33, 0.048)
  voxel(g, shade(e.tie, 0.83), 0, 0.925, 0.27, 0.11, 0.065, 0.048)
  for (const y of [1.4, 1.27, 1.13, 0.99])
    voxel(g, "#ece8dd", 0.06, y, 0.229, 0.025, 0.025, 0.013)
  voxel(g, shade(e.shirt, 0.84), -0.225, 1.26, 0.24, 0.17, 0.16, 0.015)
  voxel(g, "#bda48a", -0.24, 1.33, 0.257, 0.03, 0.12, 0.015)
  const pants = e.pants ?? "#514b42"
  voxel(g, pants, 0, 0.79, 0, 0.65, 0.2, 0.41)
  voxel(g, "#3d3125", 0, 0.84, 0.012, 0.68, 0.072, 0.43)
  voxel(g, "#b8a256", 0, 0.843, 0.234, 0.105, 0.072, 0.032)
  const arm = (x: number) => {
    const a = new THREE.Group()
    a.position.set(x, 1.43, 0)
    g.add(a)
    voxel(a, e.shirt, 0, -0.14, 0, 0.22, 0.32, 0.32)
    voxel(a, shade(e.shirt, 0.86), 0, -0.29, 0, 0.2, 0.18, 0.29)
    voxel(a, "#e4ddcb", 0, -0.42, 0, 0.205, 0.085, 0.3)
    voxel(a, e.skin, 0, -0.54, 0.02, 0.2, 0.18, 0.25)
    for (let i = 0; i < 3; i++)
      voxel(
        a,
        shade(e.skin, 0.91),
        -0.07 + i * 0.065,
        -0.64,
        0.08,
        0.05,
        0.07,
        0.12
      )
    return a
  }
  const leg = (x: number) => {
    const l = new THREE.Group()
    l.position.set(x, 0.77, 0)
    g.add(l)
    voxel(l, pants, 0, -0.17, 0, 0.26, 0.35, 0.35)
    voxel(
      l,
      shade(pants, 0.86),
      x < 0 ? -0.1 : 0.1,
      -0.18,
      0.01,
      0.035,
      0.3,
      0.34
    )
    const knee = new THREE.Group()
    knee.position.y = -0.34
    l.add(knee)
    voxel(knee, pants, 0, -0.17, 0, 0.245, 0.35, 0.32)
    voxel(knee, "#382d24", 0, -0.385, 0.065, 0.28, 0.13, 0.47)
    voxel(knee, "#211f1c", 0, -0.448, 0.066, 0.29, 0.035, 0.48)
    return { l, knee }
  }
  const left = leg(-0.17),
    right = leg(0.17),
    leftArm = arm(-0.43),
    rightArm = arm(0.43)
  if (e.id === "michael") {
    voxel(rightArm,"#eee6cf",0,-.52,.22,.2,.24,.2)
    voxel(rightArm,"#593b23",0,-.393,.22,.15,.012,.15)
    voxel(rightArm,"#eee6cf",.13,-.51,.22,.1,.11,.04)
    sign(rightArm,"BOSS",0,-.53,.326,.17,.05,"#eee6cf","#253736")
  }
  const marker = voxel(g, "#ffdf39", 0, 2.65, 0, 0.1, 0.1, 0.1)
  marker.visible = false
  marker.userData.dynamic = true
  const work = voxel(g, "#f1cf55", 0.4, 2.42, 0, 0.085, 0.085, 0.085)
  work.visible = false
  work.userData.dynamic = true
  const groups: THREE.Group[] = []
  g.traverse((o) => {
    if (o instanceof THREE.Group) groups.push(o)
  })
  groups.reverse().forEach(batch)
  return {
    group: g,
    head,
    leftArm,
    rightArm,
    leftLeg: left.l,
    rightLeg: right.l,
    leftKnee: left.knee,
    rightKnee: right.knee,
    marker,
    work,
  }
}

export function binders(g: THREE.Group, x: number, y: number, z: number) {
  for (let i = 0; i < 4; i++) {
    const c = ["#263f56", "#172e45", "#ded7bc", "#263f56"][i]
    voxel(g, c, x + i * 0.1, y, z, 0.078, 0.38, 0.25)
    voxel(g, "#f5ecd7", x + i * 0.1, y + 0.03, z + 0.132, 0.048, 0.19, 0.014)
    voxel(g, "#a8a891", x + i * 0.1, y - 0.12, z + 0.142, 0.025, 0.025, 0.013)
  }
}
export function papers(g: THREE.Group, x: number, y: number, z: number) {
  for (let i = 0; i < 5; i++)
    voxel(
      g,
      i % 2 ? "#fff9e8" : "#e1d8bf",
      x + (i % 2) * 0.025,
      y + i * 0.014,
      z,
      0.3,
      0.012,
      0.41
    )
  for (let i = 0; i < 5; i++)
    voxel(g, "#a9ada4", x, y + 0.079, z - 0.13 + i * 0.043, 0.19, 0.002, 0.008)
}
export function cup(g: THREE.Group, x: number, y: number, z: number) {
  voxel(g, "#e7dfc9", x, y + 0.12, z, 0.18, 0.25, 0.18)
  voxel(g, "#593b23", x, y + 0.25, z, 0.145, 0.013, 0.14)
  voxel(g, "#e7dfc9", x + 0.12, y + 0.12, z, 0.11, 0.11, 0.045)
  voxel(g, "#76624a", x, y + 0.02, z, 0.22, 0.025, 0.22)
}
export function plant(g: THREE.Group, x: number, z: number, scale = 1) {
  const p = new THREE.Group()
  p.position.set(x, 0, z)
  p.scale.setScalar(scale)
  g.add(p)
  voxel(p, "#bca477", 0, 0.22, 0, 0.46, 0.43, 0.46)
  voxel(p, "#dfc69a", 0, 0.4, 0, 0.5, 0.07, 0.5)
  voxel(p, "#524632", 0, 0.442, 0, 0.42, 0.016, 0.42)
  voxel(p, "#687647", 0, 0.98, 0, 0.06, 1.1, 0.06)
  const rng = random(Math.round((x + z) * 99))
  for (let i = 0; i < 40; i++) {
    const angle = rng() * Math.PI * 2
    const y = 0.56 + rng() * 1.13
    const radius = (1.65 - y) * 0.36 + 0.08
    voxel(
      p,
      ["#5d7939", "#718a43", "#98aa4d", "#365c2f", "#8f9a3f"][i % 5],
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
      0.15 + rng() * 0.08,
      0.1 + rng() * 0.06,
      0.13 + rng() * 0.1
    )
  }
  return p
}
export function monitor(g: THREE.Group, x: number, y: number, z: number) {
  voxel(g, "#c6c3ad", x, y + 0.32, z, 0.6, 0.54, 0.42)
  voxel(g, "#e7e0c8", x, y + 0.32, z + 0.224, 0.58, 0.53, 0.045)
  voxel(g, "#304448", x, y + 0.36, z + 0.252, 0.47, 0.35, 0.019)
  const map = texture(
    "spreadsheet",
    (ctx) => {
      ctx.fillStyle = "#719cc7"
      ctx.fillRect(0, 0, 256, 192)
      ctx.fillStyle = "#d9e1d6"
      ctx.fillRect(6, 25, 244, 160)
      ctx.fillStyle = "#284f78"
      ctx.fillRect(0, 0, 256, 18)
      ctx.fillStyle = "#f5f5e4"
      ctx.font = "12px monospace"
      ctx.fillText("Q3_REPORT.XLS", 9, 13)
      ctx.strokeStyle = "#8eaeac"
      ctx.lineWidth = 1
      for (let y = 41; y < 192; y += 14) {
        ctx.beginPath()
        ctx.moveTo(6, y)
        ctx.lineTo(250, y)
        ctx.stroke()
      }
      for (let x = 20; x < 256; x += 40) {
        ctx.beginPath()
        ctx.moveTo(x, 25)
        ctx.lineTo(x, 192)
        ctx.stroke()
      }
      ctx.fillStyle = "#394b61"
      ctx.font = "9px monospace"
      for (let y = 50; y < 186; y += 14)
        for (let x = 26; x < 240; x += 40)
          ctx.fillText(String((x * y) % 1000), x, y)
    },
    256,
    192
  )
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.32),
    new THREE.MeshStandardMaterial({
      map,
      emissive: "#8dacba",
      emissiveIntensity: 0.19,
      roughness: 0.8,
    })
  )
  screen.position.set(x, y + 0.36, z + 0.265)
  g.add(screen)
  voxel(g, "#8c9485", x + 0.15, y + 0.11, z + 0.252, 0.035, 0.035, 0.023)
  voxel(g, "#bfbba5", x, y + 0.025, z, 0.3, 0.06, 0.24)
}
export function keyboard(g: THREE.Group, x: number, y: number, z: number) {
  voxel(g, "#d3cbb7", x, y, z, 0.59, 0.045, 0.22)
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 10; col++)
      voxel(
        g,
        (row + col) % 7 ? "#efebdb" : "#b4b6ab",
        x - 0.25 + col * 0.052,
        y + 0.03,
        z - 0.075 + row * 0.047,
        0.041,
        0.015,
        0.035
      )
  voxel(g, "#e5dfcb", x + 0.47, y + 0.016, z, 0.1, 0.056, 0.145)
}
export function desk(
  g: THREE.Group,
  x: number,
  z: number,
  wood: THREE.Material
) {
  const d = new THREE.Group()
  d.position.set(x, 0, z)
  g.add(d)
  voxel(d, wood, 0, 0.83, 0, 1.9, 0.12, 1.06)
  voxel(d, "#835830", 0, 0.77, 0, 1.88, 0.075, 1.04)
  voxel(d, "#b38552", -0.65, 0.38, 0.02, 0.49, 0.75, 0.87)
  for (let i = 0; i < 3; i++) {
    voxel(d, "#c19966", -0.65, 0.15 + i * 0.22, 0.473, 0.43, 0.19, 0.027)
    voxel(d, "#584e3c", -0.65, 0.195 + i * 0.22, 0.498, 0.18, 0.032, 0.037)
  }
  for (const xx of [0.63, 0.83]) voxel(d, "#67665a", xx, 0.4, 0, 0.05, 0.8, 0.7)
  monitor(d, 0.2, 0.89, -0.16)
  keyboard(d, 0.2, 0.923, 0.27)
  binders(d, -0.81, 1.09, -0.26)
  papers(d, -0.49, 0.905, 0.21)
  cup(d, 0.76, 0.9, -0.29)
  voxel(d, "#394b48", 0.77, 0.99, 0.16, 0.13, 0.18, 0.13)
  for (let i = 0; i < 4; i++)
    voxel(
      d,
      ["#c79643", "#355785", "#a85331", "#44493a"][i],
      0.735 + i * 0.025,
      1.13,
      0.17,
      0.014,
      0.27,
      0.013
    )
  voxel(d, "#ece2b9", -0.09, 0.93, 0.25, 0.15, 0.012, 0.16)
  return d
}
export function chair(g: THREE.Group, x: number, z: number, fabric: THREE.Material) {
  voxel(g, fabric, x, 0.54, z, 0.69, 0.17, 0.65)
  voxel(g, "#233e52", x, 0.43, z, 0.72, 0.08, 0.69)
  voxel(g, fabric, x, 1.04, z + 0.34, 0.7, 0.73, 0.17)
  voxel(g, "#233e52", x, 1.02, z + 0.45, 0.58, 0.61, 0.055)
  for (const xx of [-0.41, 0.41]) {
    voxel(g, "#333c39", x + xx, 0.7, z, 0.065, 0.45, 0.05)
    voxel(g, "#2c3533", x + xx, 0.91, z, 0.11, 0.065, 0.45)
  }
  voxel(g, "#3e4640", x, 0.27, z, 0.07, 0.48, 0.07)
  for (let i = 0; i < 5; i++) {
    const leg = voxel(g, "#333c37", x, 0.09, z, 0.72, 0.05, 0.055)
    leg.rotation.y = (i * Math.PI) / 5
    const xx = Math.cos((i * Math.PI * 2) / 5) * 0.33,
      zz = Math.sin((i * Math.PI * 2) / 5) * 0.33
    voxel(g, "#242c29", x + xx, 0.05, z + zz, 0.11, 0.075, 0.1)
  }
}
export function partition(g: THREE.Group, x: number, z: number, w: number, d: number) {
  voxel(g, "#c5bca0", x, 0.54, z, w, 1.08, d)
  voxel(g, "#e6dcc2", x, 1.08, z, w + 0.015, 0.04, d + 0.02)
  voxel(g, "#a79c83", x, 0.06, z, w, 0.1, d + 0.02)
}
export function printer(g: THREE.Group, x: number, z: number) {
  const p = new THREE.Group()
  p.position.set(x, 0, z)
  g.add(p)
  voxel(p, "#c7c5b4", 0, 0.54, 0, 0.93, 1.08, 0.85)
  for (let i = 0; i < 3; i++) {
    voxel(p, "#e6e0c9", 0, 0.2 + i * 0.28, 0.44, 0.83, 0.23, 0.036)
    voxel(p, "#77877e", 0, 0.27 + i * 0.28, 0.471, 0.27, 0.03, 0.028)
  }
  voxel(p, "#d8d6c4", 0, 1.19, 0, 1.02, 0.23, 0.96)
  voxel(p, "#ebe5cf", -0.05, 1.39, -0.16, 0.82, 0.16, 0.64)
  voxel(p, "#3b4d48", 0, 1.21, 0.51, 0.63, 0.065, 0.04)
  voxel(p, "#dfdac7", 0.43, 1.34, 0.3, 0.23, 0.07, 0.35)
  voxel(p, "#799079", 0.4, 1.39, 0.32, 0.1, 0.008, 0.16)
  papers(p, 0, 1.48, -0.18)
  papers(p, 0, 1.22, 0.54)
  sign(p, "PRINT / READY", 0.02, 1.355, 0.49, 0.28, 0.08, "#5c7661", "#d9e8b6")
}
export function glass(
  g: THREE.Group,
  x: number,
  z: number,
  w: number,
  d: number,
  material: THREE.Material
) {
  voxel(g, material, x, 1.7, z, w, 3.4, d).castShadow = false
  const horizontal = w > d
  voxel(g, "#263e44", x, 0.065, z, w + 0.04, 0.13, d + 0.04)
  voxel(g, "#263e44", x, 3.43, z, w + 0.04, 0.12, d + 0.04)
  if (horizontal)
    for (const xx of [-w / 2, w / 2])
      voxel(g, "#263e44", x + xx, 1.75, z, 0.08, 3.5, 0.095)
  else
    for (const zz of [-d / 2, d / 2])
      voxel(g, "#263e44", x, 1.75, z + zz, 0.095, 3.5, 0.08)
}
export function bookshelf(g: THREE.Group, x: number, z: number, wood: THREE.Material) {
  voxel(g, wood, x, 1.12, z, 1.3, 2.24, 0.4)
  for (let r = 0; r < 4; r++) {
    voxel(g, "#292e29", x, 0.32 + r * 0.49, z + 0.215, 1.12, 0.37, 0.025)
    voxel(g, "#b28d5b", x, 0.1 + r * 0.5, z + 0.23, 1.23, 0.05, 0.08)
    binders(g, x - 0.47, 0.32 + r * 0.5, z + 0.27)
    binders(g, x + 0.04, 0.32 + r * 0.5, z + 0.27)
  }
}
