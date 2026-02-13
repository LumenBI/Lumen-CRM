"use client"
import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import { QuotePDF } from './QuotePDF';

interface QuotePDFPreviewProps {
    data: any;
}

const QuotePDFPreview: React.FC<QuotePDFPreviewProps> = ({ data }) => {
    return (
        <PDFViewer width="100%" height="100%" className="w-full h-full" showToolbar={false}>
            <QuotePDF data={data} />
        </PDFViewer>
    );
};

export default QuotePDFPreview;
