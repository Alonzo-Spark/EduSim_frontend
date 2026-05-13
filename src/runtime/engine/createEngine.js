import Matter from 'matter-js';

/**
 * Creates and configures a Matter.js Engine based on DSL environment
 * @param {Object} environment - The DSL environment configuration
 * @returns {Matter.Engine}
 */
export const createEngine = (environment) => {
  const engine = Matter.Engine.create();

  // Apply gravity from DSL
  if (environment.gravity) {
    engine.gravity.x = environment.gravity.x || 0;
    engine.gravity.y = environment.gravity.y || 0;
    engine.gravity.scale = 0.001;
  }

  console.log('[Runtime] Engine created with gravity:', engine.gravity);

  return engine;
};
