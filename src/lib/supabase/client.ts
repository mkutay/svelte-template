import { SUPABASE_SECRET_KEY } from "$env/static/private";
import { PUBLIC_SUPABASE_URL } from "$env/static/public";
import type { Database } from "$lib/supabase/database";
import { createClient } from "@supabase/supabase-js";
import { ok } from "neverthrow";

/**
 * Create a Supabase admin client with the service role key, which has elevated
 * privileges and should only be used in secure server-side environments.
 *
 * @returns A Supabase client with admin privileges.
 */
export const createAdminClient = () =>
  ok(
    createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }),
  );
