import { Send } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (messageText: string) => void;
  isStreaming: boolean;
  topicFilter: string;
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  isStreaming,
  topicFilter,
}: ChatInputProps) {
  // Suggestion actions list
  const suggestions = [
    { label: "🚀 Sim", query: "Give me an interactive projectile motion physics simulation to slide parameters!" },
    { label: "📝 Quiz", query: "Can you generate a quick practice quiz about class 9 projectile motion?" },
    { label: "📐 Derivation", query: "Can you derive horizontal range formula step-by-step?" },
    { label: "💡 Example", query: "Show me a solved real-life numerical problem example." },
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSubmit(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim() || isStreaming) return;
      onSubmit(input);
    }
  };

  return (
    <div className="shrink-0 flex flex-col">
      {/* Quick Suggestion Chips */}
      <div className="px-4 py-2 border-t border-border/40 flex gap-2 overflow-x-auto scrollbar-none bg-card/5 select-none">
        {suggestions.map((act, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSubmit(act.query)}
            className="shrink-0 rounded-full border border-border-glow bg-white/5 hover:bg-indigo-glow/10 hover:border-indigo-glow px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            {act.label}
          </button>
        ))}
      </div>

      {/* Form Input Panel */}
      <form onSubmit={handleFormSubmit} className="border-t border-border p-3.5 flex items-end gap-2 bg-card/10">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask your textbook doubt, request equations, or test yourself..."
          className="flex-1 resize-none rounded-xl border border-border bg-card/70 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo-glow transition max-h-40 focus:ring-1 focus:ring-indigo-glow/50 font-sans"
        />

        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="grid place-items-center h-[46px] w-[46px] rounded-xl bg-gradient-to-r from-indigo-glow to-purple-glow text-white shadow-glow-indigo hover:opacity-95 transition disabled:opacity-40 disabled:shadow-none shrink-0 cursor-pointer"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}
