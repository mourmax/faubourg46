import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { QuoteSelection } from '../lib/types';
import { calculateQuoteTotal } from '../lib/quote-engine';

// Register fonts if needed, otherwise use standard
// Font.register({ family: 'Roboto', src: '...' });

const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 40, fontFamily: 'Helvetica' },
    header: { marginBottom: 20 },
    title: { fontSize: 24, marginBottom: 10, fontWeight: 'bold', color: '#B8860B' }, // Dark Goldenrod usually
    subtitle: { fontSize: 12, color: '#666', marginBottom: 20 },

    section: { margin: 10, padding: 10, flexGrow: 1 },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, fontSize: 10 },
    label: { color: '#666' },
    value: { fontWeight: 'bold' },

    table: { marginTop: 20, marginBottom: 20, borderTop: '1px solid #EEE' },
    tableRow: { flexDirection: 'row', borderBottom: '1px solid #EEE', paddingTop: 8, paddingBottom: 8 },
    colDesc: { width: '60%', fontSize: 10 },
    colQty: { width: '10%', fontSize: 10, textAlign: 'center' },
    colPrice: { width: '15%', fontSize: 10, textAlign: 'right' },
    colTotal: { width: '15%', fontSize: 10, textAlign: 'right' },

    totals: { marginTop: 20, alignItems: 'flex-end' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', width: '40%', marginBottom: 5 },
    totalLabel: { fontSize: 10, color: '#666' },
    totalValue: { fontSize: 10, fontWeight: 'bold' },
    grandTotal: { fontSize: 14, fontWeight: 'bold', color: '#B8860B', borderTop: '1px solid #DDD', paddingTop: 5, marginTop: 5 },

    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#999' }
});

const formatCurrency = (amount: number) => {
    // Replace non-breaking spaces (\u00a0) and narrow non-breaking spaces (\u202f) with regular spaces
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
        .replace(/[\u00a0\u202f]/g, ' ');
};

interface PdfDocumentProps {
    selection: QuoteSelection;
    quote: ReturnType<typeof calculateQuoteTotal>;
}

