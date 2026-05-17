"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAIResponse, type ChatMessage } from "@/lib/groq";

interface AITutorProps {
  moduleTitle?: string;
  moduleContent?: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm your System Design tutor. Ask me anything about system design, architecture patterns, databases, scaling, or any concept you're learning. I can help explain topics, answer questions, or discuss real-world systems.",
};

export function AITutor({ moduleTitle, moduleContent }: AITutorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const context = moduleTitle
        ? `User is currently learning: ${moduleTitle}. ${moduleContent?.slice(0, 500)}`
        : undefined;

      const response = await getAIResponse(messages, context);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/25",
          isOpen && "hidden"
        )}
      >
        <Sparkles className="size-5 animate-pulse" />
        <span className="font-medium">AI Tutor</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border bg-background shadow-2xl transition-all duration-300",
            isMinimized ? "h-16 w-64" : "h-[500px] w-[380px] md:w-[420px]"
          )}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between rounded-t-2xl border-b bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Tutor</h3>
                <p className="text-[10px] text-white/70">System Design Expert</p>
              </div>
            </div>
            <button className="text-white/80 hover:text-white">
              {isMinimized ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <X className="size-5" />
              )}
            </button>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-indigo-500 to-purple-500"
                          : "bg-muted"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="size-4 text-white" />
                      ) : (
                        <User className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-muted rounded-bl-md whitespace-pre-wrap"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                      <Bot className="size-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1 bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex items-end gap-2 rounded-xl border bg-background focus-within:ring-2 focus-within:ring-indigo-500/50">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about system design..."
                    className="max-h-32 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="shrink-0 h-9 w-9 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                <p className="mt-2 text-[10px] text-center text-muted-foreground">
                  AI can make mistakes. Verify important information.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}