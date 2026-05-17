"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getAIResponse, type ChatMessage } from "@/lib/groq";
import { useAITutor } from "./AITutorContext";

interface AITutorProps {
  moduleTitle?: string;
  moduleContent?: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm your System Design tutor. Ask me anything about system design concepts.",
};

export function AITutor({ moduleTitle, moduleContent }: AITutorProps) {
  const { isOpen: contextOpen, initialMessage, closeTutor, openTutor } = useAITutor();
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
    if (initialMessage && contextOpen) {
      handleSendWithMessage(initialMessage);
    }
  }, [initialMessage, contextOpen]);

  useEffect(() => {
    if (contextOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [contextOpen]);

  const handleSendWithMessage = async (msg: string) => {
    if (isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const context = moduleTitle
        ? `User is currently learning: ${moduleTitle}. ${moduleContent?.slice(0, 500)}`
        : undefined;
      const response = await getAIResponse(messages, context);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await handleSendWithMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Minimal Floating Button */}
      <button
        onClick={() => openTutor()}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border bg-background px-4 py-2.5 shadow-sm transition-all hover:shadow-md",
          contextOpen && "hidden"
        )}
      >
        <MessageCircle className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">AI Help</span>
      </button>

      {/* Chat Window */}
      {contextOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col rounded-xl border bg-background shadow-lg transition-all duration-200",
            isMinimized ? "h-14 w-64" : "h-[450px] w-[360px]"
          )}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between rounded-t-xl border-b px-3 py-2.5 cursor-pointer hover:bg-muted/50"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                <Bot className="size-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">AI Tutor</span>
            </div>
            <button onClick={closeTutor} className="text-muted-foreground hover:text-foreground">
              {isMinimized ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <X className="size-4" />
              )}
            </button>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        msg.role === "assistant" ? "bg-muted" : "bg-primary/10"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="size-3 text-muted-foreground" />
                      ) : (
                        <User className="size-3 text-muted-foreground" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                      <Bot className="size-3 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1 bg-muted rounded-lg px-2.5 py-1.5">
                      <Loader2 className="size-3 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-2">
                <div className="flex items-end gap-1 rounded-lg border bg-background focus-within:ring-1 focus-within:ring-muted-foreground/20">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask..."
                    className="max-h-24 min-h-[32px] flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="shrink-0 h-7 w-7"
                  >
                    <Send className="size-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}