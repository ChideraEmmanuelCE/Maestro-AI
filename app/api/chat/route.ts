import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are Maestro, a warm, knowledgeable, encouraging AI music tutor inside Maestro AI.
Your job is to help learners understand music and improve their practical skills.
Teach piano, guitar, voice, rhythm, music theory, ear training, songwriting, practice habits and music appreciation.
Explain concepts in clear, accessible steps. Adapt to the learner's level. Give short exercises and examples when useful.
When teaching technique, explain what to do, what to listen for, and common mistakes. Encourage healthy vocal and physical technique; never recommend pushing through pain.
Do not claim you can hear or analyse a recording unless audio has actually been provided to you. This chat currently accepts text only.
If a question is unrelated to music, answer briefly and kindly steer the learner back to music.
Never invent facts about songs, artists, chords, or theory. If uncertain, say so.
Be concise, friendly, practical, and specific. Use plain language rather than overwhelming beginners.`;

export async function POST(request: NextRequest) {
  const token = process.env.HF_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Maestro AI is almost ready. The Hugging Face model token has not been added to the server yet." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 16) {
      return NextResponse.json({ error: "Please send a valid chat message." }, { status: 400 });
    }

    const messages = body.messages.map((message: { role?: string; content?: string }) => {
      if (!["user", "assistant"].includes(message.role || "") || typeof message.content !== "string") {
        throw new Error("Invalid message format.");
      }
      return { role: message.role, content: message.content.slice(0, 2500) };
    });

    const latest = messages[messages.length - 1];
    if (latest.role !== "user" || !latest.content.trim()) {
      return NextResponse.json({ error: "Your latest message must be a question or prompt." }, { status: 400 });
    }

    const upstream = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct-1M:fastest",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 550,
        temperature: 0.65,
        stream: false,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("Hugging Face inference error:", upstream.status, detail.slice(0, 500));
      return NextResponse.json(
        { error: upstream.status === 401 || upstream.status === 403
          ? "The AI service token needs the Inference Providers permission."
          : "Maestro couldn't reach its AI model just now. Please try again in a moment." },
        { status: 502 }
      );
    }

    const result = await upstream.json();
    const reply = result.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return NextResponse.json({ error: "Maestro returned an empty answer. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ reply: reply.trim() });
  } catch (error) {
    console.error("Maestro chat route error:", error);
    return NextResponse.json({ error: "Something went wrong while talking to Maestro. Please try again." }, { status: 500 });
  }
}
