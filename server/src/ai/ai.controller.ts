import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { SmartDraftDto, PriceAuditDto, JargonBusterDto } from './dto/ai.dto';

@Controller('ai')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('smart-draft')
  async generateDraft(@Body() body: SmartDraftDto) {
    const draft = await this.aiService.generateQuoteEmail(body);
    return { draft };
  }

  @Post('price-audit')
  async auditPrices(@Body() body: PriceAuditDto) {
    const alert = await this.aiService.checkPriceAnomalies(body.items);
    return { alert };
  }

  @Post('jargon-buster')
  async explainTerms(@Body() body: JargonBusterDto) {
    const glossary = await this.aiService.explainQuoteTerms(body.items);
    return glossary;
  }
}
