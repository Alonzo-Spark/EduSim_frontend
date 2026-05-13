import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { simulationSynthesisService } from "@/services/simulationSynthesisService";
import DSLRuntime from "@/runtime/DSLRuntime";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Code, Play, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dsl-test")({
  component: DSLTestPage,
});

function DSLTestPage() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("simulation");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await simulationSynthesisService.generateRaw(prompt);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate simulation. Please check if the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              DSL V2.0 Testing Lab
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Directly interface with the AI Simulation Architect
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Backend Connected</span>
          </div>
        </div>

        {/* Search/Prompt Bar */}
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md shadow-2xl overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleGenerate} className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe a physics simulation (e.g. 'A double pendulum with low gravity')..."
                  className="h-14 bg-slate-950 border-slate-800 focus:border-blue-500/50 focus:ring-blue-500/20 text-lg rounded-2xl pl-6 pr-12 transition-all text-white"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <Send size={20} />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !prompt.trim()}
                className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  "Generate"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 animate-in fade-in slide-in-from-top-4">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Content Area */}
        <div className="min-h-[600px] rounded-3xl border border-white/5 bg-slate-900/20 p-2 overflow-hidden">
          {!result && !isLoading && (
            <div className="flex flex-col items-center justify-center h-[500px] space-y-6 text-center">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                <Play size={40} className="text-blue-400 ml-1" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-200">No Simulation Active</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  Enter a prompt above to generate a new physics DSL and visualize it in real-time.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-[500px] space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-b-indigo-500 rounded-full animate-spin-slow" />
                </div>
              </div>
              <div className="space-y-3 text-center">
                <h3 className="text-lg font-bold text-white animate-pulse">Synthesizing Simulation...</h3>
                <div className="flex gap-1 justify-center">
                   {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {result && !isLoading && (
            <div className="space-y-6 animate-in fade-in duration-700">
               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-center mb-6">
                  <TabsList className="bg-slate-900/80 p-1 border border-slate-800 rounded-2xl h-12">
                    <TabsTrigger value="simulation" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                      <Play size={16} className="mr-2" /> Simulation
                    </TabsTrigger>
                    <TabsTrigger value="dsl" className="rounded-xl px-6 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                      <Code size={16} className="mr-2" /> Raw DSL
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="simulation" className="mt-0 outline-none">
                  <DSLRuntime dsl={result.dsl} />
                </TabsContent>

                <TabsContent value="dsl" className="mt-0 outline-none">
                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 font-mono text-xs overflow-auto max-h-[700px] shadow-inner">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                      <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">DSL Payload</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-slate-400 hover:text-white"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                      >
                        Copy JSON
                      </Button>
                    </div>
                    <pre className="text-blue-400/90 leading-relaxed">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
