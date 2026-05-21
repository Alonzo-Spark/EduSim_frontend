import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  focus?: boolean;
}

export function ChatInput({ onSend, disabled, focus = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [text]);

  useEffect(() => {
    if (focus && taRef.current) {
      // focus after small delay so the element is mounted and not blocked
      setTimeout(() => taRef.current?.focus(), 80);
    }
  }, [focus]);

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
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-auto">
      <div className="mx-auto w-full max-w-[950px] px-4 sm:px-6 flex items-end">
        <div className="relative flex items-end gap-4 rounded-[1.5rem] border border-white/8 bg-white/6 px-5 py-3 shadow-lg backdrop-blur-md w-full" style={{ boxShadow: '0 10px 40px rgba(139,92,246,0.18)' }}>
          <button
            type="button"
            aria-label="Attach file"
            className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/4 text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </button>
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the tutor... (Enter to send, Shift+Enter for newline)"
            className="min-h-[48px] max-h-44 flex-1 resize-none border-0 bg-transparent px-1 py-3 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
          />
          <div className="mb-1 flex items-center gap-3">
            <button
              type="button"
              aria-label="Voice input"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/4 text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
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
              disabled={disabled || !text.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-[0_10px_30px_rgba(139,92,246,0.24)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
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
