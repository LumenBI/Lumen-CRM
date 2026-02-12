import { Controller, Get, Query, UnauthorizedException, Headers, UseGuards } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { AuthGuard } from '@nestjs/passport';

@Controller('quotes/products')
@UseGuards(AuthGuard('jwt'))
export class ProductsController {
    private getClient(token: string) {
        return createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
            { global: { headers: { Authorization: token } } }
        );
    }

    @Get()
    async getProducts(@Headers('Authorization') token: string, @Query('search') search: string) {
        const supabase = this.getClient(token);

        let query = supabase.from('products').select('*').limit(20);

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        const { data, error } = await query;

        if (error) throw new UnauthorizedException(error.message);

        return data;
    }
}
