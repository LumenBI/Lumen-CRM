import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { ProductsController } from './products.controller';
import { QuotesService } from './quotes.service';
import { PdfStorageService } from './pdf-storage.service';
import { CurrencyModule } from '../currency/currency.module';

@Module({
    imports: [CurrencyModule],
    controllers: [QuotesController, ProductsController],
    providers: [QuotesService, PdfStorageService],
})
export class QuotesModule { }
