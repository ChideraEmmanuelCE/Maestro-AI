# Maestro AI

Maestro AI is being rebuilt as an age-adaptive music education studio: structured learning, audible examples, instrument practice, composition, and a private AI tutor.

## Current implementation

- 20 structured lessons spanning listening, piano, notation, rhythm, scales, ear training, chords, harmony, guitar and composition.
- Lesson objectives, concept explanations, listening prompts, practical activities and four-question mastery checks. Learners must score at least 75% before a lesson is marked mastered; best score and attempt count are persisted to Supabase when cloud auth is configured.
- Three-octave sample-based piano playback using the Salamander soundfont, with a local synthesizer fallback.
- Interactive guitar fretboard with playable open strings/frets and common chord voicings.
- Five-pad synthesized drum kit and real-time microphone pitch detection.
- Prompt-driven four-bar procedural compositions plus a multitrack C-major arrangement with melody, harmony, bass and percussion.
- Tempo control, track muting, arrangement playback and MIDI export.
- Maestro AI function tools for playing concept examples, generating music, opening practice and controlling the metronome.
- Supabase email magic links, guardian-managed multi-learner profiles, learner switching, cloud lesson mastery and cloud composition records (requires configured Supabase project).
- Supabase email magic-link sign-in, session refresh middleware and auth callback (requires project environment variables).
- Supabase SQL schema for guardian accounts, multiple learner profiles, lesson mastery, practice sessions, generated pieces and weekly goals.
- Row-level security policies scope learner records to their guardian.

## Technology

- Next.js 15 App Router, React 19 and TypeScript
- Tone.js + Web Audio API
- Salamander piano samples (loaded from Tone.js public sample hosting)
- `@tonejs/midi` for MIDI export
- Supabase Auth, Postgres and Storage (schema and dependencies included; project credentials and live auth wiring remain required)
- Vercel deployment

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the Supabase and AI provider values.

3. In the Supabase SQL editor, run:

   `supabase/migrations/001_initial_schema.sql`

4. Start the app:

   ```bash
   npm run dev
   ```

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable/anon key
- `GROQ_API_KEY`: optional server-side AI tutor provider key
- `HF_TOKEN`: optional Hugging Face fallback

Never expose service-role keys or model-provider secrets in browser code.

## Important release status

This repository is in active rebuild. The Supabase schema is prepared but has not been applied to a live Supabase project. Cloud sign-in, profile switching, lesson-mastery sync and composition records are wired, but they cannot work until the Supabase URL/key are configured in Vercel and the migration is applied. Full practice-session analytics, weekly-goal UI, microphone performance scoring, external generative-model audio and MP3/WAV export are not yet shipped. The microphone tuner detects pitch locally; it does not upload or retain microphone audio. Voice pitch analysis, microphone performance assessment, high-quality generated MP3 output and external generative-model integration are not yet shipped. Do not represent those capabilities as live.

## Audio notes

The piano sampler fetches Salamander samples on first use. If the sample host is unavailable, the audio engine falls back to a local Tone.js synthesizer. The current procedural arrangement can be played immediately after the first user gesture and exported as MIDI.
