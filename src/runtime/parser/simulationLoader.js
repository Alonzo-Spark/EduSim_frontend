import Matter from 'matter-js';
import { createEngine } from '../engine/createEngine';
import { createBodyFromDSL } from './objectFactory';
import { createRenderer } from '../renderer/createRenderer';
import { toPixels, toWorld } from '../utils/coordinateUtils';
import { validateSimulation } from '../utils/physicsValidator';

/**
 * Orchestrates the simulation lifecycle with centralized state maps
 */
export class SimulationLoader {
  constructor(container, dsl) {
    this.container = container;
    this.dsl = dsl;
    this.engine = null;
    this.runner = null;
    this.renderer = null;

    this.bodyMap = new Map();
    this.constraintMap = new Map();
    this.behaviorMap = new Map();
    this.forceMap = new Map();

    // Validation State
    this.liveState = {
      time: 0,
      initialStates: new Map(), // To capture y0, u0, etc.
      lastMeasuredPeriod: 0,
      currentPositionY: 0,
      validationResults: null
    };

    this._lastVelX = 0;
    this._lastZeroCrossTime = 0;
  }

  load() {
    console.log('[Runtime] Loading simulation:', this.dsl.meta?.title);

    this.engine = createEngine(this.dsl.environment);

    const bodies = this.dsl.objects.map(obj => {
      const body = createBodyFromDSL(obj);
      this.bodyMap.set(obj.id, body);
      
      // Capture Initial State for Formula Validation
      this.liveState.initialStates.set(obj.id, {
        y0: obj.position.y,
        x0: obj.position.x,
        u0y: obj.velocity?.y || 0,
        u0x: obj.velocity?.x || 0
      });

      return body;
    });

    if (this.dsl.constraints) {
      this.dsl.constraints.forEach(c => {
        const bodyA = this.bodyMap.get(c.bodyA);
        const bodyB = this.bodyMap.get(c.bodyB);
        if (bodyA && bodyB) {
          const constraint = Matter.Constraint.create({
            bodyA,
            bodyB,
            length: toPixels(c.length || 0),
            stiffness: c.stiffness || 1.0,
            label: c.id
          });
          this.constraintMap.set(c.id, constraint);
          Matter.Composite.add(this.engine.world, constraint);
        }
      });
    }

    if (this.dsl.forces) {
      this.dsl.forces.forEach(f => this.forceMap.set(f.id, f));
    }
    if (this.dsl.behaviors) {
      this.dsl.behaviors.forEach(b => this.behaviorMap.set(b.id, b));
    }

    Matter.Composite.add(this.engine.world, bodies);

    this.renderer = createRenderer(this.container, this.engine, this.dsl);
    this.renderer.start(); 

    this.runner = Matter.Runner.create();

    Matter.Events.on(this.engine, 'beforeUpdate', () => {
      this._applyRuntimeLogic();
      this._performValidation();
    });
  }

  _applyRuntimeLogic() {
    this.forceMap.forEach(force => {
      if (!force.enabled) return;
      const body = this.bodyMap.get(force.target);
      if (body) {
        Matter.Body.applyForce(body, body.position, {
          x: force.vector.x * 0.001, 
          y: force.vector.y * 0.001
        });
      }
    });

    this.behaviorMap.forEach(behavior => {
      if (!behavior.enabled) return;
      if (behavior.type === 'variableMass') {
        behavior.targets.forEach(targetId => {
          const body = this.bodyMap.get(targetId);
          if (body && body.mass > 0.1) {
            Matter.Body.setMass(body, body.mass + (behavior.coefficient || 0));
          }
        });
      }
      if (behavior.type === 'drag') {
        behavior.targets.forEach(targetId => {
          const body = this.bodyMap.get(targetId);
          if (body) {
            const drag = {
              x: -body.velocity.x * (behavior.coefficient || 0.01),
              y: -body.velocity.y * (behavior.coefficient || 0.01)
            };
            Matter.Body.applyForce(body, body.position, drag);
          }
        });
      }
    });
  }

  _performValidation() {
    this.liveState.time = this.engine.timing.timestamp / 1000;
    
    const bodies = Matter.Composite.allBodies(this.engine.world);
    const body = bodies.find(b => !b.isStatic);

    if (body) {
      this.liveState.currentPositionY = toWorld(body.position.y);

      // Detect zero-crossing for pendulum period
      if (this._lastVelX < 0 && body.velocity.x >= 0) {
        const currentTime = this.liveState.time;
        if (this._lastZeroCrossTime > 0) {
          this.liveState.lastMeasuredPeriod = (currentTime - this._lastZeroCrossTime) * 2;
        }
        this._lastZeroCrossTime = currentTime;
      }
      this._lastVelX = body.velocity.x;
    }

    this.liveState.validationResults = validateSimulation(this.dsl, this.liveState);
    
    if (this.renderer) {
      this.renderer.setValidation(this.liveState.validationResults);
    }
  }

