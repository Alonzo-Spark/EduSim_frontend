import { useEffect, useState, useRef } from 'react';
import { physicsEventBus, PhysicsEvent } from './physicsEventBus';
import { generateInsight, ExplanationInsight } from './insightGenerator';

export interface ExplanationQueueItem {
  id: string;
  insight: ExplanationInsight;
  timestamp: number;
}

export function useExplanationEngine() {
  const [queue, setQueue] = useState<ExplanationQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentExplanation = queue[currentIndex] || null;

  // Process incoming events from the bus
  useEffect(() => {
    const handleEvent = (event: PhysicsEvent) => {
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
  }, []);

  // Auto-dismiss logic
  useEffect(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    if (currentExplanation && !isHovered) {
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 7000); // Auto dismiss after 7 seconds
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
    pushExplanation
  };
}
