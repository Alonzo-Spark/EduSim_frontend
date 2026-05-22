import * as objectDataModule from "../data/objectData";
import { resolveAssetByKeywords, normalizePrompt, fallbackObjectMap } from '../utils/AssetResolver';
import { generateSceneBackground } from './SceneComposer';

const objectData = objectDataModule.default ?? objectDataModule;

const DEFAULT_ASSET_PATHS = {
  block: "/assets/physics/interactables/block_locked_square/block_locked_square.png",
  sphere: "/assets/physics/balls/ball_generic/ball_generic1.png",
  projectile: "/assets/physics/balls/ball_generic/ball_generic1.png",
  pendulum: "/assets/physics/weights/weight/weight.png",
  spring: "/assets/physics/springs/spring/spring.png",
  plane: "/assets/terrain/road/road_asphalt/road_asphalt.png",
  particle: "/assets/physics/balls/ball_generic/ball_generic2.png",
  vehicles: "/assets/vehicles/land/truck/truck.png",
  vehicle: "/assets/vehicles/land/car/car_blue_1.png",
  truck: "/assets/vehicles/land/truck/truck.png",
  car: "/assets/vehicles/land/car/car_blue_1.png",
  rocket: "/assets/space/environment/rocket/rocket.png",
  orbit: "/assets/space/environment/planet_earth/planet_earth.png",
  wall: "/assets/buildings/structures/wall/wall.png",
  barrier: "/assets/buildings/structures/wall/wall.png",
  characters: "/assets/characters/player/adventurer_duck/adventurer_duck.png",
  character: "/assets/characters/player/adventurer_duck/adventurer_duck.png",
  obstacles: "/assets/physics/interactables/block_locked_square/block_locked_square.png",
  obstacle: "/assets/physics/interactables/block_locked_square/block_locked_square.png",
};

const CATEGORY_ALIASES = {
  block: "block",
  blocks: "block",
  box: "block",
  rectangle: "block",
  rect: "block",
  sphere: "sphere",
  ball: "sphere",
  bouncingball: "sphere",
  projectile: "projectile",
  projectilemotion: "projectile",
  pendulum: "pendulum",
  pendulummotion: "pendulum",
  rocket: "rocket",
  rocketlaunch: "rocket",
  orbit: "orbit",
  orbitalmotion: "orbit",
  spring: "spring",
  plane: "plane",
  floor: "plane",
  ground: "plane",
  particle: "particle",
  particles: "particle",
  vehicles: "vehicles",
  vehicle: "vehicle",
  car: "car",
  truck: "truck",
  bus: "bus",
  van: "van",
  suv: "suv",
  motorcycle: "motorcycle",
  characters: "characters",
  character: "character",
  person: "character",
  wall: "wall",
  barrier: "barrier",
  fence: "fence",
  pillar: "pillar",
  obstacle: "obstacle",
  obstacles: "obstacle",
  target: "barrier",
};

const STATIC_TYPES = new Set([
  "plane", "block", "obstacle", "obstacles", "ground", "floor",
  "wall", "barrier", "fence", "pillar", "post", "target",
]);

