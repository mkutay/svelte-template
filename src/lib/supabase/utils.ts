import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { StorageError } from "@supabase/storage-js";
import {
  errAsync,
  fromSafePromise,
  okAsync,
  type ResultAsync,
} from "neverthrow";

type PGResponse<T> = PostgrestSingleResponse<T>;
type StorageResponse<T> =
  | { data: T; error: null }
  | { data: null; error: StorageError };

/**
 * A type representing data returned from a Supabase query, which can be
 * either the data T, an object containing the data and a count, or just the count.
 *
 * @template T The type of the data returned from the query.
 */
export type WithCount<T> = T | { data: T; count: number } | number;

/**
 * A mapping of PostgreSQL error codes to their corresponding error messages.
 *
 * This can be used to provide more descriptive error messages when handling
 * errors from Supabase queries.
 */
export const postgreSQLErrorMessages = {
  // Class 00
  "00000": "Successful completion",
  // Class 01
  "01000": "Warning",
  "01003": "Null value eliminated in set function",
  "01004": "String data right truncation",
  "01006": "Privilege not revoked",
  "01007": "Privilege not granted",
  "01008": "Implicit zero bit padding",
  "0100C": "Dynamic result sets returned",
  "01P01": "Deprecated feature",
  // Class 02
  "02000": "No data",
  "02001": "No additional dynamic result sets returned",
  // Class 03
  "03000": "Sql statement not yet complete",
  // Class 08
  "08000": "Connection exception",
  "08001": "Sqlclient unable to establish sqlconnection",
  "08003": "Connection does not exist",
  "08004": "Sqlserver rejected establishment of sqlconnection",
  "08006": "Connection failure",
  "08007": "Transaction resolution unknown",
  "08P01": "Protocol violation",
  // Class 09
  "09000": "Triggered action exception",
  // Class 0A
  "0A000": "Feature not supported",
  // Class 0B
  "0B000": "Invalid transaction initiation",
  // Class 0F
  "0F000": "Locator exception",
  "0F001": "Invalid locator specification",
  // Class 0L
  "0L000": "Invalid grantor",
  "0LP01": "Invalid grant operation",
  // Class 0P
  "0P000": "Invalid role specification",
  // Class 0Z
  "0Z000": "Diagnostics exception",
  "0Z002": "Stacked diagnostics accessed without active handler",
  // Class 10
  "10608": "Invalid argument for xquery",
  // Class 20
  "20000": "Case not found",
  // Class 21
  "21000": "Cardinality violation",
  // Class 22
  "22000": "Data exception",
  "22001": "String data right truncation",
  "22002": "Null value no indicator parameter",
  "22003": "Numeric value out of range",
  "22004": "Null value not allowed",
  "22005": "Error in assignment",
  "22007": "Invalid datetime format",
  "22008": "Datetime field overflow",
  "22009": "Invalid time zone displacement value",
  "2200B": "Escape character conflict",
  "2200C": "Invalid use of escape character",
  "2200D": "Invalid escape octet",
  "2200F": "Zero length character string",
  "2200G": "Most specific type mismatch",
  "2200H": "Sequence generator limit exceeded",
  "2200L": "Not an xml document",
  "2200M": "Invalid xml document",
  "2200N": "Invalid xml content",
  "2200S": "Invalid xml comment",
  "2200T": "Invalid xml processing instruction",
  "22010": "Invalid indicator parameter value",
  "22011": "Substring error",
  "22012": "Division by zero",
  "22013": "Invalid preceding or following size",
  "22014": "Invalid argument for ntile function",
  "22015": "Interval field overflow",
  "22016": "Invalid argument for nth value function",
  "22018": "Invalid character value for cast",
  "22019": "Invalid escape character",
  "2201B": "Invalid regular expression",
  "2201E": "Invalid argument for logarithm",
  "2201F": "Invalid argument for power function",
  "2201G": "Invalid argument for width bucket function",
  "2201W": "Invalid row count in limit clause",
  "2201X": "Invalid row count in result offset clause",
  "22021": "Character not in repertoire",
  "22022": "Indicator overflow",
  "22023": "Invalid parameter value",
  "22024": "Unterminated c string",
  "22025": "Invalid escape sequence",
  "22026": "String data length mismatch",
  "22027": "Trim error",
  "2202E": "Array subscript error",
  "2202G": "Invalid tablesample repeat",
  "2202H": "Invalid tablesample argument",
  "22030": "Duplicate json object key value",
  "22031": "Invalid argument for sql json datetime function",
  "22032": "Invalid json text",
  "22033": "Invalid sql json subscript",
  "22034": "More than one sql json item",
  "22035": "No sql json item",
  "22036": "Non numeric sql json item",
  "22037": "Non unique keys in a json object",
  "22038": "Singleton sql json item required",
  "22039": "Sql json array not found",
  "2203A": "Sql json member not found",
  "2203B": "Sql json number not found",
  "2203C": "Sql json object not found",
  "2203D": "Too many json array elements",
  "2203E": "Too many json object members",
  "2203F": "Sql json scalar required",
  "2203G": "Sql json item cannot be cast to target type",
  "22P01": "Floating point exception",
  "22P02": "Invalid text representation",
  "22P03": "Invalid binary representation",
  "22P04": "Bad copy file format",
  "22P05": "Untranslatable character",
  "22P06": "Nonstandard use of escape character",
  // Class 23
  "23000": "Integrity constraint violation",
  "23001": "Restrict violation",
  "23502": "Not null violation",
  "23503": "Foreign key violation",
  "23505": "Unique violation",
  "23514": "Check violation",
  "23P01": "Exclusion violation",
  // Class 24
  "24000": "Invalid cursor state",
  // Class 25
  "25000": "Invalid transaction state",
  "25001": "Active sql transaction",
  "25002": "Branch transaction already active",
  "25003": "Inappropriate access mode for branch transaction",
  "25004": "Inappropriate isolation level for branch transaction",
  "25005": "No active sql transaction for branch transaction",
  "25006": "Read only sql transaction",
  "25007": "Schema and data statement mixing not supported",
  "25008": "Held cursor requires same isolation level",
  "25P01": "No active sql transaction",
  "25P02": "In failed sql transaction",
  "25P03": "Idle in transaction session timeout",
  "25P04": "Transaction timeout",
  // Class 26
  "26000": "Invalid sql statement name",
  // Class 27
  "27000": "Triggered data change violation",
  // Class 28
  "28000": "Invalid authorization specification",
  "28P01": "Invalid password",
  // Class 2B
  "2B000": "Dependent privilege descriptors still exist",
  "2BP01": "Dependent objects still exist",
  // Class 2D
  "2D000": "Invalid transaction termination",
  // Class 2F
  "2F000": "Sql routine exception",
  "2F002": "Modifying sql data not permitted",
  "2F003": "Prohibited sql statement attempted",
  "2F004": "Reading sql data not permitted",
  "2F005": "Function executed no return statement",
  // Class 34
  "34000": "Invalid cursor name",
  // Class 38
  "38000": "External routine exception",
  "38001": "Containing sql not permitted",
  "38002": "Modifying sql data not permitted",
  "38003": "Prohibited sql statement attempted",
  "38004": "Reading sql data not permitted",
  // Class 39
  "39000": "External routine invocation exception",
  "39001": "Invalid sqlstate returned",
  "39004": "Null value not allowed",
  "39P01": "Trigger protocol violated",
  "39P02": "Srf protocol violated",
  "39P03": "Event trigger protocol violated",
  // Class 3B
  "3B000": "Savepoint exception",
  "3B001": "Invalid savepoint specification",
  // Class 3D
  "3D000": "Invalid catalog name",
  // Class 3F
  "3F000": "Invalid schema name",
  // Class 40
  "40000": "Transaction rollback",
  "40001": "Serialization failure",
  "40002": "Transaction integrity constraint violation",
  "40003": "Statement completion unknown",
  "40P01": "Deadlock detected",
  // Class 42
  "42000": "Syntax error or access rule violation",
  "42501": "Insufficient privilege",
  "42601": "Syntax error",
  "42602": "Invalid name",
  "42611": "Invalid column definition",
  "42622": "Name too long",
  "42701": "Duplicate column",
  "42702": "Ambiguous column",
  "42703": "Undefined column",
  "42704": "Undefined object",
  "42710": "Duplicate object",
  "42712": "Duplicate alias",
  "42723": "Duplicate function",
  "42725": "Ambiguous function",
  "42803": "Grouping error",
  "42804": "Datatype mismatch",
  "42809": "Wrong object type",
  "42830": "Invalid foreign key",
  "42846": "Cannot coerce",
  "42883": "Undefined function",
  "428C9": "Generated always",
  "42939": "Reserved name",
  "42P01": "Undefined table",
  "42P02": "Undefined parameter",
  "42P03": "Duplicate cursor",
  "42P04": "Duplicate database",
  "42P05": "Duplicate prepared statement",
  "42P06": "Duplicate schema",
  "42P07": "Duplicate table",
  "42P08": "Ambiguous parameter",
  "42P09": "Ambiguous alias",
  "42P10": "Invalid column reference",
  "42P11": "Invalid cursor definition",
  "42P12": "Invalid database definition",
  "42P13": "Invalid function definition",
  "42P14": "Invalid prepared statement definition",
  "42P15": "Invalid schema definition",
  "42P16": "Invalid table definition",
  "42P17": "Invalid object definition",
  "42P18": "Indeterminate datatype",
  "42P19": "Invalid recursion",
  "42P20": "Windowing error",
  "42P21": "Collation mismatch",
  "42P22": "Indeterminate collation",
  // Class 44
  "44000": "With check option violation",
  // Class 53
  "53000": "Insufficient resources",
  "53100": "Disk full",
  "53200": "Out of memory",
  "53300": "Too many connections",
  "53400": "Configuration limit exceeded",
  // Class 54
  "54000": "Program limit exceeded",
  "54001": "Statement too complex",
  "54011": "Too many columns",
  "54023": "Too many arguments",
  // Class 55
  "55000": "Object not in prerequisite state",
  "55006": "Object in use",
  "55P02": "Cant change runtime param",
  "55P03": "Lock not available",
  "55P04": "Unsafe new enum value usage",
  // Class 57
  "57000": "Operator intervention",
  "57014": "Query canceled",
  "57P01": "Admin shutdown",
  "57P02": "Crash shutdown",
  "57P03": "Cannot connect now",
  "57P04": "Database dropped",
  "57P05": "Idle session timeout",
  // Class 58
  "58000": "System error",
  "58030": "Io error",
  "58P01": "Undefined file",
  "58P02": "Duplicate file",
  "58P03": "File name too long",
  // Class F0
  F0000: "Config file error",
  F0001: "Lock file exists",
  // Class HV
  HV000: "Fdw error",
  HV001: "Fdw out of memory",
  HV002: "Fdw dynamic parameter value needed",
  HV004: "Fdw invalid data type",
  HV005: "Fdw column name not found",
  HV006: "Fdw invalid data type descriptors",
  HV007: "Fdw invalid column name",
  HV008: "Fdw invalid column number",
  HV009: "Fdw invalid use of null pointer",
  HV00A: "Fdw invalid string format",
  HV00B: "Fdw invalid handle",
  HV00C: "Fdw invalid option index",
  HV00D: "Fdw invalid option name",
  HV00J: "Fdw option name not found",
  HV00K: "Fdw reply handle",
  HV00L: "Fdw unable to create execution",
  HV00M: "Fdw unable to create reply",
  HV00N: "Fdw unable to establish connection",
  HV00P: "Fdw no schemas",
  HV00Q: "Fdw schema not found",
  HV00R: "Fdw table not found",
  HV010: "Fdw function sequence error",
  HV014: "Fdw too many handles",
  HV021: "Fdw inconsistent descriptor information",
  HV024: "Fdw invalid attribute value",
  HV090: "Fdw invalid string length or buffer length",
  HV091: "Fdw invalid descriptor field identifier",
  // Class P0
  P0000: "Plpgsql error",
  P0001: "Raise exception",
  P0002: "No data found",
  P0003: "Too many rows",
  P0004: "Assert failure",
  // Class XX
  XX000: "Internal error",
  XX001: "Data corrupted",
  XX002: "Index corrupted",
  // PL/pgSQL Error Class
  "P0*": "PL/pgSQL error",
  // PostgREST
  PGRST000:
    "Could not connect with the database due to an incorrect connection string or due to the Postgres service not running.",
  PGRST001: "Could not connect with the database due to an internal error.",
  PGRST002:
    "Could not connect with the database when building the schema cache",
  PGRST003:
    "The request timed out waiting for a connection from PostgREST's internal pool",
  PGRST100: "Parsing error in the query string parameter.",
  PGRST101:
    "For database functions, only GET and POST verbs are allowed. Any other verb will throw this error.",
  PGRST102:
    "An invalid request body was sent(e.g. an empty body or malformed JSON).",
  PGRST103: "An invalid range was specified for limits.",
  PGRST105: "An invalid UPDATE/UPSERT request was done",
  PGRST106:
    "The schema specified when switching schemas is not exposed to the API.",
  PGRST107: "The Content-Type sent in the request is invalid.",
  PGRST108:
    "The filter is applied to an embedded resource that is not specified in the select part of the query string.",
  PGRST111: "An invalid response.headers was set.",
  PGRST112: "The status code must be a positive integer.",
  PGRST114: "For an UPSERT using PUT when limits and offsets are used.",
  PGRST115:
    "For an UPSERT using PUT when the primary key in the query string and the body are different.",
  PGRST116:
    "More than 1 or no items where returned when requesting a singular response.",
  PGRST117: "The HTTP verb used in the request in not supported.",
  PGRST118:
    "Could not order the result using the related table because there is no many-to-one or one-to-one relationship between them.",
  PGRST120:
    "An embedded resource can only be filtered using the is.null or not.is.null operators.",
  PGRST121: "API can't parse the JSON objects in RAISE PGRST error.",
  PGRST122:
    "Invalid preferences found in Prefer header with Prefer: handling=strict.",
  PGRST123: "Aggregate functions are disabled.",
  PGRST124: "max-affected preference is violated.",
  PGRST125: "Invalid path is specified in request URL.",
  PGRST126: "Open API config is disabled but API root path is accessed.",
  PGRST127: "The feature specified in the details field is not implemented.",
  PGRST128: "max-affected preference is violated with RPC call.",
  PGRST200:
    "Caused by stale foreign key relationships, otherwise any of the embedding resources or the relationship itself may not exist in the database.",
  PGRST201: "An ambiguous embedding request was made.",
  PGRST202:
    "Caused by a stale function signature, otherwise the function may not exist in the database.",
  PGRST203:
    "Caused by requesting overloaded functions with the same argument names but different types, or by using a POST verb to request overloaded functions with a JSON or JSONB type unnamed parameter. The solution is to rename the function or add/modify the names of the arguments.",
  PGRST204:
    "Caused when the column specified in the columns query parameter is not found.",
  PGRST205: "Caused when the table specified in the URI is not found.",
  PGRST300: "PostgREST does not have an active JWT secret to validate requests",
  PGRST301: "Provided JWT couldn't be decoded or it is invalid.",
  PGRST302:
    "Attempted to do a request without the header Auth: Bearer when the anonymous role is disabled.",
  PGRST303: "JWT claims validation or parsing failed.",
  PGRSTX00:
    "Internal errors related to the library used for connecting to the database.",
};

