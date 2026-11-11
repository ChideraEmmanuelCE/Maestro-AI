# Maestro AI

Maestro AI is an age-adaptive music-learning studio with structured lessons, audible examples, instrument practice, rhythm training, composition and an AI tutor.

## Features

- 20 structured lessons across listening, piano, notation, rhythm, scales, ear training, chords, harmony, guitar and composition.
- Lesson objectives, explanations, listening prompts, practical activities and mastery checks.
- Three-octave piano playback with sample-based audio and synthesizer fallback.
- Interactive guitar fretboard, drum pads, microphone pitch detection and practice recording.
- Procedural music composition, multitrack playback, tempo control, track muting and MIDI export.
- AI tutor with music actions and practice guidance.
- Local accounts with username, email and password. Passwords use PBKDF2-SHA-256 hashes with unique salts; no email verification or email service is used.
- Learning progress, goals, chat history and saved compositions persist in the current browser.

## Technology

Next.js 15, React 19, TypeScript, Tone.js, Web Audio API and `@tonejs/midi`.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add an AI provider key if you want the AI tutor enabled.
3. Run `npm run dev`.

## Account and data model

Authentication is intentionally local-only. Accounts and learning data are stored in the browser's local storage, so they remain on that browser/device and do not synchronize across devices. Clearing browser storage removes the local account and progress. Passwords are never stored as plaintext. Do not use this local account mode for sensitive or regulated data.

## Environment variables

- `GROQ_API_KEY`: optional server-side AI tutor provider key.
- `HF_TOKEN`: optional Hugging Face fallback.

Never expose model-provider secrets in browser code.
