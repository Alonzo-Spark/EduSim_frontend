import { z } from "zod";

const AssetSchema = z.object({
  key: z.string(),
  category: z.string(),
  filePath: z.string(),
  objectFamily: z.string().optional(),
  matched: z.boolean().optional(),
});

const ShapeCircleSchema = z.object({ type: z.literal("circle"), radius: z.number().nonnegative() });
const ShapeRectSchema = z.object({ type: z.literal("rectangle"), width: z.number().nonnegative(), height: z.number().nonnegative() });
const ShapeSchema = z.union([ShapeCircleSchema, ShapeRectSchema]);

const PhysicsSchema = z.object({
  mass: z.number().finite(),
  density: z.number().nonnegative(),
  friction: z.number().nonnegative(),
  restitution: z.number().nonnegative(),
  isStatic: z.boolean(),
});

const VisualSchema = z.object({
  color: z.string().optional(),
  label: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  trail: z.boolean().optional(),
  showVelocity: z.boolean().optional(),
});

const RuntimeObjectSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  type: z.string(),
  asset: AssetSchema,
  shape: ShapeSchema,
  physics: PhysicsSchema,
  visual: VisualSchema.optional(),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
  velocity: z.object({ x: z.number().finite(), y: z.number().finite() }).optional(),
  angle: z.number().optional(),
  angularVelocity: z.number().optional(),
});

const EnvironmentSchema = z.object({
  gravity: z.object({ x: z.number().finite(), y: z.number().finite() }),
  friction: z.number().nonnegative(),
  air_resistance: z.number().nonnegative(),
  background: z.string().optional(),
});

export const SimulationRuntimeSchema = z.object({
  meta: z.record(z.any()).optional(),
  environment: EnvironmentSchema,
  rendererType: z.string(),
  objects: z.array(RuntimeObjectSchema),
  interactions: z.array(z.any()).optional(),
  forces: z.array(z.any()).optional(),
  raw: z.any().optional(),
});

export type SimulationRuntime = z.infer<typeof SimulationRuntimeSchema>;

export default SimulationRuntimeSchema;
