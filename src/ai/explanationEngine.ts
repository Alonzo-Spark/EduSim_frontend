import { useEffect, useState, useRef } from 'react';
import { physicsEventBus, PhysicsEvent } from './physicsEventBus';
import { generateInsight, ExplanationInsight } from './insightGenerator';

export interface ExplanationQueueItem {
  id: string;
  insight: ExplanationInsight;
  timestamp: number;
  loading?: boolean;
}

// ─── Event-to-Prompt Mapping Helper ──────────────────────────────────────────
function getDynamicPromptAndPlaceholder(event: PhysicsEvent, gravityMode: 'linear' | 'radial') {
  const isRadial = gravityMode === 'radial';

  switch (event.type) {
    case 'OBJECT_SPAWNED': {
      const mass = event.metadata?.mass ? `${event.metadata.mass.toFixed(1)} kg` : 'unknown mass';
      const shape = event.metadata?.shape ?? 'object';
      const name = event.metadata?.name ?? shape;
      
      if (isRadial) {
        return {
          query: `Explain the physics of a celestial ${shape} named "${name}" with mass ${mass} which has just been spawned in a zero-atmosphere space environment under radial gravity. Explain centripetal force, radial gravitational pull ($F = G \\frac{m_1 m_2}{r^2}$), and how orbital velocity determines whether it stays in a stable orbit or falls towards the star.`,
          placeholderTitle: `${name} spawned in space orbit`,
          placeholderEffects: ['Calculating orbital trajectory...', 'Measuring radial gravity field...', 'Checking centripetal balance...']
        };
      } else {
        const gVal = typeof event.metadata?.gravity === 'number' ? event.metadata.gravity : 1.0;
        const gMs = (gVal * 9.8).toFixed(1);
        return {
          query: `Explain the physics of a ${shape} named "${name}" with mass ${mass} which has just been released and is in free-fall under downward Earth gravity of ${gMs} m/s². What happens to its velocity, acceleration, kinetic energy, and potential energy as it falls?`,
          placeholderTitle: `${name} released — free-fall begins`,
          placeholderEffects: ['Calculating free-fall dynamics...', 'Simulating weight force...', 'Preparing formulas...']
        };
      }
    }
    case 'GRAVITY_CHANGED': {
      if (isRadial) {
        return {
          query: `Explain what happens in a space physics simulation when the radial gravitational constant (G) changes from ${event.oldValue.toFixed(4)} to ${event.newValue.toFixed(4)}. Discuss the dynamic impact on planetary orbital velocities ($v = \\sqrt{\\frac{GM}{r}}$), centripetal acceleration, and orbit stability.`,
          placeholderTitle: 'Radial Gravity changed (Live AI)',
          placeholderEffects: ['Recalculating orbital vectors...', 'Recalibrating radial field lines...', 'Checking trajectory stability...']
        };
      } else {
        const gOld = (event.oldValue * 9.8).toFixed(1);
        const gNew = (event.newValue * 9.8).toFixed(1);
        return {
          query: `Explain what happens in a physics simulation when downward linear gravity is changed from ${gOld} m/s² to ${gNew} m/s². Discuss the implications on the weight of objects, how fast they fall, and how collision forces or bounciness will scale.`,
          placeholderTitle: 'Linear Gravity changed (Live AI)',
          placeholderEffects: ['Recalculating weight vectors...', 'Updating acceleration values...', 'Recalibrating physics engine...']
        };
      }
    }
    case 'MASS_CHANGED': {
      const mOld = event.oldValue.toFixed(1);
      const mNew = event.newValue.toFixed(1);
      const diff = Math.abs(event.newValue - event.oldValue).toFixed(1);
      
      if (isRadial) {
        return {
          query: `In an orbital celestial simulation, a body's mass has changed from ${mOld} kg to ${mNew} kg (a change of ${diff} kg). Explain how this change affects the gravitational attraction force ($F = G \\frac{m_1 m_2}{r^2}$) exerted on or by this body, its orbital velocity, and its resistance to orbital changes (inertia).`,
          placeholderTitle: 'Celestial Mass updated (Live AI)',
          placeholderEffects: ['Recalculating orbital gravitational pull...', 'Adjusting centripetal parameters...', 'Checking Keplerian variables...']
        };
      } else {
        return {
          query: `In a ground physics simulation, an object's mass has changed from ${mOld} kg to ${mNew} kg (a change of ${diff} kg). Explain the concept of inertia and how this change in mass affects the force required to accelerate the object ($F = ma$), its weight ($W = mg$), and collision impact.`,
          placeholderTitle: 'Object Mass updated (Live AI)',
          placeholderEffects: ['Recalculating inertia tensors...', 'Adjusting force requirements...', 'Recalibrating weight force...']
        };
      }
    }
    case 'FRICTION_CHANGED': {
      const fOld = event.oldValue.toFixed(2);
      const fNew = event.newValue.toFixed(2);
      return {
        query: `Explain what happens in a physics simulation when the sliding friction coefficient (μ) changes from ${fOld} to ${fNew}. Discuss the impact on sliding objects, how rate of kinetic energy loss changes, and how force opposes motion.`,
        placeholderTitle: 'Friction adjusted (Live AI)',
        placeholderEffects: ['Adjusting normal force vectors...', 'Recalculating sliding resistance...', 'Recalibrating energy dissipation...']
      };
    }
    case 'RESTITUTION_CHANGED': {
      const rOld = event.oldValue.toFixed(2);
      const rNew = event.newValue.toFixed(2);
      return {
        query: `Explain the physical meaning of restitution (bounciness) changing from ${rOld} to ${rNew} in a simulation. Discuss elastic vs inelastic collisions, kinetic energy conservation, and how high or low the object will bounce when dropped.`,
        placeholderTitle: 'Restitution adjusted (Live AI)',
        placeholderEffects: ['Recalculating coefficient of restitution...', 'Adjusting kinetic energy retention...', 'Simulating impact dynamics...']
      };
    }
    case 'SPRING_CREATED': {
      const k = event.metadata?.stiffness ?? 0.02;
      return {
        query: `A spring constraint with stiffness constant k = ${k.toFixed(3)} has just been attached to an object in a physics simulation. Explain Hooke's Law (F = -kx), spring potential energy, and the resulting oscillatory motion (simple harmonic motion).`,
        placeholderTitle: 'Spring attached (Live AI)',
        placeholderEffects: ['Calculating Hooke\'s Law restoring force...', 'Simulating elastic potential energy...', 'Estimating oscillation periods...']
      };
    }
    case 'ROPE_CREATED': {
      return {
        query: `A rope constraint has been added between two bodies in a physics simulation. Explain the physics of tension force, centripetal acceleration, pendulum-like swinging motion, and how a rope goes slack when objects get closer.`,
        placeholderTitle: 'Rope constraint added (Live AI)',
        placeholderEffects: ['Calculating tension vectors...', 'Determining separation thresholds...', 'Simulating pendulum arcs...']
      };
    }
    case 'PIVOT_CREATED': {
      return {
        query: `A pivot anchor constraint has been attached to a body in a physics simulation. Explain pendulum motion, restoring forces under gravity, and how the length of the pendulum arm and gravity affect the oscillation period.`,
        placeholderTitle: 'Pivot attached (Live AI)',
        placeholderEffects: ['Determining rotational coordinates...', 'Calculating centripetal forces...', 'Mapping pendulum arcs...']
      };
    }
    case 'COLLISION_DETECTED': {
      const speed = event.metadata?.relativeSpeed ? `${event.metadata.relativeSpeed.toFixed(1)} m/s` : 'unknown speed';
      const impulse = event.metadata?.impulse ? `${event.metadata.impulse.toFixed(2)} N·s` : 'unknown impulse';
      
      if (isRadial) {
        return {
          query: `A collision has occurred between celestial bodies in space at a relative speed of ${speed} with an impulse of ${impulse}. Explain the conservation of momentum in orbital mechanics, relative impact speed, and how such collisions alter orbital trajectories.`,
          placeholderTitle: 'Celestial Collision (Live AI)',
          placeholderEffects: ['Checking momentum vectors...', 'Calculating trajectory alterations...', 'Determining kinetic energy loss...']
        };
      } else {
        return {
          query: `A collision has occurred between objects in a ground simulation at a relative speed of ${speed} with an impulse of ${impulse}. Explain the conservation of momentum, Newton's Third Law (equal and opposite forces), and how bounciness determines energy conservation.`,
          placeholderTitle: 'Collision detected (Live AI)',
          placeholderEffects: ['Verifying momentum conservation...', 'Calculating impulse transfer...', 'Determining kinetic energy loss...']
        };
      }
    }
    case 'FORCE_APPLIED': {
      const fx = event.newValue?.x ?? 0;
      const fy = event.newValue?.y ?? 0;
      const fMag = (Math.hypot(fx, fy) * 1000).toFixed(1);
      const mass = event.metadata?.mass;
      const accStr = mass ? `resulting in an acceleration of ${((Math.hypot(fx, fy) * 1000) / mass).toFixed(1)} m/s²` : '';
      return {
        query: `An external force of magnitude ${fMag} N has been applied to an object of mass ${mass?.toFixed(1) ?? 'unknown'} kg ${accStr}. Explain Newton's Second Law of Motion (F = ma) and how the applied force causes acceleration, changes velocity, and increases kinetic energy over time.`,
        placeholderTitle: 'Force applied (Live AI)',
        placeholderEffects: ['Summing force vectors...', 'Calculating F = ma acceleration...', 'Mapping momentum accumulation...']
      };
    }
    case 'OBJECT_AT_REST': {
      const friction = event.metadata?.friction ?? 0.3;
      const rest = event.metadata?.restitution ?? 0.5;
      return {
        query: `An object in a physics simulation has come to rest. Explain how kinetic energy was fully dissipated into other forms of energy (like heat and sound) through friction (μ = ${friction.toFixed(2)}) and low restitution (e = ${rest.toFixed(2)}), bringing the system to equilibrium under balanced forces.`,
        placeholderTitle: 'Object came to rest (Live AI)',
        placeholderEffects: ['Summing net forces to zero...', 'Verifying kinetic energy dissipation...', 'Confirming system static state...']
      };
    }
    default:
      return {
        query: `Explain the physics of a simulator event: ${event.type}.`,
        placeholderTitle: 'Analyzing Physics Event...',
        placeholderEffects: ['Updating state variables...', 'Calculating force equations...']
      };
  }
}

