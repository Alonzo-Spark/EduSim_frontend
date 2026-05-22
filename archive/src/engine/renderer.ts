import { SimulationState, SimulationObject, Vector } from "../types/simulation";

/** Helper to draw an arrow representing a vector (for forces) */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Vector,
  to: Vector,
  color: string = "#ff0000",
) {
  const headLength = 10; // length of head in pixels
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLength * Math.cos(angle - Math.PI / 6),
    to.y - headLength * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    to.x - headLength * Math.cos(angle + Math.PI / 6),
    to.y - headLength * Math.sin(angle + Math.PI / 6),
  );
  ctx.lineTo(to.x, to.y);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Draw a single simulation object based on its primitive type */
function drawObject(ctx: CanvasRenderingContext2D, obj: SimulationObject) {
  ctx.save();
  ctx.translate(obj.position.x, obj.position.y);

  switch (obj.type) {
    case "projectile":
    case "ball":
      ctx.fillStyle = obj.props?.color ?? "#3498db";
      ctx.beginPath();
      const radius = obj.props?.radius ?? 10;
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "pendulum": {
      const length = obj.props?.length ?? 150;
      const angle = obj.props?.angle ?? 0;
      // Draw rod
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, length);
      ctx.stroke();
      // Draw bob
      ctx.translate(0, length);
      ctx.fillStyle = obj.props?.color ?? "#e74c3c";
      ctx.beginPath();
      ctx.arc(0, 0, obj.props?.radius ?? 12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default:
      // Fallback – draw a small square
      ctx.fillStyle = "#888";
      ctx.fillRect(-5, -5, 10, 10);
  }
  ctx.restore();
}

/** Main renderer – clears the canvas and draws the full simulation state */
export function renderSimulation(state: SimulationState, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f9f9f9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each object
  state.objects.forEach((obj) => {
    // If it's a SimulationObject (has Vector position/velocity)
    if (obj.position && typeof obj.position === 'object' && 'x' in obj.position) {
      const sObj = obj as SimulationObject;
      drawObject(ctx, sObj);
      
      // Optionally draw velocity vector for educational purposes
      if (sObj.velocity) {
        const velocityEnd: Vector = {
          x: sObj.position.x + sObj.velocity.x * 0.2, // scale for visibility
          y: sObj.position.y + sObj.velocity.y * 0.2,
        };
        drawArrow(ctx, sObj.position, velocityEnd, "#27ae60");
      }
    }
  });
}
