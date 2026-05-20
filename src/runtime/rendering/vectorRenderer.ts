export type VectorStyle = {
  color: string;
  label: string;
  scale?: number;
  visible?: boolean;
};

export type VectorPayload = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  magnitude?: number;
  style: VectorStyle;
};

const DEFAULT_SCALE = 1;

function drawArrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
  const size = 8;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, size * 0.5);
  ctx.lineTo(-size, -size * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawVectors(ctx: CanvasRenderingContext2D, vectors: VectorPayload[]) {
  const batch = vectors.filter((vector) => vector.style.visible !== false && Number.isFinite(vector.dx) && Number.isFinite(vector.dy));
  for (const vector of batch) {
    const scale = vector.style.scale ?? DEFAULT_SCALE;
    const endX = vector.x + vector.dx * scale;
    const endY = vector.y + vector.dy * scale;
    const angle = Math.atan2(endY - vector.y, endX - vector.x);
    const magnitude = vector.magnitude ?? Math.hypot(vector.dx, vector.dy);

    ctx.save();
    ctx.strokeStyle = vector.style.color;
    ctx.fillStyle = vector.style.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vector.x, vector.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    drawArrowHead(ctx, endX, endY, angle, vector.style.color);

    if (vector.style.label) {
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(`${vector.style.label}: ${magnitude.toFixed(2)}`, endX + 6, endY - 6);
    }
    ctx.restore();
  }
}

export function vectorMagnitude(x: number, y: number) {
  return Math.hypot(Number(x) || 0, Number(y) || 0);
}