export type PostgreSQLErrorCode = keyof typeof postgreSQLErrorMessages;

/**
 * An array of all PostgreSQL error codes, derived from the keys of the
 * `postgreSQLErrorMessages` object. This can be used to validate error codes
 * returned from Supabase queries against known PostgreSQL error codes.
 */
export const postgreSQLErrorCodes = Object.keys(postgreSQLErrorMessages);

/**
 * A type representing an error that can occur during a Supabase query,
 * including the error message, type, and detailed information from PostgreSQL.
 *
 * @template T A string literal type representing the specific type of database error.
 */
export type SupabaseQueryError<T extends string> = {
  error: string;
  type: T;
  postgres: {
    code: PostgreSQLErrorCode | "unknown";
    message: string;
    hint?: string;
    details?: string;
    cause?: unknown;
    name?: string;
    stack?: string;
  };
};

export function handleSupabaseResponse<T>(
  response: PGResponse<T>,
  type: "count",
): ResultAsync<
  { data: T; count: number },
  SupabaseQueryError<"DATABASE_ERROR">
>;

export function handleSupabaseResponse<T>(
  response: PGResponse<T>,
  type: "head",
): ResultAsync<number, SupabaseQueryError<"DATABASE_ERROR">>;

export function handleSupabaseResponse<T>(
  response: PGResponse<T>,
  type?: "data",
): ResultAsync<T, SupabaseQueryError<"DATABASE_ERROR">>;

