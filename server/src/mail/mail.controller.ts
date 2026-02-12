import { Controller, Get, Post, Body, Headers, Param, Query, UnauthorizedException } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';

@Controller('mail')
export class MailController {

    private getAuthClient(token: string) {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: token });
        return oauth2Client;
    }

    @Get('inbox')
    async getInbox(
        @Headers('x-google-token') token: string,
        @Query('pageToken') pageToken?: string,
        @Query('maxResults') maxResults: string = '50'
    ) {
        if (!token) throw new UnauthorizedException('No Google Token provided');

        const auth = this.getAuthClient(token);
        const gmail = google.gmail({ version: 'v1', auth });

        try {
            const response = await gmail.users.messages.list({
                userId: 'me',
                maxResults: parseInt(maxResults),
                labelIds: ['INBOX'],
                pageToken: pageToken
            });

            const messages = response.data.messages || [];
            const details = await Promise.all(
                messages.map(async (msg) => {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'metadata',
                        metadataHeaders: ['Subject', 'From', 'Date']
                    });
                    const headers = detail.data.payload?.headers;
                    return {
                        id: msg.id,
                        threadId: msg.threadId,
                        subject: headers?.find(h => h.name === 'Subject')?.value || '(Sin asunto)',
                        from: headers?.find(h => h.name === 'From')?.value || '(Desconocido)',
                        date: headers?.find(h => h.name === 'Date')?.value || '',
                        snippet: detail.data.snippet
                    };
                })
            );

            return {
                messages: details.filter(d => d !== null),
                nextPageToken: response.data.nextPageToken
            };
        } catch (error) {
            throw new UnauthorizedException('Failed to fetch inbox: ' + (error.message || 'Unknown error'));
        }
    }

    @Post('send')
    async sendEmail(
        @Headers('x-google-token') token: string,
        @Body() body: {
            to: string;
            subject: string;
            message: string;
            threadId?: string;
            inReplyTo?: string;
            references?: string;
        }
    ) {
        if (!token) throw new UnauthorizedException('No Google Token provided');

        const auth = this.getAuthClient(token);
        const gmail = google.gmail({ version: 'v1', auth });

        const emailLines = [
            `To: ${body.to}`,
            `Subject: ${body.subject}`,
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: 7bit',
        ];

        if (body.inReplyTo) {
            emailLines.push(`In-Reply-To: ${body.inReplyTo}`);
        }
        if (body.references) {
            emailLines.push(`References: ${body.references}`);
        }

        emailLines.push('');
        emailLines.push(body.message);

        const raw = Buffer.from(emailLines.join('\r\n')).toString('base64url');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw,
                threadId: body.threadId
            }
        });

        return { success: true };
    }

    @Get('message/:id')
    async getMessage(@Headers('x-google-token') token: string, @Param('id') id: string) {
        if (!token) throw new UnauthorizedException('No Google Token provided');

        const auth = this.getAuthClient(token);
        const gmail = google.gmail({ version: 'v1', auth });

        try {
            const response = await gmail.users.messages.get({
                userId: 'me',
                id: id
            });

            const msg = response.data;
            const headers = msg.payload?.headers;

            const messageId = headers?.find(h => h.name?.toLowerCase() === 'message-id')?.value;
            const references = headers?.find(h => h.name?.toLowerCase() === 'references')?.value || '';

            const attachments = [];
            let bodyText = '';
            let bodyHtml = '';

            const parseParts = (payload: any) => {
                // Check if this part is a body content
                if (payload.mimeType === 'text/plain' && payload.body?.data && !payload.filename) {
                    bodyText += Buffer.from(payload.body.data, 'base64').toString('utf-8');
                }
                if (payload.mimeType === 'text/html' && payload.body?.data && !payload.filename) {
                    bodyHtml += Buffer.from(payload.body.data, 'base64').toString('utf-8');
                }

                // Check for attachments (with or without filename, as long as it has attachmentId)
                const isAttachment = payload.filename || (payload.body?.attachmentId);
                if (isAttachment && payload.body?.attachmentId) {
                    attachments.push({
                        id: payload.body.attachmentId,
                        filename: payload.filename || 'unnamed-attachment',
                        mimeType: payload.mimeType,
                        size: payload.body.size,
                        contentId: payload.headers?.find(h => h.name?.toLowerCase() === 'content-id')?.value
                    });
                }

                if (payload.parts) {
                    for (const part of payload.parts) {
                        parseParts(part);
                    }
                }
            };

            parseParts(msg.payload);

            // Logic to choose which body to return
            // If text/plain contains "[imagen" or looks like a placeholder, and html is present, we might want to flag it
            // For now, we return plain text as primary, but if it's empty we use html snippet
            let finalBody = bodyText;
            if (!finalBody && bodyHtml) {
                // Basic HTML to text conversion for preview/display
                finalBody = bodyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            }

            return {
                id: msg.id,
                threadId: msg.threadId,
                messageId: messageId,
                references: references,
                subject: headers?.find(h => h.name === 'Subject')?.value || '(No Subject)',
                from: headers?.find(h => h.name === 'From')?.value || '(Unknown)',
                to: headers?.find(h => h.name === 'To')?.value || '',
                date: headers?.find(h => h.name === 'Date')?.value || '',
                snippet: msg.snippet,
                body: finalBody,
                attachments: attachments
            };
        } catch (error) {
            console.error(`Error fetching message ${id}:`, error);
            throw new UnauthorizedException('Failed to fetch message details');
        }
    }

    @Get('attachment/:messageId/:attachmentId')
    async getAttachment(
        @Headers('x-google-token') token: string,
        @Param('messageId') messageId: string,
        @Param('attachmentId') attachmentId: string
    ) {
        if (!token) throw new UnauthorizedException('No Google Token provided');

        const auth = this.getAuthClient(token);
        const gmail = google.gmail({ version: 'v1', auth });

        try {
            const response = await gmail.users.messages.attachments.get({
                userId: 'me',
                messageId: messageId,
                id: attachmentId
            });

            return response.data;
        } catch (error) {
            console.error('Error fetching attachment:', error);
            throw new UnauthorizedException('Failed to fetch attachment');
        }
    }

    @Get('threads/:email')
    async getThreads(@Headers('x-google-token') token: string, @Param('email') email: string) {
        if (!token) throw new UnauthorizedException('No Google Token provided');

        const auth = this.getAuthClient(token);
        const gmail = google.gmail({ version: 'v1', auth });

        try {
            const response = await gmail.users.messages.list({
                userId: 'me',
                q: `from:${email} OR to:${email}`,
                maxResults: 10
            });

            const messages = response.data.messages || [];
            const threadDetails: gmail_v1.Schema$Thread[] = [];

            for (const msg of messages) {
                if (!msg.threadId) continue;
                const thread = await gmail.users.threads.get({
                    userId: 'me',
                    id: msg.threadId,
                });
                threadDetails.push(thread.data);
            }

            return threadDetails;
        } catch (error) {
            console.error('Error fetching threads:', error);
            throw new UnauthorizedException('Failed to fetch threads');
        }
    }

    @Post('send-quote')
    async sendQuote(
        @Headers('x-google-token') token: string,
        @Body() body: { to: string; subject: string; message: string; pdfBase64: string; filename: string }
    ) {
        if (!token) throw new UnauthorizedException('No Google Token provided');

        const auth = this.getAuthClient(token);
        const gmail = google.gmail({ version: 'v1', auth });

        // 1. Thread Search: Find existing thread with this client
        let threadId: string | undefined;
        let inReplyTo: string | undefined;
        let references: string | undefined;

        try {
            const listRes = await gmail.users.messages.list({
                userId: 'me',
                q: `to:${body.to}`,
                maxResults: 1
            });

            if (listRes.data.messages && listRes.data.messages.length > 0) {
                const latestMsgId = listRes.data.messages[0].id;
                threadId = listRes.data.messages[0].threadId; // Use existing thread

                // Get details to find Message-ID for In-Reply-To
                const msgDetails = await gmail.users.messages.get({
                    userId: 'me',
                    id: latestMsgId,
                    format: 'metadata',
                    metadataHeaders: ['Message-ID', 'References']
                });

                const headers = msgDetails.data.payload?.headers;
                const existingMessageId = headers?.find(h => h.name?.toLowerCase() === 'message-id')?.value;
                const existingReferences = headers?.find(h => h.name?.toLowerCase() === 'references')?.value;

                if (existingMessageId) {
                    inReplyTo = existingMessageId;
                    references = existingReferences ? `${existingReferences} ${existingMessageId}` : existingMessageId;
                }
            }
        } catch (e) {
            console.error("Error finding thread:", e);
            // Non-blocking, fallback to new thread
        }

        const emailLines = [
            `To: ${body.to}`,
            `Subject: ${body.subject}`,
            'Content-Type: multipart/mixed; boundary="foo_bar_baz"',
        ];

        if (inReplyTo) emailLines.push(`In-Reply-To: ${inReplyTo}`);
        if (references) emailLines.push(`References: ${references}`);

        emailLines.push(
            '',
            '--foo_bar_baz',
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: 7bit',
            '',
            body.message,
            '',
            '--foo_bar_baz',
            `Content-Type: application/pdf; name="${body.filename}"`,
            'Content-Transfer-Encoding: base64',
            'Content-Disposition: attachment',
            '',
            body.pdfBase64,
            '--foo_bar_baz--'
        );

        const raw = Buffer.from(emailLines.join('\r\n')).toString('base64url');

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw,
                threadId: threadId
            }
        });

        // IMPORTANT: Here we should ideally return the threadId so the creating service can log it, 
        // or trigger the status update. 
        // For "Zero-Trust", the frontend calls this, so it returns success.
        // The Status Update happens in a separate step or we could inject QuotesService here 
        // but MailController is generic. Better to keep it generic.

        return { success: true, threadId };
    }
}
