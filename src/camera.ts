export type Point = { x: number; y: number };
export type Camera = Point & { scale: number };
export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, scale: 1 };
export function toWorld(point: Point, camera: Camera): Point {
  return { x: (point.x-camera.x)/camera.scale, y: (point.y-camera.y)/camera.scale };
}
export function zoomAt(camera: Camera, point: Point, scale: number): Camera {
  const next=Math.max(.35,Math.min(2.5,scale));const world=toWorld(point,camera);
  return { x:point.x-world.x*next,y:point.y-world.y*next,scale:next };
}
