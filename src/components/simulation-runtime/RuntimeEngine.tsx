import React from "react";
import { DSLRenderer } from "./DSLRenderer";
import { HtmlRenderer } from "./HtmlRenderer";
import { SimulationCanvas } from "./SimulationCanvas";
import { GraphRenderer, DiagramRenderer } from "@/components/simulation/SimulationTemplates";
import { SimulationLoader } from "@/components/simulation/SimulationLoader";
import { SimulationDSL } from "@/runtime/dsl";
import { Layout } from "lucide-react";

interface RuntimeEngineProps {
  dsl?: any;
  html?: string;
  formula?: string;
  explanation?: string;
  title?: string;
  onLoad?: () => void;
  onRuntimeReady?: (runtime: any) => void;
  onSimulationStateChange?: (snapshot: any) => void;
  loading?: boolean;
}

export const RuntimeEngine: React.FC<RuntimeEngineProps> = ({
  dsl,
  html,
  formula,
  explanation,
  title,
  onLoad,
  onRuntimeReady,
  onSimulationStateChange,
  loading,
}) => {
  const runtimeType = typeof dsl?.runtime === "string"
    ? dsl.runtime
    : dsl?.runtime?.engine || dsl?.runtime?.runtime || dsl?.metadata?.runtime || dsl?.config?.runtime;
  const rendererType = dsl?.rendererType || dsl?.metadata?.rendererType || dsl?.config?.rendererType;
  const hasRenderableObjects = Array.isArray(dsl?.objects) && dsl.objects.length > 0;

  if (loading || !dsl || !hasRenderableObjects) {
    return <div className="w-full h-full min-h-[520px] relative overflow-hidden rounded-2xl"><SimulationLoader /></div>;
  }

  const rendererKind = runtimeType || rendererType;

  if (rendererKind === "matter_js" || rendererKind === "matter-js" || rendererKind === "physics") {
    return (
      <SimulationCanvas
        dsl={dsl}
        title={title}
        compact={true}
        onRuntimeReady={onRuntimeReady}
        onSimulationStateChange={onSimulationStateChange}
      />
    );
  }

  if (rendererKind === "graph") {
    return <GraphRenderer dsl={dsl} />;
  }

  if (rendererKind === "diagram") {
    return <DiagramRenderer dsl={dsl} />;
  }

  if (rendererKind === "hybrid") {
    // Future support for mixed scenes
    return <SimulationCanvas dsl={dsl} title={title} compact={true} onRuntimeReady={onRuntimeReady} />;
  }

  if (html) {
    return (
      <HtmlRenderer
        html={html}
        title={title}
        onLoad={onLoad}
      />
    );
  }

  return (
    <div className="w-full h-full min-h-[520px] rounded-2xl flex flex-col items-center justify-center bg-slate-900/20 border border-white/5 text-slate-500 italic">
      <Layout className="w-10 h-10 mb-4 opacity-10" />
      No simulation data to render.
    </div>
  );
};
