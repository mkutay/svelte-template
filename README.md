# svelte-template

A SvelteKit template that is generic enough to be used for any project, but also has some nice features like:

- TS
- biome
- vitest
- playwright
- tailwind
- shadcn-svelte
- neverthrow
- bun
- drizzle-orm (PostgreSQL)
- better-auth (email+password, GitHub OAuth)

## Local development

### 1. Set up environment variables

```bash
cp .env.development .env
```

Fill in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` if you need GitHub OAuth locally
(create an OAuth app at https://github.com/settings/developers with callback URL `http://localhost:5173/api/auth/callback/github`).

### 2. Start the database

Requires [Docker](https://docs.docker.com/get-docker/) and Docker Compose.

```bash
docker compose up -d
```

This starts a PostgreSQL 16 instance on `localhost:5432` (user: `postgres`, password: `postgres`, db: `app`).

### 3. Run migrations

```bash
bun db:migrate
```

This applies all SQL migrations from the `drizzle/` folder to your local database.

### 4. Start the dev server

```bash
bun dev
```

---

## Database scripts

| Script            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `bun db:generate` | Generate a new migration from schema changes             |
| `bun db:migrate`  | Apply pending migrations to the database                 |
| `bun db:push`     | Push schema directly to DB (no migration file, dev-only) |
| `bun db:studio`   | Open Drizzle Studio in the browser                       |

### Schema workflow

1. Edit `src/lib/server/db/schema/` to define or change tables.
2. Run `bun db:generate` to produce a migration SQL file in `drizzle/`.
3. Run `bun db:migrate` to apply it.

---

## Auth

Better Auth is wired up and provides:

- **Email + password** sign-up / sign-in / sign-out
- **GitHub OAuth** sign-in

### Server-side usage

`event.locals.user` and `event.locals.session` are populated in every request via `src/hooks.server.ts`.

```ts
// +page.server.ts
export async function load({ locals }) {
  return { user: locals.user };
}
```

### Client-side usage

```ts
import { signIn, signOut, signUp, useSession } from "$lib/auth-client";

// Reactive session store (Svelte store)
const session = useSession();
// $session.data?.user

// Sign up with email + password
await signUp.email({ email, password, name });

// Sign in with email + password
await signIn.email({ email, password });

// Sign in with GitHub
await signIn.social({ provider: "github" });

// Sign out
await signOut();
```

The auth API is mounted at `/api/auth/*` automatically by `src/hooks.server.ts`.

---

## Add components

```bash
bunx shadcn-svelte@latest add button
```
