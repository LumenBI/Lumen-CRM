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

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const request = ctx.getRequest();
    const url = request.url;
    const user = request.user;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      const context = `Route: ${url}\nUser: ${user?.userId || 'Guest'}`;
      this.notificationsService.notifySlackError(exception, context);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
