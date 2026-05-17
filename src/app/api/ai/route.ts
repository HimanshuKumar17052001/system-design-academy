import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL;

export async function POST(request: NextRequest) {
  try {
    if (!MODEL) {
      return NextResponse.json(
        { error: "GROQ_MODEL not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { messages, type } = body;

    if (type === "chat") {
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: messages || [],
        temperature: 0.7,
        max_tokens: 1024,
      });

      return NextResponse.json({
        content: completion.choices[0]?.message?.content || "No response",
      });
    }

    if (type === "explain") {
      const { concept, context } = body;
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert System Design tutor. Explain the following concept simply and clearly. ${context || ""}`,
          },
          { role: "user", content: concept },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return NextResponse.json({
        content: completion.choices[0]?.message?.content || "No response",
      });
    }

    if (type === "quiz") {
      const { topic, numQuestions } = body;
      const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert System Design tutor. Generate ${numQuestions || 5} multiple choice quiz questions about "${topic}". Return ONLY valid JSON array in this exact format - no additional text:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "A",
    "explanation": "Explanation text here"
  }
]`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content || "[]";
      let questions;
      try {
        questions = JSON.parse(content);
      } catch {
        questions = [];
      }

      return NextResponse.json({ questions });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Groq API error:", error);
    return NextResponse.json(
      { error: "Failed to call AI" },
      { status: 500 }
    );
  }
}