import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get project root (ES module compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Ensure logs directory exists
const LOGS_DIR = path.join(PROJECT_ROOT, "logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Log levels
export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

// Global print level
let _printLevel: LogLevel = LogLevel.INFO;

/**
 * Define log level and create logger instance
 */
export function defineLogLevel(
  printLevel: LogLevel = LogLevel.INFO,
  logfileLevel: LogLevel = LogLevel.DEBUG,
  name?: string
): winston.Logger {
  _printLevel = printLevel;

  // Create timestamp for log file naming
  const currentDate = new Date();
  const formattedDate = currentDate
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "")
    .replace("T", "");

  const logName = name ? `${name}_${formattedDate}` : formattedDate;

  // Create transports
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      level: printLevel,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = "";
          if (Object.keys(meta).length) {
            try {
              metaStr = JSON.stringify(meta, null, 2);
            } catch (error) {
              // Handle circular references
              metaStr = JSON.stringify(
                meta,
                (key, value) => {
                  if (typeof value === "object" && value !== null) {
                    if (
                      value.constructor?.name === "ClientRequest" ||
                      value.constructor?.name === "IncomingMessage"
                    ) {
                      return "[Circular HTTP Object]";
                    }
                  }
                  return value;
                },
                2
              );
            }
          }
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    }),

    // Daily rotate file transport
    new DailyRotateFile({
      filename: path.join(LOGS_DIR, `${logName}.log`),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      level: logfileLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
  ];

  // Create logger
  const logger = winston.createLogger({
    level: printLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
  });

  return logger;
}

// Create default logger instance
export const logger = defineLogLevel();

// Export logger methods for convenience
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  critical: (message: string, meta?: any) =>
    logger.error(`[CRITICAL] ${message}`, meta),

  // Exception logging (equivalent to Python's logger.exception)
  exception: (message: string, error: Error, meta?: any) => {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      ...meta,
    });
  },
};

// Test function (equivalent to Python's __main__ block)
export function testLogger(): void {
  log.info("Starting application");
  log.debug("Debug message");
  log.warn("Warning message");
  log.error("Error message");
  log.critical("Critical message");

  try {
    throw new Error("Test error");
  } catch (error) {
    log.exception("An error occurred", error as Error);
  }
}

// Export the winston logger instance for advanced usage
export default logger;
