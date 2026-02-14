import { IsString, IsOptional, IsUrl, IsIn } from 'class-validator';

export class UpdateQuoteStatusDto {
  @IsString()
  @IsIn(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'OBSOLETE'])
  status: string;

  @IsOptional()
  @IsUrl()
  pdfUrl?: string;
}
