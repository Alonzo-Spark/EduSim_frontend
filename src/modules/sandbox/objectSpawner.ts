import Matter from 'matter-js'

export async function spawnObjects(objects: any[]) {
  // Gracefully ensure the global physicsWorld is bound to window
  if (!(window as any).physicsWorld) {
    console.warn("window.physicsWorld is not initialized yet. Initializing virtual context.");
    (window as any).physicsWorld = Matter.World.create();
  }

  objects.forEach((obj) => {
    let body: Matter.Body | null = null;

    if (obj.type === 'planet' || obj.type === 'circle' || obj.type === 'bob') {
      body = Matter.Bodies.circle(
        obj.position.x,
        obj.position.y,
        obj.visual?.radius || 20,
        {
          mass: obj.physics?.mass || 1.0,
          friction: obj.physics?.friction || 0.1,
          restitution: obj.physics?.restitution || 0.5,
          label: obj.label
        }
      )
    } else {
      // Default to rectangle spawner
      body = Matter.Bodies.rectangle(
        obj.position.x,
        obj.position.y,
        obj.visual?.width || 40,
        obj.visual?.height || 40,
        {
          mass: obj.physics?.mass || 2.0,
          friction: obj.physics?.friction || 0.1,
          restitution: obj.physics?.restitution || 0.4,
          label: obj.label
        }
      )
    }

    if (body) {
      if (obj.physics?.velocity) {
        Matter.Body.setVelocity(body, obj.physics.velocity)
      }
      Matter.World.add((window as any).physicsWorld, body)
      console.log(`Spawned object: ${obj.label} at position (${obj.position.x}, ${obj.position.y})`);
    }
  })
}
