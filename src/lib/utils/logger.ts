/**
 * Logging Utility
 * Provides structured logging for the interview platform
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    // In production, you might want to send this to a log service
    // For now, just console output with colors
    const logMethod = level === 'error' ? console.error :
                     level === 'warn' ? console.warn :
                     level === 'debug' ? console.debug :
                     console.log;

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${this.context}]`;

    if (error) {
      logMethod(prefix, message, '\n', error);
    } else {
      logMethod(prefix, message, data ? '\n' : '', data || '');
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error, data?: any) {
    this.log('error', message, data, error);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  /**
   * Log API request
   */
  logRequest(method: string, path: string, userId?: string) {
    this.info(`API Request: ${method} ${path}`, { userId });
  }

  /**
   * Log API response
   */
  logResponse(method: string, path: string, statusCode: number, duration: number) {
    this.info(`API Response: ${method} ${path} - ${statusCode} (${duration}ms)`);
  }

  /**
   * Log API error
   */
  logApiError(method: string, path: string, error: Error, statusCode?: number) {
    this.error(`API Error: ${method} ${path} - ${statusCode || 'Unknown'}`, error);
  }

  /**
   * Log database operation
   */
  logDbOperation(operation: string, table: string, recordId?: string) {
    this.debug(`DB Operation: ${operation} on ${table}`, { recordId });
  }

  /**
   * Log LLM operation
   */
  logLlmOperation(operation: string, model: string, tokens?: number) {
    this.info(`LLM Operation: ${operation}`, { model, tokens });
  }

  /**
   * Log interview event
   */
  logInterviewEvent(event: string, sessionId: string, data?: any) {
    this.info(`Interview Event: ${event}`, { sessionId, ...data });
  }

  /**
   * Log WebSocket event
   */
  logWebSocketEvent(event: string, socketId: string, sessionId?: string) {
    this.debug(`WebSocket Event: ${event}`, { socketId, sessionId });
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Export default logger instances for common contexts
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('Database');
export const llmLogger = createLogger('LLM');
export const wsLogger = createLogger('WebSocket');
export const interviewLogger = createLogger('Interview');
