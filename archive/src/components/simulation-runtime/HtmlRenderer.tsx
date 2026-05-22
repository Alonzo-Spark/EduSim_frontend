import React from "react";

interface HtmlRendererProps {
  html: string;
  title?: string;
  onLoad?: () => void;
}

export const HtmlRenderer: React.FC<HtmlRendererProps> = ({
  html,
  title = "Simulation",
  onLoad,
}) => {
  return (
    <div className="w-full h-full min-h-[520px] rounded-2xl overflow-hidden bg-black/40 border border-white/5 shadow-2xl">
      <iframe
        title={title}
        sandbox="allow-scripts allow-forms"
        srcDoc={html}
        className="w-full h-full min-h-[520px] border-0"
        onLoad={onLoad}
      />
    </div>
  );
};
