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
  texture?: string;         // Optional SVG/image asset texture path
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

const baseRegistry: Record<string, AssetDefinition[]> = {
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
  Planets: [
    {
      id: 'earth',
      name: 'Earth',
      emoji: '🌍',
      category: 'Planets',
      tags: ['planet', 'earth', 'space', 'gravity'],
      spawnType: 'circle',
      texture: '/assets/planets/earth.svg',
      spawnConfig: { radius: 40, density: 0.002, restitution: 0.9, friction: 0.1, fillColor: 0x3388cc, strokeColor: 0x66aadd }
    },
    {
      id: 'mars',
      name: 'Mars',
      emoji: '🔴',
      category: 'Planets',
      tags: ['planet', 'mars', 'space', 'red'],
      spawnType: 'circle',
      texture: '/assets/planets/mars.svg',
      spawnConfig: { radius: 35, density: 0.0018, restitution: 0.8, friction: 0.12, fillColor: 0xe0533c, strokeColor: 0xff8866 }
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      emoji: '🪐',
      category: 'Planets',
      tags: ['planet', 'jupiter', 'space', 'gas'],
      spawnType: 'circle',
      texture: '/assets/planets/jupiter.svg',
      spawnConfig: { radius: 55, density: 0.0025, restitution: 0.7, friction: 0.15, fillColor: 0xb07f35, strokeColor: 0xd4a35c }
    },
    {
      id: 'saturn',
      name: 'Saturn',
      emoji: '🪐',
      category: 'Planets',
      tags: ['planet', 'saturn', 'space', 'rings'],
      spawnType: 'circle',
      texture: '/assets/planets/saturn.svg',
      spawnConfig: { radius: 48, density: 0.0015, restitution: 0.75, friction: 0.14, fillColor: 0xe2bf7d, strokeColor: 0xf9e3b4 }
    },
    {
      id: 'mercury',
      name: 'Mercury',
      emoji: '🌑',
      category: 'Planets',
      tags: ['planet', 'mercury', 'space', 'hot'],
      spawnType: 'circle',
      texture: '/assets/planets/mercury.svg',
      spawnConfig: { radius: 28, density: 0.0022, restitution: 0.65, friction: 0.1, fillColor: 0x9e9e9e, strokeColor: 0xcccccc }
    },
    {
      id: 'venus',
      name: 'Venus',
      emoji: '🟡',
      category: 'Planets',
      tags: ['planet', 'venus', 'space', 'atmosphere'],
      spawnType: 'circle',
      texture: '/assets/planets/venus.svg',
      spawnConfig: { radius: 38, density: 0.002, restitution: 0.78, friction: 0.11, fillColor: 0xe3bb76, strokeColor: 0xffe6a3 }
    },
    {
      id: 'neptune',
      name: 'Neptune',
      emoji: '🔵',
      category: 'Planets',
      tags: ['planet', 'neptune', 'space', 'cold'],
      spawnType: 'circle',
      texture: '/assets/planets/neptune.svg',
      spawnConfig: { radius: 44, density: 0.0021, restitution: 0.82, friction: 0.13, fillColor: 0x274687, strokeColor: 0x4f70b5 }
    },
    {
      id: 'uranus',
      name: 'Uranus',
      emoji: '💎',
      category: 'Planets',
      tags: ['planet', 'uranus', 'space', 'cyan'],
      spawnType: 'circle',
      texture: '/assets/planets/uranus.svg',
      spawnConfig: { radius: 42, density: 0.0019, restitution: 0.85, friction: 0.12, fillColor: 0x76c0c2, strokeColor: 0xaee1e3 }
    },
    {
      id: 'sun',
      name: 'Sun',
      emoji: '☀️',
      category: 'Planets',
      tags: ['star', 'sun', 'space', 'giant'],
      spawnType: 'circle',
      texture: '/assets/planets/sun.svg',
      spawnConfig: { radius: 65, density: 0.003, restitution: 0.1, friction: 0.2, fillColor: 0xffaa00, strokeColor: 0xffdd44 }
    },
    {
      id: 'moon',
      name: 'Moon',
      emoji: '🌙',
      category: 'Planets',
      tags: ['satellite', 'moon', 'space', 'orbit'],
      spawnType: 'circle',
      texture: '/assets/planets/moon.svg',
      spawnConfig: { radius: 20, density: 0.0016, restitution: 0.6, friction: 0.18, fillColor: 0xd6d6d6, strokeColor: 0xffffff }
    }
  ],
  Vehicles: [
    {
      id: 'car',
      name: 'Sports Car',
      emoji: '🏎️',
      category: 'Vehicles',
      tags: ['vehicle', 'car', 'fast', 'wheel'],
      spawnType: 'rectangle',
      texture: '/assets/vehicles/car.svg',
      spawnConfig: { width: 80, height: 40, density: 0.0025, restitution: 0.45, friction: 0.25, fillColor: 0xdc2626, strokeColor: 0xfca5a5, cornerRadius: 6 }
    }
  ]
};

