"use client"
import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { QuoteDocument } from './QuoteDocument';
import { Quote, QuoteItem } from '@/types';

interface QuotePDFViewProps {
    quote: Quote;
    items: QuoteItem[];
}

const QuotePDFView: React.FC<QuotePDFViewProps> = ({ quote, items }) => {
    return (
        <PDFViewer width="100%" height="100%" className="w-full h-full min-h-[600px]">
            <QuoteDocument quote={quote} items={items} currency={quote.currency_code} />
        </PDFViewer>
    );
};

export default QuotePDFView;
