import { createServerClient } from "@supabase/ssr";
import type { Database } from "$lib/supabase/database";
import type { Handle } from "@sveltejs/kit";
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from "$env/static/public";
import { errAsync, ok, okAsync, safeTry } from "neverthrow";
import {
  getSession,
  getUser,
  refreshSession,
  type SessionError,
  type UserError,
} from "$lib/supabase/auth";
import type { Session } from "@supabase/supabase-js";

/**
 * SvelteKit server-side hook that initializes Supabase authentication for each request.
 *
 * This hook is automatically called by SvelteKit for every server request and is responsible for:
 * - Creating a Supabase client instance with server-side cookie handling.
 * - Injecting the Supabase client into `event.locals` for use in server-side routes and endpoints.
 * - Providing a safe session getter that validate Supabase tokens server-side.
 *
 * @param event SvelteKit request event containing cookies, locals, and other request context.
 * @param resolve SvelteKit function to process the request and return the response.
 *
 * @returns A promise that resolves to the HTTP response with filtered serialized headers.
 *
 * @usage You can access the Supabase client in your server-side routes and endpoints via
 * `event.locals.supabase` and use `event.locals.safeGetSession()` to safely retrieve
 * the current user's session.
 *
 * @see https://kit.svelte.dev/docs/hooks#server-hooks-handle
 * @see https://github.com/engageintellect/sveltekit-supabase/blob/main/src/hooks.server.ts
 */
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = ok(
    createServerClient<Database>(
      PUBLIC_SUPABASE_URL,
      PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          fetch: event.fetch,
        },
        cookies: {
          getAll: () => event.cookies.getAll(),
          /**
           * Note: You have to add the `path` variable to the
           * set and remove method due to sveltekit's cookie API
           * requiring this to be set, setting the path to `/`
           * will replicate previous/standard behaviour (https://kit.svelte.dev/docs/types#public-types-cookies)
           */
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              event.cookies.set(name, value, { ...options, path: "/" });
            });
          },
        },
      },
    ),
  );

  event.locals.safeGetSession = () =>
    safeTry<
      {
        session: Session;
        user: Session["user"];
      },
      SessionError | UserError
    >(async function* () {
      const supabase = yield* event.locals.supabase;
      const user = yield* getUser(supabase);
      const session = yield* getSession(supabase);
      return okAsync({ user, session });
    }).orElse((error) =>
      safeTry<
        {
          session: Session;
          user: Session["user"];
        },
        SessionError | UserError
      >(async function* () {
        if (!/expired/i.test(error.error.message)) return errAsync(error);

        const supabase = yield* event.locals.supabase;
        yield* refreshSession(supabase);

        const user = yield* getUser(supabase);
        const session = yield* getSession(supabase);
        return okAsync({ user, session });
      }),
    );

  return resolve(event, {
    filterSerializedResponseHeaders(name: string) {
      return (
        name === "content-type" ||
        name === "content-length" ||
        name === "content-range" ||
        name === "x-supabase-api-version"
      );
    },
  });
};
