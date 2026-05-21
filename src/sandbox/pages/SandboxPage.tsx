import React from "react";
import SandboxCanvas from "../components/SandboxCanvas";

export function SandboxPage() {
  return (
    <div className="w-full h-[calc(100vh-80px)] mt-20 relative bg-slate-950 overflow-hidden rounded-tl-3xl border-t border-l border-border/30">
      <SandboxCanvas />
    </div>
  );
}

export default SandboxPage;
