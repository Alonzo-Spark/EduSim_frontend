export type InteractionNode = {
  id: string;
  label: string;
  type: string;
  x?: number;
  y?: number;
};

export type InteractionEdge = {
  id: string;
  source: string;
  target: string;
  kind: string;
  weight?: number;
  label?: string;
};

export type InteractionGraph = {
  nodes: InteractionNode[];
  edges: InteractionEdge[];
};

export function buildInteractionGraph(dsl: any, runtimeEventsLog: any[] = []): InteractionGraph {
  const objects = Array.isArray(dsl?.objects) ? dsl.objects : [];
  const interactions = Array.isArray(dsl?.interactions) ? dsl.interactions : [];
  const nodes: InteractionNode[] = [];
  const edges: InteractionEdge[] = [];

  for (const object of objects) {
    nodes.push({
      id: object.id,
      label: object.name || object.id,
      type: object.type || object.shape?.type || "entity",
      x: object.physics?.position?.x,
      y: object.physics?.position?.y,
    });
  }

  for (const interaction of interactions) {
    const target = interaction?.target || interaction?.bind || interaction?.object || interaction?.body;
    if (target) {
      edges.push({
        id: `${interaction.id || interaction.type}_${String(target)}`,
        source: String(target),
        target: String(target),
        kind: String(interaction.type || "interaction"),
        weight: Number(interaction?.parameters?.strength ?? interaction?.parameters?.k ?? 1) || 1,
        label: interaction.label || interaction.type,
      });
    }
  }

  for (const event of runtimeEventsLog) {
    if (event?.kind === "collision" && event?.bodyA?.id && event?.bodyB?.id) {
      edges.push({
        id: `collision_${event.bodyA.id}_${event.bodyB.id}_${event.timestamp || Date.now()}`,
        source: event.bodyA.id,
        target: event.bodyB.id,
        kind: "collision",
        weight: Number(event?.impulseMagnitude ?? 1) || 1,
        label: "collision",
      });
    }
  }

  return { nodes, edges };
}

export function renderInteractionGraph(ctx: CanvasRenderingContext2D, graph: InteractionGraph, width: number, height: number) {
  const nodes = graph.nodes;
  const edges = graph.edges;
  if (!nodes.length) return;

  const positions = new Map<string, { x: number; y: number }>();
  const radius = Math.min(width, height) * 0.18;
  const centerX = width - 160;
  const centerY = 180;

  nodes.forEach((node, index) => {
    const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2;
    positions.set(node.id, {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
  });

  ctx.save();
  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";

  for (const edge of edges) {
    const from = positions.get(edge.source);
    const to = positions.get(edge.target);
    if (!from || !to) continue;
    ctx.strokeStyle = edge.kind === "collision" ? "rgba(248,113,113,0.75)" : "rgba(96,165,250,0.55)";
    ctx.lineWidth = Math.max(1, Math.min(4, edge.weight || 1));
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  for (const node of nodes) {
    const point = positions.get(node.id);
    if (!point) continue;
    ctx.fillStyle = "rgba(15,23,42,0.95)";
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(node.label, point.x + 12, point.y + 3);
  }

  ctx.restore();
}

export default buildInteractionGraph;