  play() {
    if (this.runner && this.engine) {
      Matter.Runner.run(this.runner, this.engine);
      if (this.renderer) this.renderer.start();
    }
  }

  pause() {
    if (this.runner) {
      Matter.Runner.stop(this.runner);
      if (this.renderer) this.renderer.stop();
    }
  }

  reset() {
    this.destroy();
    this._lastZeroCrossTime = 0;
    this.load();
  }

  updateProperty(bindPath, value) {
    if (!this.engine) return;

    if (bindPath.startsWith('environment.')) {
      if (bindPath === 'environment.gravity.x') this.engine.gravity.x = value * (40 / 1000);
      if (bindPath === 'environment.gravity.y') this.engine.gravity.y = value * (40 / 1000);
    }

    const objectMatch = bindPath.match(/objects\[(\d+)\]\.(.+)/);
    if (objectMatch) {
      const index = parseInt(objectMatch[1]);
      const property = objectMatch[2];
      const dslObject = this.dsl.objects[index];
      const body = this.bodyMap.get(dslObject.id);
      if (body) {
        if (property === 'physics.mass') Matter.Body.setMass(body, value);
        if (property === 'material.friction') body.friction = value;
        if (property === 'material.restitution') body.restitution = value;
        if (property === 'velocity.x') Matter.Body.setVelocity(body, { x: toPixels(value), y: body.velocity.y });
        if (property === 'velocity.y') Matter.Body.setVelocity(body, { x: body.velocity.x, y: toPixels(value) });
        
        // Update initial state for validator if property is changed while paused
        if (!this.runner || !this.runner.enabled) {
          const state = this.liveState.initialStates.get(dslObject.id);
          if (state) {
            if (property === 'velocity.y') state.u0y = value;
          }
        }
      }
    }

    const constraintMatch = bindPath.match(/constraints\[(\d+)\]\.(.+)/);
    if (constraintMatch) {
      const index = parseInt(constraintMatch[1]);
      const property = constraintMatch[2];
      const dslConstraint = this.dsl.constraints[index];
      const constraint = this.constraintMap.get(dslConstraint.id);
      if (constraint && property === 'length') {
        constraint.length = toPixels(value);
      }
    }

    const forceMatch = bindPath.match(/forces\[(\d+)\]\.(.+)/);
    if (forceMatch) {
      const index = parseInt(forceMatch[1]);
      const property = forceMatch[2];
      const force = this.dsl.forces[index];
      if (force) {
        if (property === 'enabled') force.enabled = value;
        if (property === 'vector.x') force.vector.x = value;
        if (property === 'vector.y') force.vector.y = value;
      }
    }

    const behaviorMatch = bindPath.match(/behaviors\[(\d+)\]\.(.+)/);
    if (behaviorMatch) {
      const index = parseInt(behaviorMatch[1]);
      const property = behaviorMatch[2];
      const behavior = this.dsl.behaviors[index];
      if (behavior) {
        if (property === 'enabled') behavior.enabled = value;
      }
    }
  }

  destroy() {
    if (this.runner) Matter.Runner.stop(this.runner);
    if (this.renderer) this.renderer.destroy();
    if (this.engine) {
      Matter.Events.off(this.engine);
      Matter.Engine.clear(this.engine);
    }

    this.engine = null;
    this.runner = null;
    this.renderer = null;
    this.bodyMap.clear();
    this.constraintMap.clear();
    this.behaviorMap.clear();
    this.forceMap.clear();
    this.liveState.initialStates.clear();
  }

  getLiveState() {
    if (!this.engine) return null;
    
    // Map of current values for all observable paths
    const state = {
      time: this.engine.timing.timestamp / 1000,
      values: {}
    };

    // Extract current values for all objects
    this.bodyMap.forEach((body, id) => {
      state.values[`objects.${id}.position.x`] = toWorld(body.position.x);
      state.values[`objects.${id}.position.y`] = toWorld(body.position.y);
      state.values[`objects.${id}.velocity.x`] = toWorld(body.velocity.x);
      state.values[`objects.${id}.velocity.y`] = toWorld(body.velocity.y);
      state.values[`objects.${id}.velocity.magnitude`] = toWorld(Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2));
      state.values[`objects.${id}.physics.mass`] = body.mass;
    });

    // Add calculated fields from liveState
    state.values['runtime.calculated.period'] = this.liveState.lastMeasuredPeriod;
    
    return state;
  }
}
