# Maestro AI

Maestro AI is a music-learning application with two age-adapted experiences: a parent-managed early-years interface for ages 0–3, and a structured learning workspace for learners aged 4 and above.

## Features

- Local learner profile creation and sign-in on the same browser/device.
- Separate large-touch early-years interface and standard learning workspace.
- Guided music lessons for listening, rhythm, piano, voice, guitar and creativity.
- Interactive Web Audio piano keyboard and audible metronome.
- AI music tutor powered by GPT-OSS 20B (openai/gpt-oss-20b) through Hugging Face Inference Providers.
- Local progress history for completed lessons and notes explored.
- Responsive desktop and mobile navigation.

## Important account limitation

The current profile system uses browser localStorage as a temporary, device-local profile. It is not secure server-side authentication, does not verify email, and does not sync across browsers or devices. Do not store sensitive information. A production release should add a real authentication provider and database-backed learner profiles, guardian consent and account recovery.

## AI tutor setup

1. Create a fine-grained Hugging Face token at https://huggingface.co/settings/tokens.
2. Enable **Make calls to Inference Providers**.
3. Add it to Vercel as the encrypted Production environment variable `HF_TOKEN`.
4. Redeploy after changing the environment variable.

The server calls the Hugging Face OpenAI-compatible chat-completions endpoint. The token is never sent to the browser. Chat is text-only: the tutor does not claim to listen to microphone recordings.

Hugging Face Inference Providers may use account credits and/or usage-based billing.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `HF_TOKEN` for local AI chat.
