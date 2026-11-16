// Structured logger. Single-line JSON in production for aggregation, readable
// output in development. Never pass request bodies, message contents, or
// personal data; log ids and counts.

type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, string | number | boolean | null | undefined>;

function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug(message: string, fields?: LogFields) {
    if (process.env.NODE_ENV !== "production") {
      emit("debug", message, fields);
    }
  },
  info(message: string, fields?: LogFields) {
    emit("info", message, fields);
  },
  warn(message: string, fields?: LogFields) {
    emit("warn", message, fields);
  },
  error(message: string, fields?: LogFields) {
    emit("error", message, fields);
  },
  // Every failed authentication is logged with a timestamp so credential
  // stuffing is visible. Call from authz helpers and API routes.
  authFailure(surface: string, fields?: LogFields) {
    emit("warn", "auth_failure", { surface, ...fields });
  },
};
