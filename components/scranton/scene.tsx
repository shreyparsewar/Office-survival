"use client"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js"
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { Focus, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { employees } from "@/lib/scranton/roster"
import { findPath, movementClear, rooms, stations, type Point } from "@/lib/scranton/world"
import { constrainOfficeCamera } from "@/lib/scranton/camera"
import type { OfficeState } from "@/lib/scranton/simulation"
import { person, type VoxelPerson } from "./detailed-models"
import { officeModel } from "./interior-model"
import { Button } from "@/components/ui/8bit/button"
import { Badge } from "@/components/ui/8bit/badge"
import { Progress } from "@/components/ui/8bit/progress"

type Props = {
  state: OfficeState
  onSelect: (id: string) => void
  onStation: (id: string) => void
  focus: string
  focusSerial: number
}
function eDestination(id: string): Point {
  const e = employees.find((e) => e.id === id)!
  return e.department === "Accounting" || e.department === "Sales"
    ? stations.find((s) => s.id === "printer")!.position
    : e.department === "Management"
      ? [10, 4]
      : [2, 8]
}
export default function OfficeScene({
  state,
  onSelect,
  onStation,
  focus,
  focusSerial,
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const stateRef = useRef(state)
  const callbacks = useRef({ onSelect, onStation })
  stateRef.current = state
  callbacks.current = { onSelect, onStation }
  const controller = useRef<{
    focus: (id: string) => void
    approach: (id: string) => void
    reset: () => void
    zoom: (factor: number) => void
  } | null>(null)
  const [failed, setFailed] = useState(false)
  const selectCoworker = (id: string) => {
    onSelect(id)
    controller.current?.approach(id)
  }
  const [hover, setHover] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState({
    x: 0,
    y: 0,
    visible: false,
  })
  const [roomLabels, setRoomLabels] = useState<
    { name: string; x: number; y: number; visible: boolean }[]
  >([])
  useEffect(() => {
    controller.current?.focus(focus)
  }, [focus, focusSerial])
  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const world = officeModel()
    scene.add(world)
    scene.add(new THREE.HemisphereLight("#fff2dd", "#6b746e", 1.9))
    const sun = new THREE.DirectionalLight("#ffddb1", 4.2)
    sun.position.set(-8, 8, -9)
    sun.castShadow = true
    sun.shadow.mapSize.set(4096, 4096)
    sun.shadow.camera.left = -23
    sun.shadow.camera.right = 23
    sun.shadow.camera.top = 23
    sun.shadow.camera.bottom = -23
    sun.shadow.normalBias = 0.018
    sun.shadow.bias = -0.00015
    scene.add(sun)
    scene.add(sun.target)
    sun.target.position.set(10, 0, 7)
    const camera = new THREE.PerspectiveCamera(35, 1, .1, 100)
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const ambientOcclusion = new SSAOPass(scene, camera, 1, 1, 16)
    ambientOcclusion.kernelRadius = 0.3
    ambientOcclusion.minDistance = 0.001
    ambientOcclusion.maxDistance = 0.018
    composer.addPass(ambientOcclusion)
    const outline = new OutlinePass(new THREE.Vector2(1, 1), scene, camera)
    outline.visibleEdgeColor.set("#ffdf22")
    outline.hiddenEdgeColor.set("#000000")
    outline.edgeStrength = 5
    outline.edgeThickness = 1.5
    composer.addPass(outline)
    const output = new OutputPass()
    composer.addPass(output)
    let width = 1, height = 1
    const home = new THREE.Vector3(8.4, 1.3, 7.4)
    camera.position.set(home.x + 5.8, 5.15, 14.7)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(home)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.rotateSpeed = 0.65
    controls.minDistance = 2
    controls.maxDistance = 14
    controls.minPolarAngle = 0.25
    controls.maxPolarAngle = Math.PI / 2 - 0.08
    controls.update()
    constrainOfficeCamera(camera.position, controls.target)
    camera.lookAt(controls.target)
    controls.saveState()
    const target = controls.target
    const desiredTarget = home.clone()
    const desiredCameraOffset = new THREE.Vector3()
    let focusPending = false
    controls.addEventListener("start", () => { focusPending = false; desiredTarget.copy(target) })
    const updateCamera = () => {
      camera.aspect = width / height
      camera.fov = width / height < 1 ? 47 : 35
      camera.updateProjectionMatrix()
    }
    const resize = () => {
      width = el.clientWidth
      height = el.clientHeight
      renderer.setSize(width, height)
      composer.setSize(width, height)
      updateCamera()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(el)
    resize()
    controller.current = {
      focus: (id) => {
        const actor = actors.get(id)
        if (actor) {
          desiredTarget.set(actor.group.position.x, 1.3, actor.group.position.z)
          // A close three-quarter view leaves room beside the coworker for you.
          desiredCameraOffset.set(Math.sin(.6), .58, Math.cos(.6)).normalize().multiplyScalar(6.4)
          focusPending = true
        }
      },
      reset: () => { focusPending = false; controls.reset(); desiredTarget.copy(home) },
      zoom: (factor) => {
        focusPending = false
        const offset = camera.position.clone().sub(target)
        offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance))
        camera.position.copy(target).add(offset)
        controls.update()
        constrainOfficeCamera(camera.position, target)
        camera.lookAt(target)
      },
      approach: (id) => {
        const actor = actors.get(id)
        if (!actor) return
        controller.current?.focus(id)
        const coworker = positionOf(actor)
        // Face-to-face, with enough clearance for seated legs and swinging arms.
        routePlayer([coworker[0], coworker[1] + 1.85])
        interactingWith = id
      },
    }
    const actors = new Map<string, VoxelPerson>()
    for (const e of employees) {
      const a = person(e)
      a.group.position.set(
        ...([e.home[0], 0.08, e.home[1]] as [number, number, number])
      )
      a.group.userData.employee = e.id
      a.group.traverse((o) => {
        o.userData.employee = e.id
      })
      scene.add(a.group)
      actors.set(e.id, a)
    }
    const trips = new Map<
      string,
      { path: Point[]; returnAt: number; completed: number; homeward: boolean; goal: Point | null; retryAt: number }
    >()
    for (const e of employees)
      trips.set(e.id, {
        path: [],
        returnAt: 0,
        completed: stateRef.current.people[e.id].completed,
        homeward: false,
        goal: null,
        retryAt: 0,
      })
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const player = person({
      skin: "#e2b995",
      hair: "#42382e",
      shirt: "#487ab9",
      pants: "#a58a63",
      tie: "#d2af5d",
    })
    player.group.position.set(9.4, 0.08, 9.3)
    scene.add(player.group)
    const positionOf = (a: VoxelPerson): Point => [a.group.position.x, a.group.position.z]
    const occupiedByOthers = (id?: string): Point[] => [
      ...employees.filter(e => e.id !== id).flatMap(e => [e.home, positionOf(actors.get(e.id)!)]),
      ...(id ? [positionOf(player)] : []),
    ]
    let path: Point[] = []
    let playerGoal: Point | null = null
    let playerRetryAt = 0
    let interactingWith: string | null = null
    const routePlayer = (to: Point) => {
      interactingWith = null
      playerGoal = to
      path = findPath(positionOf(player), to, occupiedByOthers())
    }
    // Clamp each step and check its entire segment, so a long frame cannot
    // move through another character between two otherwise clear endpoints.
    const advance = (a: VoxelPerson, route: Point[], speed: number, dt: number, occupied: Point[]) => {
      if (!route.length) return false
      const from = positionOf(a), next = route[0]
      const dx = next[0] - from[0], dz = next[1] - from[1]
      const distance = Math.hypot(dx, dz)
      const fraction = distance ? Math.min(1, speed * dt / distance) : 1
      const to: Point = [from[0] + dx * fraction, from[1] + dz * fraction]
      if (!movementClear(from, to, occupied)) return false
      a.group.position.x = to[0]
      a.group.position.z = to[1]
      if (distance) a.group.rotation.y = Math.atan2(dx, dz)
      if (fraction === 1) route.shift()
      return distance > 0
    }
    const selection = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.54, 4),
      new THREE.MeshBasicMaterial({ color: "#e7bf58", side: THREE.DoubleSide })
    )
    selection.rotation.x = -Math.PI / 2
    scene.add(selection)
    const destination = selection.clone()
    destination.material = new THREE.MeshBasicMaterial({
      color: "#729c8b",
      side: THREE.DoubleSide,
    })
    scene.add(destination)
    destination.visible = false
    const ray = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hit = new THREE.Vector3()
    let dragging = false,
      dragged = false,
      lastX = 0,
      lastY = 0,
      downX = 0,
      downY = 0
    const pointRay = (event: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect()
      mouse.set(
        ((event.clientX - r.left) / r.width) * 2 - 1,
        (-(event.clientY - r.top) / r.height) * 2 + 1
      )
      ray.setFromCamera(mouse, camera)
    }
    const pick = (event: PointerEvent) => {
      pointRay(event)
      // Invisible station hit boxes must not cover a visible coworker.
      return ray.intersectObjects([...actors.values()].map(a => a.group), true)
        .find(i => i.object.userData.employee)
        ?? ray.intersectObjects(world.children.filter(o => o.userData.station), true)
          .find(i => i.object.userData.station)
    }
    const down = (e: PointerEvent) => {
      dragging = true
      dragged = false
      downX = e.clientX; downY = e.clientY
      renderer.domElement.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (dragging) {
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) dragged = true
      } else {
        const obj = pick(e)?.object
        const name = obj?.userData.employee ? employees.find(p => p.id === obj.userData.employee)?.name : stations.find(s => s.id === obj?.userData.station)?.name
        setHover(name ?? null)
        renderer.domElement.style.cursor = name ? "pointer" : "default"
      }
    }
    const up = (e: PointerEvent) => {
      dragging = false
      if (dragged || e.button !== 0) return
      const obj = pick(e)?.object
      if (obj?.userData.employee) {
        const id = obj.userData.employee
        callbacks.current.onSelect(id)
        controller.current?.approach(id)
      } else if (obj?.userData.station) {
        callbacks.current.onStation(obj.userData.station)
        routePlayer(stations.find((s) => s.id === obj.userData.station)!.position)
      } else {
        pointRay(e)
        if (ray.ray.intersectPlane(plane, hit))
          routePlayer([hit.x, hit.z])
      }
      if (path.length) {
        const p = path.at(-1)!
        destination.position.set(p[0], 0.09, p[1])
        destination.visible = true
      }
    }
    const key = (e: KeyboardEvent) => {
      if (document.activeElement !== renderer.domElement) return
      const dir: Record<string, Point> = {
        ArrowUp: [0, -1],
        w: [0, -1],
        ArrowDown: [0, 1],
        s: [0, 1],
        ArrowLeft: [-1, 0],
        a: [-1, 0],
        ArrowRight: [1, 0],
        d: [1, 0],
      }
      if (dir[e.key]) {
        e.preventDefault()
        const [x, z] = dir[e.key]
        routePlayer([
            Math.round(player.group.position.x) + x,
            Math.round(player.group.position.z) + z,
          ])
      }
    }
    renderer.domElement.tabIndex = 0
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D office. Drag to rotate 360 degrees, scroll to zoom, and right-drag or Shift-drag to pan. Click a coworker to interact or the floor to walk. Arrow keys move your character."
    )
    renderer.domElement.addEventListener("pointerdown", down)
    renderer.domElement.addEventListener("pointermove", move)
    renderer.domElement.addEventListener("pointerup", up)
    renderer.domElement.addEventListener("keydown", key)
    let frame = 0,
      last = performance.now(),
      labelTick = 0
    let alive = true
    let observedRun = stateRef.current.runId
    const animate = (now: number) => {
      if (!alive) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const t = now / 1000
      if (focusPending) {
        const blend = 1 - Math.exp(-dt * 5)
        const offset = camera.position.clone().sub(target).lerp(desiredCameraOffset, blend)
        target.lerp(desiredTarget, blend)
        camera.position.copy(target).add(offset)
        if (desiredTarget.distanceToSquared(target) < .0001 && offset.distanceToSquared(desiredCameraOffset) < .0001) focusPending = false
      }
      controls.update()
      constrainOfficeCamera(camera.position, target)
      camera.lookAt(target)
      if (!focusPending) desiredTarget.copy(target)
      const state = stateRef.current
      if (state.runId !== observedRun) {
        observedRun = state.runId
        path = []
        playerGoal = null
        interactingWith = null
        player.group.position.set(9.4, 0.08, 9.3)
        for (const e of employees) {
          actors.get(e.id)!.group.position.set(e.home[0], 0.08, e.home[1])
          trips.set(e.id, {
            path: [],
            returnAt: 0,
            completed: state.people[e.id].completed,
            homeward: false,
            goal: null,
            retryAt: 0,
          })
        }
        controls.reset()
        focusPending = false
        desiredTarget.copy(home)
      }
      for (const [id, a] of actors) {
        const p = state.people[id]
        const trip = trips.get(id)!
        const current: Point = [a.group.position.x, a.group.position.z]
        if (p.completed > trip.completed) {
          trip.completed = p.completed
          trip.goal = eDestination(id)
          trip.path = findPath(current, trip.goal, occupiedByOthers(id))
          trip.returnAt = t + 16
          trip.homeward = false
        }
        if (trip.returnAt && (t > trip.returnAt || p.job) && !trip.homeward) {
          trip.goal = employees.find((e) => e.id === id)!.home
          trip.path = findPath(current, trip.goal, occupiedByOthers(id))
          trip.homeward = true
          trip.returnAt = 0
        }
        const traveling = trip.path.length > 0
        const working = !!p.job && state.mode === "playing" && !traveling
        const e = employees.find((e) => e.id === id)!
        // Workers type; idle employees look around and occasionally walk to a neighbor.
        const offset = employees.findIndex((e) => e.id === id) * 0.7
        const seated =
          !traveling &&
          !trip.returnAt &&
          Math.hypot(current[0] - e.home[0], current[1] - e.home[1]) < 0.12 &&
          e.room !== "Conference" &&
          e.room !== "Break room" &&
          !(["michael", "pam", "jim"].includes(e.id))
        const wander =
          !seated &&
          !working &&
          !traveling &&
          !reduceMotion &&
          id !== state.selected &&
          Math.sin(t * 0.13 + offset) > 0.85
        const tx = e.home[0] + (wander ? 0.42 * Math.sin(t * 0.8 + offset) : 0)
        const tz = e.home[1] + (wander ? 0.45 : 0)
        const moving =
          traveling ||
          Math.abs(tx - a.group.position.x) +
            Math.abs(tz - a.group.position.z) >
            0.02
        if (traveling) {
          if (!advance(a, trip.path, 2.2, dt, occupiedByOthers(id)) && t >= trip.retryAt && trip.goal) {
            trip.retryAt = t + 0.6
            trip.path = findPath(current, trip.goal, occupiedByOthers(id))
          }
        } else if (!trip.returnAt) {
          const next: Point = [THREE.MathUtils.damp(current[0], tx, 6, dt), THREE.MathUtils.damp(current[1], tz, 6, dt)]
          if (movementClear(current, next, occupiedByOthers(id))) {
            a.group.position.x = next[0]
            a.group.position.z = next[1]
          } else if (t >= trip.retryAt) {
            trip.retryAt = t + 0.6
            trip.goal = e.home
            trip.path = findPath(current, trip.goal, occupiedByOthers(id))
          }
        }
        if (!traveling)
          a.group.rotation.y = THREE.MathUtils.damp(
            a.group.rotation.y,
            seated
              ? Math.PI
              : id === state.selected
                ? 0.7
                : Math.sin(t * 0.3 + offset) * 0.2,
            5,
            dt
          )
        a.leftArm.rotation.x = working
          ? -0.85 + Math.sin(t * 8 + offset) * 0.14
          : moving
            ? Math.sin(t * 8) * 0.4
            : Math.sin(t + offset) * 0.03
        a.rightArm.rotation.x = working
          ? -0.85 + Math.cos(t * 8 + offset) * 0.14
          : -a.leftArm.rotation.x
        if (["michael", "jim"].includes(id) && !moving) a.rightArm.rotation.x = -1.05
        a.group.position.y = seated ? -0.22 : 0.08
        a.leftLeg.rotation.x = seated
          ? -1.35
          : moving
            ? Math.sin(t * 8) * 0.3
            : 0
        a.rightLeg.rotation.x = seated ? -1.35 : -a.leftLeg.rotation.x
        a.leftKnee.rotation.x = a.rightKnee.rotation.x = seated ? 1.35 : 0
        a.head.rotation.y = seated
          ? id === state.selected ? -2.3 : working ? -.3 : -1.4 + Math.sin(t*.4+offset)*.2
          : Math.sin(t * 0.4 + offset) * 0.15
        if (interactingWith === id && !path.length && !traveling && !working) {
          const angle = Math.atan2(player.group.position.x - a.group.position.x, player.group.position.z - a.group.position.z)
          const relativeAngle = Math.atan2(Math.sin(angle - a.group.rotation.y), Math.cos(angle - a.group.rotation.y))
          a.head.rotation.y = relativeAngle
        }
        a.marker.visible = id === state.selected
        a.marker.rotation.y = reduceMotion ? 0 : t
        a.marker.position.y = 2.6 + (reduceMotion ? 0 : Math.sin(t * 3) * 0.08)
        a.work.visible = working
        a.work.rotation.y = t * 2
      }
      if (path.length) {
        if (!advance(player, path, 3.3, dt, occupiedByOthers()) && t >= playerRetryAt && playerGoal) {
          playerRetryAt = t + 0.6
          path = findPath(positionOf(player), playerGoal, occupiedByOthers())
        }
        player.leftLeg.rotation.x = Math.sin(t * 11) * 0.6
        player.rightLeg.rotation.x = -player.leftLeg.rotation.x
        player.leftArm.rotation.x = -player.leftLeg.rotation.x * 0.5
        player.rightArm.rotation.x = -player.leftArm.rotation.x
      } else {
        destination.visible = false
        player.leftLeg.rotation.x =
          player.rightLeg.rotation.x =
          player.leftArm.rotation.x =
          player.rightArm.rotation.x =
            0
        const coworker = interactingWith ? actors.get(interactingWith) : null
        if (coworker) {
          const angle = Math.atan2(coworker.group.position.x - player.group.position.x, coworker.group.position.z - player.group.position.z)
          const difference = Math.atan2(Math.sin(angle - player.group.rotation.y), Math.cos(angle - player.group.rotation.y))
          player.group.rotation.y += difference * (1 - Math.exp(-dt * 7))
        }
      }
      const chosen = actors.get(state.selected)
      if (chosen) {
        outline.selectedObjects = [chosen.group]
        selection.position.set(
          chosen.group.position.x,
          0.1,
          chosen.group.position.z
        )
        selection.rotation.z = t * 0.35
        if (now - labelTick > 100) {
          labelTick = now
          const v = chosen.group.position.clone()
          v.y = 2.7
          v.project(camera)
          setSelectedLabel({
            x: ((v.x + 1) * width) / 2,
            y: Math.max(82, ((1 - v.y) * height) / 2),
            visible: v.x > -1 && v.x < 1 && v.y > -1 && v.y < 1,
          })
          setRoomLabels(
            ["michael", "pam", "jim"].filter(id => id !== state.selected).map((id) => {
              const point = actors.get(id)!.group.position.clone()
              point.y = 2.75
              point.project(camera)
              return {
                name: id,
                x: ((point.x + 1) * width) / 2,
                y: ((1 - point.y) * height) / 2,
                visible:
                  point.x > -0.9 &&
                  point.x < 0.9 &&
                  point.y > -0.85 &&
                  point.y < 0.75,
              }
            })
          )
        }
      }
      composer.render()
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      controller.current = null
      controls.dispose()
      ambientOcclusion.dispose()
      outline.dispose()
      output.dispose()
      composer.dispose()
      renderer.dispose()
      scene.traverse((o) => {
        if (o instanceof THREE.InstancedMesh) o.dispose()
        if (o.userData.station && o instanceof THREE.Mesh) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        }
        if (
          o instanceof THREE.Mesh &&
          o.geometry !== undefined &&
          o.geometry.type !== "BoxGeometry"
        )
          o.geometry.dispose()
      })
      el.removeChild(renderer.domElement)
    }
  }, [])
  const selected = employees.find((e) => e.id === state.selected)!
  return (
    <div className="scranton-world">
      <div ref={host} className="scranton-canvas" />
      {!failed &&
        roomLabels
          .filter((l) => l.visible)
          .map((label) => (
            <div
              key={label.name}
              className="office-coworker-bubble"
              style={{ left: label.x, top: label.y }}
            >
              <Button variant="outline" size="sm" onClick={() => selectCoworker(label.name)}>
                {employees.find(e => e.id === label.name)!.name.split(" ")[0]} · {state.people[label.name].job ? "WORKING" : "AVAILABLE"}
              </Button>
            </div>
          ))}
      <div className="scranton-world-top">
        <Badge variant="secondary">SCRANTON BRANCH</Badge>
        <span>10 coworkers · Scranton</span>
      </div>
      {selectedLabel.visible && !failed && (
        <div
          className="scranton-character-label"
          style={{ left: selectedLabel.x, top: selectedLabel.y }}
        >
          <Button size="sm" className={state.people[selected.id].job ? "office-working-bubble" : ""} onClick={() => selectCoworker(selected.id)}>
            {state.people[selected.id].job ? <><span>{state.people[selected.id].job!.title}</span><Progress value={state.people[selected.id].job!.progress/state.people[selected.id].job!.duration*100} variant="retro" className="h-1"/><small>In progress</small></> : <>{selected.name.split(" ")[0]} · AVAILABLE</>}
          </Button>
        </div>
      )}
      {failed && (
        <div className="scranton-webgl-fallback">
          <h2>3D preview unavailable</h2>
          <p>
            This browser couldn't create a WebGL context. The entire simulation
            still works through the team directory and office stations.
          </p>
          <div>
            {rooms.map((r) => (
              <Badge key={r.name} variant="outline">
                {r.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {!failed && <div className="scranton-scene-controls" aria-label="Camera controls">
        <Button variant="outline" size="icon" aria-label="Zoom in" title="Zoom in" onClick={() => controller.current?.zoom(0.8)}><ZoomIn /></Button>
        <Button variant="outline" size="icon" aria-label="Zoom out" title="Zoom out" onClick={() => controller.current?.zoom(1.25)}><ZoomOut /></Button>
        <Button variant="outline" size="icon" aria-label="Center selected coworker" title="Center selected coworker" onClick={() => controller.current?.focus(state.selected)}><Focus /></Button>
        <Button variant="outline" size="icon" aria-label="Reset office view" title="Reset office view" onClick={() => controller.current?.reset()}><RotateCcw /></Button>
      </div>}
      <div className="scranton-world-caption">
        <span>
          {hover
            ? `CLICK TO INTERACT · ${hover}`
            : "CLICK A COWORKER OR AN OFFICE OBJECT"}
        </span>
        <span>
          <i />
          YOU · BLUE SHIRT
        </span>
      </div>
    </div>
  )
}
