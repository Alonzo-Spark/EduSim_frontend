import { drawVectors } from "./vectorRenderer";
import { analyzeCollision } from "@/runtime/analysis/collisionAnalyzer";
import { renderInteractionGraph, InteractionGraph } from "@/runtime/graphs/interactionGraph";

type OverlayOptions = {
  showCollisionNormals?: boolean;
  showContacts?: boolean;
  showImpulseVectors?: boolean;
  showFrictionVectors?: boolean;
  showAccelerationVectors?: boolean;
  showGravityField?: boolean;
  showSpringConstraints?: boolean;
  showForcePoints?: boolean;
  showCenterOfMass?: boolean;
  showConstraintTension?: boolean;
  runtimeEventsLog?: any[];
  interactionGraph?: InteractionGraph | null;
};

function safeVec(input: any, fallback = { x: 0, y: 0 }) {
  return {
    x: Number(input?.x ?? fallback.x) || 0,
    y: Number(input?.y ?? fallback.y) || 0,
  };
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, stroke: string, fill?: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}

function drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = "rgba(255,255,255,0.85)") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(text, x + 6, y - 6);
  ctx.restore();
}

export function renderPhysicsOverlays(
  ctx: CanvasRenderingContext2D,
  snapshot: any,
  options: OverlayOptions = {},
) {
  const objects = Array.isArray(snapshot?.dsl?.objects) ? snapshot.dsl.objects : [];
  const interactions = Array.isArray(snapshot?.dsl?.interactions) ? snapshot.dsl.interactions : [];
  const width = ctx.canvas.clientWidth || ctx.canvas.width;
  const height = ctx.canvas.clientHeight || ctx.canvas.height;

  const vectors: any[] = [];
  const centerOfMass = objects.reduce(
    (acc, object) => {
      const mass = Number(object?.physics?.mass ?? 1) || 1;
      const pos = safeVec(object?.physics?.position || object?.position);
      acc.mass += mass;
      acc.x += pos.x * mass;
      acc.y += pos.y * mass;
      return acc;
    },
    { x: 0, y: 0, mass: 0 },
  );
  const comX = centerOfMass.mass ? centerOfMass.x / centerOfMass.mass : width / 2;
  const comY = centerOfMass.mass ? centerOfMass.y / centerOfMass.mass : height / 2;

  if (options.showCenterOfMass !== false) {
    drawCircle(ctx, comX * 50, comY * 50, 6, "rgba(16,185,129,0.95)", "rgba(16,185,129,0.2)");
    drawLabel(ctx, comX * 50, comY * 50, "COM", "rgba(16,185,129,0.95)");
  }

  if (options.showGravityField !== false) {
    const spacing = 120;
    ctx.save();
    ctx.strokeStyle = "rgba(34,197,94,0.12)";
    ctx.fillStyle = "rgba(34,197,94,0.25)";
    for (let y = spacing / 2; y < height; y += spacing) {
      for (let x = spacing / 2; x < width; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 24);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y + 24, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  for (const object of objects) {
    const body = object?.physics || {};
    const position = safeVec(body.position || object.position);
    const velocity = safeVec(body.velocity || object.velocity);
    const acceleration = safeVec(body.acceleration || object.acceleration);
    const mass = Number(body.mass ?? 1) || 1;
    const baseX = position.x * 50;
    const baseY = position.y * 50;

    if (options.showAccelerationVectors !== false) {
      vectors.push({ x: baseX, y: baseY, dx: acceleration.x * 140, dy: acceleration.y * 140, style: { color: "rgba(248,113,113,0.85)", label: `${object.id} a`, scale: 1, visible: true } });
    }

    if (options.showForcePoints !== false) {
      drawCircle(ctx, baseX, baseY, 3, "rgba(250,204,21,0.9)", "rgba(250,204,21,0.2)");
      drawLabel(ctx, baseX, baseY, `${object.id}`, "rgba(250,204,21,0.8)");
    }

    if (options.showFrictionVectors !== false && Math.abs(velocity.x) + Math.abs(velocity.y) > 0.001) {
      vectors.push({ x: baseX, y: baseY, dx: -velocity.x * 14, dy: -velocity.y * 14, style: { color: "rgba(251,191,36,0.85)", label: `${object.id} f`, scale: 1, visible: true } });
    }

    if (options.showImpulseVectors !== false) {
      vectors.push({ x: baseX, y: baseY, dx: velocity.x * 20, dy: velocity.y * 20, style: { color: "rgba(59,130,246,0.9)", label: `${object.id} J`, scale: 1, visible: true }, magnitude: mass * Math.hypot(velocity.x, velocity.y) });
    }

    if (options.showCollisionNormals !== false) {
      const angle = Math.atan2(velocity.y, velocity.x);
      vectors.push({ x: baseX, y: baseY, dx: Math.cos(angle) * 24, dy: Math.sin(angle) * 24, style: { color: "rgba(236,72,153,0.75)", label: `${object.id} n`, scale: 1, visible: true } });
    }

    if (options.showSpringConstraints !== false && Array.isArray(interactions)) {
      for (const interaction of interactions) {
        if (String(interaction?.type || "").toLowerCase() !== "spring_force") continue;
        const target = interaction?.target || interaction?.bind || interaction?.object;
        if (String(target) !== String(object.id)) continue;
        const anchor = interaction?.parameters?.anchor;
        const ax = Array.isArray(anchor) ? Number(anchor[0] ?? 0) : baseX;
        const ay = Array.isArray(anchor) ? Number(anchor[1] ?? 0) : baseY - 80;
        ctx.save();
        ctx.strokeStyle = "rgba(168,85,247,0.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(baseX, baseY);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel(ctx, (ax + baseX) / 2, (ay + baseY) / 2, "spring", "rgba(196,181,253,0.95)");
        ctx.restore();
      }
    }

    // reuse vector renderer for all computed vectors at the end of the loop
  }

  drawVectors(ctx, vectors);

  const collisions = Array.isArray(options.runtimeEventsLog)
    ? options.runtimeEventsLog.filter((event) => event?.kind === "collision" || event?.type === "collision_start")
    : [];

  for (const event of collisions.slice(-8)) {
    const point = event?.contactPoint || event?.point || event?.bodyA?.position || { x: 0, y: 0 };
    const px = Number(point.x ?? 0) * 50;
    const py = Number(point.y ?? 0) * 50;
    drawCircle(ctx, px, py, 14, "rgba(248,113,113,0.9)", "rgba(248,113,113,0.12)");
    drawLabel(ctx, px, py, event?.impact?.toFixed?.(2) ? `impact ${event.impact.toFixed(2)}` : "impact", "rgba(248,113,113,0.95)");
  }

  // Energy / damping hints from interactions and equations
  for (const interaction of interactions) {
    if (String(interaction?.type || "").toLowerCase() === "gravity") {
      drawLabel(ctx, width - 260, 30, "gravity field active", "rgba(34,197,94,0.95)");
    }
  }

  if (options.interactionGraph) {
    renderInteractionGraph(ctx, options.interactionGraph, width, height);
  }

  const collisionPairs = collisions.slice(-1);
  if (collisionPairs.length > 0) {
    const latest = collisionPairs[collisionPairs.length - 1];
    const analysis = analyzeCollision({
      bodyA: latest.bodyA,
      bodyB: latest.bodyB,
      restitution: latest?.restitution,
      durationMs: latest?.durationMs,
      impulse: latest?.impulseMagnitude,
      contactPoint: latest?.contactPoint || latest?.point,
      preVelocityA: latest?.preVelocityA,
      preVelocityB: latest?.preVelocityB,
      postVelocityA: latest?.postVelocityA,
      postVelocityB: latest?.postVelocityB,
    });
    drawLabel(ctx, 20, height - 28, analysis.summary, "rgba(250,204,21,0.95)");
  }

  return {
    centerOfMass: { x: comX, y: comY },
    collisions: collisions.length,
    vectorCount: vectors.length,
  };
}

export default renderPhysicsOverlays;
