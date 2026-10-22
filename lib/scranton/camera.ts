export const officeBounds = {
  left: 0.35,
  right: 17.65,
  back: 0.25,
  front: 15.4,
  height: 5.8,
}
type Vector = { x: number; y: number; z: number }
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

// Keep the orbit pivot near the work areas and the camera inside the room.
export function constrainOfficeCamera(camera: Vector, target: Vector) {
  const x = clamp(target.x, 2.6, 15.4)
  const z = clamp(target.z, 2.3, 13.1)
  camera.x += x - target.x
  camera.z += z - target.z
  target.x = x
  target.z = z
  target.y = clamp(target.y, 0.9, 2.2)
  // Shorten the orbit ray uniformly. Clamping each coordinate separately used
  // to distort the orbit angle and make rotation stick to room corners.
  let dx = camera.x - target.x,
    dy = camera.y - target.y,
    dz = camera.z - target.z
  if (![dx, dy, dz].every(Number.isFinite) || Math.hypot(dx, dy, dz) < 0.01) {
    dx = 0
    dy = 2
    dz = 4
  }
  let scale = 1
  for (const [origin, delta, min, max] of [
    [target.x, dx, officeBounds.left + 0.4, officeBounds.right - 0.4],
    [target.y, dy, 0.7, officeBounds.height - 0.4],
    [target.z, dz, officeBounds.back + 0.4, officeBounds.front - 0.4],
  ]) {
    if (delta > 0) scale = Math.min(scale, (max - origin) / delta)
    if (delta < 0) scale = Math.min(scale, (min - origin) / delta)
  }
  camera.x = target.x + dx * scale
  camera.y = target.y + dy * scale
  camera.z = target.z + dz * scale
}