export const PdfDocument = ({ selection, quote }: PdfDocumentProps) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>FAUBOURG</Text>
                <Text style={styles.subtitle}>Devis Événementiel</Text>
            </View>

            {/* Info Grid */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ width: '50%' }}>
                    <Text style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>CLIENT</Text>
                    {selection.contact.company && <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{selection.contact.company}</Text>}
                    <Text style={{ fontSize: 11, fontWeight: selection.contact.company ? 'normal' : 'bold' }}>{selection.contact.name}</Text>
                    <Text style={{ fontSize: 10 }}>{selection.contact.email}</Text>
                    <Text style={{ fontSize: 10, marginBottom: 4 }}>{selection.contact.phone}</Text>

                    {selection.contact.address && (
                        <Text style={{ fontSize: 9, color: '#444' }}>{selection.contact.address}</Text>
                    )}
                    {selection.contact.vatNumber && (
                        <Text style={{ fontSize: 9, color: '#444' }}>TVA: {selection.contact.vatNumber}</Text>
                    )}
                    {selection.contact.internalRef && (
                        <Text style={{ fontSize: 9, color: '#444', marginTop: 4 }}>Réf: {selection.contact.internalRef}</Text>
                    )}
                    {selection.contact.allergies && (
                        <View style={{ marginTop: 8, padding: 5, backgroundColor: '#FFF9E6', borderRadius: 2 }}>
                            <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#B8860B' }}>CONTRAINTES ALIMENTAIRES:</Text>
                            <Text style={{ fontSize: 8, color: '#444' }}>{selection.contact.allergies}</Text>
                        </View>
                    )}
                </View>
                <View>
                    <Text style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>DÉTAILS</Text>
                    <Text style={{ fontSize: 10 }}>Date: {selection.event.date.toLocaleDateString()}</Text>
                    <Text style={{ fontSize: 10 }}>Service: {selection.event.service.replace('_', ' ')}</Text>
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

                {/* Children Formula (Implicitly assumed for Brunch if children > 0) */}
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
            </View>

            {/* Totals */}
            <View style={styles.totals}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total HT</Text>
                    <Text style={styles.totalValue}>{formatCurrency(quote.totalHt)}</Text>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TVA 10%</Text>
                    <Text style={styles.totalValue}>{formatCurrency(quote.breakdown.vat10.tva)}</Text>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>TVA 20%</Text>
                    <Text style={styles.totalValue}>{formatCurrency(quote.breakdown.vat20.tva)}</Text>
                </View>

                {selection.discount && selection.discount.value > 0 && (
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: '#B8860B' }]}>Remise {selection.discount.type === 'PERCENT' ? `(${selection.discount.value}%)` : ''}</Text>
                        <Text style={[styles.totalValue, { color: '#B8860B' }]}>-{formatCurrency(selection.discount.type === 'PERCENT' ? (quote.totalTtc / (1 - selection.discount.value / 100)) * (selection.discount.value / 100) : selection.discount.value)}</Text>
                    </View>
                )}

                <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={[styles.totalLabel, { color: '#B8860B', fontWeight: 'bold' }]}>Total TTC</Text>
                    <Text style={[styles.totalValue, { fontSize: 14 }]}>{formatCurrency(quote.totalTtc)}</Text>
                </View>
                <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Acompte 30% demandé: {formatCurrency(quote.deposit)}</Text>
                </View>
            </View>

            {/* General Conditions */}
            <View style={{ marginTop: 30, borderTop: '1px solid #EEE', paddingTop: 15 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5, color: '#B8860B' }}>NOS CONDITIONS GÉNÉRALES DE VENTE</Text>

                <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>VALIDITÉ DE L’OPTION :</Text>
                    <Text style={{ fontSize: 7, color: '#444' }}>
                        EN L’ABSENCE DE CONFIRMATION DANS UN DÉLAI DE 10 JOURS AVANT LA VISITE, PAR LE PAIEMENT DES 30% D’ARRHES, LES OPTIONS SERONT AUTOMATIQUEMENT ANNULÉES.
                    </Text>
                </View>

                <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>CONFIRMATION DE RÉSERVATION :</Text>
                    <Text style={{ fontSize: 7, color: '#444' }}>
                        30 % D’ARRHES SONT DEMANDÉS À LA RÉSERVATION, LE SOLDE SUR PLACE OU À RÉCEPTION DE FACTURE.
                    </Text>
                </View>

                <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>CONDITIONS D’ANNULATION :</Text>
                    <Text style={{ fontSize: 7, color: '#444', marginBottom: 1 }}>• ANNULATION TOTALE 10 JOURS OUVRÉS AVANT LA DATE : 40 % DES ARRHES SONT CONSERVÉES</Text>
                    <Text style={{ fontSize: 7, color: '#444', marginBottom: 1 }}>• ANNULATION TOTALE 5 JOURS OUVRÉS AVANT LA DATE : 70 % DES ARRHES SONT CONSERVÉES</Text>
                    <Text style={{ fontSize: 7, color: '#444', marginBottom: 1 }}>• ANNULATION TOTALE 3 JOURS OUVRÉS AVANT LA DATE : 100 % DES ARRHES SONT CONSERVÉES</Text>
                    <Text style={{ fontSize: 7, color: '#444', marginBottom: 1 }}>• ANNULATION LA DATE MÊME : 100 % DU DEVIS.</Text>
                </View>

                <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', marginBottom: 2 }}>MODIFICATIONS DU NOMBRE DE PERSONNES :</Text>
                    <Text style={{ fontSize: 7, color: '#444' }}>
                        LES EFFECTIFS MINIMUMS RETENUS POUR LA FACTURATION SERONT CEUX TRANSMIS AU PLUS TARD PAR LE CLIENT 5 JOURS OUVRÉS AVANT LA DATE DU DÉNER.
                    </Text>
                </View>

                <Text style={{ fontSize: 7, color: '#666', fontStyle: 'italic', marginTop: 5 }}>
                    TOUTE RÉSERVATION VAUT ACCEPTATION DES PRÉSENTES CONDITIONS GÉNÉRALES DE VENTE.
                </Text>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>FAUBOURG 46 - 46 Boulevard Gambetta, 30000 Nîmes - Tél: 04 66 21 02 49 - Email: contact@faubourg46.fr</Text>
        </Page>
    </Document>
);
