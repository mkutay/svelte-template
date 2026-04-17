/// <reference types="node" />

import { defineConfig } from "drizzle-kit";

// DATABASE_URL is read from the environment.
// When running via `bun db:*` scripts, Bun automatically loads .env — no dotenv needed.
// If you invoke drizzle-kit directly (e.g. `bunx drizzle-kit migrate`), make sure
// DATABASE_URL is already set in your shell or prefix the command with it:
//   DATABASE_URL=... bunx drizzle-kit migrate
export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/server/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: DATABASE_URL is required for drizzle-kit to work, so we can safely assert it here.
    url: process.env.DATABASE_URL!,
  },
});
