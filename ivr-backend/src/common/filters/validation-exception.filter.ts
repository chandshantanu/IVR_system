import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    // Extract validation errors
    let validationErrors = [];
    if (
      exceptionResponse.message &&
      Array.isArray(exceptionResponse.message)
    ) {
      validationErrors = exceptionResponse.message;
    } else if (typeof exceptionResponse.message === 'string') {
      validationErrors = [exceptionResponse.message];
    }

    // Log validation error
    this.logger.warn(
      JSON.stringify({
        type: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        errors: validationErrors,
        userId: request.user?.id,
      }),
    );

    // Send formatted response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: 'Validation Error',
      message: 'Request validation failed',
      validationErrors,
    });
  }
}
