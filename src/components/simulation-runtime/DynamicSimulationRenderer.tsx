import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/Card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { getFormulaCards } from "@/lib/formulaCatalog";
import { normalizeSimulationDsl, type SimulationControlSpec, type SimulationDsl } from "@/lib/simulationDsl";
import { PhysicsEngine, type RuntimeSnapshot } from "@/runtime/physicsEngine";
import { Pause, Play, RotateCcw, SlidersHorizontal, Activity } from "lucide-react";

type RendererProps = {
  dsl: SimulationDsl | Record<string, unknown> | null;
  className?: string;
};

function formatControlValue(value: number, unit: string): string {
  return `${value.toFixed(unit === "°" || unit === "" ? 0 : 1)}${unit ? ` ${unit}` : ""}`;
}

function renderWorldBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: SimulationDsl["world"]["background"],
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  switch (background) {
    case "space":
      gradient.addColorStop(0, "#04111f");
      gradient.addColorStop(1, "#0f172a");
      break;
    case "earth":
      gradient.addColorStop(0, "#1d4ed8");
      gradient.addColorStop(1, "#0ea5e9");
      break;
    case "road":
      gradient.addColorStop(0, "#1e293b");
      gradient.addColorStop(1, "#334155");
      break;
    case "ice":
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#1e3a8a");
      break;
    case "mountain":
      gradient.addColorStop(0, "#172554");
      gradient.addColorStop(1, "#0f172a");
      break;
    default:
      gradient.addColorStop(0, "#081120");
      gradient.addColorStop(1, "#111827");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let x = 0; x < width; x += 40) {
    ctx.fillRect(x, height - 1, 1, 1);
  }
}

