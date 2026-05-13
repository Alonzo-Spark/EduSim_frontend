/**
 * Centralized scaling and coordinate transformation utilities for EduSim
 */

export const SCALE = 40; // Pixels per world unit

/**
 * Converts world units to pixels
 * @param {number} value - Value in SI/world units
 * @returns {number} Value in pixels
 */
export const toPixels = (value) => value * SCALE;

/**
 * Converts pixels to world units
 * @param {number} value - Value in pixels
 * @returns {number} Value in SI/world units
 */
export const toWorld = (value) => value / SCALE;

/**
 * Transforms world coordinates to screen/canvas coordinates
 * @param {Object} worldPos - {x, y} in world units
 * @returns {Object} {x, y} in pixels
 */
export const worldToScreen = (worldPos) => {
  return {
    x: worldPos.x * SCALE,
    y: worldPos.y * SCALE
  };
};

/**
 * Transforms screen/canvas coordinates to world coordinates
 * @param {Object} screenPos - {x, y} in pixels
 * @returns {Object} {x, y} in world units
 */
export const screenToWorld = (screenPos) => {
  return {
    x: screenPos.x / SCALE,
    y: screenPos.y / SCALE
  };
};
