import { Bodies, World } from 'matter-js';

export function applyPreset_SpacePhysics(api, options = {}) {
  const world = api.world;
  // low gravity
  api.setGravity(0.12);

  const objs = [];
  for (let i = 0; i < 8; i++) {
    const b = Bodies.circle(200 + i * 80, 300 + (i % 2) * 40, 22, { mass: 2, friction: 0.001, restitution: 0.95, render: { fillStyle: '#9be7ff' } });
    objs.push(b);
  }
  World.add(world, objs);

  return { name: 'Low Gravity / Space', objects: objs };
}

export default applyPreset_SpacePhysics;