/**
 * Handles the response from a Supabase query, returning a ResultAsync that
 * resolves to the data on success or a SupabaseQueryError on failure.
 *
 * This function is overloaded to support both data-only, data/count,
 * and count-only returns.
 */
export function handleSupabaseResponse<T>(
  response: PGResponse<T>,
  type?: "count" | "head" | "data",
): ResultAsync<WithCount<T>, SupabaseQueryError<"DATABASE_ERROR">> {
  const { error, data, count } = response;

  if (error) {
    return errAsync({
      error: `Database query failed. ${error.message}`,
      type: "DATABASE_ERROR",
      postgres: {
        code: postgreSQLErrorCodes.includes(error.code)
          ? (error.code as PostgreSQLErrorCode)
          : "unknown",
        message: postgreSQLErrorCodes.includes(error.code)
          ? postgreSQLErrorMessages[error.code as PostgreSQLErrorCode]
          : "Unknown error.",
        hint: error.hint,
        details: error.details,
        cause: error.cause,
        name: error.name,
        stack: error.stack,
      },
    });
  }

  if (type === "count") {
    return okAsync({ data, count: count ?? 0 });
  }

  if (type === "head") {
    return okAsync(count ?? 0);
  }

  return okAsync(data);
}

export function supabaseRun<T>(
  query: PromiseLike<PGResponse<T>>,
  type?: "data",
): ResultAsync<T, SupabaseQueryError<"DATABASE_ERROR">>;

