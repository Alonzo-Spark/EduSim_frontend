import Matter from 'matter-js';
import { toPixels } from '../utils/coordinateUtils';

const { Bodies, Body } = Matter;

/**
 * Converts a DSL object into a Matter.js body
 * @param {Object} obj - The DSL object definition
 * @returns {Matter.Body}
 */
export const createBodyFromDSL = (obj) => {
  const isStatic = obj.type === 'staticBody';

  // Use centralized scaling pipeline
  const x = toPixels(obj.position.x);
  const y = toPixels(obj.position.y);

  const options = {
    isStatic: isStatic,
    label: obj.id,
    restitution: obj.material?.restitution ?? 0.0,
    friction: obj.material?.friction ?? 0.1,
    frictionAir: obj.physics?.airResistance ?? 0.01,
    mass: obj.physics?.mass ?? 1,
    isSensor: obj.physics?.isSensor ?? false,
    // Store visual data in the body for the renderer
    plugin: {
      visual: {
        color: obj.visual?.color ?? '#3b82f6',
        label: obj.visual?.label || obj.id,
        showVelocityVector: obj.visual?.showVelocityVector ?? false,
        shape: obj.shape.type,
        width: obj.shape.width,
        height: obj.shape.height,
        radius: obj.shape.radius
      }
    }
  };

  let body;

  // Create shape based on DSL - SI units are scaled to pixels
  if (obj.shape.type === 'circle') {
    const radius = toPixels(obj.shape.radius || 1);
    body = Bodies.circle(x, y, radius, options);
  } else {
    // Rectangle: Matter.js uses (x, y, width, height) where (x, y) is the CENTER
    const width = toPixels(obj.shape.width || 1);
    const height = toPixels(obj.shape.height || 1);
    body = Bodies.rectangle(x, y, width, height, options);
  }

  // Set initial velocity if provided
  if (obj.velocity) {
    // Note: Applying scaling for consistency with positions (assuming DSL in m/s)
    Body.setVelocity(body, {
      x: toPixels(obj.velocity.x),
      y: toPixels(obj.velocity.y)
    });
  }

  // Set initial rotation
  if (obj.rotation !== undefined) {
    Body.setAngle(body, obj.rotation);
  }

  // If mass is explicitly provided and not 0, set it
  if (obj.physics?.mass && obj.physics.mass > 0) {
    Body.setMass(body, obj.physics.mass);
  }

  console.log(`[Runtime] Created body: ${obj.id} at (${x}, ${y}) type: ${obj.type}`);

  return body;
};
