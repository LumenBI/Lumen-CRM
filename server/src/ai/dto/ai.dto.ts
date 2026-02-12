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
