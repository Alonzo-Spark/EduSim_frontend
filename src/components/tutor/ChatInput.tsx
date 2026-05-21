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
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [text]);

  useEffect(() => {
    if (focus && taRef.current) {
      setTimeout(() => taRef.current?.focus(), 80);
    }
  }, [focus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !disabled) {
        onSend(text.trim());
        setText("");
      }
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end pointer-events-none pb-6">
      <div className="w-full max-w-[900px] px-4 pointer-events-auto">
        <div className="relative flex flex-col rounded-[24px] border border-white/20 bg-background/70 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-3xl overflow-hidden p-2">
          
          <div className="flex items-end gap-2 px-2">
            <button
              type="button"
              aria-label="Attach file"
              className="mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </button>

            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the tutor..."
              className="min-h-[44px] w-full resize-none border-0 bg-transparent px-2 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 custom-scrollbar"
              rows={1}
            />

            <div className="mb-1 flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                aria-label="Voice input"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <Mic className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => {
                  if (text.trim() && !disabled) {
                    onSend(text.trim());
                    setText("");
                  }
                }}
                disabled={disabled || !text.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4.5 w-4.5 ml-1" />
              </button>
            </div>
          </div>

          <div className="text-center pb-1">
            <span className="text-[11px] text-muted-foreground/60 font-medium">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
