import React, { useState, useEffect } from 'react';
import * as Matter from 'matter-js';
import { OrbitUtils } from '../../orbits/orbitUtils';
import { OrbitSpawner } from '../../orbits/orbitSpawner';
import type { PropertyController } from '../../properties/propertyController';
import type { RuntimeObject } from '../../types/RuntimeObject';

interface OrbitControlsProps {
  selectedObject: RuntimeObject;
  propertyController: PropertyController;
  onRefresh?: () => void;
}

export const OrbitControls: React.FC<OrbitControlsProps> = ({
  selectedObject,
  propertyController,
  onRefresh,
}) => {
  const runtime = (propertyController as any).runtime;
  const store = (propertyController as any).store;

  const [timeScale, setTimeScale] = useState(1.0);
  const [draggedRadius, setDraggedRadius] = useState<number | null>(null);

  const { body } = selectedObject;

  // Sync timing scale state on mount/change
  useEffect(() => {
    if (runtime) {
      const currentScale = runtime.physics.getEngine().timing.timeScale;
      setTimeScale(currentScale);
    }
  }, [runtime]);

  // Retrieve dominant central gravity source
  const radialGravity = runtime?.gravitySystem?.getRadialGravity();
  const sources = radialGravity?.getSources() ?? [];
  const bodyPos = body.position;

  let centralSource: any = null;
  let minDistance = Infinity;

  for (const source of sources) {
    if (source.id === selectedObject.id || !source.enabled) continue;
    const dist = OrbitUtils.calculateDistance(source.position, bodyPos);
    if (dist < minDistance) {
      minDistance = dist;
      centralSource = source;
    }
  }

  // Live physical distance
  const currentRadius = centralSource
    ? Math.round(OrbitUtils.calculateDistance(centralSource.position, body.position))
    : 150;

  const displayRadius = draggedRadius !== null ? draggedRadius : currentRadius;

  // Helper: Trigger parent and local states refresh
  const triggerRefresh = () => {
    if (onRefresh) onRefresh();
  };

  // ─── 1. Orbit Radius Control System ────────────────────────────────────────

  const setOrbitRadius = (newRadius: number) => {
    if (!centralSource || !runtime) return;

    const dx = body.position.x - centralSource.position.x;
    const dy = body.position.y - centralSource.position.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.001) {
      // 1. Move orbiting body relative to gravity source along the radial vector
      const dirX = dx / dist;
      const dirY = dy / dist;

      const newX = centralSource.position.x + dirX * newRadius;
      const newY = centralSource.position.y + dirY * newRadius;

      // Position Matter body cleanly
      Matter.Body.setPosition(body, { x: newX, y: newY });

      // 2. Recompute orbital velocity & tangential direction
      const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
      const M = centralSource.mass;

      // v = sqrt(GM / r) * 16.67
      const circSpeed = OrbitUtils.computeStableOrbitVelocity(G, M, newRadius) * 16.67;

      const crossProduct = dx * body.velocity.y - dy * body.velocity.x;
      const clockwise = crossProduct >= 0;
      const tangentDir = OrbitUtils.computeTangentialDirection(
        centralSource.position,
        { x: newX, y: newY },
        clockwise
      );

      // 3. Apply new velocity
      const newVx = tangentDir.x * circSpeed;
      const newVy = tangentDir.y * circSpeed;

      propertyController.updateProperty(selectedObject.id, 'vx', newVx);
      propertyController.updateProperty(selectedObject.id, 'vy', newVy);

      Matter.Body.setVelocity(body, { x: newVx, y: newVy });
      triggerRefresh();
    }
  };

  const increaseOrbitRadius = () => {
    if (!centralSource) return;
    const nextR = Math.min(800, currentRadius + 25);
    setOrbitRadius(nextR);
  };

  const decreaseOrbitRadius = () => {
    if (!centralSource) return;
    const nextR = Math.max(40, currentRadius - 25);
    setOrbitRadius(nextR);
  };

  // ─── 2. Velocity Adjustments & Stabilization ──────────────────────────────

  const applyThrust = (percentChange: number) => {
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const speed = Math.hypot(vx, vy);

    if (speed > 0.0001) {
      const newSpeed = speed * (1 + percentChange);
      const newVx = (vx / speed) * newSpeed;
      const newVy = (vy / speed) * newSpeed;

      propertyController.updateProperty(selectedObject.id, 'vx', newVx);
      propertyController.updateProperty(selectedObject.id, 'vy', newVy);
      Matter.Body.setVelocity(body, { x: newVx, y: newVy });
      triggerRefresh();
    }
  };

  // Circularize Orbit: compute ideal velocity, remove radial component, restore stable circular orbit
  const circularizeOrbit = () => {
    if (!centralSource) return;

    const r = OrbitUtils.calculateDistance(centralSource.position, body.position);
    const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
    const M = centralSource.mass;

    // 1. Compute stable circular velocity
    const circSpeed = OrbitUtils.computeStableOrbitVelocity(G, M, r) * 16.67;

    // 2. Compute tangential direction and remove radial velocity component
    const dx = body.position.x - centralSource.position.x;
    const dy = body.position.y - centralSource.position.y;
    const crossProduct = dx * body.velocity.y - dy * body.velocity.x;
    const clockwise = crossProduct >= 0;

    const tangentDir = OrbitUtils.computeTangentialDirection(
      centralSource.position,
      body.position,
      clockwise
    );

    // 3. Apply new tangential velocity
    const newVx = tangentDir.x * circSpeed;
    const newVy = tangentDir.y * circSpeed;

    propertyController.updateProperty(selectedObject.id, 'vx', newVx);
    propertyController.updateProperty(selectedObject.id, 'vy', newVy);

    Matter.Body.setVelocity(body, { x: newVx, y: newVy });
    triggerRefresh();
  };

  // Make Elliptical: Compute elliptical periapsis speed and apply tangential impulse
  const setEllipticalOrbit = () => {
    if (!centralSource) return;

    const r = OrbitUtils.calculateDistance(centralSource.position, body.position);
    const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
    const M = centralSource.mass;

    // Vis-Viva elliptical velocity equation at periapsis: v_p = sqrt(G * M * (1 + e) / r) * 16.67
    const eccentricity = 0.35;
    const ellipSpeed = Math.sqrt((G * M * (1 + eccentricity)) / r) * 16.67;

    const dx = body.position.x - centralSource.position.x;
    const dy = body.position.y - centralSource.position.y;
    const crossProduct = dx * body.velocity.y - dy * body.velocity.x;
    const clockwise = crossProduct >= 0;

    const velVec = OrbitUtils.calculateTangentialVelocityVector(
      centralSource.position,
      body.position,
      ellipSpeed,
      clockwise
    );

    propertyController.updateProperty(selectedObject.id, 'vx', velVec.x);
    propertyController.updateProperty(selectedObject.id, 'vy', velVec.y);
    Matter.Body.setVelocity(body, velVec);
    triggerRefresh();
  };

  // Dynamically Stabilize Orbit: snaps velocity to stable circular orbit at current distance
  const stabilizeOrbit = () => {
    circularizeOrbit();
  };

  const resetVelocity = () => {
    propertyController.updateProperty(selectedObject.id, 'vx', 0);
    propertyController.updateProperty(selectedObject.id, 'vy', 0);
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    triggerRefresh();
  };

  // ─── 3. Time Control Scaling ──────────────────────────────────────────────

  const updateTimeScale = (scale: number) => {
    if (runtime) {
      runtime.physics.getEngine().timing.timeScale = scale;
      setTimeScale(scale);
    }
  };

  // ─── 4. Spawning Celestial Moons / Satellites ─────────────────────────────

  const spawnBody = async (type: 'satellite' | 'moon') => {
    if (!runtime || !store) return;

    // Parent is either the current selected planet, or the dominant star
    const isPlanetSelected = selectedObject.metadata?.customData?.orbitalCategory === 'planet';
    const parentObj = isPlanetSelected ? selectedObject : store.getObject('orbit-star');
    if (!parentObj) return;

    const { createObject } = await import('../../objects/objectFactory');
    const uid = () => `orbital-${type}-${Math.random().toString(36).substr(2, 6)}`;

    const id = uid();
    const parentPos = parentObj.body.position;

    // Configuration of spawned body
    const radius = type === 'satellite' ? 5 : 9;
    const offset = type === 'satellite' ? 35 : 55;
    const fillColor = type === 'satellite' ? 0x94a3b8 : 0xcbd5e1;
    const strokeColor = type === 'satellite' ? 0x64748b : 0x94a3b8;

    const spawnedObj = createObject({
      id,
      type: 'circle',
      x: parentPos.x,
      y: parentPos.y - offset,
      radius,
      restitution: 0.1,
      friction: 0.05,
      frictionAir: 0,
      density: type === 'satellite' ? 0.0005 : 0.001,
      fillColor,
      strokeColor,
      strokeWidth: 1.5,
    });

    spawnedObj.body.label = type === 'satellite' ? 'Satellite' : 'Moon';
    (spawnedObj.body as any).customData = {
      orbitalCategory: type === 'satellite' ? 'moon' : 'moon',
    };

    // Calculate stable circular speed around the parent
    const G = radialGravity?.config?.gravitationalConstant ?? OrbitUtils.DEFAULT_G;
    OrbitSpawner.spawnCircularOrbit(
      {
        centerBody: parentObj.body,
        orbitingBody: spawnedObj.body,
        radius: offset,
        angle: -Math.PI / 2,
        clockwise: true,
      },
      G
    );

    // Register into the runtime and visual layers
    runtime.renderer.getViewport().addChild(spawnedObj.display);
    runtime.physics.addBodies(spawnedObj.body);
    runtime.sync.register(spawnedObj.id, spawnedObj.body, spawnedObj.display);
    store.addObject(spawnedObj);

    // Select the newly spawned body to inspect it!
    const selectManager = (runtime as any).selectionManager || (propertyController as any).selectionManager;
    if (selectManager) {
      selectManager.register(spawnedObj);
    }
    store.setSelectedObject(id);

    triggerRefresh();
  };

  return (
    <div style={S.container}>
      {/* ── Section 1: Orbit Radius Slider & Manipulation ── */}
      {centralSource && (
        <div style={S.controlGroup}>
          <div style={S.groupLabel}>🪐 Orbital Geometry</div>

          <div style={S.sliderRow}>
            <div style={S.sliderMeta}>
              <span style={S.sliderLabel}>Orbit Radius</span>
              <span style={S.sliderVal}>{Math.round(displayRadius * 100).toLocaleString()} km</span>
            </div>
            <input
              type="range"
              min={40}
              max={600}
              step={1}
              value={displayRadius}
              onMouseDown={() => setDraggedRadius(currentRadius)}
              onTouchStart={() => setDraggedRadius(currentRadius)}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setDraggedRadius(val);
                setOrbitRadius(val);
              }}
              onMouseUp={() => setDraggedRadius(null)}
              onTouchEnd={() => setDraggedRadius(null)}
              style={S.sliderInput}
            />
            <span style={S.sliderTooltip}>
              Drag to scale the orbit. Notice that velocity changes dynamically: Larger orbit → slower velocity, Smaller orbit → faster velocity.
            </span>
          </div>

          <div style={S.buttonGrid}>
            <button
              onClick={increaseOrbitRadius}
              style={S.actionBtn}
              title="Increase orbit radius by 25px and stabilize velocity"
            >
              ➕ Expand Orbit
            </button>
            <button
              onClick={decreaseOrbitRadius}
              style={S.actionBtn}
              title="Decrease orbit radius by 25px and stabilize velocity"
            >
              ➖ Contract Orbit
            </button>
          </div>
        </div>
      )}

      {/* ── Section 2: Delta-V Thrust & Stabilization ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>🚀 Delta-V Propulsion / Thrust</div>
        <div style={S.buttonGrid}>
          <button
            onClick={() => applyThrust(0.1)}
            style={{ ...S.actionBtn, borderColor: '#34d399', color: '#34d399' }}
            title="Apply prograde thrust (+10% velocity) to raise apoapsis"
          >
            ➕ Prograde (+10%)
          </button>
          <button
            onClick={() => applyThrust(-0.1)}
            style={{ ...S.actionBtn, borderColor: '#f87171', color: '#f87171' }}
            title="Apply retrograde thrust (-10% velocity) to lower periapsis"
          >
            ➖ Retrograde (-10%)
          </button>
        </div>
        <div style={S.buttonRow}>
          <button
            onClick={circularizeOrbit}
            style={{ ...S.actionBtn, borderColor: '#38bdf8', color: '#38bdf8' }}
            title="Snap body to stable circular velocity removing radial deviations"
          >
            🔄 Circularize
          </button>
          <button
            onClick={setEllipticalOrbit}
            style={{ ...S.actionBtn, borderColor: '#a78bfa', color: '#a78bfa' }}
            title="Enter stable eccentric elliptical path (eccentricity e = 0.35)"
          >
            🪐 Make Elliptical
          </button>
        </div>
        <button
          onClick={stabilizeOrbit}
          style={{ ...S.actionBtn, width: '100%', borderColor: '#10b981', color: '#10b981' }}
          title="Dynamically stabilize orbit at current distance"
        >
          🛡️ Stabilize Orbit
        </button>
        <button
          onClick={resetVelocity}
          style={{ ...S.actionBtn, width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }}
        >
          🛑 Cut Engines (Zero Velocity)
        </button>
      </div>

      {/* ── Section 3: Time Scaling ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>⏳ Physics Timestep Warp</div>
        <div style={S.warpGrid}>
          {[
            { label: '⏸️ Pause', value: 0 },
            { label: '0.5x', value: 0.5 },
            { label: '1.0x (Std)', value: 1.0 },
            { label: '2.0x ⏩', value: 2.0 },
          ].map((t) => {
            const isActive = timeScale === t.value;
            return (
              <button
                key={t.value}
                onClick={() => updateTimeScale(t.value)}
                style={{
                  ...S.warpBtn,
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  borderColor: isActive ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Orbital Construction ── */}
      <div style={S.controlGroup}>
        <div style={S.groupLabel}>🏗️ Orbital Constructor</div>
        <div style={S.buttonGrid}>
          <button onClick={() => spawnBody('moon')} style={S.actionBtn}>
            🌒 Launch Moon
          </button>
          <button onClick={() => spawnBody('satellite')} style={S.actionBtn}>
            🛰️ Deploy Satellite
          </button>
        </div>
      </div>
    </div>
  );
};

const S = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  controlGroup: {
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  groupLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: 4,
    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
    paddingBottom: 2,
  },
  sliderRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    marginBottom: 4,
  },
  sliderMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: 600,
  },
  sliderVal: {
    fontSize: 10,
    color: '#f8fafc',
    fontFamily: 'monospace',
    fontWeight: 700,
  },
  sliderInput: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    background: 'rgba(255, 255, 255, 0.1)',
    outline: 'none',
    cursor: 'pointer',
  },
  sliderTooltip: {
    fontSize: 8,
    color: '#64748b',
    lineHeight: 1.3,
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 600,
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  warpGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 6,
  },
  warpBtn: {
    padding: '6px 4px',
    borderRadius: 6,
    border: '1px solid',
    cursor: 'pointer',
    fontSize: 9,
    fontWeight: 700,
    outline: 'none',
    transition: 'all 0.15s ease',
    textAlign: 'center' as const,
  },
};
