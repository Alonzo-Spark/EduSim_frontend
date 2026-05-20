export type CollisionAnalysisInput = {
  bodyA?: any;
  bodyB?: any;
  restitution?: number;
  durationMs?: number;
  impulse?: number;
  contactPoint?: { x: number; y: number } | null;
  preVelocityA?: { x: number; y: number };
  preVelocityB?: { x: number; y: number };
  postVelocityA?: { x: number; y: number };
  postVelocityB?: { x: number; y: number };
};

export type CollisionAnalysisResult = {
  impactForce: number;
  momentumBefore: number;
  momentumAfter: number;
  momentumConservedPct: number;
  energyBefore: number;
  energyAfter: number;
  energyLost: number;
  restitutionEfficiency: number;
  collisionDurationMs: number;
  impulseMagnitude: number;
  summary: string;
  formulas: string[];
};

function vecMag(v?: { x: number; y: number }) {
  if (!v) return 0;
  return Math.hypot(Number(v.x) || 0, Number(v.y) || 0);
}

function momentum(mass: number, velocity?: { x: number; y: number }) {
  return mass * vecMag(velocity);
}

function kineticEnergy(mass: number, velocity?: { x: number; y: number }) {
  const speed = vecMag(velocity);
  return 0.5 * mass * speed * speed;
}

export function analyzeCollision(input: CollisionAnalysisInput): CollisionAnalysisResult {
  const massA = Number(input.bodyA?.mass ?? input.bodyA?.physics?.mass ?? 1) || 1;
  const massB = Number(input.bodyB?.mass ?? input.bodyB?.physics?.mass ?? 1) || 1;
  const preA = input.preVelocityA ?? input.bodyA?.velocity ?? input.bodyA?.physics?.velocity ?? { x: 0, y: 0 };
  const preB = input.preVelocityB ?? input.bodyB?.velocity ?? input.bodyB?.physics?.velocity ?? { x: 0, y: 0 };
  const postA = input.postVelocityA ?? preA;
  const postB = input.postVelocityB ?? preB;

  const momentumBefore = momentum(massA, preA) + momentum(massB, preB);
  const momentumAfter = momentum(massA, postA) + momentum(massB, postB);
  const energyBefore = kineticEnergy(massA, preA) + kineticEnergy(massB, preB);
  const energyAfter = kineticEnergy(massA, postA) + kineticEnergy(massB, postB);
  const energyLost = Math.max(0, energyBefore - energyAfter);
  const impulseMagnitude = Math.abs(input.impulse ?? momentumAfter - momentumBefore);
  const durationMs = Math.max(1, Number(input.durationMs ?? 16) || 16);
  const impactForce = impulseMagnitude / (durationMs / 1000);
  const restitutionEfficiency = energyBefore > 0 ? Math.max(0, Math.min(1, energyAfter / energyBefore)) : 1;
  const momentumConservedPct = momentumBefore !== 0 ? Math.max(0, Math.min(100, (1 - Math.abs(momentumAfter - momentumBefore) / Math.abs(momentumBefore)) * 100)) : 100;

  return {
    impactForce,
    momentumBefore,
    momentumAfter,
    momentumConservedPct,
    energyBefore,
    energyAfter,
    energyLost,
    restitutionEfficiency,
    collisionDurationMs: durationMs,
    impulseMagnitude,
    summary: `During collision, ${momentumConservedPct.toFixed(0)}% of momentum was conserved while ${energyLost.toFixed(0)} J of kinetic energy was lost to deformation and friction.`,
    formulas: [
      `p = mv`,
      `p_before = ${momentumBefore.toFixed(2)} kg·m/s`,
      `p_after = ${momentumAfter.toFixed(2)} kg·m/s`,
      `KE_before = ${energyBefore.toFixed(2)} J`,
      `KE_after = ${energyAfter.toFixed(2)} J`,
      `J = Δp = ${impulseMagnitude.toFixed(2)} N·s`,
    ],
  };
}

export default analyzeCollision;
