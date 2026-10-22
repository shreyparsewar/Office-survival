export const officeBounds = { left: 0.35, right: 17.65, back: 0.25, front: 15.4, height: 5.8 }
type Vector = { x: number; y: number; z: number }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

// Keep the orbit pivot near the work areas and the camera inside the room.
export function constrainOfficeCamera(camera: Vector, target: Vector) {
  const x = clamp(target.x, 2.6, 15.4)
  const z = clamp(target.z, 2.3, 13.1)
  camera.x += x - target.x
  camera.z += z - target.z
  target.x = x
  target.z = z
  target.y = clamp(target.y, 0.9, 2.2)
  camera.x = clamp(camera.x, officeBounds.left + 0.45, officeBounds.right - 0.45)
  camera.z = clamp(camera.z, officeBounds.back + 0.45, officeBounds.front - 0.45)
  camera.y = clamp(camera.y, 0.7, officeBounds.height - 0.45)
}
