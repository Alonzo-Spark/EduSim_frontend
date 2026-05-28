import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import type { SandboxExampleConfig } from '../types/example.types';
import { physicsEventBus } from '../../../ai/physicsEventBus';

export const example7_5: SandboxExampleConfig = {
  metadata: {
    id: 'example-7-5',
    title: '7.5 Circular Orbit & Orbital Burns',
    description: "Demonstrates stable circular orbital velocity injection. Use the engine burn controls to apply prograde or retrograde thrust to witness orbital transitions.",
    category: 'Orbital Mechanics',
    educationalNotes: [
      "Stable circular orbit is reached when centrifugal acceleration perfectly matches gravitational acceleration: v = sqrt(G*M / r).",
      "Increasing orbital speed (prograde burn) increases kinetic energy, stretching the circular orbit into an ellipse with a higher apoapsis.",
      "Decreasing orbital speed (retrograde burn) drops the planet into a lower elliptical orbit, descending towards the Sun."
    ]
  },
  objects: [
    {
      assetId: 'sun',
      id: 'example-sun',
      x: 400,
      y: 300,
      isStatic: true,
      mass: 8000,
      radius: 50
    },
    {
      assetId: 'earth',
      id: 'example-earth',
      x: 400,
      y: 100, // 200 px above Sun
      orbitCenterId: 'example-sun',
      orbitType: 'circular',
      clockwise: true,
      mass: 10,
      radius: 18
    }
  ],
  observables: [
    {
      objectId: 'example-earth',
      types: ['velocity', 'force'],
      label: 'Circular Orbit',
      color: 0x60a5fa
    }
  ],
  overlays: {
    showOrbitPath: true,
    showVelocityVectors: true,
    showForceVectors: true,
    showInfluenceRadius: false,
    showOrbitalTrail: true
  },
  gConstant: 0.0012,
  gravityMode: 'radial',
  camera: {
    zoom: 1.0,
    centerX: 400,
    centerY: 300
  },
  customSetup: async (runtime, store, controller, observables) => {
    // 1. Draw helper circular target trajectory
    const vp = runtime.renderer.getViewport();
    const graphics = new PIXI.Graphics();
    graphics.name = 'example7_5-trajectory';
    vp.addChild(graphics);

    graphics.circle(400, 300, 200);
    graphics.stroke({ color: 0x3b82f6, width: 1, alpha: 0.25 });

    // 2. Inject floating HTML controller overlay for orbital burns!
    const canvasWrap = runtime.renderer.getApp().canvas.parentElement;
    if (!canvasWrap) return;

    // Clean up any existing overlay first
    const existing = document.getElementById('example-burn-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'example-burn-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '16px';
    overlay.style.right = '16px';
    overlay.style.background = 'rgba(15, 23, 42, 0.85)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.border = '1px solid rgba(99, 102, 241, 0.3)';
    overlay.style.borderRadius = '12px';
    overlay.style.padding = '14px';
    overlay.style.color = '#fff';
    overlay.style.fontFamily = 'Inter, sans-serif';
    overlay.style.fontSize = '12px';
    overlay.style.width = '240px';
    overlay.style.zIndex = '1000';
    overlay.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';

    overlay.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 6px; color: #818cf8; font-size: 13px;">🛰️ Flight Controls</div>
      <div style="margin-bottom: 10px; color: #94a3b8; font-size: 11px; line-height: 1.4;">
        Apply delta-v engine burns to manipulate the spacecraft's orbital geometry in real-time.
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="prograde-burn-btn" style="flex: 1; padding: 6px 10px; background: #2563eb; border: none; border-radius: 6px; color: #fff; font-weight: 600; cursor: pointer; transition: all 0.2s;">
          🚀 +Prograde
        </button>
        <button id="retrograde-burn-btn" style="flex: 1; padding: 6px 10px; background: #dc2626; border: none; border-radius: 6px; color: #fff; font-weight: 600; cursor: pointer; transition: all 0.2s;">
          🛑 -Retrograde
        </button>
      </div>
      <div id="burn-feedback" style="margin-top: 8px; font-size: 10px; text-align: center; color: #10b981; font-weight: bold; height: 12px;"></div>
    `;

    canvasWrap.appendChild(overlay);

    const progradeBtn = document.getElementById('prograde-burn-btn');
    const retrogradeBtn = document.getElementById('retrograde-burn-btn');
    const feedback = document.getElementById('burn-feedback');

    const triggerBurn = (type: 'prograde' | 'retrograde') => {
      const earthObj = store.getObject('example-earth');
      if (!earthObj) return;

      const body = earthObj.body;
      const vel = body.velocity;
      const speed = Math.hypot(vel.x, vel.y);

      if (speed > 0.01) {
        const factor = type === 'prograde' ? 1.15 : 0.85; // +/- 15% delta-v thrust
        Matter.Body.setVelocity(body, {
          x: vel.x * factor,
          y: vel.y * factor
        });

        if (feedback) {
          feedback.innerText = `${type.toUpperCase()} BURN APPLIED (${type === 'prograde' ? '+' : '-'}15% Δv)`;
          feedback.style.color = type === 'prograde' ? '#10b981' : '#f87171';
          setTimeout(() => {
            if (feedback) feedback.innerText = '';
          }, 2000);
        }

        // Emit an event to trigger immediate AI tutoring card update
        physicsEventBus.emit({
          type: 'OBJECT_SPAWNED', // triggers explanation cards update
          objectId: 'example-earth',
          metadata: {
            name: 'Earth Spaceship',
            action: `Engine ${type} burn executed`,
            newVelocity: speed * factor
          }
        });
      }
    };

    if (progradeBtn) progradeBtn.onclick = () => triggerBurn('prograde');
    if (retrogradeBtn) retrogradeBtn.onclick = () => triggerBurn('retrograde');
  }
};
