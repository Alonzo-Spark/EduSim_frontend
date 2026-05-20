import React from "react";

export function SimulationErrorOverlay({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <div className="max-w-xl bg-slate-900 border border-red-600 rounded-2xl p-6 text-left text-white">
        <h3 className="text-lg font-bold text-red-400 mb-2">Simulation Error</h3>
        <pre className="text-[12px] whitespace-pre-wrap text-slate-200 mb-4">{error}</pre>
        <div className="flex gap-2">
          <button onClick={onRetry} className="px-4 py-2 rounded bg-red-500 hover:bg-red-400">Retry</button>
        </div>
      </div>
    </div>
  );
}

export default SimulationErrorOverlay;
