# Hugging Face Integration Setup

Refinery UI now uses **Hugging Face Inference API** for free AI-powered component refactoring!

## Why Hugging Face?

- ✅ **Completely FREE** - No credit card required
- ✅ **No rate limits** for most models
- ✅ **Great code models** - Qwen2.5-Coder is excellent for React/TypeScript
- ✅ **Easy setup** - Just need a free account

## Model Used

We're using **Qwen/Qwen2.5-Coder-32B-Instruct** which is:
- Specialized for coding tasks
- Great at following instructions
- Supports TypeScript and React
- Completely free on Hugging Face

## Setup Steps

### 1. Create a Free Hugging Face Account

1. Go to: https://huggingface.co/join
2. Sign up with email or GitHub
3. Verify your email

### 2. Get Your API Token

1. Go to: https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Give it a name (e.g., "Refinery UI")
4. Select **"Read"** access (that's all you need)
5. Click **"Generate token"**
6. **Copy the token** (starts with `hf_...`)

### 3. Add Token to Your Project

Open `apps/studio/.env.local` and replace the placeholder:

```env
HUGGINGFACE_API_TOKEN="hf_your_actual_token_here"
```

Paste your real token there.

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Start the App

```bash
pnpm dev
```

## Usage

1. Navigate to a component
2. Paste React code in the editor
3. Click **"Run AI Refactor"**
4. Wait 15-30 seconds (free tier is slower than paid OpenAI, but still good!)
5. View refactored code and docs

## Performance Notes

### Speed
- **First request**: ~20-40 seconds (model loading)
- **Subsequent requests**: ~15-25 seconds
- Slower than OpenAI but **completely free**!

### Quality
- Excellent for TypeScript/React refactoring
- Good at following instructions
- May occasionally need a retry if JSON parsing fails

### Rate Limits
- **Inference API**: Very generous free tier
- **Most models**: No hard rate limits
- If you hit limits: wait a minute and try again

## Troubleshooting

### "Hugging Face API token not configured"
**Solution**: Make sure `HUGGINGFACE_API_TOKEN` is set in `.env.local`

### "Failed to parse LLM response as JSON"
**Solution**: The model occasionally returns malformed JSON. Just click "Run AI Refactor" again. The prompt is designed to strongly encourage valid JSON output.

### Slow responses
**Cause**: Free tier has no dedicated compute
**Solution**: This is normal for free tier. First request loads the model (~30s), then faster.

### "Model is currently loading"
**Cause**: Popular models can take 20-30s to load on first use
**Solution**: Just wait, it will work. The model stays loaded for ~5 minutes.

## Alternative Models

If you want to try different models, edit `packages/llm/src/refactor.ts` line 62:

```typescript
// Current (best for code):
model: "Qwen/Qwen2.5-Coder-32B-Instruct"

// Alternatives:
// Fast, good quality:
model: "meta-llama/Meta-Llama-3.1-8B-Instruct"

// Balanced:
model: "mistralai/Mixtral-8x7B-Instruct-v0.1"

// Small/fast:
model: "microsoft/Phi-3-mini-4k-instruct"
```

## Comparison: Hugging Face vs OpenAI

| Feature | Hugging Face | OpenAI |
|---------|--------------|--------|
| **Cost** | Free | ~$0.005-0.02 per refactor |
| **Speed** | 15-30s | 5-15s |
| **Quality** | Very Good | Excellent |
| **Rate Limits** | Generous | Pay per use |
| **Setup** | Free account | Credit card required |

## Support

If you need help:
- Hugging Face Docs: https://huggingface.co/docs/api-inference
- Model Page: https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct
- Report issues: Check browser console for detailed errors

---

**You're all set!** Enjoy free AI-powered component refactoring! 🎉
