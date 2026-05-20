import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        onSend(text.trim());
        setText("");
      }
    }
  };

  return (
    <div className="fixed left-0 right-0 bottom-8 z-50 flex justify-center pointer-events-none">
      <div className="mx-auto w-full max-w-[64rem] px-4 sm:px-6 lg:px-8 flex items-end pointer-events-auto">
        <div className="relative flex items-end gap-4 rounded-[2rem] border border-violet-400/25 bg-black/20 px-5 py-2 shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_-1px_36px_rgba(0,0,0,0.32)] backdrop-blur-2xl w-full">
          <button
            type="button"
            aria-label="Attach file"
            className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </button>
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the tutor... (Enter to send, Shift+Enter for newline)"
            className="min-h-[48px] max-h-44 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
          />
          <div className="mb-1 flex items-center gap-3">
            <button
              type="button"
              aria-label="Voice input"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-white/[0.03] text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => {
                if (text.trim()) {
                  onSend(text.trim());
                  setText("");
                }
              }}
              disabled={disabled}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
