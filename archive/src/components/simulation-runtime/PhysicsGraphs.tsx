import React, { useEffect, useMemo, useRef, useState } from "react";
import { PhysicsAnalytics } from "@/runtime/analytics/physicsAnalytics";
import { ReplayFrame } from "@/runtime/replay/simulationReplay";

type PhysicsGraphsProps = {
  analytics: PhysicsAnalytics | null;
  replayFrame?: ReplayFrame | null;
  visible?: boolean;
};

type SeriesKey = "momentum" | "kineticEnergy" | "potentialEnergy" | "forceMagnitude" | "acceleration" | "fps";

const SERIES_META: Record<SeriesKey, { label: string; color: string }> = {
  momentum: { label: "Momentum", color: "#22d3ee" },
  kineticEnergy: { label: "Kinetic Energy", color: "#a78bfa" },
  potentialEnergy: { label: "Potential Energy", color: "#34d399" },
  forceMagnitude: { label: "Forces", color: "#f59e0b" },
  acceleration: { label: "Acceleration", color: "#fb7185" },
  fps: { label: "FPS", color: "#60a5fa" },
};

function drawGraph(ctx: CanvasRenderingContext2D, values: number[], color: string, width: number, height: number, zoom: number, pan: { x: number; y: number }) {
  if (!values.length) return;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(1e-6, max - min);
  const stepX = (width * zoom) / Math.max(1, values.length - 1);

  ctx.beginPath();
  values.forEach((value, index) => {
    const x = index * stepX + pan.x;
    const normalized = (value - min) / range;
    const y = height - normalized * height * zoom + pan.y;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function PhysicsGraphs({ analytics, replayFrame, visible = true }: PhysicsGraphsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null);

  const series = useMemo(() => analytics?.getSeries() ?? null, [analytics, replayFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "rgba(15,23,42,0.75)";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!series) return;
    const plotArea = { width: width - 24, height: height - 24 };
    const keys: SeriesKey[] = ["momentum", "kineticEnergy", "potentialEnergy", "forceMagnitude", "acceleration", "fps"];
    keys.forEach((key, index) => {
      const values = series[key as keyof typeof series] as number[];
      ctx.save();
      ctx.translate(12, 12);
      drawGraph(ctx, values || [], SERIES_META[key].color, plotArea.width, plotArea.height / 2.5, zoom, pan);
      ctx.fillStyle = SERIES_META[key].color;
      ctx.fillText(SERIES_META[key].label, 18, 18 + index * 18);
      ctx.restore();
    });

    if (replayFrame) {
      ctx.save();
      ctx.fillStyle = "rgba(250,204,21,0.95)";
      ctx.fillText(`Replay frame ${replayFrame.id}`, 12, height - 14);
      ctx.restore();
    }
  }, [series, replayFrame, zoom, pan, visible]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => Math.max(0.5, Math.min(3, current - event.deltaY * 0.001)));
    };
    const onPointerDown = (event: PointerEvent) => {
      setDragging(true);
      setDragOrigin({ x: event.clientX - pan.x, y: event.clientY - pan.y });
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || !dragOrigin) return;
      setPan({ x: event.clientX - dragOrigin.x, y: event.clientY - dragOrigin.y });
    };
    const onPointerUp = () => setDragging(false);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragOrigin, dragging, pan]);

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
        <span>Physics Graphs</span>
        <span>zoom / pan / replay synced</span>
      </div>
      <canvas ref={canvasRef} className="h-[240px] w-full rounded-xl outline-none" />
    </div>
  );
}

export default PhysicsGraphs;
