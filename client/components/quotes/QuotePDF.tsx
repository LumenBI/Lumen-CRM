import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#112233',
        paddingBottom: 10,
    },
    logo: {
        width: 150,
        height: 50, // Placeholder size
        // backgroundColor: '#CCCCCC', // Visual placeholder if image missing
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#112233',
    },
    subTitle: {
        fontSize: 12,
        color: '#555555',
    },
    section: {
        margin: 10,
        padding: 10,
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 20,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
    },
    tableCol: {
        width: "20%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableColDesc: {
        width: "40%",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: "auto",
        marginTop: 5,
        fontSize: 10,
        padding: 5,
    },
    tableHeader: {
        fontWeight: 'bold',
        backgroundColor: '#f0f0f0',
    },
    totalSection: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    totalText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 10,
        color: 'grey',
    },
    glossary: {
        marginTop: 30,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
    },
    glossaryTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    glossaryItem: {
        fontSize: 9,
        marginBottom: 3,
    },
});

interface QuoteItem {
    description: string;
    quantity: number;
    unit_price: number;
    total?: number;
}

interface QuoteData {
    quote_number: string;
    client_name?: string; // Passed from parent
    date: string;
    valid_until: string;
    currency: string;
    items: QuoteItem[];
    total_amount?: number;
    glossary?: { term: string; definition: string }[];
}

export const QuotePDF: React.FC<{ data: QuoteData }> = ({ data }) => {
    const calculateTotal = (items: QuoteItem[]) => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
    };

    const total = data.total_amount || calculateTotal(data.items);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View>
                        {/* Replace with actual logo URL or import */}
                        <Text style={styles.title}>Star Cargo</Text>
                        <Text style={styles.subTitle}>International Logistics</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.title}>COTIZACIÓN</Text>
                        <Text style={styles.subTitle}>#{data.quote_number || 'BORRADOR'}</Text>
                        <Text style={styles.subTitle}>Fecha: {data.date}</Text>
                        <Text style={styles.subTitle}>Válido hasta: {data.valid_until}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={{ fontSize: 12, marginBottom: 5 }}>Cliente: {data.client_name || 'N/A'}</Text>
                    <Text style={{ fontSize: 12 }}>Moneda: {data.currency}</Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <View style={{ ...styles.tableColDesc, ...styles.tableHeader }}>
                            <Text style={styles.tableCell}>Descripción</Text>
                        </View>
                        <View style={{ ...styles.tableCol, ...styles.tableHeader }}>
                            <Text style={styles.tableCell}>Cantidad</Text>
                        </View>
                        <View style={{ ...styles.tableCol, ...styles.tableHeader }}>
                            <Text style={styles.tableCell}>Precio Unit.</Text>
                        </View>
                        <View style={{ ...styles.tableCol, ...styles.tableHeader }}>
                            <Text style={styles.tableCell}>Total</Text>
                        </View>
                    </View>
                    {data.items.map((item, index) => (
                        <View style={styles.tableRow} key={index}>
                            <View style={styles.tableColDesc}>
                                <Text style={styles.tableCell}>{item.description}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{item.quantity}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{item.unit_price.toFixed(2)}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text style={styles.tableCell}>{(item.quantity * item.unit_price).toFixed(2)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.totalSection}>
                    <Text style={styles.totalText}>Total ({data.currency}): {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                </View>

                {/* Jargon Buster Section */}
                {data.glossary && data.glossary.length > 0 && (
                    <View style={styles.glossary}>
                        <Text style={styles.glossaryTitle}>Glosario Técnico (IA Generated)</Text>
                        {data.glossary.map((g, i) => (
                            <Text key={i} style={styles.glossaryItem}>
                                <Text style={{ fontWeight: 'bold' }}>{g.term}: </Text>
                                {g.definition}
                            </Text>
                        ))}
                    </View>
                )}

                <View style={styles.footer}>
                    <Text>Star Cargo S.A. - San José, Costa Rica - www.starcargo.com</Text>
                    <Text>Esta cotización está sujeta a términos y condiciones generales de servicio.</Text>
                </View>
            </Page>
        </Document>
    );
};
