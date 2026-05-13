import Matter from 'matter-js';
import { toPixels, toWorld } from '../utils/coordinateUtils';

/**
 * Custom Canvas-based renderer for EduSim
 * Synchronizes with Matter.js engine and renders bodies with high-fidelity visuals.
 */
class EduSimRenderer {
  constructor(container, engine, dsl) {
    this.container = container;
    this.engine = engine;
    this.dsl = dsl;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.isRunning = false;
    this.animationId = null;
    this.validationResults = null;

    this.resize();
    container.appendChild(this.canvas);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
  }

  setValidation(results) {
    this.validationResults = results;
  }

  resize() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.render();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  destroy() {
    this.stop();
    this.resizeObserver.disconnect();
    this.canvas.remove();
  }

  render() {
    if (!this.isRunning) return;

    const { ctx, canvas, dsl, engine } = this;
    const pixelRatio = window.devicePixelRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = dsl.environment?.background?.color || '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);

    const worldWidthPx = dsl.environment?.world?.width || 800;
    const worldHeightPx = dsl.environment?.world?.height || 600;
    const containerWidth = canvas.width / pixelRatio;
    const containerHeight = canvas.height / pixelRatio;

    const scaleX = containerWidth / worldWidthPx;
    const scaleY = containerHeight / worldHeightPx;
    const viewScale = Math.min(scaleX, scaleY);

    const offsetX = (containerWidth - worldWidthPx * viewScale) / 2;
    const offsetY = (containerHeight - worldHeightPx * viewScale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(viewScale, viewScale);

    // Draw bodies
    const bodies = Matter.Composite.allBodies(engine.world);
    bodies.forEach(body => this.drawBody(body));

    const constraints = Matter.Composite.allConstraints(engine.world);
    constraints.forEach(constraint => this.drawConstraint(constraint));

    ctx.restore();

    // Draw HUD
    this.drawHUD();

    this.animationId = requestAnimationFrame(() => this.render());
  }

  drawBody(body) {
    const { position, angle, plugin } = body;
    const visual = plugin?.visual;

    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    this.ctx.rotate(angle);

    this.ctx.fillStyle = visual?.color || '#3b82f6';
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 2;

    if (visual?.shape === 'circle') {
      const radius = toPixels(visual.radius || 1);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
    } else {
      const width = toPixels(visual?.width || 1);
      const height = toPixels(visual?.height || 1);
      this.ctx.fillRect(-width / 2, -height / 2, width, height);
      this.ctx.strokeRect(-width / 2, -height / 2, width, height);
    }

    this.ctx.restore();

    if (visual?.label) {
      this.ctx.save();
      this.ctx.translate(position.x, position.y);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 12px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      const offset = visual?.shape === 'circle' ? toPixels(visual.radius || 1) : toPixels(visual?.height || 1) / 2;
      this.ctx.fillText(visual.label, 0, -offset - 10);
      this.ctx.restore();
    }
  }

  drawConstraint(constraint) {
    if (!constraint.bodyA || !constraint.bodyB) return;
    const posA = constraint.bodyA.position;
    const posB = constraint.bodyB.position;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(posA.x, posA.y);
    this.ctx.lineTo(posB.x, posB.y);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawHUD() {
    const pixelRatio = window.devicePixelRatio;
    const ctx = this.ctx;
    
    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);

    // Instrument Panel Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(10, 10, 260, 200);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 260, 200);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px Courier New';
    ctx.fillText('PHYSICS VERIFICATION ENGINE', 20, 25);

    // Live Metrics
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 12px Inter, sans-serif';
    const time = (this.engine.timing.timestamp / 1000).toFixed(2);
    ctx.fillText(`Sim Time: ${time}s`, 20, 45);

    // Dynamic Formulas from DSL
    const formulas = this.dsl.knowledge?.relevant_formulas || [];
    const activeFormula = this.validationResults?.activeFormula;

    if (formulas.length > 0) {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 10px Inter';
      ctx.fillText('RELEVANT FORMULAS:', 20, 65);
      
      formulas.forEach((f, i) => {
        const isActive = activeFormula && f.includes(activeFormula.replace(/[π√()]/g, ''));
        // Simplified matching: check if formula string contains the core logic
        const highlight = isActive || (activeFormula === 'v = u + at' && f === 'v = u + at');

        ctx.fillStyle = highlight ? '#fbbf24' : '#475569';
        ctx.font = highlight ? 'bold italic 11px Inter' : 'italic 11px Inter';
        ctx.fillText(`${highlight ? '> ' : '• '}${f}`, 25, 80 + (i * 18));
      });
    }

    // Comparison Table
    const res = this.validationResults;
    if (res && res.type !== 'Generic') {
      ctx.beginPath();
      ctx.moveTo(20, 140);
      ctx.lineTo(250, 140);
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 9px Inter';
      ctx.fillText('ACTIVE VERIFICATION: ' + res.type.toUpperCase(), 20, 155);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Inter';
      const label = res.unit || 'Value';
      ctx.fillText(`${label}:`, 20, 175);
      
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`THEORY: ${Object.values(res.expected)[0]?.toFixed(2)}`, 90, 175);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`ACTUAL: ${Object.values(res.actual)[0]?.toFixed(2)}`, 175, 175);

      const diff = Math.abs(Object.values(res.expected)[0] - Object.values(res.actual)[0]);
      const isSync = diff < 0.2;
      ctx.fillStyle = isSync ? '#10b981' : '#f43f5e';
      ctx.font = 'bold 11px Inter';
      ctx.fillText(isSync ? '✓ PHYSICS SYNC: OK' : '⚠ PHYSICS SYNC: CALCULATING...', 20, 195);
    }

    ctx.restore();
  }
}

export const createRenderer = (container, engine, dsl) => {
  return new EduSimRenderer(container, engine, dsl);
};
