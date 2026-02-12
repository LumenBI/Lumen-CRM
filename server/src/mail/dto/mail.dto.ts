import { IsEmail, IsString, IsOptional, IsBase64 } from 'class-validator';

export class SendEmailDto {
    @IsEmail()
    to: string;

    @IsString()
    subject: string;

    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    threadId?: string;

    @IsOptional()
    @IsString()
    inReplyTo?: string;

    @IsOptional()
    @IsString()
    references?: string;
}

export class SendQuoteEmailDto {
    @IsEmail()
    to: string;

    @IsString()
    subject: string;

    @IsString()
    message: string;

    @IsBase64()
    pdfBase64: string;

    @IsString()
    filename: string;
}
