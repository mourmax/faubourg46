import { useState } from 'react';
import { Card, Button, Input } from './ui/components';
import { FileText, Plus, Trash2, DollarSign, Save } from 'lucide-react';
import type { InvoiceData, CustomLineItem, VatRate, QuoteSelection } from '../lib/types';
import { formatCurrency } from '../lib/utils';

interface InvoiceEditorProps {
    existingInvoice?: InvoiceData;
    quoteSelection: QuoteSelection;
    onSave: (invoice: InvoiceData) => void;
    onCancel: () => void;
}

export function InvoiceEditor({ existingInvoice, quoteSelection, onSave, onCancel }: InvoiceEditorProps) {
    // Initialize invoice with quote items if creating new
    const initializeInvoice = (): InvoiceData => {
        if (existingInvoice) return existingInvoice;

        // Convert quote items to custom line items
        const quoteItems: CustomLineItem[] = [];

        // Add formulas
        (quoteSelection.formulas || []).forEach(sf => {
            if (sf.quantity <= 0) return;
            const priceTtc = sf.customPrice !== undefined ? sf.customPrice : sf.formula.priceTtc;
            const priceHt = priceTtc / 1.1; // Standard 10% VAT assumption for formulas in invoice
            quoteItems.push({
                id: `formula-${sf.formula.id}`,
                description: `${sf.formula.name} (${sf.quantity} pers.)`,
                quantity: sf.quantity,
                unitPriceHt: priceHt,
                vatRate: 10,
                totalHt: priceHt * sf.quantity,
                totalTva: (priceHt * sf.quantity) * 0.1,
                totalTtc: priceTtc * sf.quantity
            });
        });

        // Backward compatibility if formulas is empty but single formula exists
        if (quoteSelection.formulas.length === 0 && quoteSelection.formula) {
            const formulaPriceHt = quoteSelection.formula.priceTtc / 1.1;
            quoteItems.push({
                id: 'formula',
                description: `${quoteSelection.formula.name} (${quoteSelection.event.guests} pers.)`,
                quantity: quoteSelection.event.guests,
                unitPriceHt: formulaPriceHt,
                vatRate: 10,
                totalHt: formulaPriceHt * quoteSelection.event.guests,
                totalTva: (formulaPriceHt * quoteSelection.event.guests) * 0.1,
                totalTtc: quoteSelection.formula.priceTtc * quoteSelection.event.guests
            });
        }

        // Add options
        quoteSelection.options.forEach(opt => {
            if (opt.quantity > 0) {
                const optionPriceHt = opt.unitPriceTtc / 1.2; // Assuming 20% VAT for options
                quoteItems.push({
                    id: `option-${opt.name}`,
                    description: opt.name,
                    quantity: opt.quantity,
                    unitPriceHt: optionPriceHt,
                    vatRate: 20,
                    totalHt: optionPriceHt * opt.quantity,
                    totalTva: (optionPriceHt * opt.quantity) * 0.2,
                    totalTtc: opt.unitPriceTtc * opt.quantity
                });
            }
        });

        // Add discount if exists
        if (quoteSelection.discount && quoteSelection.discount.value > 0) {
            const subtotalTtc = quoteItems.reduce((sum, item) => sum + item.totalTtc, 0);
            const discountAmount = quoteSelection.discount.type === 'PERCENT'
                ? subtotalTtc * (quoteSelection.discount.value / 100)
                : quoteSelection.discount.value;

            if (discountAmount > 0) {
                const discountHt = discountAmount / 1.1; // Default to 10% VAT for discount
                quoteItems.push({
                    id: 'discount',
                    description: `Remise ${quoteSelection.discount.type === 'PERCENT' ? `(${quoteSelection.discount.value}%)` : ''}`,
                    quantity: 1,
                    unitPriceHt: -discountHt,
                    vatRate: 10,
                    totalHt: -discountHt,
                    totalTva: -(discountAmount - discountHt),
                    totalTtc: -discountAmount
                });
            }
        }

        return {

            invoiceNumber: '',
            invoiceDate: new Date(),
            customItems: quoteItems,
            depositReceived: false,
            depositAmount: 0,
            depositDate: undefined,
            depositMethod: ''
        };
    };

    const [invoice, setInvoice] = useState<InvoiceData>(initializeInvoice());

    const addCustomItem = () => {
        const newItem: CustomLineItem = {
            id: `custom-${Math.random().toString(36).substring(2, 9)}`,
            description: '',
            quantity: 1,
            unitPriceHt: 0,
            vatRate: 10,
            totalHt: 0,
            totalTva: 0,
            totalTtc: 0
        };
        setInvoice(prev => ({
            ...prev,
            customItems: [...prev.customItems, newItem]
        }));
    };

    const removeCustomItem = (id: string) => {
        setInvoice(prev => ({
            ...prev,
            customItems: prev.customItems.filter(item => item.id !== id)
        }));
    };

    const updateCustomItem = (id: string, updates: Partial<CustomLineItem>) => {
        setInvoice(prev => ({
            ...prev,
            customItems: prev.customItems.map(item => {
                if (item.id !== id) return item;

                const updated = { ...item, ...updates };
                const totalHt = updated.quantity * updated.unitPriceHt;
                const totalTva = totalHt * (updated.vatRate / 100);
                const totalTtc = totalHt + totalTva;

                return {
                    ...updated,
                    totalHt,
                    totalTva,
                    totalTtc
                };
            })
        }));
    };

    const calculateTotals = () => {
        const totals = invoice.customItems.reduce((acc, item) => {
            if (item.vatRate === 10) {
                acc.ht10 += item.totalHt;
                acc.tva10 += item.totalTva;
            } else {
                acc.ht20 += item.totalHt;
                acc.tva20 += item.totalTva;
            }
            acc.totalHt += item.totalHt;
            acc.totalTva += item.totalTva;
            acc.totalTtc += item.totalTtc;
            return acc;
        }, { ht10: 0, tva10: 0, ht20: 0, tva20: 0, totalHt: 0, totalTva: 0, totalTtc: 0 });

        return totals;
    };

    const totals = calculateTotals();
    const balanceDue = totals.totalTtc - (invoice.depositReceived ? (invoice.depositAmount || 0) : 0);

    // Check if item is from quote (not custom)
    const isQuoteItem = (id: string) => id === 'formula' || id.startsWith('option-');

    return (
        <div className="space-y-6 p-8">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-6">
                <div className="flex items-center gap-4">
                    <FileText className="w-6 h-6 text-gold-600" />
                    <h3 className="text-lg font-black text-dark-900 uppercase tracking-widest">
                        {existingInvoice ? 'Modifier la Facture' : 'Créer une Facture'}
                    </h3>
                </div>
            </div>

            <Card className="bg-white p-6 border border-neutral-100 rounded-2xl space-y-6">
                <h4 className="text-sm font-black text-dark-900 uppercase tracking-widest">Informations Facture</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Numéro de Facture</label>
                        <Input
                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                            value={invoice.invoiceNumber}
                            onChange={e => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                            placeholder="F2026-001"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Date de Facture</label>
                        <Input
                            type="date"
                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                            value={invoice.invoiceDate.toISOString().split('T')[0]}
                            onChange={e => setInvoice(prev => ({ ...prev, invoiceDate: new Date(e.target.value) }))}
                        />
                    </div>
                </div>
            </Card>

            <Card className="bg-white p-6 border border-neutral-100 rounded-2xl space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-dark-900 uppercase tracking-widest">Postes de Facturation</h4>
                    <Button
                        onClick={addCustomItem}
                        className="h-10 px-4 text-[10px] font-black bg-gold-500 text-white hover:bg-gold-600 border-none"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Ajouter un poste
                    </Button>
                </div>

                <div className="space-y-4">
                    {invoice.customItems.map((item) => (
                        <div key={item.id} className={`p-4 rounded-2xl border space-y-4 ${isQuoteItem(item.id) ? 'bg-gold-50/30 border-gold-200' : 'bg-neutral-50 border-neutral-100'}`}>
                            {isQuoteItem(item.id) && (
                                <div className="text-[9px] font-black uppercase tracking-widest text-gold-600 mb-2">
                                    📋 Du devis
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Description</label>
                                    <Input
                                        className="bg-white border-neutral-100 text-neutral-900 h-12 rounded-xl"
                                        value={item.description}
                                        onChange={e => updateCustomItem(item.id, { description: e.target.value })}
                                        placeholder="Service ou produit"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Qté</label>
                                    <Input
                                        type="number"
                                        className="bg-white border-neutral-100 text-neutral-900 h-12 rounded-xl"
                                        value={item.quantity}
                                        onChange={e => updateCustomItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">P.U. HT</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="bg-white border-neutral-100 text-neutral-900 h-12 rounded-xl"
                                        value={item.unitPriceHt || ''}
                                        onChange={e => updateCustomItem(item.id, { unitPriceHt: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">TVA</label>
                                    <select
                                        className="w-full h-12 bg-white border border-neutral-100 rounded-xl px-3 text-xs font-black text-neutral-900"
                                        value={item.vatRate}
                                        onChange={e => updateCustomItem(item.id, { vatRate: parseInt(e.target.value) as VatRate })}
                                    >
                                        <option value={10}>10%</option>
                                        <option value={20}>20%</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                                <div className="text-xs font-black text-neutral-900">
                                    Total: {formatCurrency(item.totalTtc)} <span className="text-[9px] text-neutral-400">(HT: {formatCurrency(item.totalHt)} + TVA: {formatCurrency(item.totalTva)})</span>
                                </div>
                                {!isQuoteItem(item.id) && (
                                    <button
                                        onClick={() => removeCustomItem(item.id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-neutral-200 space-y-2 bg-gold-50/20 p-4 rounded-2xl">
                    <div className="grid grid-cols-2 gap-4 text-xs font-black">
                        <div className="text-neutral-600">HT TVA 10%:</div>
                        <div className="text-right text-neutral-900">{formatCurrency(totals.ht10)}</div>
                        <div className="text-neutral-600">TVA 10%:</div>
                        <div className="text-right text-neutral-900">{formatCurrency(totals.tva10)}</div>
                        <div className="text-neutral-600">HT TVA 20%:</div>
                        <div className="text-right text-neutral-900">{formatCurrency(totals.ht20)}</div>
                        <div className="text-neutral-600">TVA 20%:</div>
                        <div className="text-right text-neutral-900">{formatCurrency(totals.tva20)}</div>
                        <div className="text-gold-600 text-sm pt-2 border-t border-neutral-200">Total TTC:</div>
                        <div className="text-right text-gold-600 text-sm pt-2 border-t border-neutral-200">{formatCurrency(totals.totalTtc)}</div>
                    </div>
                </div>
            </Card>

            <Card className="bg-white p-6 border border-neutral-100 rounded-2xl space-y-6">
                <div className="flex items-center gap-4">
                    <DollarSign className="w-6 h-6 text-gold-600" />
                    <h4 className="text-sm font-black text-dark-900 uppercase tracking-widest">Acompte</h4>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <input
                            type="checkbox"
                            id="depositReceived"
                            className="w-5 h-5 rounded border-neutral-300 text-gold-600 focus:ring-gold-500"
                            checked={invoice.depositReceived}
                            onChange={e => setInvoice(prev => ({ ...prev, depositReceived: e.target.checked }))}
                        />
                        <label htmlFor="depositReceived" className="text-sm font-black text-neutral-900 uppercase tracking-widest">
                            Acompte reçu
                        </label>
                    </div>

                    {invoice.depositReceived && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top duration-300">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Montant</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                    value={invoice.depositAmount || ''}
                                    onChange={e => setInvoice(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Date</label>
                                <Input
                                    type="date"
                                    className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                    value={invoice.depositDate?.toISOString().split('T')[0] || ''}
                                    onChange={e => setInvoice(prev => ({ ...prev, depositDate: new Date(e.target.value) }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Moyen de paiement</label>
                                <Input
                                    className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                    value={invoice.depositMethod || ''}
                                    onChange={e => setInvoice(prev => ({ ...prev, depositMethod: e.target.value }))}
                                    placeholder="Virement, CB, Chèque..."
                                />
                            </div>
                        </div>
                    )}

                    {invoice.depositReceived && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                            <div className="grid grid-cols-2 gap-2 text-sm font-black">
                                <div className="text-green-700">Solde restant dû:</div>
                                <div className="text-right text-green-900 text-lg">{formatCurrency(balanceDue)}</div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="flex gap-4">
                <Button
                    onClick={onCancel}
                    className="flex-1 h-16 text-sm font-black bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border-none rounded-2xl"
                >
                    Annuler
                </Button>
                <Button
                    onClick={() => onSave(invoice)}
                    disabled={!invoice.invoiceNumber}
                    className="flex-1 h-16 text-sm font-black gold-gradient text-white gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl border-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" />
                    Enregistrer la facture
                </Button>
            </div>
        </div>
    );
}
