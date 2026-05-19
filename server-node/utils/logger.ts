type LogLevel = "info" | "warn" | "error" | "debug";

function formatMessage(level: LogLevel, message: string, details?: unknown): string {
  const timestamp = new Date().toISOString();
  const baseMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  if (details === undefined) {
    return baseMessage;
  }

  if (details instanceof Error) {
    return `${baseMessage}\n${details.stack ?? details.message}`;
  }

  return `${baseMessage} ${typeof details === "string" ? details : JSON.stringify(details, null, 2)}`;
}

function log(level: LogLevel, message: string, details?: unknown): void {
  const output = formatMessage(level, message, details);

  if (level === "error") {
    console.error(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.log(output);
}

export const logger = {
  info(message: string, details?: unknown): void {
    log("info", message, details);
  },
  warn(message: string, details?: unknown): void {
    log("warn", message, details);
  },
  error(message: string, details?: unknown): void {
    log("error", message, details);
  },
  debug(message: string, details?: unknown): void {
    log("debug", message, details);
  },
};
