import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { ProductsController } from './products.controller';
import { QuotesService } from './quotes.service';
import { PdfStorageService } from './pdf-storage.service';
import { CurrencyModule } from '../currency/currency.module';
import { DefaultPricingStrategy } from './strategies/default-pricing.strategy';

@Module({
  imports: [CurrencyModule],
  controllers: [ProductsController, QuotesController],
  providers: [QuotesService, PdfStorageService, DefaultPricingStrategy],
  exports: [DefaultPricingStrategy],
})
export class QuotesModule { }