function drawBody(ctx: CanvasRenderingContext2D, body: RuntimeSnapshot["bodies"][number]) {
  const [x, y] = body.position;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(body.angle);

  switch (body.shape) {
    case "rect":
    case "slider": {
      const [w, h] = body.size;
      ctx.fillStyle = body.color;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = `${body.color}88`;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      break;
    }
    case "plane": {
      const [w, h] = body.size;
      ctx.fillStyle = body.color;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      break;
    }
    default: {
      ctx.fillStyle = body.color;
      ctx.beginPath();
      ctx.arc(0, 0, body.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `${body.color}88`;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
  }

  if (body.shape === "pendulum_bob" && body.anchor) {
    ctx.strokeStyle = "rgba(148,163,184,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, body.length ?? 120);
    ctx.stroke();
  }

  ctx.restore();

  if (body.label) {
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(body.label, x, y - body.radius - 12);
  }
}

function SimulationViewport({ snapshot }: { snapshot: RuntimeSnapshot | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!snapshot || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      canvas.width = bounds.width * window.devicePixelRatio;
      canvas.height = bounds.height * window.devicePixelRatio;
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    resize();

    const frame = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderWorldBackground(context, width, height, snapshot.world.background);

      if (snapshot.intent === "projectile_motion") {
        context.strokeStyle = "rgba(125,211,252,0.2)";
        context.beginPath();
        context.moveTo(0, height - 40);
        context.lineTo(width, height - 40);
        context.stroke();
      }

      snapshot.bodies.forEach((body) => {
        drawBody(context, body);
      });

      context.fillStyle = "rgba(226,232,240,0.75)";
      context.font = "12px Inter, system-ui, sans-serif";
      context.fillText(`t=${snapshot.time.toFixed(2)}s`, 16, 24);
      context.fillText(snapshot.formula, 16, 42);
    };

    frame();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [snapshot]);

  return <canvas ref={canvasRef} className="h-full w-full rounded-3xl" />;
}

function SimulationControls({
  controls,
  values,
  onChange,
}: {
  controls: SimulationControlSpec[];
  values: Record<string, number>;
  onChange: (key: SimulationControlSpec["key"], value: number) => void;
}) {
  return (
    <div className="space-y-4">
      {controls.map((control) => (
        <div key={control.key} className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">{control.label}</span>
            <span className="font-mono text-cyan-300">{formatControlValue(values[control.key] ?? control.value, control.unit)}</span>
          </div>
          <Slider
            value={[values[control.key] ?? control.value]}
            onValueChange={(value) => onChange(control.key, value[0])}
            min={control.min}
            max={control.max}
            step={control.step}
          />
        </div>
      ))}
    </div>
  );
}

function createSnapshotSummary(snapshot: RuntimeSnapshot | null): string[] {
  if (!snapshot) return [];
  return [
    `World: ${snapshot.intent.replace(/_/g, " ")}`,
    `Bodies: ${snapshot.bodies.length}`,
    `Gravity: ${snapshot.world.gravity.toFixed(1)} m/s²`,
    `Formula: ${snapshot.formula}`,
  ];
}

export function DynamicSimulationRenderer({ dsl, className }: RendererProps) {
  const normalized = useMemo(
    () => normalizeSimulationDsl(dsl, typeof dsl === "object" && dsl && "prompt" in dsl ? String((dsl as any).prompt || "") : ""),
    [dsl],
  );
  const engineRef = useRef<PhysicsEngine | null>(null);
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [controlValues, setControlValues] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!normalized) {
      engineRef.current = null;
      setSnapshot(null);
      setControlValues({});
      return;
    }

    engineRef.current?.stop();
    const engine = new PhysicsEngine(normalized);
    engineRef.current = engine;
    setControlValues(Object.fromEntries(normalized.controls.map((control) => [control.key, control.value])));
    setSnapshot(engine.getSnapshot());
    setIsRunning(true);

    engine.start((nextSnapshot) => {
      setSnapshot(nextSnapshot);
    });

    return () => engine.stop();
  }, [normalized]);

  const handleControlChange = (key: SimulationControlSpec["key"], value: number) => {
    setControlValues((current) => ({ ...current, [key]: value }));
    engineRef.current?.setControl(key, value);
    setSnapshot(engineRef.current?.getSnapshot() ?? null);
  };

  const handleReset = () => {
    engineRef.current?.reset();
    setSnapshot(engineRef.current?.getSnapshot() ?? null);
    if (normalized) {
      setControlValues(Object.fromEntries(normalized.controls.map((control) => [control.key, control.value])));
    }
  };

  if (!normalized) {
    return <Card className={cn("border border-white/10 bg-slate-950/70 p-6 text-slate-300", className)}>Generate a simulation to mount the runtime.</Card>;
  }

  const formulaCards = getFormulaCards(normalized.simulation);

  return (
    <div className={cn("grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]", className)}>
      <Card className="overflow-hidden border border-cyan-400/10 bg-slate-950/80 p-0 shadow-2xl shadow-cyan-950/20">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Live runtime</p>
            <h3 className="text-xl font-semibold text-white">{normalized.title}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="h-4 w-4 text-cyan-300" />
            {isRunning ? "Running" : "Paused"}
          </div>
        </div>

        <div className="relative h-[520px] bg-black/20">
          <SimulationViewport snapshot={snapshot} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const engine = engineRef.current;
                if (!engine) return;
                if (isRunning) {
                  engine.stop();
                  setIsRunning(false);
                } else {
                  engine.start((nextSnapshot) => setSnapshot(nextSnapshot));
                  setIsRunning(true);
                }
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
            >
              {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isRunning ? "Pause" : "Resume"}
            </Button>
            <Button onClick={handleReset} variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
          <div className="text-xs text-slate-400">{createSnapshotSummary(snapshot).join(" · ")}</div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="border border-white/10 bg-slate-950/70 p-5">
          <div className="mb-4 flex items-center gap-2 text-white">
            <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
            <h3 className="font-semibold">Interactive Controls</h3>
          </div>
          <SimulationControls controls={normalized.controls} values={controlValues} onChange={handleControlChange} />
        </Card>

        <Card className="border border-white/10 bg-slate-950/70 p-5">
          <h3 className="mb-3 font-semibold text-white">Formula Retrieval</h3>
          <div className="space-y-3">
            {formulaCards.map((card) => (
              <motion.div key={card.equation} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-cyan-400/10 bg-cyan-500/5 p-3">
                <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">{card.label}</div>
                <div className="mt-1 font-mono text-lg text-white">{card.equation}</div>
                <p className="mt-2 text-sm text-slate-300">{card.meaning}</p>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="border border-white/10 bg-slate-950/70 p-5">
          <h3 className="mb-3 font-semibold text-white">Educational Context</h3>
          <div className="space-y-2 text-sm text-slate-300">
            {normalized.educationalContext.map((item) => (
              <p key={item} className="rounded-xl border border-white/5 bg-white/5 p-3">{item}</p>
            ))}
            {normalized.notes.map((item) => (
              <p key={item} className="text-xs text-slate-400">{item}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
