# Maestro AI

An approachable music-learning workspace with an AI tutor, guided learning paths and a practice studio.

## AI tutor

Maestro uses the open-weight **Qwen2.5-7B-Instruct-1M** model through Hugging Face Inference Providers. The model is hosted remotely; the Hugging Face token is kept server-side and is never sent to the browser.

### Configure the model

1. Create a Hugging Face account and generate a fine-grained token at https://huggingface.co/settings/tokens.
2. Enable **Make calls to Inference Providers** for that token.
3. In Vercel, open the `maestro-ai` project → Settings → Environment Variables.
4. Add `HF_TOKEN` as an encrypted variable for Production (and Preview/Development if desired).
5. Redeploy.

For local development, copy `.env.example` to `.env.local` and set `HF_TOKEN`.

Hugging Face Inference Providers use usage-based billing and account credits may apply. Open model weights do not mean hosted inference is always free.

## Local development

```bash
npm install
npm run dev
```