export function supabaseRun<T>(
  query: PromiseLike<PGResponse<T>>,
  type: "count",
): ResultAsync<
  { data: T; count: number },
  SupabaseQueryError<"DATABASE_ERROR">
>;

export function supabaseRun<T>(
  query: PromiseLike<PGResponse<T>>,
  type: "head",
): ResultAsync<number, SupabaseQueryError<"DATABASE_ERROR">>;

/**
 * Executes a Supabase query and returns a ResultAsync containing either the
 * data or a SupabaseQueryError. This function is overloaded to support both
 * data-only, data/count, and count-only returns.
 *
 * @param query A Promise-like object representing the Supabase query to be executed.
 * @param type The type of result to return: "data" (default), "count" (`{data, count}`), or "head" (count only).
 * @returns A ResultAsync that resolves to the query data or {data, count} or count on success.
 * @example
 * ```typescript
 * // Returns T
 * const result = await supabaseRun(supabase.from("competitions").select("id"));
 *
 * // Returns { data: T, count: number }
 * const result = await supabaseRun(supabase.from("competitions").select("id", { count: 'exact' }), "count");
 * ```
 */
export function supabaseRun<T>(
  query: PromiseLike<PGResponse<T>>,
  type?: "count" | "head" | "data",
): ResultAsync<WithCount<T>, SupabaseQueryError<"DATABASE_ERROR">> {
  return fromSafePromise(query).andThen((response) => {
    if (type === "count") {
      return handleSupabaseResponse(response, "count");
    }
    if (type === "head") {
      return handleSupabaseResponse(response, "head");
    }
    return handleSupabaseResponse(response, "data");
  });
}

