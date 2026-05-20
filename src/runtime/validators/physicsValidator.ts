function isFiniteNumber(v: any) {
  return typeof v === "number" && Number.isFinite(v);
}

export function validatePhysicsEntity(entity: any) {
  if (!entity || typeof entity !== "object") {
    throw new Error(`Invalid entity: ${String(entity)}`);
  }
  const id = entity.id || entity.name || "<unknown>";

  const mass = entity.physics?.mass ?? entity.mass ?? entity?.raw?.mass;
  if (!isFiniteNumber(mass) || mass <= 0) {
    throw new Error(`Invalid mass for ${id}: ${mass}`);
  }

  const pos = entity.physics?.position ?? entity.position ?? entity?.raw?.position;
  if (!pos || !isFiniteNumber(pos.x) || !isFiniteNumber(pos.y)) {
    throw new Error(`Invalid position for ${id}: ${JSON.stringify(pos)}`);
  }

  const vel = entity.physics?.velocity ?? entity.velocity ?? entity?.raw?.velocity ?? { x: 0, y: 0 };
  if (!isFiniteNumber(vel.x) || !isFiniteNumber(vel.y)) {
    throw new Error(`Invalid velocity for ${id}: ${JSON.stringify(vel)}`);
  }

  const shape = entity.shape || {};
  if (shape.type === "rectangle" || shape.type === "rect" || shape.type === "box") {
    const w = shape.width ?? entity.width ?? entity.raw?.width;
    const h = shape.height ?? entity.height ?? entity.raw?.height;
    if (!isFiniteNumber(w) || !isFiniteNumber(h) || w <= 0 || h <= 0) {
      throw new Error(`Invalid dimensions for ${id}: width=${w} height=${h}`);
    }
  }

  if (shape.type === "circle" || shape.type === "sphere") {
    const r = shape.radius ?? entity.radius ?? entity.raw?.radius;
    if (!isFiniteNumber(r) || r <= 0) {
      throw new Error(`Invalid radius for ${id}: ${r}`);
    }
  }

  const phys = entity.physics || {};
  if (!isFiniteNumber(phys.restitution ?? entity.restitution ?? 0) || (phys.restitution ?? entity.restitution ?? 0) < 0) {
    throw new Error(`Invalid restitution for ${id}: ${phys.restitution ?? entity.restitution}`);
  }

  if (!isFiniteNumber(phys.friction ?? entity.friction ?? 0) || (phys.friction ?? entity.friction ?? 0) < 0) {
    throw new Error(`Invalid friction for ${id}: ${phys.friction ?? entity.friction}`);
  }

  // No NaN/Infinity check for nested properties
  return true;
}

export function validatePhysicsScene(scene: any) {
  if (!scene || !Array.isArray(scene.objects)) {
    throw new Error("Invalid scene: missing objects array");
  }

  for (const obj of scene.objects) {
    validatePhysicsEntity(obj);
  }

  return true;
}

export default validatePhysicsScene;
