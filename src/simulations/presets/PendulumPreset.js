import { Bodies, World, Constraint } from 'matter-js';

export function applyPreset_Pendulum(api, options = {}) {
  const world = api.world;
  api.setGravity(1);

  const roof = Bodies.rectangle(400, 100, 600, 20, { isStatic: true });
  World.add(world, roof);

  const bob = Bodies.circle(400, 260, 28, { mass: 10, friction: 0.001, restitution: 0.9, render: { fillStyle: '#ffd166' } });
  World.add(world, bob);

  const rod = Constraint.create({ bodyA: roof, pointA: { x: 0, y: 0 }, bodyB: bob, pointB: { x: 0, y: 0 }, length: 160, stiffness: 1 });
  World.add(world, rod);

  // give initial push
  setTimeout(() => { bob.force = bob.force || { x: 0, y: 0 }; bob.force.x += 0.02; }, 300);

  return { name: 'Pendulum', objects: [roof, bob, rod] };
}

export default applyPreset_Pendulum;
