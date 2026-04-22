import type { Database } from "$lib/supabase/database";
import {
  AuthError,
  type SupabaseClient,
  type Session,
  type User,
  type JwtPayload,
} from "@supabase/supabase-js";
import {
  errAsync,
  fromSafePromise,
  okAsync,
  type ResultAsync,
} from "neverthrow";

/**
 * Convert the result of a getSession or refreshSession call to a ResultAsync
 * that may contain a SessionError if the request fails or if there is no
 * active session.
 *
 * @param result The result of a getSession or refreshSession call, containing
 * data and error properties.
 * @returns A ResultAsync containing the Session or a SessionError.
 */
const toSessionResult = ({
  data,
  error,
}:
  | Awaited<ReturnType<SBClient["auth"]["getSession"]>>
  | Awaited<ReturnType<SBClient["auth"]["refreshSession"]>>): ResultAsync<
  Session,
  SessionError
> => {
  if (error)
    return errAsync({
      error,
      type: "SESSION_ERROR" as const,
    });

  if (!data.session)
    return errAsync({
      error: new AuthError("No active session."),
      type: "SESSION_ERROR" as const,
    });

  return okAsync(data.session);
};

/**
 * Get the user from the Supabase client, returning a ResultAsync that may
 * contain a UserError if the request fails or if there is no user.
 *
 * @param supabase The Supabase client to use for the request.
 * @returns A ResultAsync containing the User or a UserError.
 */
export const getUser = (supabase: SBClient): ResultAsync<User, UserError> =>
  fromSafePromise(supabase.auth.getUser()).andThen(({ data, error }) => {
    if (error) return errAsync({ error, type: "USER_ERROR" as const });
    return okAsync(data.user);
  });

/**
 * Get the session from the Supabase client, returning a ResultAsync that may
 * contain a SessionError if the request fails or if there is no active session.
 *
 * @param supabase The Supabase client to use for the request.
 * @returns A ResultAsync containing the Session or a SessionError.
 */
export const getSession = (
  supabase: SBClient,
): ResultAsync<Session, SessionError> =>
  fromSafePromise(supabase.auth.getSession()).andThen(toSessionResult);

/**
 * Refresh the session using Supabase, returning a ResultAsync that may contain a
 * SessionError if refresh fails or if no session is returned.
 *
 * @param supabase The Supabase client to use for the request.
 * @returns A ResultAsync containing the refreshed Session or a SessionError.
 */
export const refreshSession = (
  supabase: SBClient,
): ResultAsync<Session, SessionError> =>
  fromSafePromise(supabase.auth.refreshSession()).andThen(toSessionResult);

/**
 * Sign up a user with the given email and password, returning a ResultAsync
 * that may contain an SignUpError if the sign-up fails.
 *
 * @param supabase The Supabase client to use for the request.
 * @param email The email of the user to sign up.
 * @param password The password of the user to sign up.
 * @returns A ResultAsync that resolves if the sign-up is successful,
 * or contains an SignUpError if it fails.
 */
export const signUp = (
  supabase: SBClient,
  email: string,
  password: string,
): ResultAsync<void, SignUpError> =>
  fromSafePromise(
    supabase.auth.signUp({
      email,
      password,
    }),
  ).andThen(({ error }) =>
    error ? errAsync({ error, type: "SIGN_UP_ERROR" as const }) : okAsync(),
  );

/**
 * Sign in a user with the given email and password, returning a ResultAsync
 * that may contain a SignInError if the sign-in fails.
 *
 * @param supabase The Supabase client to use for the request.
 * @param email The email of the user to sign in.
 * @param password The password of the user.
 * @returns A ResultAsync that resolves if the sign-in is successful,
 * or contains a SignInError if it fails.
 */
export const signIn = (
  supabase: SBClient,
  email: string,
  password: string,
): ResultAsync<void, SignInError> =>
  fromSafePromise(
    supabase.auth.signInWithPassword({
      email,
      password,
    }),
  ).andThen(({ error }) =>
    error ? errAsync({ error, type: "SIGN_IN_ERROR" as const }) : okAsync(),
  );

/**
 * Sign out a user, returning a ResultAsync that may contain a SignOutError
 * if the sign-out fails.
 *
 * @returns A ResultAsync that resolves if the sign-out is successful,
 * or contains a SignOutError if it fails.
 */
export const signOut = (supabase: SBClient): ResultAsync<void, SignOutError> =>
  fromSafePromise(supabase.auth.signOut()).andThen(({ error }) =>
    error ? errAsync({ error, type: "SIGN_OUT_ERROR" as const }) : okAsync(),
  );

/**
 * Get the claims from the Supabase client, returning a ResultAsync that may
 * contain a ClaimsError if the request fails or if there are no claims.
 *
 * @param supabase The Supabase client to use for the request.
 * @returns A ResultAsync containing the claims as a JwtPayload or a ClaimsError.
 * @remarks This function validates the JWT signature locally (for asymmetric keys) once
 * the relevant signing keys are available or cached, and returns the decoded
 * claims. While an initial or periodic network request may be required to
 * fetch or refresh keys, this is both faster and safer than `getSession`,
 * which does not validate the JWT.
 */
export const getClaims = (
  supabase: SBClient,
): ResultAsync<JwtPayload, ClaimsError> =>
  fromSafePromise(supabase.auth.getClaims()).andThen(({ data, error }) => {
    if (error) return errAsync({ error, type: "CLAIMS_ERROR" as const });
    if (!data?.claims)
      return errAsync({
        error: new AuthError("No claims found."),
        type: "CLAIMS_ERROR" as const,
      });
    return okAsync(data.claims);
  });

export interface SessionError {
  error: AuthError;
  type: "SESSION_ERROR";
}

export interface UserError {
  error: AuthError;
  type: "USER_ERROR";
}

export interface SignUpError {
  error: AuthError;
  type: "SIGN_UP_ERROR";
}

export interface SignOutError {
  error: AuthError;
  type: "SIGN_OUT_ERROR";
}

export interface SignInError {
  error: AuthError;
  type: "SIGN_IN_ERROR";
}

export interface ClaimsError {
  error: AuthError;
  type: "CLAIMS_ERROR";
}

export type SBClient = SupabaseClient<Database>;
