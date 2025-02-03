import chalk from 'chalk';
import { mapToSourceSync } from '../fs/map-to-source.js';

export interface LogOptions {
  defaultIndentLevel?: number;
  showTimestamp?: boolean;
  timestampFormat?: string;
  debug?: boolean;
  tag?: string;
  prefix?: string;
}

// Available colors for logger prefixes
const COLORS = ['blue', 'magenta', 'cyan', 'green', 'yellow', 'red'] as const;

let nextColorIndex = 0;

/**
 * A configurable logging utility that provides formatted console output with various log levels,
 * indentation support, and timestamp options.
 */
export class Logger {
  private options: Required<LogOptions> & { tag: string | undefined };
  private currentIndent: number;
  private prefixColor: (typeof COLORS)[number];

  /**
   * Creates a new Log instance with the specified options.
   * @param options - Configuration options for the logger
   */
  constructor(options: LogOptions = {}) {
    this.options = {
      defaultIndentLevel: 0,
      showTimestamp: false,
      timestampFormat: 'YYYY-MM-DD HH:mm:ss',
      debug: false,
      tag: '',
      prefix: '',
      ...options,
    };

    this.currentIndent = this.options.defaultIndentLevel;
    this.prefixColor = COLORS[nextColorIndex];
    nextColorIndex = (nextColorIndex + 1) % COLORS.length;
  }

  public setOptions(options: LogOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Applies formatting options to subsequent log messages.
   * @param options - Formatting options to apply
   */
  format(options: { indent?: number } = {}): this {
    this.currentIndent = options.indent ?? this.options.defaultIndentLevel;
    return this;
  }

  /**
   * Gets the call site location from the stack trace, mapped to source when possible.
   * @returns {string} The call site information from the error stack.
   */
  private getCallSite(): string {
    const stack = new Error().stack?.split('\n');
    if (!stack) return '';

    const extractFilePath = (frame: string) => {
      const line = frame.trim();
      const parenMatch = line.match(/\((?:file:\/\/)?(.*?)(?::(\d+):(\d+))?\)/);
      if (parenMatch) {
        const [, path, line, column] = parenMatch;
        return path + (line ? `:${line}${column ? `:${column}` : ''}` : '');
      }
      return line.substring(3);
    };

    // Find first non-logger.js stack frame
    for (const frame of stack.slice(1)) {
      if (!frame.includes('logger.js')) {
        const rawPath = extractFilePath(frame);
        // Normalize Windows paths
        const normalizedPath = rawPath.replace(/\\/g, '/');
        const sourcePath = mapToSourceSync(normalizedPath);
        return chalk.gray(sourcePath);
      }
    }

    return '';
  }

  /**
   * Formats a log message with indentation and prefix.
   * @param message - Message to format
   * @param type - Type of log message
   * @param indentLevel - Level of indentation
   */
  private formatLog(
    message: string,
    type: string | null,
    indentLevel = 0,
  ): { formattedMessage: string; callSite: string } {
    const indent = ' '.repeat(indentLevel * 2);
    const prefix = this.getPrefix(type);
    const tag = this.options.tag ? chalk.cyan(`[${this.options.tag}] `) : '';
    let callSite = '';
    if (type === 'debug') {
      callSite = this.getCallSite();
    }
    const formattedMessage = `${indent}${prefix}${tag}${message}`;
    return { formattedMessage, callSite };
  }

  /**
   * Internal method to handle log message formatting and output.
   * @param args - Arguments to be logged
   * @param type - Log type (info, success, error, warning)
   * @param force - Whether to force logging even in production
   */
  private log(
    args: unknown[],
    type: string | null = null,
    force = false,
  ): void {
    if (!this.options.debug && !force) {
      return;
    }

    const { formattedMessage, callSite } = this.formatLog(
      String(args[0]),
      type,
      this.currentIndent,
    );
    const newArgs = [formattedMessage, ...args.slice(1)];

    if (callSite) {
      newArgs.push(callSite);
    }

    if (this.options.showTimestamp) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}]`, ...newArgs);
    } else {
      console.log(...newArgs);
    }

    this.resetFormatting();
  }

  private logSeparator(force = false, amount = 1): void {
    this.log(['\n'.repeat(amount - 1)], '', force);
  }

  text(...args: string[]): this {
    this.log(args, null, true);
    return this;
  }

  /**
   * Logs a debug message.
   * Only logs if debug is enabled and if PLUGMA_DEBUG_TASK matches the logger's prefix.
   * @param args - Arguments to log
   */
  debug(...args: unknown[]): this {
    if (!this.options.debug) {
      return this;
    }

    const debugTask = process.env.PLUGMA_DEBUG_TASK;
    if (debugTask) {
      if (!this.options.prefix || !this.options.prefix.startsWith(debugTask)) {
        return this;
      }
    }

    this.log(args, 'debug');
    return this;
  }

  /**
   * Logs an informational message.
   * @param args - Arguments to log
   */
  info(...args: unknown[]): this {
    this.log(args, 'info');
    return this;
  }

  /**
   * Logs a success message.
   * @param args - Arguments to log
   */
  success(...args: unknown[]): this {
    this.logSeparator(true);
    this.log(args, 'success', true);
    return this;
  }

  /**
   * Logs an error message.
   * @param args - Arguments to log
   */
  error(...args: unknown[]): this {
    this.log(args, 'error', true);
    return this;
  }

  /**
   * Logs a warning message.
   * @param args - Arguments to log
   */
  warn(...args: unknown[]): this {
    this.log(args, 'warning', true);
    return this;
  }

  /**
   * Gets the prefix for a given log type.
   * @param type - Type of log message
   */
  private getPrefix(type: string | null): string {
    // Only show prefix for debug logs
    if (type === 'debug' && this.options.prefix) {
      return chalk[this.prefixColor](`[${this.options.prefix}] `);
    }

    switch (type) {
      case 'info':
        return chalk.blue.bold('INFO: ');
      case 'debug':
        return chalk.gray.bold('DEBUG: ');
      case 'success':
        return chalk.green.bold('✔︎ ');
      case 'error':
        return chalk.red.bold('ERROR: ');
      case 'warning':
        return chalk.yellow.bold('WARNING: ');
      default:
        return '';
    }
  }

  /**
   * Resets formatting to default values.
   */
  private resetFormatting(): void {
    this.currentIndent = this.options.defaultIndentLevel;
  }
}

export const defaultLogger = new Logger({ prefix: 'plugma' });

export const debugLogger = new Logger({ debug: true });
