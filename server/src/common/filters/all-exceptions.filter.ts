import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { NotificationsService } from '../../notifications/notifications.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly notificationsService: NotificationsService,
  ) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const url = request.url;
    const user = request.user;

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
    };

    // --- Slack Categorization Logic ---
    const isProduction = process.env.NODE_ENV === 'production';
    const isCritical = httpStatus === HttpStatus.INTERNAL_SERVER_ERROR;
    const isAuthError = httpStatus === HttpStatus.UNAUTHORIZED || httpStatus === HttpStatus.FORBIDDEN;
    const isValidationError = httpStatus === HttpStatus.BAD_REQUEST;

    if (isCritical || isAuthError || (isProduction && isValidationError)) {
      const metadata: any = {
        severity: isCritical ? 'CRITICAL' : 'WARN',
        type: 'SERVER',
        module: 'GENERAL',
      };

      // Module Detection
      if (url.includes('/clients')) metadata.module = 'CLIENTS';
      else if (url.includes('/deals')) metadata.module = 'DEALS';
      else if (url.includes('/appointments')) metadata.module = 'APPOINTMENTS';
      else if (url.includes('/auth')) metadata.module = 'AUTH';
      else if (url.includes('/stats')) metadata.module = 'STATS';

      // Type Detection
      if (isAuthError) metadata.type = 'AUTH';
      else if (isValidationError) metadata.type = 'VALIDATION';
      else if (this.isDatabaseError(exception)) metadata.type = 'DATABASE';

      const context = `Route: ${url}\nUser: ${user?.userId || 'Guest'}`;
      this.notificationsService.notifySlackError(exception, context, metadata);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private isDatabaseError(exception: any): boolean {
    const msg = (exception?.message || '').toLowerCase();
    const stack = (exception?.stack || '').toLowerCase();
    return (
      msg.includes('supabase') ||
      msg.includes('db') ||
      msg.includes('query') ||
      stack.includes('supabase') ||
      stack.includes('postgrest')
    );
  }
}
