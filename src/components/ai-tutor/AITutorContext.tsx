"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AITutorContextType {
  isOpen: boolean;
  initialMessage: string | null;
  openTutor: (message?: string) => void;
  closeTutor: () => void;
}

const AITutorContext = createContext<AITutorContextType | undefined>(undefined);

export function AITutorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  const openTutor = useCallback((message?: string) => {
    setInitialMessage(message || null);
    setIsOpen(true);
  }, []);

  const closeTutor = useCallback(() => {
    setIsOpen(false);
    setInitialMessage(null);
  }, []);

  return (
    <AITutorContext.Provider value={{ isOpen, initialMessage, openTutor, closeTutor }}>
      {children}
    </AITutorContext.Provider>
  );
}

export function useAITutor() {
  const context = useContext(AITutorContext);
  if (!context) {
    throw new Error("useAITutor must be used within AITutorProvider");
  }
  return context;
}