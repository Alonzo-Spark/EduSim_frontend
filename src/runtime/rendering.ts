import { SimulationSnapshot } from "./dsl";
import { imageSafeLoader } from "@/utils/imageSafeLoader";
import { getAssetDimensions, resolveBestAsset } from "@/utils/assetCatalogResolver";

const METER_TO_PIXEL = 50;
const imageCache = new Map<string, HTMLImageElement>();

function warmSprite(path: string) {
  if (!path || imageCache.has(path)) {
    return;
  }

  void imageSafeLoader.load(path).then((image) => {
    imageCache.set(path, image);
  });
}

function getSpritePath(obj: any) {
  const explicit = obj?.assetUrl || obj?.asset?.path || obj?.asset?.filePath || obj?.sprite;
  if (typeof explicit === "string" && explicit.startsWith("/assets/")) {
    return explicit;
  }

  const resolved = resolveBestAsset(obj?.type || obj?.name || obj?.id || "block");
  return resolved?.path || null;
}

function drawContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const ratio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;

  if (ratio > targetRatio) {
    drawHeight = width / ratio;
  } else {
    drawWidth = height * ratio;
  }

  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
}

export class SimulationRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.resize();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth * window.devicePixelRatio;
      this.canvas.height = parent.clientHeight * window.devicePixelRatio;
      this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      this.canvas.style.width = `${parent.clientWidth}px`;
      this.canvas.style.height = `${parent.clientHeight}px`;
    }
  }

  render(snapshot: SimulationSnapshot) {
    const { dsl } = snapshot;
    const { width, height } = this.canvas.getBoundingClientRect();
    
    // Clear canvas
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    this.ctx.clearRect(0, 0, width, height);
    
    // Draw Background Grid (Visual Scale Reference)
    this.drawGrid(width, height);
    
    // Draw Objects
    dsl.objects.forEach(obj => {
      this.drawObject(obj);
    });
  }

  private drawGrid(width: number, height: number) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    this.ctx.lineWidth = 1;

    // Draw grid lines every 1 meter
    for (let x = 0; x < width; x += METER_TO_PIXEL) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += METER_TO_PIXEL) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    this.ctx.stroke();
  }

  private drawObject(obj: any) {
    const { physics, visual, shape, trail } = obj;
    const ctx = this.ctx;
    const spritePath = getSpritePath(obj);
       const resolvedAsset = resolveBestAsset(obj?.type || obj?.name || obj?.id || "block");
       const assetDims = resolvedAsset ? getAssetDimensions(resolvedAsset.id) : null;

    // 1. Draw Trail
    if (visual.trail && trail && trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = visual.color;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 2;
      ctx.moveTo(trail[0].x * METER_TO_PIXEL, trail[0].y * METER_TO_PIXEL);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x * METER_TO_PIXEL, trail[i].y * METER_TO_PIXEL);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    // 2. Draw Shape
    ctx.save();
    ctx.translate(physics.position.x * METER_TO_PIXEL, physics.position.y * METER_TO_PIXEL);
    ctx.rotate(physics.angle);
    
    ctx.fillStyle = visual.color;
    ctx.globalAlpha = visual.opacity;

    if (spritePath) {
      warmSprite(spritePath);
      const image = imageCache.get(spritePath);
      if (image && image.complete && image.naturalWidth > 0) {
        const width = (assetDims?.width || shape.width || shape.radius * 2 || 1) * METER_TO_PIXEL;
        const height = (assetDims?.height || shape.height || shape.radius * 2 || 1) * METER_TO_PIXEL;
        drawContain(ctx, image, width, height);
        ctx.restore();
        return;
      }
    }
    
    if (shape.type === 'sphere' || shape.type === 'circle') {
      const radius = (shape.radius || 0.5) * METER_TO_PIXEL;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle glow/shading
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();
    } else if (shape.type === 'box' || shape.type === 'rect') {
      const w = (shape.width || 1) * METER_TO_PIXEL;
      const h = (shape.height || 1) * METER_TO_PIXEL;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      
      // Outline
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    }
    
    ctx.restore();
  }
}
