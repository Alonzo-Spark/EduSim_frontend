import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import type { SandboxExampleConfig } from '../types/example.types';

export const example7_7: SandboxExampleConfig = {
  metadata: {
    id: 'example-7-7',
    title: '7.7 Escape Velocity Thresholds',
    description: 'Demonstrates escape velocity limits. Compares a sub-escape probe (trapped in a closed orbit) against a hyper-escape probe (freeing itself on an open trajectory).',
    category: 'Orbital Mechanics',
    educationalNotes: [
      'Escape velocity is the minimum speed needed for a non-propelled body to escape from the gravitational influence of a primary body: v_esc = sqrt(2*G*M / r).',
      'Probes launched below v_esc are gravitationally bound, moving along elliptical orbits.',
      'Probes launched above v_esc have positive total mechanical energy, escaping along open hyperbolic paths.'
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
      assetId: 'satellite',
      id: 'example-sat-bound',
      x: 400,
      y: 170,
      isStatic: false,
      mass: 8,
      radius: 12,
      vx: -2.3,
      vy: 0,
      customData: {
        density: 0.001
      }
    },
    {
      assetId: 'satellite',
      id: 'example-sat-escape',
      x: 400,
      y: 130,
      isStatic: false,
      mass: 8,
      radius: 12,
      vx: 3.2,
      vy: 0,
      customData: {
        density: 0.001
      }
    }
  ],
  observables: [
    {
      objectId: 'example-sat-bound',
      types: ['velocity'],
      label: 'Probe A (Bound)',
      color: 0xf87171
    },
    {
      objectId: 'example-sat-escape',
      types: ['velocity'],
      label: 'Probe B (Escape)',
      color: 0x4ade80
    }
  ],
  overlays: {
    showOrbitPath: true,
    showVelocityVectors: true,
    showForceVectors: false,
    showInfluenceRadius: false,
    showOrbitalTrail: true
  },
  gConstant: 0.0012,
  gravityMode: 'radial',
  camera: {
    zoom: 0.9,
    centerX: 400,
    centerY: 300
  },
  customSetup: async (runtime, store, controller, observables) => {
    const vp = runtime.renderer.getViewport();
    const markers = new PIXI.Container();
    markers.name = 'example7_7-labels';
    vp.addChild(markers);

    const graphics = new PIXI.Graphics();
    markers.addChild(graphics);

    const bStyle = new PIXI.TextStyle({ fill: '#f87171', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 'bold' });
    const eStyle = new PIXI.TextStyle({ fill: '#4ade80', fontSize: 11, fontFamily: 'Inter, sans-serif', fontWeight: 'bold' });

    const bText = new PIXI.Text('Probe A: Bound Ellipse (v < v_esc)', bStyle);
    bText.anchor.set(1, 0.5);
    markers.addChild(bText);

    const eText = new PIXI.Text('Probe B: Escape Trajectory (v > v_esc)', eStyle);
    eText.anchor.set(0, 0.5);
    markers.addChild(eText);

    runtime.addHook({
      id: 'example7_7-labels-hook',
      beforeStep: () => {
        const bound = store.getObject('example-sat-bound');
        const escape = store.getObject('example-sat-escape');

        if (bound) {
          bText.position.set(bound.body.position.x - 18, bound.body.position.y);
        }
        if (escape) {
          eText.position.set(escape.body.position.x + 18, escape.body.position.y);
        }
      }
    });

    return () => {
      runtime.removeHook('example7_7-labels-hook');
    };
  }
};
