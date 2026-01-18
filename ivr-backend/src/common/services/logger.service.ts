import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogContext {
  context?: string;
  userId?: number;
  callSid?: string;
  flowId?: number;
  nodeId?: number;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: LogContext) {
    this.printLog(LogLevel.INFO, message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.printLog(LogLevel.ERROR, message, { ...context, trace });
  }

  warn(message: string, context?: LogContext) {
    this.printLog(LogLevel.WARN, message, context);
  }

  debug(message: string, context?: LogContext) {
    this.printLog(LogLevel.DEBUG, message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.printLog(LogLevel.DEBUG, message, context);
  }

  // Specific IVR logging methods
  logCallStarted(callSid: string, flowId: number, callerNumber: string) {
    this.log(`Call started: ${callSid}`, {
      context: 'IVR',
      callSid,
      flowId,
      callerNumber,
    });
  }

  logCallCompleted(callSid: string, duration: number, status: string) {
    this.log(`Call completed: ${callSid}`, {
      context: 'IVR',
      callSid,
      duration,
      status,
    });
  }

  logNodeExecution(callSid: string, nodeId: number, nodeType: string) {
    this.debug(`Node executed: ${nodeType}`, {
      context: 'IVR',
      callSid,
      nodeId,
      nodeType,
    });
  }

  logNodeError(callSid: string, nodeId: number, error: string) {
    this.error(`Node execution failed`, error, {
      context: 'IVR',
      callSid,
      nodeId,
    });
  }

  logApiCall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
  ) {
    this.log(`API Call: ${method} ${url}`, {
      context: 'API',
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  logExotelWebhook(event: string, callSid: string, data: any) {
    this.log(`Exotel webhook: ${event}`, {
      context: 'Exotel',
      event,
      callSid,
      data: this.sanitizeData(data),
    });
  }

  logQueueUpdate(queueId: number, queueName: string, size: number) {
    this.debug(`Queue updated: ${queueName}`, {
      context: 'Queue',
      queueId,
      queueName,
      size,
    });
  }

  logAgentStatusChange(agentId: number, oldStatus: string, newStatus: string) {
    this.log(`Agent status changed: ${oldStatus} -> ${newStatus}`, {
      context: 'Agent',
      agentId,
      oldStatus,
      newStatus,
    });
  }

  private printLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logContext = context?.context || this.context || 'Application';

    const logEntry = {
      timestamp,
      level,
      context: logContext,
      message,
      ...context,
    };

    const logString = JSON.stringify(logEntry);

    switch (level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(logString);
        }
        break;
      default:
        console.log(logString);
    }
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
