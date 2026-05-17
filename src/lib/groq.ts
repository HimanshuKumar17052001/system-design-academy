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

const MODEL = "llama-3.1-70b-instruct";

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
        model: MODEL,
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

export async function explainConcept(
  concept: string,
  context?: string
): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert System Design tutor. Explain the following concept simply and clearly. Use analogies, examples, and keep it concise (2-4 sentences). ${context ? `Context: ${context}` : ""}`,
          },
          {
            role: "user",
            content: concept,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to explain concept");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Sorry, I couldn't explain this concept.";
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
}

export async function generateQuiz(
  topic: string,
  numQuestions: number = 5
): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert System Design tutor. Generate ${numQuestions} multiple choice quiz questions about the topic: "${topic}". 

Format each question as:
Q#. Question text
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Answer: [letter]

Make questions practical and interview-focused. Include 1-2 sentence explanation for correct answer.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate quiz");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Sorry, I couldn't generate a quiz.";
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}