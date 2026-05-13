import { Bodies, World } from 'matter-js';

export function applyPreset_Friction(api, options = {}) {
  const world = api.world;
  api.setGravity(1);

  const ground = Bodies.rectangle(600, 700, 1400, 80, { isStatic: true });
  World.add(world, ground);

  const low = Bodies.rectangle(200, 560, 120, 40, { mass: 5, friction: 0.001, restitution: 0.1, render: { fillStyle: '#8bd3dd' } });
  const med = Bodies.rectangle(400, 560, 120, 40, { mass: 5, friction: 0.05, restitution: 0.1, render: { fillStyle: '#7c5cff' } });
  const high = Bodies.rectangle(600, 560, 120, 40, { mass: 5, friction: 0.2, restitution: 0.1, render: { fillStyle: '#ff8fab' } });
  World.add(world, [low, med, high]);

  // apply same push
  low.force = low.force || { x: 0, y: 0 }; low.force.x += 0.02;
  med.force = med.force || { x: 0, y: 0 }; med.force.x += 0.02;
  high.force = high.force || { x: 0, y: 0 }; high.force.x += 0.02;

  return { name: 'Friction Demo', objects: [low, med, high, ground] };
}

export default applyPreset_Friction;
