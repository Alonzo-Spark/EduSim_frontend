import React from "react";
import { BookOpen } from "lucide-react";

interface Props {
  onToggle: () => void;
  open: boolean;
}

export function VerticalResourcesToggle({ onToggle, open }: Props) {
  return (
    <div className="fixed right-0 top-1/2 z-40 -translate-y-1/2 pr-1 sm:pr-0">
      <button
        onClick={onToggle}
        className="group flex h-40 w-11 items-center justify-center rounded-l-3xl border border-white/10 bg-gradient-to-b from-indigo-600/95 via-violet-600/95 to-purple-600/95 text-white shadow-[0_0_30px_rgba(139,92,246,0.28)] backdrop-blur-xl transition-transform duration-300 hover:translate-x-0 translate-x-1"
        aria-expanded={open}
      >
        <div className="flex flex-col items-center -rotate-90 tracking-[0.28em] transition-transform group-hover:scale-105">
          <BookOpen className="w-4 h-4 mb-2" />
          <span className="text-[10px] font-bold uppercase">Resources</span>
        </div>
      </button>
    </div>
  );
}

export default VerticalResourcesToggle;
