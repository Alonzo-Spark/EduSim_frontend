import { useEffect, useRef } from 'react';
import type { RuntimeStore } from '../state/runtimeStore';
import type { PropertyController } from '../properties/propertyController';
import type { SandboxRuntime } from '../engine/runtime';

interface AIExplanationEngineProps {
  store: RuntimeStore | null;
  propertyController: PropertyController | null;
  runtime: SandboxRuntime | null;
  onExplanation: (explanation: string) => void;
}

export function useAIExplanationEngine({ store, propertyController, runtime, onExplanation }: AIExplanationEngineProps) {
  // Use a ref to debounce rapid events (like slider sliding)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!runtime || !store || !propertyController) return;

    const generateExplanation = (title: string, effects: string[], formula: string, description?: string) => {
      let explanation = `✨ AI Explanation\n\n${title}\n\nEffects:\n${effects.map(e => `• ${e}`).join('\n')}\n\nFormula:\n${formula}`;
      if (description) {
        explanation += `\n\nExplanation:\n${description}`;
      }
      return explanation;
    };

    const triggerExplanation = (text: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onExplanation(text);
      }, 800); // 800ms debounce so we don't spam explanations while dragging sliders
    };

    // 1. Property Changes (Mass, Gravity, Velocity, Friction, Restitution)
    const unsubProp = propertyController.subscribe('propertyChanged', (data: any) => {
      const { objectId, property, value } = data;

      if (property === 'gravity') {
        const text = generateExplanation(
          `Gravity changed to ${value.y} m/s²`,
          [
            'Objects fall faster or slower',
            'Impact force scales with gravity',
            'Acceleration increases/decreases proportionally',
            'Potential energy gradient changes'
          ],
          'F = m × g'
        );
        triggerExplanation(text);
      } else if (property === 'mass') {
        const obj = store.getObject(objectId);
        const text = generateExplanation(
          `Mass of ${obj?.metadata?.label || objectId} updated to ${value.toFixed(1)} kg.`,
          [
            'Higher inertia',
            'Requires more force to accelerate',
            'Momentum changes proportionately',
            'Collision impact force changes'
          ],
          'F = m × a',
          'As mass changes, acceleration inversely changes for the same applied force according to Newton\'s Second Law.'
        );
        triggerExplanation(text);
      } else if (property === 'activeForce') {
        if (value && (value.x !== 0 || value.y !== 0)) {
          const text = generateExplanation(
            `Force applied to ${objectId}`,
            [
              'Object begins accelerating',
              'Velocity will change over time',
              'Kinetic energy increases'
            ],
            'F = m × a',
            'An external force causes a proportional acceleration inversely proportional to the mass.'
          );
          triggerExplanation(text);
        }
      } else if (property === 'friction') {
        const text = generateExplanation(
          `Friction adjusted on ${objectId}`,
          [
            'Rate of kinetic energy loss changes',
            'Sliding objects will halt faster/slower',
            'Heat generation (simulated) increases/decreases'
          ],
          'F_f = μ × F_n'
        );
        triggerExplanation(text);
      } else if (property === 'restitution') {
        const text = generateExplanation(
          `Bounciness (Restitution) adjusted on ${objectId}`,
          [
            'Energy retained after collisions changes',
            'Bounce height increases/decreases',
            'Momentum transfer becomes more/less elastic'
          ],
          'e = v_rel_after / v_rel_before'
        );
        triggerExplanation(text);
      }
    });

    // 2. Constraint Additions (Springs, Ropes, Pivots)
    const unsubConstraint = store.subscribe('constraintAdded', (data: any) => {
      const constraint = data;
      
      let title = 'Constraint added';
      let effects = ['Degrees of freedom restricted', 'Reaction forces generated'];
      let formula = 'F_c = -k × x (if elastic)';

      if (constraint.stiffness && constraint.stiffness < 1) {
        title = 'Spring constraint added.';
        effects = [
          'Oscillatory motion enabled',
          'Elastic potential energy stored',
          'Restoring force generated directly proportional to stretch'
        ];
        formula = 'F = -kx (Hooke\'s Law)';
      } else {
        title = 'Rigid constraint (Rod/Pivot) added.';
        effects = [
          'Distance between bodies fixed',
          'Tension/compression forces automatically calculated',
          'Rotational pendulum motion enabled'
        ];
        formula = 'T - mg cos(θ) = m(v²/r)';
      }

      const text = generateExplanation(title, effects, formula);
      triggerExplanation(text);
    });

    // 3. Collision Events
    const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
      if (event.pairs.length > 0) {
        // Only trigger explanation for high-impact collisions to avoid spam
        // We'll just randomly sample or use the first significant pair
        const pair = event.pairs[0];
        
        // Find if they are dynamic bodies
        if (!pair.bodyA.isStatic || !pair.bodyB.isStatic) {
          const text = generateExplanation(
            'Collision Detected',
            [
              'Momentum is exchanged between bodies',
              'Impulsive forces act over a short time',
              'Kinetic energy may be lost to deformation (based on restitution)'
            ],
            'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\' (Conservation of Momentum)',
            'When two objects collide, they exert equal and opposite impulses on each other.'
          );
          triggerExplanation(text);
        }
      }
    };

    runtime.physics.onCollisionStart(handleCollision);

    return () => {
      unsubProp();
      unsubConstraint();
      runtime.physics.offCollisionStart(handleCollision);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [store, propertyController, runtime, onExplanation]);
}
