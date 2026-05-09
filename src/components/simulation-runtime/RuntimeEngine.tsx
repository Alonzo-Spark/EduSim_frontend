import React from "react";
import { DSLRenderer } from "./DSLRenderer";
import { HtmlRenderer } from "./HtmlRenderer";

interface RuntimeEngineProps {
  dsl?: any;
  html?: string;
  formula?: string;
  explanation?: string;
  title?: string;
  onLoad?: () => void;
}

export const RuntimeEngine: React.FC<RuntimeEngineProps> = ({
  dsl,
  html,
  formula,
  explanation,
  title,
  onLoad,
}) => {
  if (dsl) {
    return (
      <DSLRenderer
        dsl={dsl}
        formula={formula}
        explanation={explanation}
        title={title}
      />
    );
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
    <div className="w-full h-full min-h-[520px] rounded-2xl flex items-center justify-center bg-slate-900/20 border border-white/5 text-slate-500 italic">
      No simulation data to render.
    </div>
  );
};
