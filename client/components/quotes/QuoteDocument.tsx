import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Quote, QuoteItem } from '@/types';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 18, fontWeight: 'bold' },
    section: { margin: 10, padding: 10, flexGrow: 1 },
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderRightWidth: 0, borderBottomWidth: 0 },
    tableRow: { margin: 'auto', flexDirection: 'row' },
    tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', borderLeftWidth: 0, borderTopWidth: 0 },
    tableHeader: { backgroundColor: '#f0f0f0', fontWeight: 'bold' },
    cell: { margin: 5, fontSize: 10 },
    total: { marginTop: 20, textAlign: 'right', fontSize: 12, fontWeight: 'bold' }
});

interface QuoteDocumentProps {
    quote: Quote;
    items: QuoteItem[];
    currency: string;
}

export const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote, items, currency }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>COTIZACIÓN #{quote.quote_number}</Text>
                    <Text>Fecha: {new Date(quote.created_at).toLocaleDateString()}</Text>
                    <Text>Válido hasta: {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A'}</Text>
                </View>
                <View>
                    <Text>Star Cargo Service S.A.</Text>
                    {/* Add more company info here if needed */}
                </View>
            </View>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <View style={styles.tableCol}><Text style={styles.cell}>Descripción</Text></View>
                    <View style={styles.tableCol}><Text style={styles.cell}>Cantidad</Text></View>
                    <View style={styles.tableCol}><Text style={styles.cell}>Precio ({currency})</Text></View>
                    <View style={styles.tableCol}><Text style={styles.cell}>Total</Text></View>
                </View>
                {items.map((item, i) => (
                    <View key={i} style={styles.tableRow}>
                        <View style={styles.tableCol}><Text style={styles.cell}>{item.description}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.cell}>{item.quantity}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.cell}>{item.unit_price.toFixed(2)}</Text></View>
                        <View style={styles.tableCol}><Text style={styles.cell}>{item.total_price.toFixed(2)}</Text></View>
                    </View>
                ))}
            </View>

            <View style={styles.total}>
                <Text>Total: {currency} {quote.total_amount?.toFixed(2)}</Text>
            </View>
        </Page>
    </Document>
);
