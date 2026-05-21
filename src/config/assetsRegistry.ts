// ─── Asset Registry ──────────────────────────────────────────────────────────
// Each asset maps to a physics shape that can be spawned in the simulation.
// The `spawnType` and `spawnConfig` fields are forwarded to the objectFactory.

export interface AssetDefinition {
  id: string;
  name: string;
  emoji: string;            // Used as icon when no image is available
  category: string;
  tags: string[];
  spawnType: 'circle' | 'rectangle' | 'triangle';
  spawnConfig: {
    radius?: number;
    width?: number;
    height?: number;
    density?: number;
    restitution?: number;
    friction?: number;
    fillColor: number;
    strokeColor: number;
    isStatic?: boolean;
    cornerRadius?: number;
  };
}

export const assetsRegistry: Record<string, AssetDefinition[]> = {
  Shapes: [
    {
      id: 'ball-small',
      name: 'Small Ball',
      emoji: '🔴',
      category: 'Shapes',
      tags: ['circle', 'ball', 'round', 'bounce'],
      spawnType: 'circle',
      spawnConfig: { radius: 18, density: 0.002, restitution: 0.75, friction: 0.1, fillColor: 0xef4444, strokeColor: 0xfca5a5 },
    },
    {
      id: 'ball-large',
      name: 'Large Ball',
      emoji: '🟠',
      category: 'Shapes',
      tags: ['circle', 'ball', 'large', 'heavy'],
      spawnType: 'circle',
      spawnConfig: { radius: 36, density: 0.004, restitution: 0.5, friction: 0.15, fillColor: 0xf97316, strokeColor: 0xfdba74 },
    },
    {
      id: 'cube-small',
      name: 'Small Cube',
      emoji: '🟦',
      category: 'Shapes',
      tags: ['box', 'cube', 'square', 'rect'],
      spawnType: 'rectangle',
      spawnConfig: { width: 40, height: 40, density: 0.003, restitution: 0.3, friction: 0.4, fillColor: 0x3b82f6, strokeColor: 0x93c5fd, cornerRadius: 6 },
    },
    {
      id: 'cube-large',
      name: 'Large Cube',
      emoji: '🟫',
      category: 'Shapes',
      tags: ['box', 'cube', 'large', 'block'],
      spawnType: 'rectangle',
      spawnConfig: { width: 70, height: 70, density: 0.005, restitution: 0.2, friction: 0.6, fillColor: 0x78350f, strokeColor: 0xd97706, cornerRadius: 8 },
    },
    {
      id: 'plank',
      name: 'Plank',
      emoji: '🟩',
      category: 'Shapes',
      tags: ['plank', 'platform', 'beam', 'ramp'],
      spawnType: 'rectangle',
      spawnConfig: { width: 120, height: 16, density: 0.002, restitution: 0.2, friction: 0.5, fillColor: 0x15803d, strokeColor: 0x4ade80, cornerRadius: 4 },
    },
    {
      id: 'heavy-disk',
      name: 'Heavy Disk',
      emoji: '⚫',
      category: 'Shapes',
      tags: ['disk', 'heavy', 'circle', 'dense'],
      spawnType: 'circle',
      spawnConfig: { radius: 28, density: 0.012, restitution: 0.1, friction: 0.8, fillColor: 0x1e293b, strokeColor: 0x475569 },
    },
  ],

  Physics: [
    {
      id: 'bouncy-ball',
      name: 'Bouncy Ball',
      emoji: '🏀',
      category: 'Physics',
      tags: ['bounce', 'elastic', 'restitution', 'high'],
      spawnType: 'circle',
      spawnConfig: { radius: 22, density: 0.001, restitution: 0.95, friction: 0.05, fillColor: 0xf59e0b, strokeColor: 0xfcd34d },
    },
    {
      id: 'rubber-cube',
      name: 'Rubber Block',
      emoji: '🟪',
      category: 'Physics',
      tags: ['rubber', 'elastic', 'bounce', 'soft'],
      spawnType: 'rectangle',
      spawnConfig: { width: 45, height: 45, density: 0.001, restitution: 0.9, friction: 0.8, fillColor: 0x7c3aed, strokeColor: 0xc084fc, cornerRadius: 10 },
    },
    {
      id: 'lead-ball',
      name: 'Lead Ball',
      emoji: '⚙️',
      category: 'Physics',
      tags: ['heavy', 'dense', 'mass', 'lead'],
      spawnType: 'circle',
      spawnConfig: { radius: 20, density: 0.02, restitution: 0.05, friction: 0.9, fillColor: 0x374151, strokeColor: 0x6b7280 },
    },
    {
      id: 'ice-cube',
      name: 'Ice Cube',
      emoji: '🧊',
      category: 'Physics',
      tags: ['ice', 'slippery', 'low friction', 'slide'],
      spawnType: 'rectangle',
      spawnConfig: { width: 42, height: 42, density: 0.001, restitution: 0.4, friction: 0.02, fillColor: 0x7dd3fc, strokeColor: 0xe0f2fe, cornerRadius: 8 },
    },
    {
      id: 'cork',
      name: 'Cork',
      emoji: '🟤',
      category: 'Physics',
      tags: ['cork', 'light', 'float', 'low density'],
      spawnType: 'circle',
      spawnConfig: { radius: 16, density: 0.0005, restitution: 0.5, friction: 0.3, fillColor: 0xa16207, strokeColor: 0xfbbf24 },
    },
  ],

  Structures: [
    {
      id: 'wall',
      name: 'Wall',
      emoji: '🧱',
      category: 'Structures',
      tags: ['wall', 'static', 'barrier', 'block'],
      spawnType: 'rectangle',
      spawnConfig: { width: 20, height: 100, density: 0.01, restitution: 0.1, friction: 0.9, fillColor: 0x7f1d1d, strokeColor: 0xf87171, isStatic: true, cornerRadius: 2 },
    },
    {
      id: 'platform',
      name: 'Platform',
      emoji: '⬛',
      category: 'Structures',
      tags: ['platform', 'static', 'floor', 'ground'],
      spawnType: 'rectangle',
      spawnConfig: { width: 140, height: 18, density: 0.01, restitution: 0.3, friction: 0.7, fillColor: 0x1e293b, strokeColor: 0x334155, isStatic: true, cornerRadius: 4 },
    },
    {
      id: 'wedge',
      name: 'Wedge',
      emoji: '📐',
      category: 'Structures',
      tags: ['wedge', 'ramp', 'slope', 'incline'],
      spawnType: 'rectangle',
      spawnConfig: { width: 80, height: 40, density: 0.004, restitution: 0.2, friction: 0.5, fillColor: 0x065f46, strokeColor: 0x34d399, isStatic: true, cornerRadius: 3 },
    },
    {
      id: 'pillar',
      name: 'Pillar',
      emoji: '🏛️',
      category: 'Structures',
      tags: ['pillar', 'column', 'support', 'vertical'],
      spawnType: 'rectangle',
      spawnConfig: { width: 18, height: 120, density: 0.01, restitution: 0.1, friction: 0.8, fillColor: 0x374151, strokeColor: 0x9ca3af, isStatic: true, cornerRadius: 4 },
    },
  ],

  Lab: [
    {
      id: 'test-mass',
      name: 'Test Mass',
      emoji: '🔬',
      category: 'Lab',
      tags: ['test', 'mass', 'experiment', 'measure'],
      spawnType: 'circle',
      spawnConfig: { radius: 14, density: 0.005, restitution: 0.3, friction: 0.4, fillColor: 0x0891b2, strokeColor: 0x67e8f9 },
    },
    {
      id: 'projectile',
      name: 'Projectile',
      emoji: '💥',
      category: 'Lab',
      tags: ['projectile', 'launch', 'fast', 'velocity'],
      spawnType: 'circle',
      spawnConfig: { radius: 10, density: 0.008, restitution: 0.6, friction: 0.05, fillColor: 0xdc2626, strokeColor: 0xfca5a5 },
    },
    {
      id: 'weight',
      name: 'Weight',
      emoji: '⚖️',
      category: 'Lab',
      tags: ['weight', 'gravity', 'heavy', 'measure'],
      spawnType: 'rectangle',
      spawnConfig: { width: 32, height: 48, density: 0.015, restitution: 0.1, friction: 0.7, fillColor: 0x292524, strokeColor: 0x78716c, cornerRadius: 4 },
    },
    {
      id: 'sensor-ball',
      name: 'Sensor Ball',
      emoji: '🟡',
      category: 'Lab',
      tags: ['sensor', 'observe', 'track', 'monitor'],
      spawnType: 'circle',
      spawnConfig: { radius: 16, density: 0.001, restitution: 0.6, friction: 0.1, fillColor: 0xeab308, strokeColor: 0xfde047 },
    },
  ],
};