// Dynamically load SVGs from root svgs/ folder
const svgModules = import.meta.glob('../../svgs/**/*.svg', { eager: true, import: 'default' }) as Record<string, string>;

// Helper to capitalize words
function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Copy baseRegistry to exportable assetsRegistry
export const assetsRegistry: Record<string, AssetDefinition[]> = { ...baseRegistry };

// Process the glob files and dynamically populate categories
Object.entries(svgModules).forEach(([filePath, url]) => {
  // Extract category and name from path: "../../svgs/planets/earth.svg"
  const match = filePath.match(/\/svgs\/([^/]+)\/([^/]+)\.svg$/);
  if (!match) return;

  const rawCategory = match[1];
  const rawName = match[2];

  // Capitalize category name (e.g. "planets" -> "Planets")
  const category = capitalize(rawCategory);

  // Strip common trailing "_svg" or "-svg" suffixes and format clean item name
  const cleanName = rawName.replace(/[_-]svg$/i, '');
  const name = capitalize(cleanName.replace(/[_-]+/g, ' '));
  const id = cleanName.toLowerCase();

  // Map appropriate premium emojis based on category or name
  let emoji = '📦';
  const nameLower = name.toLowerCase();
  const catLower = category.toLowerCase();

  if (catLower.includes('planet')) {
    if (nameLower.includes('earth')) emoji = '🌍';
    else if (nameLower.includes('mars')) emoji = '🔴';
    else if (nameLower.includes('jupiter')) emoji = '🪐';
    else if (nameLower.includes('saturn')) emoji = '🪐';
    else if (nameLower.includes('mercury')) emoji = '🌑';
    else if (nameLower.includes('venus')) emoji = '🟡';
    else if (nameLower.includes('neptune')) emoji = '🔵';
    else if (nameLower.includes('uranus')) emoji = '💎';
    else if (nameLower.includes('sun')) emoji = '☀️';
    else if (nameLower.includes('moon')) emoji = '🌙';
    else emoji = '🪐';
  } else if (catLower.includes('vehicle')) {
    if (nameLower.includes('car')) emoji = '🏎️';
    else if (nameLower.includes('bus')) emoji = '🚌';
    else if (nameLower.includes('truck')) emoji = '🚚';
    else if (nameLower.includes('train')) emoji = '🚊';
    else if (nameLower.includes('rocket')) emoji = '🚀';
    else emoji = '🚗';
  } else if (catLower.includes('animal')) {
    if (nameLower.includes('tiger') || nameLower.includes('lion')) emoji = '🦁';
    else if (nameLower.includes('bear')) emoji = '🐻';
    else if (nameLower.includes('cat')) emoji = '🐱';
    else if (nameLower.includes('dog')) emoji = '🐶';
    else if (nameLower.includes('bird')) emoji = '🐦';
    else if (nameLower.includes('frog')) emoji = '🐸';
    else emoji = '🦁';
  } else if (catLower.includes('food')) {
    emoji = '🍎';
  } else if (catLower.includes('instrument') || catLower.includes('music')) {
    emoji = '🎸';
  } else if (catLower.includes('weapon')) {
    emoji = '⚔️';
  } else {
    emoji = '🎨';
  }

  // Smart shape matching based on naming conventions and category
  const isCircle = catLower.includes('planet') ||
                   nameLower.includes('ball') ||
                   nameLower.includes('wheel') ||
                   nameLower.includes('disk') ||
                   nameLower.includes('circle');

  const spawnType = isCircle ? 'circle' : 'rectangle';

  // Config parameters with fine-tuned premium defaults
  const spawnConfig: any = {
    density: 0.002,
    restitution: 0.6,
    friction: 0.1,
    fillColor: 0x818cf8,
    strokeColor: 0xc7d2fe,
  };

  if (isCircle) {
    spawnConfig.radius = catLower.includes('planet')
      ? (nameLower.includes('sun') ? 65 : nameLower.includes('jupiter') ? 55 : 35)
      : 24;
  } else {
    spawnConfig.width = 60;
    spawnConfig.height = 40;
    spawnConfig.cornerRadius = 6;
  }

  const asset: AssetDefinition = {
    id,
    name,
    emoji,
    category,
    tags: [catLower, rawName.toLowerCase(), ...rawName.split(/[_-]/).map((t) => t.toLowerCase())],
    spawnType,
    texture: url,
    spawnConfig,
  };

  if (!assetsRegistry[category]) {
    assetsRegistry[category] = [];
  }

  // Prevent duplicate definitions to preserve static custom/fine-tuned physics properties
  const exists = assetsRegistry[category].some((a) => a.id === id);
  if (!exists) {
    assetsRegistry[category].push(asset);
  }
});

