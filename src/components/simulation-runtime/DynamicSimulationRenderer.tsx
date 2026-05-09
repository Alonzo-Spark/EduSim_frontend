import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { RuntimeEngine } from "./RuntimeEngine";

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Simulation Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[520px] w-full bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-4" />
          <h3 className="text-lg font-semibold text-rose-200 mb-2">Runtime Crash</h3>
          <p className="text-sm text-rose-300/70 max-w-md">
            The simulation encountered a critical error during execution.
            {this.state.error && <span className="block mt-2 font-mono text-[10px] opacity-50">{this.state.error.message}</span>}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="flex flex-col items-center justify-center min-h-[520px] w-full bg-slate-900/20 backdrop-blur-sm rounded-2xl border border-white/5">
    <div className="relative">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4 opacity-50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
      </div>
    </div>
    <p className="text-sm text-slate-400 font-medium animate-pulse">Initializing engine...</p>
    <div className="mt-8 flex gap-2">
      <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500/50 w-1/2 animate-shimmer" />
      </div>
    </div>
  </div>
);

interface DynamicSimulationRendererProps {
  dsl?: any;
  html?: string;
  formula?: string;
  explanation?: string;
  title?: string;
}

export const DynamicSimulationRenderer: React.FC<DynamicSimulationRendererProps> = ({
  dsl,
  html,
  formula,
  explanation,
  title = "Simulation",
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Natural feeling delay for engine prep
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [dsl, html]);

  return (
    <ErrorBoundary>
      <div className="w-full h-full min-h-[520px] transition-all duration-500 ease-in-out">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <RuntimeEngine
            dsl={dsl}
            html={html}
            formula={formula}
            explanation={explanation}
            title={title}
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};
