import { Bodies, World } from 'matter-js';

export function applyPreset_NewtonsLaw(api, options = {}) {
  const world = api.world;
  api.setGravity(1);

  // two blocks and a spring-like constraint demonstration (simple)
  const ground = Bodies.rectangle(600, 700, 1400, 80, { isStatic: true });
  World.add(world, ground);

  const a = Bodies.rectangle(300, 300, 120, 60, { mass: 2, friction: 0.05, restitution: 0.2, render: { fillStyle: '#7c5cff' } });
  const b = Bodies.rectangle(600, 300, 120, 60, { mass: 4, friction: 0.05, restitution: 0.2, render: { fillStyle: '#00eaff' } });
  World.add(world, [a, b]);

  // apply a force to the smaller block to show acceleration
  setTimeout(() => {
    try { api.engine && api.engine.world && api.engine.world.bodies && api.engine; }
    catch (e) {}
    // apply impulsive force
    a.force = a.force || { x: 0, y: 0 };
    a.force.x += 0.03;
  }, 500);

  return { name: 'Newton\'s Laws', objects: [a, b, ground] };
}

export default applyPreset_NewtonsLaw;
