# Parhaylikhay Platform

Cambridge O-Level Maths & Physics — marking-scheme-aware learning platform.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database + Auth | Supabase |
| Hosting | Vercel |
| Video | Bunny Stream (Week 4) |
| Payments | Stripe + Safepay (Week 5) |

## Getting started

### 1. Create a Supabase project

Go to supabase.com → New project. Choose Singapore region (closest to Pakistan).

Once created, go to **Project Settings → API** and copy:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Set environment variables

Edit `.env.local` and paste your Supabase values.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

## 8-week build plan

| Week | Goal |
|---|---|
| 1 | Foundation — Next.js, Vercel, Supabase auth, homepage (done) |
| 2 | Database schema + admin panel to add content |
| 3 | Dashboard + lesson page layout |
| 4 | Video (Bunny Stream) + widget embeds |
| 5 | Payments — Safepay (Pakistan) + Stripe |
| 6 | Content — 20-30 real lessons |
| 7 | AI tutor (Claude API, mark-scheme-aware) |
| 8 | Polish, analytics, soft launch |

## Folder structure

```
platform/
├── app/
│   ├── page.tsx                 # Marketing homepage
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── dashboard/page.tsx
│   └── api/auth/confirm/route.ts
├── components/
│   ├── nav.tsx
│   ├── hero-canvas.tsx
│   └── ui/ (shadcn)
├── lib/supabase/
│   ├── client.ts
│   └── server.ts
├── middleware.ts
└── public/widgets/
```
