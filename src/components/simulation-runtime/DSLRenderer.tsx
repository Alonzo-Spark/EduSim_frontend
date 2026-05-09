import React from "react";
import { Box, GitBranch, BarChart2 } from "lucide-react";

interface DSLRendererProps {
  dsl: any;
  formula?: string;
  explanation?: string;
  title?: string;
}

export const DSLRenderer: React.FC<DSLRendererProps> = ({
  dsl,
  formula,
  explanation,
  title = "Simulation",
}) => {
  return (
    <div className="w-full h-full min-h-[520px] rounded-2xl overflow-hidden bg-slate-900/40 border border-white/5 shadow-2xl p-8 flex flex-col items-center justify-center text-center">
      <div className="max-w-md space-y-4">
        <h3 className="text-xl font-bold text-gradient">{title}</h3>
        {formula && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl font-mono text-indigo-300">
            {formula}
          </div>
        )}
        {explanation && (
          <p className="text-sm text-slate-400 leading-relaxed">
            {explanation}
          </p>
        )}
        
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="flex flex-col items-center gap-1">
            <Box className="w-5 h-5 text-sky-400" />
            <span className="text-[10px] text-slate-500 uppercase">Entities</span>
            <span className="text-sm font-bold text-slate-200">{dsl.entities?.length || 0}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] text-slate-500 uppercase">Interactions</span>
            <span className="text-sm font-bold text-slate-200">{dsl.interactions?.length || 0}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] text-slate-500 uppercase">Graphs</span>
            <span className="text-sm font-bold text-slate-200">{dsl.visualizations?.length || 0}</span>
          </div>
        </div>

        <div className="mt-8 p-6 border border-dashed border-slate-700 rounded-2xl bg-slate-800/30 text-left">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-bold">DSL Payload Ready</p>
          <pre className="text-[10px] text-emerald-400/80 overflow-auto max-h-40">
            {JSON.stringify(dsl, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
