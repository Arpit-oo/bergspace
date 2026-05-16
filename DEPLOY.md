# Deploying Atomquest to Vercel

Summary: this project is a Next.js app (Next 16). Vercel detects Next.js automatically. Follow these steps to deploy safely and securely.

1) Do NOT commit secrets
- Remove any sensitive keys from `\.env.local` before pushing. Keep local secrets out of the repo and only set them in Vercel.

2) Required environment variables (set these in Vercel Dashboard -> Settings -> Environment Variables)
- `NEXT_PUBLIC_SUPABASE_URL` (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` (server-only)
- `TELEGRAM_BOT_TOKEN` (server-only)
- `OPENAI_API_KEY` (server-only)
- `NEXT_PUBLIC_APP_URL` (set to your production URL after deploy)

3) Quick deploy (recommended: connect your Git provider)
- Push this repository to GitHub/GitLab/Bitbucket.
- In Vercel, click "New Project", import from the repo, and Vercel will detect Next.js.
- Add the environment variables under Project Settings ➜ Environment Variables.
- Deploy; after the first deploy, set `NEXT_PUBLIC_APP_URL` to the production URL shown by Vercel.

4) Deploy from local (Vercel CLI)
- Install and login:
```powershell
npm i -g vercel
vercel login
```
- Add environment variables via CLI (interactive) or in Vercel Dashboard. Example interactive flow:
```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# repeat for other vars
```
- Deploy:
```powershell
vercel --prod
```

5) Notes & troubleshooting
- Node/runtime: Vercel will select a compatible Node version automatically; if you need a specific Node version, add an `engines` field in `package.json`.
- Keep server-only secrets (service role keys) restricted to Production and Preview environments only.
- If any server functions require the Supabase service role key, ensure you only reference them from server code (not client-side) so the key is never exposed.

If you want, I can (A) connect and deploy via the Vercel CLI from this machine (you'll need to authenticate), or (B) prepare a GitHub repo and push changes and then help connect it to Vercel. Which do you prefer?
