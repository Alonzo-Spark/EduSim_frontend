import { Bodies, World } from 'matter-js';

export function applyPreset_Collision(api, options = {}) {
  const world = api.world;
  api.setGravity(1);

  const ground = Bodies.rectangle(600, 700, 1400, 80, { isStatic: true });
  World.add(world, ground);

  // two cars colliding
  const car1 = Bodies.rectangle(200, 320, 180, 60, { mass: 1500, friction: 0.3, restitution: 0.2, render: { fillStyle: '#2fb4ff' } });
  const car2 = Bodies.rectangle(800, 320, 180, 60, { mass: 1500, friction: 0.3, restitution: 0.2, render: { fillStyle: '#ff6b6b' } });
  World.add(world, [car1, car2]);

  // give velocities towards each other
  car1.velocity.x = 10;
  car2.velocity.x = -10;

  return { name: 'Collision', objects: [car1, car2, ground] };
}

export default applyPreset_Collision;
