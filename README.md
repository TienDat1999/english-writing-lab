# Draftwise Web

Next.js full-stack application for the personalized IELTS Writing Coach.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add a Google OAuth web client with callback URL:
   `http://localhost:3000/api/auth/callback/google`.
3. Start MongoDB and Redis, or provide hosted connection URLs.
4. Run `pnpm dev` for the web app.
5. Add an OpenAI API key, then run `pnpm worker` in a second terminal.

## Environment

- `AUTH_SECRET`: random Auth.js signing secret.
- `AUTH_GOOGLE_ID`: Google OAuth client ID.
- `AUTH_GOOGLE_SECRET`: Google OAuth client secret.
- `MONGODB_URI`: MongoDB connection URI.
- `MONGODB_DB`: database name, defaults to `english_study`.
- `REDIS_URL`: Redis connection URI used by BullMQ.
- `OPENAI_API_KEY`: server-only API key used by the analysis worker.
- `OPENAI_MODEL`: structured-output model, defaults to `gpt-4o-mini`.

Never prefix server secrets with `NEXT_PUBLIC_`.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm exec next build --webpack
```

The Webpack build command is useful in restricted environments where Turbopack
cannot bind its internal process port.

## Implemented foundation

- Auth.js Google authentication backed by MongoDB.
- Cached MongoDB and Mongoose connections.
- Server-only session DAL.
- Submission schema and validated create/list/status APIs.
- BullMQ producer with deterministic analysis job IDs.
- Provider-neutral AI gateway contract.
- Landing, login, and protected dashboard routes.
- Responsive IELTS essay form with live word count and validated submission.
- Dashboard submission history with queue and analysis status badges.
- BullMQ analysis worker with grounded, schema-validated OpenAI feedback.
- Personal learning items saved from vocabulary, grammar, and essay feedback.
- Active-recall review sessions with spaced-repetition scheduling and mastery states.
