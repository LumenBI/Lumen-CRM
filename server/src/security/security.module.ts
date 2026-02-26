import { Global, Module } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { SlackSignatureGuard } from './slack-signature.guard';

@Global()
@Module({
    providers: [PermissionsGuard, SlackSignatureGuard],
    exports: [PermissionsGuard, SlackSignatureGuard],
})
export class SecurityModule { }
