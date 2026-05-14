import React, { useEffect, useRef, useState } from 'react';
import { SimulationLoader } from './parser/simulationLoader';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Activity, Settings2, Info } from "lucide-react";

/**
 * Enhanced Runtime for DSL v2.0
 */
const DSLRuntime = ({ dsl }) => {
  const containerRef = useRef(null);
  const loaderRef = useRef(null);
  const [status, setStatus] = useState('Ready');
  const [controlValues, setControlValues] = useState({});
  const [liveData, setLiveData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let interval;
    if (isMounted && status === 'Simulating') {
      interval = setInterval(() => {
        if (loaderRef.current) {
          setLiveData(loaderRef.current.getLiveState());
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [status, isMounted]);

  useEffect(() => {
    if (isMounted && containerRef.current && dsl) {
      // Initialize the clean runtime
      loaderRef.current = new SimulationLoader(containerRef.current, dsl);
      loaderRef.current.load();
      setStatus('Loaded');

      // Initialize control values from DSL state
      const initialValues = {};
      if (dsl.controls?.parameters) {
        dsl.controls.parameters.forEach(param => {
          initialValues[param.id] = resolveInitialValue(dsl, param.bind);
        });
      }
      setControlValues(initialValues);
    }

    return () => {
      if (loaderRef.current) {
        loaderRef.current.destroy();
      }
    };
  }, [dsl, isMounted]);

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
    if (dsl.controls?.parameters) {
      dsl.controls.parameters.forEach(param => {
        initialValues[param.id] = resolveInitialValue(dsl, param.bind);
      });
    }
    setControlValues(initialValues);
  };

  const handleControlUpdate = (id, bind, value) => {
    setControlValues(prev => ({ ...prev, [id]: value }));
    loaderRef.current?.updateProperty(bind, value);
  };

  const handleAction = (action) => {
    if (action === 'startSimulation') {
      // Logic fix: if simulation is already loaded but stationary, 
      // check if this action string is actually intended to be a force
      const actionDef = dsl.controls?.actions?.find(a => a.action === action);
      const label = actionDef?.label?.toLowerCase() || "";
      
      if (label.includes('force') || label.includes('push')) {
         loaderRef.current?.triggerAction(action);
      }
      
      handlePlay();
    }
    else if (action === 'togglePause') status === 'Simulating' ? handlePause() : handlePlay();
    else if (action === 'resetSimulation') handleReset();
    else {
      // Pass custom actions (like applyBriefForce) to the loader
      console.log(`[UI] Triggering custom action: ${action}`);
      loaderRef.current?.triggerAction(action);
    }
  };

  if (!isMounted || !dsl) return null;

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-950/50 backdrop-blur-xl text-white rounded-2xl shadow-2xl border border-slate-800/50">
      {/* Simulation Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              {dsl.meta?.title || 'Untitled Simulation'}
            </h2>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wider font-bold">
              v{dsl.meta?.version || '2.0'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Activity size={14} className="text-slate-500" /> {dsl.meta?.topic}</span>
            <span className="text-slate-700">•</span>
            <span className="flex items-center gap-1"><Settings2 size={14} className="text-slate-500" /> {dsl.meta?.difficulty}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-all duration-300 ${status === 'Simulating'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
            <div className={`w-2 h-2 rounded-full ${status === 'Simulating' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
            {status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Simulation Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="group relative">
            <div
              ref={containerRef}
              className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-500 group-hover:border-blue-500/30"
            />

            {/* Viewport Overlay Controls (Optional) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 p-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button size="icon" variant="ghost" onClick={handleReset} className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
                <RotateCcw size={20} />
              </Button>
              <div className="w-[1px] bg-slate-800 my-1" />
              {status === 'Simulating' ? (
                <Button size="icon" variant="ghost" onClick={handlePause} className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-xl">
                  <Pause size={20} fill="currentColor" />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" onClick={handlePlay} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl">
                  <Play size={20} fill="currentColor" />
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            {dsl.controls?.actions?.map(action => (
              <Button
                key={action.id}
                onClick={() => handleAction(action.action)}
                className={`px-6 py-2 rounded-xl font-bold transition-all active:scale-95 ${action.action === 'startSimulation' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20' :
                    action.action === 'togglePause' ? 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-900/20' :
                      'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
              >
                {action.label}
              </Button>
            ))}

            {/* Fallback buttons if none in DSL */}
            {(!dsl.controls?.actions || dsl.controls.actions.length === 0) && (
              <>
                <Button onClick={handlePlay} className="bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl px-6">Play</Button>
                <Button onClick={handlePause} className="bg-amber-600 hover:bg-amber-500 font-bold rounded-xl px-6 text-white">Pause</Button>
                <Button onClick={handleReset} className="bg-slate-800 hover:bg-slate-700 font-bold rounded-xl px-6">Reset</Button>
              </>
            )}
          </div>
        </div>

        {/* Interaction Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800/50 h-full">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 size={18} className="text-blue-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Control Panel</h3>
            </div>

            <div className="space-y-8">
              {dsl.controls?.parameters?.length > 0 ? dsl.controls.parameters.map((param) => (
                <div key={param.id} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <Label className="text-xs font-semibold text-slate-300">{param.label}</Label>
                      {param.symbol && <span className="text-[10px] text-slate-500 italic">Symbol: {param.symbol}</span>}
                    </div>
                    {param.type === 'slider' && (
                      <div className="px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">
                        <span className="text-[11px] font-mono font-bold text-blue-400">
                          {Number(controlValues[param.id] || 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {param.type === 'slider' && (
                    <div className="px-1">
                      <Slider
                        value={[controlValues[param.id] ?? param.min ?? 0]}
                        min={param.min ?? 0}
                        max={param.max ?? 100}
                        step={param.step || 0.1}
                        onValueChange={(vals) => handleControlUpdate(param.id, param.bind, vals[0])}
                        className="cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-[9px] text-slate-600 font-mono">{param.min}</span>
                        <span className="text-[9px] text-slate-600 font-mono">{param.max}</span>
                      </div>
                    </div>
                  )}

                  {param.type === 'toggle' && (
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-white/5">
                      <span className="text-[11px] text-slate-400">{controlValues[param.id] ? 'Enabled' : 'Disabled'}</span>
                      <Switch
                        checked={!!controlValues[param.id]}
                        onCheckedChange={(val) => handleControlUpdate(param.id, param.bind, val)}
                      />
                    </div>
                  )}
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
                  <Info size={24} className="text-slate-600" />
                  <p className="text-xs text-slate-500 italic max-w-[150px]">No interactive parameters defined in this simulation DSL.</p>
                </div>
              )}
            </div>

            {/* Observables Section */}
            {dsl.observables?.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Live Observables</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {dsl.observables.map(obs => {
                    // Try to find live value
                    let liveValue = 0;
                    if (liveData?.values) {
                      // Normalize source path to match our liveState keys
                      const sourceKey = obs.source.replace(/\[(\d+)\]/, (match, p1) => {
                        const index = parseInt(p1);
                        return `.${dsl.objects[index]?.id}`;
                      });
                      liveValue = liveData.values[sourceKey] || liveData.values[obs.source] || 0;
                    }

                    return (
                      <div key={obs.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                        <div className="text-[10px] text-slate-500 font-medium">{obs.label}</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-white">{Number(liveValue).toFixed(2)}</span>
                          <span className="text-[9px] text-slate-500">{obs.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conceptual Insights Section */}
            {(dsl.knowledge?.relevant_formulas?.length > 0 || dsl.knowledge?.learningObjectives?.length > 0) && (
              <div className="mt-8 pt-8 border-t border-slate-800 space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={18} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Conceptual Insights</h3>
                </div>

                {/* Formulas Card */}
                {dsl.knowledge?.relevant_formulas?.length > 0 && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Mathematical Model</span>
                    <div className="space-y-2">
                      {dsl.knowledge.relevant_formulas.map((f, i) => (
                        <div key={i} className="font-mono text-sm text-blue-100 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Objectives */}
                {dsl.knowledge?.learningObjectives?.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Observation Guide</span>
                    <ul className="space-y-3">
                      {dsl.knowledge.learningObjectives.map((obj, i) => (
                        <li key={i} className="flex gap-3 text-xs text-slate-400 leading-relaxed group">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40 mt-1.5 shrink-0 group-hover:bg-amber-500 transition-colors" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Concepts Tags */}
                {dsl.knowledge?.related_concepts?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dsl.knowledge.related_concepts.map((concept, i) => (
                      <span key={i} className="text-[9px] font-bold uppercase tracking-tighter px-2 py-1 bg-slate-800 text-slate-500 rounded-md border border-slate-700/50">
                        {concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DSLRuntime;
