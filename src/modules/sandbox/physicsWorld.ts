import Matter from 'matter-js'

export function setWorldGravity(x: number, y: number, scale = 0.001) {
  const engine = (window as any).physicsEngine
  if (engine) {
    engine.gravity.x = x
    engine.gravity.y = y
    engine.gravity.scale = scale
    console.log(`World gravity set to x: ${x}, y: ${y}`)
  } else {
    console.warn("Global physicsEngine not found. Buffering gravity update.");
  }
}

export function clearPhysicsWorld() {
  const world = (window as any).physicsWorld
  if (world) {
    Matter.World.clear(world, false)
    console.log("Cleared all bodies from physics world.")
  }
}
