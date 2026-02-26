import { Controller, Post, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { CurrencyService } from './currency.service';

/**
 * REST endpoint for Vercel Cron Jobs.
 * Vercel calls POST /api/cron/daily-tasks on a schedule defined in vercel.json.
 * The endpoint is protected by a shared secret (CRON_SECRET env var).
 */
@Controller('api/cron')
export class CronController {
    private readonly logger = new Logger(CronController.name);

    constructor(private readonly currencyService: CurrencyService) { }

    @Post('daily-tasks')
    async runDailyTasks(@Headers('authorization') authorization: string) {
        // Validate the Bearer token against CRON_SECRET
        const secret = process.env.CRON_SECRET;
        const provided = authorization?.replace('Bearer ', '').trim();

        if (!secret || provided !== secret) {
            this.logger.warn('Unauthorized cron attempt');
            throw new UnauthorizedException('Invalid cron secret');
        }

        this.logger.log('Running daily cron tasks...');

        // Await all daily tasks before returning — required in serverless
        // (Vercel kills the function as soon as the response is sent)
        const currencyResult = await this.currencyService.runDailyUpdate();

        this.logger.log('Daily cron tasks completed.');
        return {
            success: true,
            tasks: {
                currency: currencyResult,
            },
        };
    }
}
