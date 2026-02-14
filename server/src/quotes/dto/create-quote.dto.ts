import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  tax_rate?: number;
}

export class CreateQuoteDto {
  @IsOptional()
  @ValidateIf((o) => o.deal_id !== null && o.deal_id !== undefined)
  @IsUUID()
  deal_id?: string;

  @IsString()
  currency_code: string;

  @IsNumber()
  @IsOptional()
  exchange_rate_snapshot?: number;

  @IsString()
  @IsOptional()
  valid_until?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}
