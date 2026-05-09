import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFormulaEntry } from "@/runtime/formulaRegistry";
import { buildRuntimeWorld, PhysicsEngine } from "@/runtime/physicsEngine";
import type { SimulationDSL, SimulationSnapshot, SimulationType, RuntimeBody } from "@/runtime/dsl";
import { ArrowRight, Pause, Play, RotateCcw, Sparkles, Gauge, Ruler, Wind } from "lucide-react";

type Props = {
  dsl: SimulationDSL | null | undefined;
  formula?: string;
  explanation?: string;
  className?: string;
};

type SceneControls = {
  gravity: number;
  mass: number;
  force: number;
  angle: number;
  velocity: number;
  length: number;
  friction: number;
  radius: number;
};

function useSceneEngine(dsl: SimulationDSL | null | undefined) {
  const engineRef = useRef<PhysicsEngine | null>(null);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);

  useEffect(() => {
    if (!dsl) {
      setSnapshot(null);
      return;
    }

    const engine = new PhysicsEngine(buildRuntimeWorld(dsl));
    engineRef.current = engine;
    const unsubscribe = engine.subscribe(setSnapshot);
    engine.start();

    return () => {
      unsubscribe();
      engine.stop();
    };
  }, [dsl]);

  return { engineRef, snapshot, setSnapshot };
}

function getControlDefaults(dsl: SimulationDSL | null | undefined): SceneControls {
  return {
    gravity: dsl?.environment.gravity ?? 9.8,
    mass: dsl?.entities.find((entity) => entity.mass !== null)?.mass ?? 5,
    force: 24,
    angle: 45,
    velocity: 24,
    length: 160,
    friction: dsl?.environment.friction ?? 0.1,
    radius: 140,
  };
}

