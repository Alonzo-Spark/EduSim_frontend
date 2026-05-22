import React, { useCallback, useEffect, useRef, useState } from 'react';
import PhysicsScene from './PhysicsScene';
import PhysicsOverlay from '../components/PhysicsOverlay';
import categories from '../data/categories.json';
import * as objectDataModule from '../data/objectData';

const objectData = objectDataModule.default ?? objectDataModule;

export default function SimulationCanvas({ initialWidth = 1024, initialHeight = 640, onEngineReady, onSelect }) {
  const [api, setApi] = useState(null);
  const [gravity, setGravity] = useState(1);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const dropRef = useRef(null);

  // if parent passed onEngineReady use that as well
  const internalOnEngineReady = useCallback((engineApi) => {
    setApi(engineApi);
    if (onEngineReady) onEngineReady(engineApi);
  }, [onEngineReady]);

  useEffect(() => {
    if (api) api.setGravity(gravity);
  }, [gravity, api]);

  const handlePause = () => {
    setPaused((p) => {
      const next = !p;
      if (api && api.engine) api.engine.enabled = !next;
      return next;
    });
  };

  const handleReset = () => {
    if (api) api.reset();
  };

  // drag & drop spawn
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    function onDragOver(e) { e.preventDefault(); }
    function onDrop(e) {
      e.preventDefault();
      const assetName = e.dataTransfer.getData('text/asset');
      if (!assetName) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (api) api.spawn(assetName, x, y);
    }

    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);
    return () => {
      el.removeEventListener('dragover', onDragOver);
      el.removeEventListener('drop', onDrop);
    };
  }, [api]);

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ width: 260 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Controls</strong>
        </div>
        <div style={{ marginBottom: 8 }}>
          <button onClick={handlePause}>{paused ? 'Resume' : 'Pause'}</button>
          <button onClick={handleReset} style={{ marginLeft: 8 }}>Reset</button>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Gravity: </label>
          <input type="range" min="-2" max="3" step="0.1" value={gravity} onChange={(e) => setGravity(Number(e.target.value))} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Zoom: </label>
          <input type="range" min="0.25" max="2" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        </div>
        <div style={{ marginTop: 12 }}>
          <strong>Asset Browser</strong>
          <div style={{ maxHeight: 420, overflow: 'auto', marginTop: 8 }}>
            {Object.keys(categories).map((cat) => {
              const group = categories[cat];
              const list = Array.isArray(group) ? group : Object.values(group).flat();
              return (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: '600' }}>{cat}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {list.slice(0, 50).map((name) => {
                      const asset = objectData[name];
                      if (!asset) return null;
                      const img = (asset.image || '').replace(/^\/public/, '');
                      return (
                        <img
                          key={name}
                          src={img}
                          alt={name}
                          title={name}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/asset', name)}
                          style={{ width: 48, height: 48, objectFit: 'contain', border: '1px solid rgba(0,0,0,0.1)' }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={dropRef} style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <PhysicsScene width={initialWidth} height={initialHeight} onEngineReady={internalOnEngineReady} onSelect={onSelect} />
          {api && <PhysicsOverlay apiRef={{ current: api }} width={initialWidth} height={initialHeight} />}
        </div>
      </div>
    </div>
  );
}
