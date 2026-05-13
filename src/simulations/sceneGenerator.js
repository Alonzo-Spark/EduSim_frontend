import categories from '../data/categories.json';
import * as objectDataModule from '../data/objectData';

const objectData = objectDataModule.default ?? objectDataModule;

/**
 * Improved lightweight prompt parser -> structured scene generator.
 * Recognizes basic object names, physics terms and preset intents.
 */
export function generateSceneFromPrompt(prompt) {
  const result = { gravity: 1, objects: [] };
  const lower = (prompt || '').toLowerCase();

  // detect low gravity / moon
  if (lower.includes('moon') || lower.includes('low gravity') || lower.includes('lunar')) {
    result.gravity = 0.16;
  }
  if (lower.includes('high speed') || lower.includes('highway') || lower.includes('truck')) {
    result.gravity = 1;
  }

  // map simple intents to presets
  if (lower.includes('projectile') || lower.includes('projectile motion') || lower.includes('ball')) {
    // spawn a ball with arc velocity
    result.objects.push({ type: 'ball', x: 200, y: 520, velocity: { x: 12, y: -14 } });
    return result;
  }

  if (lower.includes('collision') || lower.includes("truck" ) || lower.includes('car coll') ) {
    result.objects.push({ type: 'car', x: 200, y: 320, velocity: { x: 10, y: 0 } });
    result.objects.push({ type: 'car', x: 800, y: 320, velocity: { x: -10, y: 0 } });
    return result;
  }

  if (lower.includes('pendulum')) {
    result.objects.push({ type: 'pendulum_bob', x: 400, y: 260 });
    return result;
  }

  // attempt to match specific named asset keys
  Object.keys(objectData).forEach((name) => {
    const ln = name.toLowerCase();
    if (lower.includes(ln)) {
      // found a named asset
      result.objects.push({ asset: name, x: 300 + Math.random() * 400, y: 100 + Math.random() * 200 });
    }
  });

  // fallback: choose misc assets
  if (result.objects.length === 0) {
    const misc = categories.misc || Object.keys(objectData).slice(0, 20);
    for (let i = 0; i < 3; i++) {
      const choice = misc[Math.floor(Math.random() * misc.length)];
      result.objects.push({ asset: choice, x: 200 + i * 80, y: 80 });
    }
  }

  return result;
}

export default { generateSceneFromPrompt };