export function useExplanationEngine(dynamicEnabled: boolean = false, gravityMode: 'linear' | 'radial' = 'linear') {
  const [queue, setQueue] = useState<ExplanationQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentExplanation = queue[currentIndex] || null;

  // Process incoming events from the bus
  useEffect(() => {
    const handleEvent = async (event: PhysicsEvent) => {
      if (dynamicEnabled) {
        const { query, placeholderTitle, placeholderEffects } = getDynamicPromptAndPlaceholder(event, gravityMode);
        const tempId = Math.random().toString(36).substr(2, 9);
        
        // 1. Avoid exact duplicate titles in queue
        let isDup = false;
        setQueue(prev => {
          if (prev.some(item => item.insight.title === placeholderTitle)) {
            isDup = true;
            return prev;
          }
          return [...prev, {
            id: tempId,
            loading: true,
            insight: {
              title: placeholderTitle,
              explanation: '✨ AI is formulating an in-depth physics explanation dynamically...',
              effects: placeholderEffects,
              formula: 'Generating...',
              suggestions: []
            },
            timestamp: Date.now()
          }];
        });

        if (isDup) return;

        // 2. Query FastAPI backend tutor endpoint
        try {
          const resp = await fetch('/api/tutor/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });
          if (!resp.ok) throw new Error(`Backend response error: ${resp.status}`);
          const json = await resp.json();
          if (json.success && json.data) {
            const d = json.data;
            setQueue(prev => prev.map(item => {
              if (item.id === tempId) {
                return {
                  ...item,
                  loading: false,
                  insight: {
                    title: d.title || placeholderTitle,
                    explanation: d.ai_explanation || d.explanation || 'No response details.',
                    effects: d.related_concepts?.map((c: string) => `📌 ${c}`) || placeholderEffects,
                    formula: d.formula || '',
                    suggestions: d.concepts || []
                  }
                };
              }
              return item;
            }));
          } else {
            throw new Error('Data format incorrect');
          }
        } catch (e) {
          console.warn('[LiveAI] Failed to fetch dynamic explanation:', e);
          setQueue(prev => prev.map(item => {
            if (item.id === tempId) {
              return {
                ...item,
                loading: false,
                insight: {
                  title: 'AI Explanation offline',
                  explanation: `Could not reach live tutor: ${(e as Error).message}. Verify that the FastAPI backend is running.`,
                  effects: ['Check if "uvicorn main:app --reload" is active.'],
                  formula: '',
                  suggestions: []
                }
              };
            }
            return item;
          }));
        }
      } else {
        const insight = generateInsight(event);
        if (insight) {
          setQueue(prev => {
            // Avoid exact duplicates in the queue
            if (prev.some(item => item.insight.title === insight.title)) {
              return prev;
            }
            return [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              insight,
              timestamp: Date.now()
            }];
          });
        }
      }
    };

    const unsub  = physicsEventBus.subscribe('MASS_CHANGED',        handleEvent);
    const unsub2 = physicsEventBus.subscribe('GRAVITY_CHANGED',      handleEvent);
    const unsub3 = physicsEventBus.subscribe('FRICTION_CHANGED',     handleEvent);
    const unsub4 = physicsEventBus.subscribe('RESTITUTION_CHANGED',  handleEvent);
    const unsub5 = physicsEventBus.subscribe('SPRING_CREATED',       handleEvent);
    const unsub6 = physicsEventBus.subscribe('COLLISION_DETECTED',   handleEvent);
    const unsub7 = physicsEventBus.subscribe('FORCE_APPLIED',        handleEvent);
    const unsub8 = physicsEventBus.subscribe('OBJECT_SPAWNED',       handleEvent);
    const unsub9 = physicsEventBus.subscribe('OBJECT_AT_REST',       handleEvent);
    const unsubA = physicsEventBus.subscribe('PIVOT_CREATED',        handleEvent);
    const unsubB = physicsEventBus.subscribe('ROPE_CREATED',         handleEvent);

    return () => {
      unsub(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7();
      unsub8(); unsub9(); unsubA(); unsubB();
    };
  }, [dynamicEnabled, gravityMode]);

  // Auto-dismiss logic (disabled when loading to allow reading once resolved)
  useEffect(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    if (currentExplanation && !isHovered && !currentExplanation.loading) {
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 9000); // 9 seconds
    }

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [currentExplanation, isHovered]);

  const handleDismiss = () => {
    if (currentIndex < queue.length - 1) {
      // Move to next explanation in queue
      setCurrentIndex(prev => prev + 1);
    } else {
      // Clear queue if we're at the end
      setQueue([]);
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleClear = () => {
    setQueue([]);
    setCurrentIndex(0);
  };

  const pushExplanation = (insight: ExplanationInsight) => {
    setQueue(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      insight,
      timestamp: Date.now()
    }]);
  };

  return {
    currentExplanation,
    queueCount: queue.length - currentIndex - 1,
    handleDismiss,
    setIsHovered,
    pushExplanation,
    handleNext,
    handleClear
  };
}