/**
 * A type representing an error that can occur during a Supabase storage operation.
 */
export type SupabaseStorageError = {
  error: string;
  type: "STORAGE_ERROR";
  storage: StorageError;
};

/**
 * Handles the response from a Supabase storage operation, returning a ResultAsync.
 *
 * @template T The type of the data returned from the storage operation.
 * @param response The response from a Supabase storage operation, which can be
 * either a success with data or an error with a StorageError.
 * @returns A ResultAsync that resolves to the storage data on success or a
 * SupabaseStorageError on failure.
 */
export const handleSupabaseStorageResponse = <T>({
  error,
  data,
}: StorageResponse<T>): ResultAsync<T, SupabaseStorageError> =>
  !error
    ? okAsync(data)
    : errAsync({
        error: `Storage operation failed. ${error.message}`,
        type: "STORAGE_ERROR",
        storage: error,
      });

/**
 * Executes a Supabase storage query and returns a ResultAsync containing either the
 * data or a SupabaseStorageError.
 *
 * @template T The type of the data returned from the storage operation.
 * @param query A Promise-like object representing the Supabase storage query.
 * @returns A ResultAsync that resolves to the query data on success or
 * a SupabaseStorageError on failure.
 * @example
 * ```typescript
 * const result: Result<Blob, SupabaseStorageError> = await supabaseStorageRun(
 *   supabase.storage.from("avatars").download("user123/avatar.png"),
 * );
 * ```
 * @example
 * ```typescript
 * const result: Result<Blob, SupabaseStorageError> = await event.locals.supabase.asyncAndThen((sb) =>
 *   supabaseStorageRun(sb.storage.from("avatars").download("user123/avatar.png")),
 * );
 * ```
 * With `asyncAndThen` in SvelteKit server functions.
 */
export const supabaseStorageRun = <T>(
  query: PromiseLike<StorageResponse<T>>,
): ResultAsync<T, SupabaseStorageError> =>
  fromSafePromise(query).andThen(handleSupabaseStorageResponse);
