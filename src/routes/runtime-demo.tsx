import { createFileRoute } from "@tanstack/react-router";
import RuntimeDemoComponent from "../runtime/RuntimeDemo";
import { sampleDSL } from "../runtime/sampleDSL";

export const Route = createFileRoute("/runtime-demo")({
  component: RuntimeDemo,
});

function RuntimeDemo() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            EduSim V2 Runtime
          </h1>
          <p className="text-slate-400 font-medium italic">Standalone Modular Architecture Demo</p>
        </div>

        {/* The New Modular Runtime Component */}
        <RuntimeDemoComponent dsl={sampleDSL.dsl} />

        {/* DSL Inspector */}
        <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <details className="group">
            <summary className="text-sm font-semibold text-slate-500 cursor-pointer flex items-center justify-between list-none">
              <span>View Active Simulation DSL</span>
              <span className="group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <pre className="mt-4 text-[10px] font-mono text-slate-600 overflow-auto max-h-60 p-4 bg-black/30 rounded-lg border border-white/5">
              {JSON.stringify(sampleDSL, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
