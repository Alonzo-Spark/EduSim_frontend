import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DynamicSimulationRenderer } from "./DynamicSimulationRenderer";
import { useAgentSimulation } from "@/hooks/useAgentSimulation";
import { detectSimulationIntent, humanizeIntent } from "@/lib/simulationIntent";
import { Sparkles, Brain, BookOpen, WandSparkles } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Show projectile motion with adjustable launch angle and velocity",
  "Demonstrate Newton's second law with mass and force sliders",
  "Create a pendulum oscillation experiment on the moon",
  "Simulate momentum conservation in a two-body collision",
  "Model a planet orbiting a star using gravity",
  "Demonstrate a block sliding down an inclined plane",
];

export function SimulationStudio() {
  const [prompt, setPrompt] = useState("");
  const [previewPrompt, setPreviewPrompt] = useState("");
  const { simulation, loading, streaming, error, progress, progressPercentage, generateStream, clearError } = useAgentSimulation();

  const inferredIntent = useMemo(() => detectSimulationIntent(prompt || previewPrompt), [prompt, previewPrompt]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setPreviewPrompt(prompt.trim());
    await generateStream(prompt.trim(), "medium");
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_35%),linear-gradient(135deg,_rgba(2,6,23,0.96),_rgba(15,23,42,0.88))] p-6 shadow-2xl shadow-cyan-950/20">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">AI Simulation Generator</p>
                <h1 className="text-2xl font-semibold text-white">Programmable physics universe</h1>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Type a physics concept naturally. The agent detects the intent, retrieves textbook context, builds a reusable DSL, and mounts a live runtime with real motion.
            </p>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="mb-2 flex items-center gap-2 text-cyan-300"><Brain className="h-4 w-4" />Detected intent</div>
              <div className="font-semibold text-white">{simulation?.dsl?.simulation?.replace(/_/g, " ") ?? humanizeIntent(inferredIntent)}</div>
              <div className="mt-1 text-xs text-slate-400">{simulation?.formula ?? "F = ma"}</div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur">
            <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Describe the simulation</label>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. Show a projectile launched at 45 degrees with adjustable gravity and velocity"
              className="min-h-32 border-white/10 bg-slate-900/60 text-white placeholder:text-slate-500"
              disabled={loading || streaming}
            />

            {error ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                <div className="mb-2 flex items-center gap-2"><BookOpen className="h-4 w-4" />Generation error</div>
                <div>{error}</div>
                <button onClick={clearError} className="mt-3 text-xs text-red-100 underline underline-offset-2">Dismiss</button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || loading || streaming}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
              >
                {loading || streaming ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                {loading || streaming ? "Generating live simulation" : "Generate simulation"}
              </Button>

              <div className="text-xs text-slate-400">
                {progress?.stage ? `${progress.stage} · ${progressPercentage}%` : "Ready to generate"}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {EXAMPLE_PROMPTS.slice(0, 4).map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-cyan-300/30 hover:bg-cyan-500/10"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <DynamicSimulationRenderer dsl={simulation?.dsl ?? null} />
      </motion.div>
    </div>
  );
}
