export function botLog(level: "info" | "warn" | "error", message: string, ...args: unknown[]) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [BOT:${level.toUpperCase()}]`;
  if (level === "error") {
    console.error(prefix, message, ...args);
  } else if (level === "warn") {
    console.warn(prefix, message, ...args);
  } else {
    console.log(prefix, message, ...args);
  }
}
