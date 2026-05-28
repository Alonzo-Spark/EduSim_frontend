import React, { useState, useRef, useEffect } from "react";
import { Send, Mic } from "lucide-react";

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
    <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center justify-end pointer-events-none pb-3 sm:pb-6">
      <div className="w-full max-w-[1600px] px-2 sm:px-4 md:px-6 pointer-events-auto">
        <div className="relative flex flex-col rounded-[22px] sm:rounded-[26px] border border-border bg-card shadow-[0_4px_20px_rgba(112,181,255,0.06)] backdrop-blur-3xl overflow-hidden p-1.5 sm:p-2 transition-all hover:border-primary/45">
          
          <div className="flex items-end gap-1.5 sm:gap-2 px-1 sm:px-2">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the tutor..."
              className="min-h-[40px] sm:min-h-[44px] w-full resize-none border-0 bg-transparent px-1.5 py-2.5 text-sm sm:text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 custom-scrollbar"
              rows={1}
            />

            <div className="mb-1 flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                aria-label="Voice input"
                className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground hover:scale-105 active:scale-95"
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
                className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(112,181,255,0.3)] transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none hover:bg-primary/90"
              >
                <Send className="h-4 w-4 sm:h-4.5 sm:w-4.5 ml-0.5 sm:ml-1" />
              </button>
            </div>
          </div>

          <div className="text-center pb-0.5">
            <span className="text-[10px] sm:text-[11px] text-muted-foreground/45 font-medium">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
