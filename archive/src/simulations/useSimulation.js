import { useCallback, useEffect, useRef, useState } from 'react';
import PhysicsScene from './PhysicsScene';

export function useSimulation() {
  const apiRef = useRef(null);
  const [ready, setReady] = useState(false);

  const onEngineReady = useCallback((api) => {
    apiRef.current = api;
    setReady(true);
  }, []);

  const spawn = useCallback((assetName, x, y, opts) => {
    if (!apiRef.current) throw new Error('Simulation engine not ready');
    return apiRef.current.spawn(assetName, x, y, opts);
  }, []);

  return { onEngineReady, spawn, ready, apiRef };
}

export default useSimulation;
