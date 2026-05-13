import Matter from 'matter-js';
import * as objectDataModule from '../data/objectData';

const objectData = objectDataModule.default ?? objectDataModule;

// Normalize image path from objectData (remove leading /public if present)
function normalizeImagePath(pathStr) {
  if (!pathStr) return pathStr;
  return pathStr.replace(/^\/public/, '');
}

/**
 * Create a Matter body from asset metadata
 * Returns the created body
 */
export function createBodyFromAsset(assetName, x = 100, y = 100, options = {}) {
  const asset = objectData[assetName];
  if (!asset) throw new Error(`Asset not found: ${assetName}`);

  const width = asset.width || 64;
  const height = asset.height || 64;
  const mass = asset.mass || 1;
  const friction = asset.friction ?? 0.1;
  const restitution = asset.restitution ?? asset.bounce ?? 0;

  let body;

  // Basic heuristics: if width ~ height and category is shapes/circle use circle
  const isCircle = (asset.category === 'shapes') || (Math.abs(width - height) < 8 && width < 100);

  if (isCircle) {
    const radius = Math.max(8, Math.round(Math.min(width, height) / 2));
    body = Matter.Bodies.circle(x, y, radius, {
      mass,
      friction,
      restitution,
      ...options
    });
  } else {
    body = Matter.Bodies.rectangle(x, y, width, height, {
      mass,
      friction,
      restitution,
      render: {
        sprite: {
          texture: normalizeImagePath(asset.image || ''),
          xScale: width ? 1 : 1,
          yScale: height ? 1 : 1
        }
      },
      ...options
    });
  }

  // Attach metadata
  body.plugin = body.plugin || {};
  body.plugin.asset = {
    name: assetName,
    category: asset.category
  };

  return body;
}

/**
 * Spawn object into world and return the body
 */
export function spawnObject(world, assetName, x = 100, y = 100, opts = {}) {
  const body = createBodyFromAsset(assetName, x, y, opts);
  Matter.World.add(world, body);
  return body;
}

export default { createBodyFromAsset, spawnObject };
