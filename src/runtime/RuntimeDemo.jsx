import React, { useEffect, useRef, useState } from 'react';
import { SimulationLoader } from './parser/simulationLoader';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

/**
 * Reusable Runtime UI Wrapper
 * @param {Object} props.dsl - The DSL JSON object
 */
const RuntimeDemo = ({ dsl }) => {
  const containerRef = useRef(null);
  const loaderRef = useRef(null);
  const [status, setStatus] = useState('Ready');
  const [interactionValues, setInteractionValues] = useState({});

  useEffect(() => {
    if (containerRef.current && dsl) {
      // Initialize the clean runtime
      loaderRef.current = new SimulationLoader(containerRef.current, dsl);
      loaderRef.current.load();
      setStatus('Loaded');

      // Initialize interaction values from DSL state
      const initialValues = {};
      dsl.interactions?.forEach(inter => {
        // Resolve initial value from DSL properties
        initialValues[inter.id] = resolveInitialValue(dsl, inter.bind);
      });
      setInteractionValues(initialValues);
    }

    return () => {
      if (loaderRef.current) {
        loaderRef.current.destroy();
      }
    };
  }, [dsl]);

  // Helper to resolve initial value from DSL path
  const resolveInitialValue = (dsl, bind) => {
    try {
      const parts = bind.split(/[.\[\]]+/).filter(Boolean);
      let current = dsl;
      for (const part of parts) {
        if (current[part] !== undefined) {
          current = current[part];
        } else {
          return 0;
        }
      }
      return current;
    } catch (e) {
      return 0;
    }
  };

  const handlePlay = () => {
    loaderRef.current?.play();
    setStatus('Simulating');
  };

  const handlePause = () => {
    loaderRef.current?.pause();
    setStatus('Paused');
  };

  const handleReset = () => {
    loaderRef.current?.reset();
    setStatus('Ready');
    
    // Re-sync initial values
    const initialValues = {};
    dsl.interactions?.forEach(inter => {
      initialValues[inter.id] = resolveInitialValue(dsl, inter.bind);
    });
    setInteractionValues(initialValues);
  };

  const handleInteraction = (id, bind, value) => {
    setInteractionValues(prev => ({ ...prev, [id]: value }));
    loaderRef.current?.updateProperty(bind, value);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-blue-400">{dsl?.meta?.title || 'Physics Simulation'}</h2>
          <p className="text-sm text-slate-400">{dsl?.meta?.topic} • {dsl?.meta?.difficulty}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-mono ${
            status === 'Simulating' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
          }`}>
            ● {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Interactions */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Control Panel</h3>
            <div className="flex flex-col gap-8">
              {dsl.interactions?.length > 0 ? dsl.interactions.map((inter, i) => (
                <div key={inter.id || i} className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-slate-300">{inter.label}</Label>
                    {inter.type === 'slider' && (
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                        {Number(interactionValues[inter.id] || 0).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {inter.type === 'slider' && (
                    <Slider
                      value={[interactionValues[inter.id] ?? inter.min ?? 0]}
                      min={inter.min ?? 0}
                      max={inter.max ?? 100}
                      step={inter.step || 0.1}
                      onValueChange={(vals) => handleInteraction(inter.id, inter.bind, vals[0])}
                    />
                  )}

                  {inter.type === 'toggle' && (
                    <Switch
                      checked={!!interactionValues[inter.id]}
                      onCheckedChange={(val) => handleInteraction(inter.id, inter.bind, val)}
                    />
                  )}

                  {inter.type === 'button' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-xs"
                      onClick={() => handleInteraction(inter.id, inter.bind, !interactionValues[inter.id])}
                    >
                      {inter.label} {interactionValues[inter.id] ? '(ON)' : '(OFF)'}
                    </Button>
                  )}
                </div>
              )) : (
                <div className="text-xs text-slate-600 italic">No interactions in DSL</div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Canvas & Controls */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div 
            ref={containerRef} 
            className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 shadow-inner"
          />

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handlePlay}
              className="bg-green-600 hover:bg-green-500 font-bold"
            >
              ▶ Play
            </Button>
            <Button
              onClick={handlePause}
              variant="secondary"
              className="bg-amber-600 hover:bg-amber-500 font-bold text-white"
            >
              ⏸ Pause
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 font-bold"
            >
              ↺ Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuntimeDemo;
