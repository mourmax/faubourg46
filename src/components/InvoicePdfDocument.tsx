import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { QuoteSelection, InvoiceData } from '../lib/types';
import { formatCurrency } from '../lib/utils';

const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
    header: { marginBottom: 20, borderBottom: '2px solid #B8860B', paddingBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#B8860B', marginBottom: 5 },
    subtitle: { fontSize: 10, color: '#666' },
    section: { marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    table: { marginTop: 20 },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #E5E5E5', paddingVertical: 8 },
    colDesc: { width: '45%', fontSize: 9 },
    colQty: { width: '10%', fontSize: 9, textAlign: 'center' },
    colPrice: { width: '20%', fontSize: 9, textAlign: 'right' },
    colTotal: { width: '25%', fontSize: 9, textAlign: 'right', fontWeight: 'bold' },
    totalsSection: { marginTop: 20, paddingTop: 10, borderTop: '2px solid #B8860B' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 },
    totalLabel: { width: '30%', fontSize: 10, textAlign: 'right', marginRight: 10 },
    totalValue: { width: '20%', fontSize: 10, textAlign: 'right', fontWeight: 'bold' },
    grandTotal: { fontSize: 14, fontWeight: 'bold', color: '#B8860B' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#999', textAlign: 'center' }
});

interface InvoicePdfProps {
    selection: QuoteSelection;
    invoice: InvoiceData;
    quoteTotals: {
        totalHt: number;
        totalTva: number;
        totalTtc: number;
        breakdown: {
            vat10: { ht: number; tva: number };
            vat20: { ht: number; tva: number };
        };
    };
}

export function InvoicePdfDocument({ selection, invoice, quoteTotals }: InvoicePdfProps) {
    // Calculate custom items totals
    const customTotals = invoice.customItems.reduce((acc, item) => {
        if (item.vatRate === 10) {
            acc.ht10 += item.totalHt;
            acc.tva10 += item.totalTva;
        } else {
            acc.ht20 += item.totalHt;
            acc.tva20 += item.totalTva;
        }
        acc.totalTtc += item.totalTtc;
        return acc;
    }, { ht10: 0, tva10: 0, ht20: 0, tva20: 0, totalTtc: 0 });

    // Combine quote and custom items
    const totalHt = quoteTotals.totalHt + customTotals.ht10 + customTotals.ht20;
    const totalTva10 = quoteTotals.breakdown.vat10.tva + customTotals.tva10;
    const totalTva20 = quoteTotals.breakdown.vat20.tva + customTotals.tva20;
    const totalTva = totalTva10 + totalTva20;
    const totalTtc = quoteTotals.totalTtc + customTotals.totalTtc;
    const balanceDue = totalTtc - (invoice.depositReceived ? (invoice.depositAmount || 0) : 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>FACTURE</Text>
                    <Text style={styles.subtitle}>Faubourg 46 - Restaurant</Text>
                    <Text style={{ fontSize: 8, marginTop: 5 }}>
                        N° {invoice.invoiceNumber} - Date: {invoice.invoiceDate.toLocaleDateString('fr-FR')}
                    </Text>
                </View>

                {/* Client Info */}
                <View style={styles.row}>
                    <View style={{ width: '48%' }}>
                        <Text style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>FACTURER À</Text>
                        <Text style={{ fontSize: 11, fontWeight: 'bold' }}>{selection.contact.name}</Text>
                        {selection.contact.company && (
                            <Text style={{ fontSize: 10, marginTop: 2 }}>{selection.contact.company}</Text>
                        )}
                        {selection.contact.address && (
                            <Text style={{ fontSize: 9, marginTop: 2 }}>{selection.contact.address}</Text>
                        )}
                        <Text style={{ fontSize: 9, marginTop: 2 }}>{selection.contact.email}</Text>
                        <Text style={{ fontSize: 9 }}>{selection.contact.phone}</Text>
                        {selection.contact.vatNumber && (
                            <Text style={{ fontSize: 9, marginTop: 4 }}>N° TVA: {selection.contact.vatNumber}</Text>
                        )}
                    </View>
                    <View style={{ width: '48%' }}>
                        <Text style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>DÉTAILS ÉVÉNEMENT</Text>
                        <Text style={{ fontSize: 10 }}>Date: {selection.event.date.toLocaleDateString('fr-FR')}</Text>
                        <Text style={{ fontSize: 10 }}>Service: {(() => {
                            const isWeekend = selection.event.date.getDay() === 5 || selection.event.date.getDay() === 6;
                            if (selection.event.service === 'LUNCH') return 'Déjeuner';
                            if (selection.event.service === 'DINNER_1') return 'Dîner - Service 1';
                            if (selection.event.service === 'DINNER_2') return 'Dîner - Service 2';
                            if (selection.event.service === 'DINNER_FULL') return isWeekend ? 'Dîner - Soirée Complète' : 'Dîner';
                            return selection.event.service;
                        })()}</Text>
                        <Text style={{ fontSize: 10 }}>
                            Convives: {selection.event.guests} Adulte{selection.event.guests > 1 ? 's' : ''}
                            {selection.event.childrenGuests && selection.event.childrenGuests > 0 ? ` + ${selection.event.childrenGuests} Enfant${selection.event.childrenGuests > 1 ? 's' : ''}` : ''}
                        </Text>
                    </View>
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, { backgroundColor: '#F9F9F9', borderBottom: 'none' }]}>
                        <Text style={[styles.colDesc, { fontWeight: 'bold' }]}>Description</Text>
                        <Text style={[styles.colQty, { fontWeight: 'bold' }]}>Qté</Text>
                        <Text style={[styles.colPrice, { fontWeight: 'bold' }]}>P.U. TTC</Text>
                        <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>Total TTC</Text>
                    </View>

                    {/* Formula */}
                    <View style={styles.tableRow}>
                        <Text style={styles.colDesc}>Formule: {selection.formula.name} {selection.event.childrenGuests ? '(Adulte)' : ''}</Text>
                        <Text style={styles.colQty}>{selection.event.guests}</Text>
                        <Text style={styles.colPrice}>{formatCurrency(selection.formula.priceTtc)}</Text>
                        <Text style={styles.colTotal}>{formatCurrency(selection.formula.priceTtc * selection.event.guests)}</Text>
                    </View>

                    {/* Children Formula */}
                    {selection.formula.id.includes('BRUNCH') && selection.event.childrenGuests && selection.event.childrenGuests > 0 && (
                        <View style={styles.tableRow}>
                            <Text style={styles.colDesc}>Formule: Brunch (Enfant -12 ans)</Text>
                            <Text style={styles.colQty}>{selection.event.childrenGuests}</Text>
                            <Text style={styles.colPrice}>{formatCurrency(16.00)}</Text>
                            <Text style={styles.colTotal}>{formatCurrency(16.00 * selection.event.childrenGuests)}</Text>
                        </View>
                    )}

                    {/* Options */}
                    {selection.options.map((opt, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.colDesc}>{opt.name}</Text>
                            <Text style={styles.colQty}>{opt.quantity}</Text>
                            <Text style={styles.colPrice}>{formatCurrency(opt.unitPriceTtc)}</Text>
                            <Text style={styles.colTotal}>{formatCurrency(opt.totalTtc)}</Text>
                        </View>
                    ))}

                    {/* Custom Items */}
                    {invoice.customItems.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.colDesc}>{item.description}</Text>
                            <Text style={styles.colQty}>{item.quantity}</Text>
                            <Text style={styles.colPrice}>{formatCurrency(item.totalTtc / item.quantity)}</Text>
                            <Text style={styles.colTotal}>{formatCurrency(item.totalTtc)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total HT:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalHt)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TVA 10%:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalTva10)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>TVA 20%:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalTva20)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total TVA:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalTva)}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginTop: 10, paddingTop: 10, borderTop: '1px solid #B8860B' }]}>
                        <Text style={[styles.totalLabel, styles.grandTotal]}>Total TTC:</Text>
                        <Text style={[styles.totalValue, styles.grandTotal]}>{formatCurrency(totalTtc)}</Text>
                    </View>

                    {/* Deposit */}
                    {invoice.depositReceived && invoice.depositAmount && (
                        <>
                            <View style={[styles.totalRow, { marginTop: 15 }]}>
                                <Text style={styles.totalLabel}>
                                    Acompte reçu le {invoice.depositDate?.toLocaleDateString('fr-FR')}
                                    {invoice.depositMethod && ` (${invoice.depositMethod})`}:
                                </Text>
                                <Text style={styles.totalValue}>-{formatCurrency(invoice.depositAmount)}</Text>
                            </View>
                            <View style={[styles.totalRow, { marginTop: 5, paddingTop: 10, borderTop: '2px solid #B8860B' }]}>
                                <Text style={[styles.totalLabel, styles.grandTotal]}>Solde à régler:</Text>
                                <Text style={[styles.totalValue, styles.grandTotal]}>{formatCurrency(balanceDue)}</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Faubourg 46 - 46 Rue du Faubourg Poissonnière, 75010 Paris - SIRET: XXX XXX XXX XXXXX - TVA: FR XX XXX XXX XXX
                </Text>
            </Page>
        </Document>
    );
}
