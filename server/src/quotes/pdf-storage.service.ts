import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class PdfStorageService {
  private getClient(token: string): SupabaseClient {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
      global: { headers: { Authorization: token } },
    });
  }

  async uploadQuotePDF(
    token: string,
    fileBuffer: Buffer,
    quoteId: string,
    filename: string,
  ): Promise<string> {
    const supabase = this.getClient(token);
    const path = `${quoteId}/${filename}`;

    const { data, error } = await supabase.storage
      .from('quotes-archive')
      .upload(path, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw new InternalServerErrorException(
        `Failed to upload PDF: ${error.message}`,
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('quotes-archive')
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  }
}
