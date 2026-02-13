import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AiQuoteItemDto {
    @IsString()
    description: string;

    @IsOptional()
    unit_price?: number;
}

export class SmartDraftDto {
    @IsString()
    company_name: string;

    @IsString()
    @IsOptional()
    contact_person?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AiQuoteItemDto)
    items: AiQuoteItemDto[];

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    quote_number?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    valid_until?: string;

    @IsOptional()
    total_amount?: number;
}

export class PriceAuditDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AiQuoteItemDto)
    items: AiQuoteItemDto[];
}

export class JargonBusterDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AiQuoteItemDto)
    items: AiQuoteItemDto[];
}
