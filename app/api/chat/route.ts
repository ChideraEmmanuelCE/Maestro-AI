import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are Maestro, a warm, knowledgeable, encouraging AI music tutor inside Maestro AI.
Your job is to help learners understand music and improve their practical skills.
Teach piano, guitar, voice, rhythm, music theory, ear training, songwriting, practice habits and music appreciation.
Explain concepts in clear, accessible steps. Adapt to the learner's level. Give short exercises and examples when useful.
When teaching technique, explain what to do, what to listen for, and common mistakes. Encourage healthy vocal and physical technique; never recommend pushing through pain.
When a learner asks to hear a concept, create music, open the practice studio, start the metronome or stop playback, use the matching music tool instead of merely describing the action. You can explain what you did after the tool call. Do not claim you can hear or analyse a recording unless audio has actually been provided to you. This chat currently accepts text only.
If a question is unrelated to music, answer briefly and kindly steer the learner back to music.
Never invent facts about songs, artists, chords, or theory. If uncertain, say so.
Be concise, friendly, practical, and specific. Use plain language rather than overwhelming beginners.`;

const MUSIC_TOOLS = [
  { type:"function", function:{ name:"play_music_example", description:"Play a short audible demonstration of a music concept for the learner.", parameters:{type:"object",properties:{kind:{type:"string",enum:["scale","chord","rhythm","interval","progression","melody"]},rootMidi:{type:"integer",minimum:36,maximum:84},bpm:{type:"integer",minimum:40,maximum:220}},required:["kind","rootMidi","bpm"],additionalProperties:false} } },
  { type:"function", function:{ name:"generate_composition", description:"Create and immediately play an original four-bar procedural music sketch based on the learner's prompt.", parameters:{type:"object",properties:{prompt:{type:"string",minLength:3,maxLength:300},bpm:{type:"integer",minimum:40,maximum:220}},required:["prompt","bpm"],additionalProperties:false} } },
  { type:"function", function:{ name:"open_practice_studio", description:"Open the learner's instrument and practice studio.", parameters:{type:"object",properties:{},additionalProperties:false} } },
  { type:"function", function:{ name:"start_metronome", description:"Open practice studio and start the metronome at a chosen tempo.", parameters:{type:"object",properties:{bpm:{type:"integer",minimum:40,maximum:220}},required:["bpm"],additionalProperties:false} } },
  { type:"function", function:{ name:"stop_music", description:"Stop the currently playing generated arrangement.", parameters:{type:"object",properties:{},additionalProperties:false} } }
];

export async function POST(request: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  const hfToken = process.env.HF_TOKEN;
  const token = groqKey || hfToken;
  if (!token) {
    return NextResponse.json(
      { error: "Maestro AI needs a model API key. Add GROQ_API_KEY in Vercel to enable the free Groq route." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 16) {
      return NextResponse.json({ error: "Please send a valid chat message." }, { status: 400 });
    }

    const invalidMessage = body.messages.some((message: { role?: string; content?: string }) =>
      !["user", "assistant"].includes(message?.role || "") || typeof message?.content !== "string"
    );
    if (invalidMessage) {
      return NextResponse.json({ error: "One of the chat messages is invalid." }, { status: 400 });
    }
    const messages = body.messages.map((message: { role: "user" | "assistant"; content: string }) => ({
      role: message.role,
      content: message.content.slice(0, 2500),
    }));

    const latest = messages[messages.length - 1];
    if (latest.role !== "user" || !latest.content.trim()) {
      return NextResponse.json({ error: "Your latest message must be a question or prompt." }, { status: 400 });
    }

    const learnerAgeBand = ["4-8", "9-16", "adult"].includes(body.learnerAgeBand) ? body.learnerAgeBand : "adult";
    const ageGuidance = learnerAgeBand === "4-8"
      ? "The learner is aged 4–8. Address the child in warm, concrete language and keep activities short, playful and supervised by a parent or guardian."
      : learnerAgeBand === "9-16"
        ? "The learner is aged 9–16. Use a structured teaching style, practical examples and clear skill progression without talking down to the learner."
        : "The learner is an adult. Respect prior knowledge, explain terminology precisely and support independent practice.";

    const endpoint = groqKey ? "https://api.groq.com/openai/v1/chat/completions" : "https://router.huggingface.co/v1/chat/completions";
    const model = groqKey ? "openai/gpt-oss-20b" : "openai/gpt-oss-20b:fastest";
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT + "\n\nLearner guidance: " + ageGuidance }, ...messages],
        max_tokens: 700,
        temperature: 0.55,
        tools: MUSIC_TOOLS,
        tool_choice: "auto",
        parallel_tool_calls: false,
        stream: false,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error(groqKey ? "Groq inference error:" : "Hugging Face inference error:", upstream.status, detail.slice(0, 500));
      const message = upstream.status === 401 || upstream.status === 403
        ? "The AI provider rejected its API key. Check the key and permissions in Vercel."
        : upstream.status === 402
          ? "Hugging Face inference credits are exhausted. Add credits or configure GROQ_API_KEY in Vercel."
          : upstream.status === 429
            ? "Maestro is receiving too many requests. Please wait a moment and try again."
            : "Maestro couldn't reach its AI model just now. Please try again in a moment.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const result = await upstream.json();
    const message = result.choices?.[0]?.message;
    const reply = typeof message?.content === "string" ? message.content.trim() : "";
    const actions = Array.isArray(message?.tool_calls) ? message.tool_calls.slice(0,2).flatMap((call: {function?:{name?:string;arguments?:string}}) => {
      try {
        const name = call.function?.name || "";
        const args = JSON.parse(call.function?.arguments || "{}");
        if (!MUSIC_TOOLS.some(tool => tool.function.name === name)) return [];
        return [{name,arguments:args}];
      } catch { return []; }
    }) : [];
    if (!reply && actions.length === 0) {
      return NextResponse.json({ error: "Maestro returned an empty answer. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ reply: reply || "I’ve prepared that musical action for you.", actions });
  } catch (error) {
    console.error("Maestro chat route error:", error);
    return NextResponse.json({ error: "Something went wrong while talking to Maestro. Please try again." }, { status: 500 });
  }
}