// ─── BUG FIX 1: CIRCLE_KEYWORDS must be checked BEFORE deriveRootType collapses
// "ball" → "sphere". Keeping the source-of-truth keyword list here so pickSize
// and deriveRootType share the same vocabulary.
const CIRCLE_KEYWORDS = [
  "ball", "sphere", "planet", "moon", "bubble", "wheel",
  "earth", "circle", "orbit", "disc", "disk", "globe",
  "projectile", "particle", "pendulum",
];
const RECT_KEYWORDS = [
  "box", "block", "wall", "barrier", "fence", "pillar",
  "rectangle", "rect", "crate", "plank", "rocket", "missile", "launcher", "truck", "car",
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_\-./]+/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, "");
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function ensureFinite(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function ensureNonNegative(val, fallback = 0) {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function normalizeAssetPath(filePath) {
  if (!filePath) return "";
  const s = String(filePath).trim();
  if (s.startsWith("/assets/")) return s;
  const cleaned = s
    .replace(/^\/+/, "")
    .replace(/^public\//, "")
    .replace(/^assets\//, "");
  return `/assets/${cleaned}`;
}

// ─── BUG FIX 2: deriveRootType was missing "ball" as a trigger for "sphere".
// When a DSL object has type "ball" the function fell through to CATEGORY_ALIASES
// via slugify, which does return "sphere" — but only if the slug matches exactly.
// Compound names like "falling ball" or "ball_1" were slugified to
// "fallingball" / "ball1", neither of which matched any alias key, so they
// returned as-is and were treated as unknown types (defaulting to rectangle in
// pickSize and no asset match). Fixed by checking individual tokens too.
function deriveRootType(type) {
  const norm = normalizeText(type);
  const tokens = norm.split(/\s+/);

  // Explicit substring checks (highest priority, order matters)
  if (norm.includes("rocket") || norm.includes("missile") || norm.includes("launch") || norm.includes("spacecraft")) return "rocket";
  if (norm.includes("pendulum")) return "pendulum";
  if (norm.includes("projectile")) return "projectile";
  if (norm.includes("orbit")) return "orbit";
  if (norm.includes("wall")) return "wall";
  if (norm.includes("barrier")) return "barrier";
  if (norm.includes("obstacle")) return "obstacle";
  if (norm.includes("block") || norm.includes("box") || norm.includes("crate")) return "block";
  if (norm.includes("truck")) return "truck";
  if (norm.includes("car")) return "car";
  // BUG FIX 2a: "ball" was not checked here — falling through to alias lookup
  // which failed for any multi-word or suffixed name.
  if (norm.includes("ball") || norm.includes("sphere")) return "sphere";
  if (norm.includes("particle")) return "particle";
  if (norm.includes("plane") || norm.includes("ground") || norm.includes("floor")) return "plane";
  if (norm.includes("spring")) return "spring";
  if (norm.includes("character") || norm.includes("person") || norm.includes("duck") || norm.includes("player")) return "character";
  if (norm.includes("planet") || norm.includes("earth") || norm.includes("moon")) return "orbit";
  if (norm.includes("vehicle")) return "vehicle";

  // BUG FIX 2b: try each individual token against CATEGORY_ALIASES before
  // falling back to the full slug (which fails for compound names).
  for (const token of tokens) {
    if (CATEGORY_ALIASES[token]) return CATEGORY_ALIASES[token];
  }

  const clean = slugify(type);
  return CATEGORY_ALIASES[clean] || clean || "block";
}

function getTypeHints(type) {
  const root = deriveRootType(type);
  const hints = {
    root,
    category: root,
    family: root,
    requireCategory: null,
  };

  if (["car", "truck", "bus", "van", "suv", "motorcycle", "vehicle", "vehicles"].includes(root)) {
    hints.category = "vehicles";
    hints.family = root === "vehicle" || root === "vehicles" ? "car" : root;
    hints.requireCategory = "vehicles";
  } else if (["character", "characters", "person"].includes(root)) {
    hints.category = "characters";
    hints.family = "adventurer_duck";
    hints.requireCategory = "characters";
  } else if (["ground", "floor", "plane"].includes(root)) {
    hints.category = "terrain";
    hints.family = "road_asphalt";
    hints.requireCategory = "terrain";
  } else if (["wall", "barrier", "fence", "pillar", "target", "obstacle", "obstacles"].includes(root)) {
    hints.category = "buildings";
    hints.family = root === "obstacle" || root === "obstacles" ? "wall" : root;
    hints.requireCategory = null;
  } else if (root === "spring") {
    hints.category = "physics";
    hints.family = "spring";
  } else if (root === "rocket") {
    hints.category = "space";
    hints.family = "rocket";
    hints.requireCategory = null;
  } else if (root === "orbit") {
    hints.category = "space";
    hints.family = "planet_earth";
    hints.requireCategory = null;
  } else if (root === "sphere" || root === "projectile" || root === "particle" || root === "pendulum") {
    // BUG FIX 3: sphere/ball types had no hints block so they fell through to
    // the generic category which matched buildings/terrain entries before the
    // correct physics/balls entry. Explicitly route them to physics category.
    hints.category = "physics";
    hints.family = root === "pendulum" ? "weight" : "ball_generic";
    hints.requireCategory = null;
  }

  return hints;
}

function scoreAsset(entry, queryTokens, hints, primaryType) {
  let score = 0;
  const entryCategory = normalizeText(entry.category || "");
  const entryFamily = normalizeText(entry.objectFamily || "");
  const entryKey = normalizeText(entry.key || "");

  const haystack = [
    entry.key, entry.category, entry.subCategory, entry.objectFamily, entry.filePath,
    ...(entry.tags || []), ...(entry.aliases || [])
  ].filter(Boolean).map((value) => normalizeText(value));

  if (primaryType) {
    if (entryKey === primaryType) score += 1000;
    if (entryFamily === primaryType) score += 800;
    if (entry.aliases?.some((a) => normalizeText(a) === primaryType)) score += 600;
    if (entry.tags?.some((t) => normalizeText(t) === primaryType)) score += 400;
    if (entryKey.includes(primaryType)) score += 100;
  }

  for (const token of queryTokens) {
    if (!token || token === "object" || !isNaN(token)) continue;
    if (entryKey === token) score += 60;
    if (entryFamily === token) score += 40;
    if (entry.aliases?.some((a) => normalizeText(a) === token)) score += 30;
    if (entry.tags?.some((tag) => normalizeText(tag) === token)) score += 20;
    if (haystack.some((value) => value === token)) score += 15;
    if (haystack.some((value) => value.includes(token))) score += 8;
  }

  if (hints.requireCategory) {
    if (entryCategory === normalizeText(hints.requireCategory)) {
      score += 50;
    } else {
      score -= 500;
    }
  } else if (hints.category && entryCategory === normalizeText(hints.category)) {
    score += 20;
  }

  if (hints.family && entryFamily.includes(normalizeText(hints.family))) score += 10;
  if (hints.root && normalizeText(entry.filePath || "").includes(normalizeText(hints.root))) score += 5;

  return score;
}

function buildAssetCatalog() {
  return Object.entries(objectData).map(([key, value]) => ({
    key,
    ...value,
    filePath: normalizeAssetPath(value.filePath || value.file || value.image || value.path),
    tokens: tokenize([key, value.category, value.subCategory, value.objectFamily, ...(value.tags || []), ...(value.aliases || [])].filter(Boolean).join(" ")),
  }));
}

const ASSET_CATALOG = buildAssetCatalog();

function resolveByPrefix(prefixes) {
  return ASSET_CATALOG.find((entry) => prefixes.some((prefix) => normalizeText(entry.filePath).includes(normalizeText(prefix))));
}

function resolveFallbackAsset(type) {
  const root = deriveRootType(type);
  return DEFAULT_ASSET_PATHS[root] || DEFAULT_ASSET_PATHS.block;
}

function resolveAsset(object, subject = "physics", prompt = "") {
  const typeValue = object?.type || object?.kind || object?.name || object?.id || "block";
  const hints = getTypeHints(typeValue);
  const isWallOrBarrier = ["wall", "barrier", "obstacle", "obstacles", "block"].includes(hints.root);

  let rawPath = resolveAssetByKeywords(prompt, typeValue, subject);

  if (!rawPath) {
    rawPath = resolveFallbackAsset(typeValue);
  }

  const filePath = normalizeAssetPath(rawPath);

  return {
    key: slugify(typeValue),
    category: hints.category,
    subCategory: null,
    objectFamily: hints.family,
    filePath,
    tags: [hints.root],
    matched: !!filePath,
    aliases: isWallOrBarrier ? ["wall", "barrier", "obstacle", "block"] : [],
  };
}

// ─── BUG FIX 4: pickSize was evaluating CIRCLE_KEYWORDS against labelTokens
// but labelTokens was built from the raw label string using normalizeText which
// keeps spaces. The check `labelTokens.includes(kw)` is a plain string
// substring match — so "ball" inside "falling ball" would match correctly, BUT
// "sphere" inside "ball_generic" (after normalizeText) became "ball generic"
// and "sphere" was never present. More critically: after deriveRootType() fixes,
// `type` is now correctly "sphere" for ball inputs. But if type === "sphere"
// and the object also has an explicit shape.type of "rectangle" (which the AI
// sometimes emits for unknown objects), the explicit shape override wins and
// the ball is drawn as a rectangle. Fix: for circle-family root types, ignore
// any explicit shape.type of "rectangle" and force circle.
function pickSize(object, asset) {
  const typeValue = object?.type || object?.kind || object?.name || object?.id || asset?.objectFamily || "block";
  const normValue = normalizeText(typeValue);
  const type = deriveRootType(typeValue);

  const CATEGORY_SIZES = {
    block: { width: 2.0, height: 2.0 },
    sphere: { radius: 1.0 },
    projectile: { radius: 0.5 },
    pendulum: { radius: 0.6 },
    spring: { width: 2.5, height: 0.5 },
    plane: { width: 20, height: 0.4 },
    particle: { radius: 0.2 },
    car: { width: 3.0, height: 1.5 },
    truck: { width: 3.5, height: 1.75 },
    bus: { width: 6.0, height: 2.2 },
    van: { width: 4.0, height: 1.9 },
    motorcycle: { width: 2.0, height: 1.2 },
    vehicle: { width: 3.0, height: 1.5 },
    vehicles: { width: 3.0, height: 1.5 },
    wall: { width: 0.6, height: 4.0 },
    barrier: { width: 0.8, height: 3.0 },
    fence: { width: 4.0, height: 1.5 },
    pillar: { width: 0.8, height: 4.0 },
    target: { width: 1.0, height: 3.0 },
    characters: { width: 1.0, height: 1.9 },
    character: { width: 1.0, height: 1.9 },
    obstacle: { width: 2.0, height: 1.5 },
    obstacles: { width: 2.0, height: 1.5 },
    rocket: { width: 1.0, height: 3.0 },
    orbit: { radius: 2.25 },
  };

  const defaults = CATEGORY_SIZES[type] || CATEGORY_SIZES.block;

  // BUG FIX 4: circle-family root types must not be overridden to rectangle by
  // an explicit shape.type from the AI. The AI frequently emits shape:{type:"rectangle"}
  // as a default when it doesn't know the shape, causing balls to render as boxes.
  const CIRCLE_ROOT_TYPES = new Set(["sphere", "projectile", "particle", "pendulum", "orbit"]);
  const isCircleRoot = CIRCLE_ROOT_TYPES.has(type);

  const rawShapeType = normalizeText(object?.shape?.type || object?.shapeType || "");
  // Only trust an explicit shape.type of "circle" or "rectangle" if it doesn't
  // contradict a circle-family root type.
  const shapeType = isCircleRoot
    ? "circle"  // circle-family types are always circles regardless of DSL
    : rawShapeType;

  const labelTokens = normalizeText(
    [object?.name, object?.type, object?.id, object?.label].filter(Boolean).join(" ")
  );
  const isCircleByKeyword = CIRCLE_KEYWORDS.some(kw => labelTokens.includes(kw));
  const isRectByKeyword = RECT_KEYWORDS.some(kw => labelTokens.includes(kw));

  // Check fallbackObjectMap first (most specific)
  for (const [key, fallback] of Object.entries(fallbackObjectMap)) {
    if (normValue.includes(key)) {
      if (fallback.shape === "circle") {
        return {
          type: "circle",
          radius: Number(object?.shape?.radius || object?.radius || fallback.radius || defaults.radius || 0.5),
        };
      }
      return {
        type: "rectangle",
        width: Number(object?.shape?.width || object?.width || fallback.width || defaults.width || 1.0),
        height: Number(object?.shape?.height || object?.height || fallback.height || defaults.height || 1.0),
      };
    }
  }

  if (shapeType === "circle" || shapeType === "sphere" || isCircleRoot) {
    return {
      type: "circle",
      radius: Number(
        object?.shape?.radius || object?.radius ||
        (asset?.width ? asset.width / 2 : null) ||
        defaults.radius || 0.5
      ),
    };
  }

  if (shapeType === "rectangle" || shapeType === "rect" || shapeType === "box") {
    return {
      type: "rectangle",
      width: Number(object?.shape?.width || object?.width || asset?.width || defaults.width || 1.6),
      height: Number(object?.shape?.height || object?.height || asset?.height || defaults.height || 1.0),
    };
  }

  // Keyword-based fallback
  if (isCircleByKeyword && !isRectByKeyword) {
    return {
      type: "circle",
      radius: Number(object?.shape?.radius || object?.radius || defaults.radius || 0.45),
    };
  }

  return {
    type: "rectangle",
    width: Number(object?.shape?.width || object?.width || asset?.width || defaults.width || 1.6),
    height: Number(object?.shape?.height || object?.height || asset?.height || defaults.height || 1.0),
  };
}

function resolvePhysics(object, asset) {
  const type = deriveRootType(object?.type || asset?.objectFamily || "block");
  const isStatic =
    object?.physics?.movable === false ||
    object?.physics?.fixed === true ||
    object?.static === true ||
    STATIC_TYPES.has(type);

  const mass = ensureNonNegative(
    object?.physics?.mass ??
    object?.mass ??
    asset?.mass ??
    (isStatic ? 0 : type === "vehicles" ? 1200 : type === "characters" ? 80 : type === "rocket" ? 500 : 1),
    1
  );

  const friction = ensureNonNegative(
    object?.material?.friction ?? object?.friction ?? asset?.friction ?? (type === "plane" ? 0.8 : 0.1),
    0.1
  );

  const restitution = ensureNonNegative(
    object?.material?.restitution ?? object?.restitution ?? object?.bounce ?? asset?.bounce ?? 0.2,
    0.2
  );

  const density = mass > 0 && !isStatic ? Math.max(0.0001, mass / 1000) : 0;

  return { mass, density, friction, restitution, isStatic };
}

function resolveVisual(object, asset, shape) {
  const normValue = normalizeText(object?.type || object?.name || "");
  let color = object?.visual?.color || object?.color || "#7dd3fc";
  let label = object?.visual?.label || object?.name || object?.id || asset?.key || "Object";
  let emoji = object?.visual?.emoji || object?.emoji || "";

  for (const [key, fallback] of Object.entries(fallbackObjectMap)) {
    if (normValue.includes(key)) {
      color = object?.visual?.color || object?.color || fallback.color;
      label = object?.visual?.label || object?.name || fallback.label;
      emoji = object?.visual?.emoji || object?.emoji || fallback.emoji;
      break;
    }
  }

  return {
    color,
    label,
    emoji,
    opacity: Number(object?.visual?.opacity ?? 1),
    trail: Boolean(object?.visual?.trail ?? object?.trail ?? (shape.type !== "rectangle" || normValue.includes("rocket"))),
    showVelocity: Boolean(object?.visual?.showVelocity ?? object?.showVelocity ?? true),
    showForces: Boolean(object?.visual?.showForces ?? object?.showForces ?? false),
  };
}

function resolvePosition(object, index, allObjects) {
  if (object?.position?.x != null || object?.x != null) {
    return {
      x: ensureFinite(object?.position?.x ?? object?.x, 5),
      y: ensureFinite(object?.position?.y ?? object?.y ?? 4, 4),
    };
  }

  const total = allObjects?.length || 1;
  const type = deriveRootType(object?.type || "");

  const isStaticObj =
    object?.physics?.movable === false ||
    object?.physics?.fixed === true ||
    object?.static === true ||
    STATIC_TYPES.has(type);

  const floorY = 4.5;

  if (total === 1) {
    if (type === "rocket") return { x: 5, y: floorY - 0.5 };
    return { x: 5, y: floorY };
  }

  if (isStaticObj) {
    return { x: 11, y: floorY };
  } else {
    const dynamicObjs = allObjects?.filter(
      (o) => !STATIC_TYPES.has(deriveRootType(o?.type || "")) &&
        o?.physics?.movable !== false && o?.static !== true
    ) || [];
    const dynIndex = dynamicObjs.indexOf(object);
    const spread = Math.max(1, dynamicObjs.length - 1);
    const xPos = 1.5 + (dynIndex / spread) * 4;
    return { x: xPos, y: type === "rocket" ? floorY - 0.5 : floorY };
  }
}

function resolveVelocity(object) {
  return {
    x: ensureFinite(object?.velocity?.x ?? object?.vx ?? 0, 0),
    y: ensureFinite(object?.velocity?.y ?? object?.vy ?? 0, 0),
  };
}

function normalizeEnvironment(environment = {}, subject = "physics", prompt = "") {
  let gravity = environment.gravity ?? 1;
  let friction = environment.friction ?? 0.05;
  let airResistance = environment.air_resistance ?? environment.airResistance ?? 0.01;

  const normPrompt = normalizePrompt(prompt);
  const p = prompt.toLowerCase();

  if (normPrompt === "rocket_launch") {
    gravity = 1;
    friction = 0.1;
  } else if (normPrompt === "projectile_motion") {
    gravity = 1;
    airResistance = 0.01;
  } else if (normPrompt === "circular_motion" || normPrompt.includes("space") || p.includes("orbit")) {
    gravity = 0;
  } else if (normPrompt === "collision") {
    friction = 0.3;
  }

  const gravityVector = typeof gravity === "number" ? { x: 0, y: gravity } : gravity;

  return {
    gravity: {
      x: ensureFinite(gravityVector?.x ?? 0, 0),
      y: ensureFinite(gravityVector?.y ?? 1, 1),
    },
    friction: ensureNonNegative(friction, 0.05),
    air_resistance: ensureNonNegative(airResistance, 0.01),
    background: generateSceneBackground(subject, normPrompt, prompt),
  };
}

export function normalizeSimulationDsl(payload) {
  const root = payload?.dsl || payload || {};
  const meta = root.meta || root.metadata || {};
  const prompt = meta.title || root.prompt || "sandbox";
  const subject = meta.subject || "physics";

  const normPrompt = normalizePrompt(prompt);
  let rendererType = root.rendererType || meta.rendererType;
  if (!rendererType) {
    if (
      normPrompt === "rocket_launch" || normPrompt === "projectile_motion" ||
      normPrompt === "circular_motion" || normPrompt === "collision"
    ) {
      rendererType = "physics";
    } else if (subject === "mathematics" || subject === "math") {
      rendererType = "graph";
    } else if (subject === "biology" || subject === "chemistry" || subject === "evs") {
      rendererType = "diagram";
    } else {
      rendererType = "physics";
    }
  }

  const objects = Array.isArray(root.objects) ? root.objects : [];
  const interactions = Array.isArray(root.interactions) ? root.interactions : [];
  const forces = Array.isArray(root.forces) ? root.forces : [];

  if (normPrompt === "rocket_launch" && !objects.some(o => normalizeText(o.type || o.name).includes("platform"))) {
    objects.push({
      id: "launch_platform",
      name: "Launch Platform",
      type: "block",
      static: true,
      position: { x: 5, y: 5.5 },
      visual: { color: "#475569" },
      shape: { width: 4, height: 1 },
    });
  }

  if (normPrompt === "rocket_launch" && forces.length === 0) {
    const rocketObj = objects.find(o => normalizeText(o.type || o.name).includes("rocket"));
    if (rocketObj) {
      forces.push({
        type: "constant_force",
        target: rocketObj.id || "object_0",
        vector: { x: 0, y: -25 },
        label: "Rocket Thrust",
      });
    }
  }

  const environment = normalizeEnvironment(root.environment || {}, subject, prompt);

  const runtimeObjects = objects.map((object, index) => {
    const asset = resolveAsset(object, subject, prompt);
    const shape = pickSize(object, asset);
    const position = resolvePosition(object, index, objects);
    const physics = resolvePhysics(object, asset);

    console.log(
      `[DSL] Object[${index}] type=${object?.type} → root=${deriveRootType(object?.type)} shape=${shape.type} ` +
      `asset=${asset.filePath} pos=(${position.x.toFixed(1)},${position.y.toFixed(1)}) ` +
      `size=${shape.width ?? shape.radius}x${shape.height ?? ""}`
    );

    return {
      raw: object,
      id: object?.id || `object_${index}`,
      name: object?.name || object?.id || `Object ${index + 1}`,
      type: object?.type || asset.objectFamily || "block",
      asset,
      shape,
      physics,
      visual: resolveVisual(object, asset, shape),
      position,
      velocity: resolveVelocity(object),
      angle: Number(object?.angle ?? object?.rotation ?? 0),
      angularVelocity: Number(object?.angularVelocity ?? object?.physics?.angularVelocity ?? 0),
    };
  });

  return {
    meta,
    environment,
    rendererType,
    objects: runtimeObjects,
    interactions,
    forces,
    raw: root,
  };
}

export function getAssetPreview(type) {
  return resolveFallbackAsset(type);
}

export function mapObjectTypeToAsset(objectType) {
  return resolveAsset({ type: objectType });
}

export function isStaticRuntimeType(objectType) {
  return STATIC_TYPES.has(deriveRootType(objectType));
}

export default normalizeSimulationDsl;