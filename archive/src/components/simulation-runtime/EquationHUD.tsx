import React, { useEffect, useMemo, useRef, useState } from "react";

type EquationHUDProps = {
  snapshot?: any;
  visible?: boolean;
  onToggleVisible?: (next: boolean) => void;
};

type EquationRow = {
  id: string;
  title: string;
  formula: string;
  substitution: string;
  result: string;
  details?: string[];
};

function safeNum(value: any, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatVector(x = 0, y = 0) {
  return `(${safeNum(x).toFixed(2)}, ${safeNum(y).toFixed(2)})`;
}

function formatSigned(value: number) {
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

function getEntityPhysics(object: any) {
  const physics = object?.physics || {};
  return {
    mass: safeNum(physics.mass ?? object?.mass ?? 1, 1),
    position: physics.position || object?.position || { x: 0, y: 0 },
    velocity: physics.velocity || object?.velocity || { x: 0, y: 0 },
    acceleration: physics.acceleration || object?.acceleration || { x: 0, y: 0 },
    angle: safeNum(physics.angle ?? object?.angle ?? 0, 0),
    angularVelocity: safeNum(physics.angularVelocity ?? object?.angularVelocity ?? 0, 0),
  };
}

function getTotalMomentum(objects: any[]) {
  return objects.reduce((total, object) => {
    const physics = getEntityPhysics(object);
    const vx = safeNum(physics.velocity?.x, 0);
    const vy = safeNum(physics.velocity?.y, 0);
    return total + Math.hypot(physics.mass * vx, physics.mass * vy);
  }, 0);
}

function getTotalKineticEnergy(objects: any[]) {
  return objects.reduce((total, object) => {
    const physics = getEntityPhysics(object);
    const vx = safeNum(physics.velocity?.x, 0);
    const vy = safeNum(physics.velocity?.y, 0);
    const speed = Math.hypot(vx, vy);
    return total + 0.5 * physics.mass * speed * speed;
  }, 0);
}

function getCenterOfMass(objects: any[]) {
  const aggregate = objects.reduce(
    (acc, object) => {
      const physics = getEntityPhysics(object);
      const pos = physics.position || { x: 0, y: 0 };
      acc.mass += physics.mass;
      acc.x += safeNum(pos.x, 0) * physics.mass;
      acc.y += safeNum(pos.y, 0) * physics.mass;
      return acc;
    },
    { x: 0, y: 0, mass: 0 },
  );
  return aggregate.mass ? { x: aggregate.x / aggregate.mass, y: aggregate.y / aggregate.mass } : { x: 0, y: 0 };
}

export function EquationHUD({ snapshot, visible = true }: EquationHUDProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [activeGroup, setActiveGroup] = useState<"system" | "entity" | "interaction">("system");
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number } | null>(null);

  const rows = useMemo<EquationRow[]>(() => {
    const objects = Array.isArray(snapshot?.dsl?.objects) ? snapshot.dsl.objects : [];
    const first = objects[0] || {};
    const entityRows = objects.slice(0, 4).map((object, index) => {
      const physics = getEntityPhysics(object);
      const speed = Math.hypot(safeNum(physics.velocity.x, 0), safeNum(physics.velocity.y, 0));
      const ke = 0.5 * physics.mass * speed * speed;
      return {
        id: `entity_${index}`,
        title: object.name || object.id || `Entity ${index + 1}`,
        formula: `m = ${physics.mass.toFixed(2)} kg`,
        substitution: `v = ${formatVector(physics.velocity.x, physics.velocity.y)} m/s, a = ${formatVector(physics.acceleration.x, physics.acceleration.y)} m/s²`,
        result: `KE = ${ke.toFixed(2)} J`,
        details: [
          `|v| = ${speed.toFixed(2)} m/s`,
          `angle = ${physics.angle.toFixed(2)} rad`,
          `ω = ${physics.angularVelocity.toFixed(2)} rad/s`,
        ],
      };
    });

    const totalMomentum = getTotalMomentum(objects);
    const totalKineticEnergy = getTotalKineticEnergy(objects);
    const centerOfMass = getCenterOfMass(objects);
    const totalMass = objects.reduce((total, object) => total + getEntityPhysics(object).mass, 0);
    const momentumVector = objects.reduce(
      (acc, object) => {
        const physics = getEntityPhysics(object);
        acc.x += physics.mass * safeNum(physics.velocity.x, 0);
        acc.y += physics.mass * safeNum(physics.velocity.y, 0);
        return acc;
      },
      { x: 0, y: 0 },
    );

    const systemRows: EquationRow[] = [
      {
        id: "momentum_total",
        title: "Total Momentum",
        formula: "p_total = Σ(mv)",
        substitution: objects.length > 0
          ? `p_x = ${objects.slice(0, 4).map((object, index) => {
              const physics = getEntityPhysics(object);
              const vx = safeNum(physics.velocity.x, 0);
              return `(${physics.mass.toFixed(0)})(${vx.toFixed(0)})${index < Math.min(objects.length, 4) - 1 ? " + " : ""}`;
            }).join("")}`
          : `p_total = 0`,
        result: `|p_total| = ${totalMomentum.toFixed(2)} kg·m/s`,
        details: [`vector = ${formatVector(momentumVector.x, momentumVector.y)}`, `p_x = ${momentumVector.x.toFixed(2)} kg·m/s`, `p_y = ${momentumVector.y.toFixed(2)} kg·m/s`],
      },
      {
        id: "energy_total",
        title: "Total Kinetic Energy",
        formula: "KE_total = Σ(1/2 mv²)",
        substitution: `KE_total = sum over ${objects.length} entities`,
        result: `KE_total = ${totalKineticEnergy.toFixed(2)} J`,
        details: [`energy density = ${(totalMass > 0 ? totalKineticEnergy / totalMass : 0).toFixed(2)} J/kg`],
      },
      {
        id: "center_of_mass",
        title: "Center of Mass",
        formula: "r_cm = Σ(mr)/Σm",
        substitution: `r_cm = Σ(mr) / ${totalMass.toFixed(2)} kg`,
        result: `r_cm = (${centerOfMass.x.toFixed(2)}, ${centerOfMass.y.toFixed(2)})`,
        details: [`total mass = ${totalMass.toFixed(2)} kg`],
      },
      {
        id: "force_chain",
        title: "Force Chain",
        formula: "F_net = ΣF",
        substitution: `linked interactions = ${(snapshot?.dsl?.interactions || []).length}`,
        result: `F_net updates in realtime`,
        details: ["Includes collision, gravity, spring, friction, and constraint interactions."],
      },
      {
        id: "energy_transfer",
        title: "Energy Transfer",
        formula: "ΔE = E_before - E_after",
        substitution: `dynamic energy flow across active bodies`,
        result: `tracked per collision frame`,
        details: ["Use the collision analyzer and explanation feed for conservation analysis."],
      },
    ];

    return [...systemRows, ...entityRows];
  }, [snapshot]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!dragRef.current?.dragging) return;
      setPosition({ x: event.clientX - dragRef.current.offsetX, y: event.clientY - dragRef.current.offsetY });
    };
    const onUp = () => {
      if (dragRef.current) dragRef.current.dragging = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed z-[70] w-[360px] max-w-[90vw] rounded-2xl border border-white/10 bg-slate-950/90 text-white shadow-2xl backdrop-blur-xl"
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="flex cursor-move items-center justify-between border-b border-white/5 px-4 py-3"
        onPointerDown={(event) => {
          dragRef.current = { dragging: true, offsetX: event.clientX - position.x, offsetY: event.clientY - position.y };
        }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Equation HUD</div>
          <div className="text-xs text-white/60">Realtime substitutions and magnitudes</div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-white/5 px-3 py-1 text-[11px]" onClick={() => setActiveGroup("system")}>System</button>
          <button className="rounded-full bg-white/5 px-3 py-1 text-[11px]" onClick={() => setActiveGroup("entity")}>Entity</button>
          <button className="rounded-full bg-white/5 px-3 py-1 text-[11px]" onClick={() => setActiveGroup("interaction")}>Interaction</button>
          <button className="rounded-full bg-white/5 px-3 py-1 text-[11px]" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="max-h-[50vh] overflow-auto p-4 space-y-3">
          {rows
            .filter((row) => {
              if (activeGroup === "system") return /total|center|force chain|energy transfer/i.test(row.id + row.title);
              if (activeGroup === "entity") return row.id.startsWith("entity_");
              return /interaction|force chain|energy transfer/i.test(row.id + row.title);
            })
            .map((row) => (
            <div key={row.id} className="rounded-xl border border-white/5 bg-white/5 p-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-indigo-300">
                <span>{row.title}</span>
                <span>{snapshot?.paused ? "paused" : "live"}</span>
              </div>
              <div className="mt-2 font-mono text-sm text-white">{row.formula}</div>
              <div className="mt-1 font-mono text-[11px] text-cyan-200/90">{row.substitution}</div>
              <div className="mt-1 font-mono text-[11px] text-emerald-300">{row.result}</div>
              {row.details?.map((detail) => (
                <div key={detail} className="mt-1 text-[10px] text-white/50">{detail}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EquationHUD;