function getSceneLabel(simulationType: string | undefined) {
  switch (simulationType) {
    case "projectile_motion":
      return "Projectile Motion";
    case "pendulum":
      return "Pendulum Oscillation";
    case "collision":
      return "Momentum Conservation";
    case "gravity_system":
      return "Gravity System";
    case "inclined_plane":
      return "Inclined Plane";
    case "circular_motion":
      return "Circular Motion";
    case "newtons_first_law":
    case "newtons_third_law":
    case "newtons_second_law":
    default:
      return "Newton's Laws";
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  dx: number,
  dy: number,
  color: string,
) {
  const toX = fromX + dx;
  const toY = fromY + dy;
  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 8 * Math.cos(angle - Math.PI / 6), toY - 8 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 8 * Math.cos(angle + Math.PI / 6), toY - 8 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function renderBody(ctx: CanvasRenderingContext2D, body: RuntimeBody) {
  ctx.save();
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle || 0);

  if (body.role === "sun") {
    const gradient = ctx.createRadialGradient(0, 0, 8, 0, 0, body.radius * 2.2);
    gradient.addColorStop(0, "#fff59d");
    gradient.addColorStop(1, "#f59e0b");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
    ctx.fill();
  } else if (body.type === "block") {
    ctx.fillStyle = body.color;
    ctx.fillRect(-body.width / 2, -body.height / 2, body.width, body.height);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.strokeRect(-body.width / 2, -body.height / 2, body.width, body.height);
  } else {
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(0, 0, body.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(body.id, body.position.x, body.position.y - body.radius - 10);

  if (body.trail.length > 1) {
    ctx.save();
    ctx.strokeStyle = `${body.color}80`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(body.trail[0].x, body.trail[0].y);
    body.trail.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.restore();
  }
}

function renderCanvas(canvas: HTMLCanvasElement, snapshot: SimulationSnapshot | null) {
  const ctx = canvas.getContext("2d");
  if (!ctx || !snapshot) return;

  const width = canvas.width / window.devicePixelRatio;
  const height = canvas.height / window.devicePixelRatio;
  const { simulationType, environment } = snapshot;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  if (
    simulationType === "projectile_motion" ||
    simulationType === "gravity_system" ||
    simulationType === "circular_motion"
  ) {
    gradient.addColorStop(0, "#07111f");
    gradient.addColorStop(0.55, "#0c1a2f");
    gradient.addColorStop(1, "#111827");
  } else {
    gradient.addColorStop(0, "#0b1020");
    gradient.addColorStop(0.55, "#10182c");
    gradient.addColorStop(1, "#17142a");
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (simulationType === "projectile_motion") {
    const ground = height * 0.82;
    const groundGradient = ctx.createLinearGradient(0, ground, 0, height);
    groundGradient.addColorStop(0, "rgba(96,165,250,0.18)");
    groundGradient.addColorStop(1, "rgba(17,24,39,0.95)");
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, ground, width, height - ground);
    ctx.strokeStyle = "rgba(125,211,252,0.45)";
    ctx.beginPath();
    ctx.moveTo(0, ground);
    ctx.lineTo(width, ground);
    ctx.stroke();
  }

  if (simulationType === "inclined_plane") {
    const angle = 28 * (Math.PI / 180);
    const originX = width * 0.18;
    const originY = height * 0.76;
    const endX = originX + Math.cos(angle) * 420;
    const endY = originY - Math.sin(angle) * 420;
    ctx.strokeStyle = "rgba(192,132,252,0.9)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.fillStyle = "rgba(192,132,252,0.12)";
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(width * 0.92, originY);
    ctx.lineTo(width * 0.92, height);
    ctx.lineTo(originX, height);
    ctx.closePath();
    ctx.fill();
  }

  if (simulationType === "pendulum") {
    const bob = snapshot.bodies[0];
    const pivot = bob?.properties.pivot as { x: number; y: number } | undefined;
    if (pivot) {
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(bob.position.x, bob.position.y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(pivot.x, pivot.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (simulationType === "gravity_system" || simulationType === "circular_motion") {
    const centerBody = snapshot.bodies.find(
      (body) => body.role === "sun" || body.role === "anchor",
    );
    const orbitBody = snapshot.bodies.find(
      (body) => body.role === "planet" || body.role === "primary",
    );
    if (centerBody && orbitBody) {
      ctx.strokeStyle = "rgba(96,165,250,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        centerBody.position.x,
        centerBody.position.y,
        Number(orbitBody.properties.orbitRadius ?? 140),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
  }

  snapshot.bodies.forEach((body) => renderBody(ctx, body));

  if (
    simulationType === "newtons_first_law" ||
    simulationType === "newtons_second_law" ||
    simulationType === "newtons_third_law"
  ) {
    const body = snapshot.bodies[0];
    if (body) {
      drawArrow(ctx, body.position.x, body.position.y, 0, -body.mass * 2.6, "#60a5fa");
      drawArrow(ctx, body.position.x, body.position.y, body.velocity.x * 1.2, 0, "#34d399");
    }
  }

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`time: ${snapshot.time.toFixed(2)}s`, 16, 22);
  ctx.fillText(`gravity: ${environment.gravity.toFixed(2)} m/s²`, 16, 40);
  ctx.fillText(`scene: ${simulationType}`, 16, 58);
}

function SceneControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="font-mono text-white">{value.toFixed(label === "Mass" ? 1 : 2)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0] ?? value)}
      />
    </div>
  );
}

function SimulationControls({
  simulationType,
  controls,
  onControlChange,
  onReset,
  isPaused,
  onTogglePause,
}: {
  simulationType: string | undefined;
  controls: SceneControls;
  onControlChange: <K extends keyof SceneControls>(key: K, value: SceneControls[K]) => void;
  onReset: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
}) {
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Runtime Controls</p>
          <h3 className="text-lg font-semibold text-white">{getSceneLabel(simulationType)}</h3>
        </div>
        <Sparkles className="h-5 w-5 text-cyan-300" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SceneControl
          label="Gravity"
          value={controls.gravity}
          min={0}
          max={20}
          step={0.1}
          onChange={(value) => onControlChange("gravity", value)}
          icon={<Gauge className="h-3.5 w-3.5" />}
        />
        <SceneControl
          label="Mass"
          value={controls.mass}
          min={0.5}
          max={20}
          step={0.1}
          onChange={(value) => onControlChange("mass", value)}
          icon={<Ruler className="h-3.5 w-3.5" />}
        />
        <SceneControl
          label="Force"
          value={controls.force}
          min={0}
          max={60}
          step={0.5}
          onChange={(value) => onControlChange("force", value)}
          icon={<Wind className="h-3.5 w-3.5" />}
        />
        <SceneControl
          label="Angle"
          value={controls.angle}
          min={0}
          max={90}
          step={0.5}
          onChange={(value) => onControlChange("angle", value)}
          icon={<ArrowRight className="h-3.5 w-3.5" />}
        />
        <SceneControl
          label="Velocity"
          value={controls.velocity}
          min={0}
          max={40}
          step={0.5}
          onChange={(value) => onControlChange("velocity", value)}
          icon={<Wind className="h-3.5 w-3.5" />}
        />
        <SceneControl
          label="Length"
          value={controls.length}
          min={60}
          max={260}
          step={1}
          onChange={(value) => onControlChange("length", value)}
          icon={<Ruler className="h-3.5 w-3.5" />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onTogglePause}
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
          {isPaused ? "Resume" : "Pause"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}

function SceneSurface({ snapshot }: { snapshot: SimulationSnapshot | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !snapshot) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    renderCanvas(canvas, snapshot);
  }, [snapshot]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && snapshot) {
        renderCanvas(canvasRef.current, snapshot);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [snapshot]);

  return (
    <canvas
      ref={canvasRef}
      className="h-[540px] w-full rounded-3xl border border-white/10 bg-black/60"
    />
  );
}

export function DynamicSimulationRenderer({ dsl, formula, explanation, className }: Props) {
  const { engineRef, snapshot } = useSceneEngine(dsl);
  const formulaEntry = useMemo(
    () => getFormulaEntry(dsl?.simulation_type || "newtons_second_law"),
    [dsl?.simulation_type],
  );
  const [controls, setControls] = useState<SceneControls>(() => getControlDefaults(dsl));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setControls(getControlDefaults(dsl));
    setPaused(false);
  }, [dsl]);

  const applyControl = <K extends keyof SceneControls>(key: K, value: SceneControls[K]) => {
    setControls((current) => ({ ...current, [key]: value }));
    if (engineRef.current) {
      engineRef.current.setControl(key, value);
    }
  };

  const handleTogglePause = () => {
    if (!engineRef.current) return;
    if (paused) {
      engineRef.current.resume();
    } else {
      engineRef.current.pause();
    }
    setPaused((current) => !current);
  };

  const handleReset = () => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    engineRef.current.setControl("gravity", controls.gravity);
    engineRef.current.setControl("mass", controls.mass);
    engineRef.current.setControl("force", controls.force);
    engineRef.current.setControl("angle", controls.angle);
    engineRef.current.setControl("velocity", controls.velocity);
    engineRef.current.setControl("length", controls.length);
    engineRef.current.setControl("friction", controls.friction);
    engineRef.current.setControl("radius", controls.radius);
    setPaused(false);
  };

  if (!dsl) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-white/10 bg-black/40 p-8 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        Generate a simulation to start the runtime.
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-950/90 to-slate-950 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">
                Dynamic Physics Runtime
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{dsl.topic}</h2>
              <p className="mt-2 text-sm text-slate-300">
                {explanation || formulaEntry.explanation}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right text-xs text-slate-300">
              <div className="font-semibold text-white">{formula || formulaEntry.formula}</div>
              <div className="mt-1 text-slate-400">{dsl.simulation_type}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
            {formulaEntry.formulas.map((entry) => (
              <span
                key={entry}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
              >
                {entry}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <SimulationControls
            simulationType={dsl.simulation_type}
            controls={controls}
            onControlChange={applyControl}
            onReset={handleReset}
            isPaused={paused}
            onTogglePause={handleTogglePause}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-3"
      >
        <SceneSurface snapshot={snapshot} />
      </motion.div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/70">Simulation</div>
          <div className="mt-1 font-semibold text-white">{getSceneLabel(dsl.simulation_type)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/70">Equations</div>
          <div className="mt-1 font-semibold text-white">
            {dsl.equations.slice(0, 2).join(" · ")}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/70">Gravity</div>
          <div className="mt-1 font-semibold text-white">
            {snapshot?.environment.gravity.toFixed(2) ?? dsl.environment.gravity.toFixed(2)} m/s²
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
          <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/70">Bodies</div>
          <div className="mt-1 font-semibold text-white">
            {snapshot?.bodies.length ?? dsl.entities.length} active bodies
          </div>
        </div>
      </div>
    </div>
  );
}
