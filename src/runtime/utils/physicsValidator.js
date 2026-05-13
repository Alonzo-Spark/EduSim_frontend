/**
 * Physics Validator Utility
 * Calculates theoretical values based on classical physics formulas
 */

export const validateSimulation = (dsl, liveState) => {
  const { environment, objects, constraints } = dsl;
  const results = {
    type: 'Generic',
    expected: {},
    actual: {},
    activeFormula: null,
    error: 0
  };

  // 1. Detect Scenario: Pendulum
  const rope = constraints?.find(c => c.type === 'rope' || c.type === 'string');
  if (rope) {
    const L = rope.length;
    const g = environment.gravity.y;
    
    if (g > 0) {
      results.type = 'Pendulum (SHM)';
      results.activeFormula = "T = 2π√(L/g)";
      results.expected.period = 2 * Math.PI * Math.sqrt(L / g);
      results.actual.period = liveState.lastMeasuredPeriod || 0;
      results.unit = 's (Period)';
    }
  }

  // 2. Detect Scenario: Free Fall / Projectile
  else if (environment.gravity.y !== undefined && objects.length > 0) {
    const dynamicObj = objects.find(obj => obj.type === 'dynamicBody');
    const initialState = liveState.initialStates.get(dynamicObj?.id);
    
    if (dynamicObj && initialState) {
      results.type = 'Kinematics (Gravity)';
      results.activeFormula = "s = ut + ½gt²"; 
      
      const g = environment.gravity.y;
      const t = liveState.time;
      const u = initialState.u0y; 
      const y0 = initialState.y0;
      
      // Theoretical Y Position: y(t) = y0 + u*t + 0.5*g*t^2
      results.expected.positionY = y0 + (u * t) + (0.5 * g * t * t);
      results.actual.positionY = liveState.currentPositionY || 0;
      results.unit = 'm (Y-Pos)';
      
      // Stop validating after first bounce as formula becomes complex
      if (results.actual.positionY > 13.0) {
        results.type = 'Post-Collision (Complex)';
        results.activeFormula = "e = v_f / v_i";
      }
    }
  }

  return results;
};
