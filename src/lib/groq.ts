export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const API_URL = "/api/ai";

export async function getAIResponse(
  messages: ChatMessage[],
  customContext?: string
): Promise<string> {
  try {
    const contextPrompt = customContext
      ? `\n\nContext: ${customContext}`
      : "";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "chat",
        messages: [
          {
            role: "system",
            content:
              "You are an expert System Design tutor. Explain concepts clearly with examples." +
              contextPrompt,
          },
          ...messages.slice(-10),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get AI response");
    }

    const data = await response.json();
    return data.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("AI API error:", error);
    throw error;
  }
}

export async function explainConcept(
  concept: string,
  context?: string
): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "explain",
        concept,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to explain concept");
    }

    const data = await response.json();
    return data.content || "Sorry, I couldn't explain this concept.";
  } catch (error) {
    console.error("Explain API error:", error);
    throw error;
  }
}

export interface AIQuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export async function generateQuiz(
  topic: string,
  numQuestions: number = 5
): Promise<AIQuizQuestion[]> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "quiz",
        topic,
        numQuestions,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate quiz");
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error("Quiz API error:", error);
    throw error;
  }
}