const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are an expert System Design tutor. Your role is to help users learn system design concepts clearly and effectively.

Guidelines:
- Explain complex concepts simply, using analogies where helpful
- Use diagrams ASCII art when helpful to visualize architectures
- Ask follow-up questions to check understanding
- Provide practical, real-world examples
- When showing code, use proper formatting
- Stay focused on system design topics
- If user asks about unrelated topics, politely redirect

Current topic context: System Design & Architecture (HTTP, DNS, Databases, Load Balancing, Caching, Microservices, Scalability, etc.)`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getAIResponse(
  messages: ChatMessage[],
  customContext?: string
): Promise<string> {
  try {
    const contextPrompt = customContext
      ? `\n\nAdditional context about the current module:\n${customContext}`
      : "";

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT + contextPrompt,
          },
          ...messages.slice(-10),
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to get AI response");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
}