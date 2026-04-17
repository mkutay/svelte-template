// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { SBClient, SessionError, UserError } from "$lib/supabase/auth";
import type { Session } from "@supabase/supabase-js";
import type { Result, ResultAsync } from "neverthrow";

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      supabase: Result<SBClient, never>;
      /**
       * Unlike `supabase.auth.getSession`, which is unsafe on the server because it
       * doesn't validate the JWT, this function validates the JWT by first calling
       * `getUser` and aborts early if the JWT signature is invalid.
       */
      safeGetSession(): ResultAsync<
        {
          session: Session;
          user: Session["user"];
        },
        SessionError | UserError
      >;
    }
    interface PageData {
      session?: Session | null;
      user?: Session["user"] | null;
    }
    // interface PageState {}
    // interface Platform {}
  }
}
