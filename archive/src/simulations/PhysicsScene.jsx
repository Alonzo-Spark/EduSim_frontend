import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import * as objectDataModule from '../data/objectData';
import { createBodyFromAsset, spawnObject } from '../physics/spawn';

const objectData = objectDataModule.default ?? objectDataModule;

export default function PhysicsScene({ width = 800, height = 600, onEngineReady, onSelect }) {
  const sceneRef = useRef(null);
  const [engine, setEngine] = useState(null);
  const [render, setRender] = useState(null);
  const [runner, setRunner] = useState(null);

  useEffect(() => {
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

    const eng = Engine.create();
    eng.gravity.y = 1;
    setEngine(eng);

    const renderInstance = Render.create({
      element: sceneRef.current,
      engine: eng,
      options: {
        width,
        height,
        wireframes: false,
        background: '#0f172a'
      }
    });
    Render.run(renderInstance);
    setRender(renderInstance);

    const run = Runner.create();
    Runner.run(run, eng);
    setRunner(run);

    // ground
    const ground = Bodies.rectangle(width / 2, height + 50, width * 2, 100, { isStatic: true });
    World.add(eng.world, [ground]);

    // mouse
    const mouse = Mouse.create(renderInstance.canvas);
    const mouseConstraint = MouseConstraint.create(eng, { mouse, constraint: { stiffness: 0.2 } });
    World.add(eng.world, mouseConstraint);

    // selection handling
    let lastSelected = null;
    Matter.Events.on(mouseConstraint, 'mousedown', (e) => {
      const mousePosition = e.mouse.position;
      const found = Matter.Query.point(eng.world.bodies, mousePosition)[0] || null;
      if (found) {
        // highlight
        if (lastSelected && lastSelected !== found) {
          lastSelected.render.lineWidth = 0;
          lastSelected.render.strokeStyle = null;
        }
        found.render.lineWidth = 4;
        found.render.strokeStyle = '#00eaff';
        lastSelected = found;
        if (typeof onSelect === 'function') onSelect(found);
      } else {
        if (lastSelected) {
          lastSelected.render.lineWidth = 0;
          lastSelected.render.strokeStyle = null;
          lastSelected = null;
          if (typeof onSelect === 'function') onSelect(null);
        }
      }
    });

    // collision and stats tracking
    let collisionCount = 0;
    const collisionHandlers = new Set();

    Matter.Events.on(eng, 'collisionStart', (evt) => {
      collisionCount += evt.pairs.length;
      evt.pairs.forEach((pair) => {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const keA = 0.5 * (a.mass || 1) * (a.speed || 0) * (a.speed || 0);
        const keB = 0.5 * (b.mass || 1) * (b.speed || 0) * (b.speed || 0);
        const data = { a, b, pair, kineticEnergy: keA + keB };
        collisionHandlers.forEach((h) => { try { h(data); } catch (e) { /* ignore */ } });
      });
    });

    // expose API
    const api = {
      engine: eng,
      world: eng.world,
      spawn: (assetName, x = width / 2, y = height / 2, opts = {}) => spawnObject(eng.world, assetName, x, y, opts),
      setGravity: (g) => { eng.gravity.y = g; },
      reset: () => {
        Matter.World.clear(eng.world, false);
        Matter.Engine.clear(eng);
        World.add(eng.world, [ground]);
      },
      clear: () => {
        Matter.World.clear(eng.world, false);
      },
      selectBody: (body) => {
        if (!body) return;
        body.render.lineWidth = 4;
        body.render.strokeStyle = '#00eaff';
      },
      onCollision: (fn) => { collisionHandlers.add(fn); return () => collisionHandlers.delete(fn); },
      getStats: () => ({ collisionCount, bodies: eng.world.bodies.length }),
      setBodyMass: (body, mass) => { try { Matter.Body.setMass(body, mass); } catch (e) { /* ignore */ } }
    };

    if (typeof onEngineReady === 'function') onEngineReady(api);

    return () => {
      Matter.Render.stop(renderInstance);
      Matter.Runner.stop(run);
      Render.stop(renderInstance);
      Runner.stop(run);
      Matter.World.clear(eng.world, false);
      Matter.Engine.clear(eng);
      renderInstance.canvas.remove();
      renderInstance.textures = {};
    };
  }, []);

  return (
    <div ref={sceneRef} style={{ width, height, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6 }} />
  );
}
