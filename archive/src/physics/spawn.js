import Matter from 'matter-js';
import * as objectDataModule from '../data/objectData';
import { resolveBestAsset, normalizeAssetName } from '../utils/assetCatalogResolver';

const objectData = objectDataModule.default ?? objectDataModule;

// Normalize image path from objectData (remove leading /public if present)
function normalizeImagePath(pathStr) {
  if (!pathStr) return pathStr;
  const cleaned = String(pathStr).replace(/^\/?(public\/)?(assets\/)?/, "");
  return `/assets/${cleaned}`;
}

function getAssetRecord(assetName, options = {}) {
  const normalizedName = normalizeAssetName(assetName);
  const exact = objectData[assetName] || objectData[normalizedName] || null;

  if (exact) {
    return {
      key: normalizedName || assetName,
      category: exact.category || options.category || 'misc',
      image: normalizeImagePath(exact.image || exact.file),
      width: exact.width,
      height: exact.height,
      mass: exact.mass,
      friction: exact.friction,
      restitution: exact.restitution ?? exact.bounce,
      source: 'objectData',
      raw: exact,
    };
  }

  const resolved = resolveBestAsset(assetName, options.category || null);
  if (resolved) {
    return {
      key: resolved.id,
      category: resolved.category || options.category || 'misc',
      image: normalizeImagePath(resolved.default || resolved.path),
      width: options.width,
      height: options.height,
      mass: options.mass,
      friction: options.friction,
      restitution: options.restitution,
      source: 'assetCatalog',
      raw: resolved,
    };
  }

  return {
    key: normalizedName || 'generic_asset',
    category: options.category || 'misc',
    image: '/assets/physics/balls/ball_generic/ball_generic1.png',
    width: options.width,
    height: options.height,
    mass: options.mass,
    friction: options.friction,
    restitution: options.restitution,
    source: 'fallback',
    raw: null,
  };
}

/**
 * Create a Matter body from asset metadata
 * Returns the created body
 */
export function createBodyFromAsset(assetName, x = 100, y = 100, options = {}) {
  const asset = getAssetRecord(assetName, options);
  const imagePath = asset.image;
  if (imagePath) {
    console.log("Loading sprite:", imagePath);
  }

  // Handle dimensions (convert meters to pixels if needed)
  const nativeWidth = asset.width || 64;
  const nativeHeight = asset.height || 64;
  const w = nativeWidth < 20 ? nativeWidth * 50 : nativeWidth;
  const h = nativeHeight < 20 ? nativeHeight * 50 : nativeHeight;
  
  const mass = asset.mass || options.mass || 1;
  const friction = asset.friction ?? options.friction ?? 0.1;
  const restitution = asset.restitution ?? options.restitution ?? 0;

  let body;
  const isCircle = (asset.category === 'shapes') || (Math.abs(w - h) < 8 && w < 100);

  const scaleX = w / (nativeWidth < 20 ? nativeWidth * 50 : nativeWidth || 1);
  const scaleY = h / (nativeHeight < 20 ? nativeHeight * 50 : nativeHeight || 1);

  if (isCircle) {
    const radius = Math.max(8, Math.round(Math.min(w, h) / 2));
    body = Matter.Bodies.circle(x, y, radius, {
      mass,
      friction,
      restitution,
      render: {
        sprite: {
          texture: imagePath,
          xScale: scaleX,
          yScale: scaleY
        }
      },
      ...options
    });
  } else {
    body = Matter.Bodies.rectangle(x, y, w, h, {
      mass,
      friction,
      restitution,
      render: {
        sprite: {
          texture: imagePath,
          xScale: scaleX,
          yScale: scaleY
        }
      },
      ...options
    });
  }

  // Attach metadata
  body.plugin = body.plugin || {};
  body.plugin.asset = {
    name: asset.key || normalizeAssetName(assetName),
    category: asset.category,
    source: asset.source,
    image: imagePath,
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
