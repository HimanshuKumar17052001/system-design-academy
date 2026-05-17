import { Groq } from "groq-sdk";

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (groqClient) return groqClient;
  
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    console.error("GROQ_API_KEY is not set. Please add it in Vercel Environment Variables.");
    throw new Error("GROQ_API_KEY environment variable is not set. Please configure it in Vercel.");
  }
  
  groqClient = new Groq({ apiKey: apiKey.trim() });
  return groqClient;
}

function getModel(): string {
  const model = process.env.GROQ_MODEL;
  if (!model || model.trim() === "") {
    console.error("GROQ_MODEL is not set. Please add it in Vercel Environment Variables.");
    throw new Error("GROQ_MODEL environment variable is not set. Please configure it in Vercel.");
  }
  const trimmedModel = model.trim();
  if (!trimmedModel) {
    throw new Error("GROQ_MODEL environment variable is empty");
  }
  return trimmedModel;
}

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

export async function getAIResponse(
  messages: ChatMessage[],
  customContext?: string
): Promise<string> {
  try {
    const contextPrompt = customContext
      ? `\n\nAdditional context about the current module:\n${customContext}`
      : "";

    const chatMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT + contextPrompt },
      ...messages.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const completion = await getGroqClient().chat.completions.create({
      model: getModel(),
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
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
    const completion = await getGroqClient().chat.completions.create({
      model: getModel(),
      messages: [
        {
          role: "system",
          content: `You are an expert System Design tutor. Explain the following concept simply and clearly. Use analogies, examples, and keep it concise (2-4 sentences). ${context ? `Context: ${context}` : ""}`,
        },
        { role: "user", content: concept },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || "Sorry, I couldn't explain this concept.";
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
    const completion = await getGroqClient().chat.completions.create({
      model: getModel(),
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
    });

    return completion.choices[0]?.message?.content || "Sorry, I couldn't generate a quiz.";
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}