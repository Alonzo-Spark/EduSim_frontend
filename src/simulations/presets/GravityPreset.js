import { Bodies, World } from 'matter-js';

export function applyPreset_Gravity(api, options = {}) {
  const world = api.world;
  api.setGravity(options.g ?? 1);

  const ground = Bodies.rectangle(600, 700, 1400, 80, { isStatic: true });
  World.add(world, ground);

  const boxes = [];
  for (let i = 0; i < 6; i++) {
    const b = Bodies.rectangle(300 + i * 60, 200 - i * 30, 48, 48, { mass: 2, friction: 0.1, restitution: 0.1 });
    boxes.push(b);
  }
  World.add(world, boxes);

  return { name: 'Gravity Field', objects: [...boxes, ground] };
}

export default applyPreset_Gravity;
