import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { AppConfigService } from '../common/config/app-config.service';
import * as crypto from 'crypto';

@Injectable()
export class SlackSignatureGuard implements CanActivate {
    constructor(private readonly config: AppConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const signature = request.headers['x-slack-signature'];
        const timestamp = request.headers['x-slack-request-timestamp'];
        const signingSecret = this.config.slackSigningSecret;

        if (!signature || !timestamp || !signingSecret) {
            throw new UnauthorizedException('Slack signature or timestamp missing');
        }

        // Prevent replay attacks (5 minute window)
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - parseInt(timestamp, 10)) > 60 * 5) {
            throw new UnauthorizedException('Slack request timestamp expired');
        }

        // Verify signature
        const rawBody = request.rawBody ? request.rawBody.toString() : '';
        const baseString = `v0:${timestamp}:${rawBody}`;
        const hmac = crypto
            .createHmac('sha256', signingSecret)
            .update(baseString)
            .digest('hex');
        const computedSignature = `v0=${hmac}`;

        if (
            !crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(computedSignature),
            )
        ) {
            throw new UnauthorizedException('Invalid Slack signature');
        }

        return true;
    }
}
