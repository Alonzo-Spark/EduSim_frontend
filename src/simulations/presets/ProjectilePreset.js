import { Bodies, World } from 'matter-js';

export function applyPreset_Projectile(api, options = {}) {
  const world = api.world;
  api.setGravity(1);

  const ground = Bodies.rectangle(600, 700, 1400, 80, { isStatic: true });
  World.add(world, ground);

  const ball = Bodies.circle(200, 520, 20, { mass: 1, friction: 0.01, restitution: 0.6, render: { fillStyle: '#ffd166' } });
  World.add(world, ball);

  // initial velocity to show projectile arc
  ball.velocity.x = 12;
  ball.velocity.y = -14;

  return { name: 'Projectile Motion', objects: [ball, ground] };
}

export default applyPreset_Projectile;
