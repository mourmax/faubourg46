import { useState, useMemo } from 'react';
import { Card, Button, Input } from './ui/components';
import { Alert } from './ui/Alert';
import type { QuoteLead, FormulaDefinition, QuoteItem, LeadStatus, InvoiceData } from '../lib/types';
import { LeadStore } from '../lib/leads-store';
import { SettingsStore } from '../lib/settings-store';
import { sendNotificationEmail } from '../lib/notifications';
import { calculateQuoteTotal } from '../lib/quote-engine';
import { formatCurrency } from '../lib/utils';
import { pdf } from '@react-pdf/renderer';
import { PdfDocument } from './PdfDocument';
import { InvoicePdfDocument } from './InvoicePdfDocument';
import {
    Calendar,
    Utensils,
    Tag,
    Clock,
    Download,
    FileText,
    ArrowLeft,
    Wine,
    Percent,
    Coins,
    Plus,
    Minus,
    Loader2,
    MessageSquare,
    Send,
    User,
    FilePlus,
    FileEdit
} from 'lucide-react';



import { InvoiceEditor } from './InvoiceEditor';
import { CHAMPAGNES, EXTRAS, FORMULAS as INITIAL_FORMULAS } from '../lib/data';
import { getFormulaAvailability } from '../lib/quote-engine';

interface LeadEditorProps {
    lead: QuoteLead;
    catalogueFormulas?: FormulaDefinition[];
    catalogueChampagnes?: QuoteItem[];
    catalogueExtras?: QuoteItem[];
    onClose: () => void;
    onUpdate: () => void;
}

function AdminLeadMenuEditor({
    selection,
    onChange,
    catalogueFormulas = INITIAL_FORMULAS,
    catalogueChampagnes = CHAMPAGNES,
    catalogueExtras = EXTRAS
}: {
    selection: QuoteLead['selection'],
    onChange: (updates: Partial<QuoteLead['selection']>) => void,
    catalogueFormulas?: FormulaDefinition[],
    catalogueChampagnes?: QuoteItem[],
    catalogueExtras?: QuoteItem[]
}) {
    const { formulas: selectedFormulas = [], options, formula: primaryFormula, event } = selection;
    const formulas = catalogueFormulas;

    const getAvailabilityStatus = (f: any) => {
        return getFormulaAvailability(f, event.date, event.service, event.guests);
    };

    const handleFormulaQuantity = (id: string, delta: number) => {
        const def = formulas.find(f => f.id === id);
        if (!def || (delta > 0 && !getAvailabilityStatus(def).available)) return;

        const currentFormulas = [...selectedFormulas];
        const existingIndex = currentFormulas.findIndex(f => f.formula.id === id);

        if (existingIndex >= 0) {
            const newQty = currentFormulas[existingIndex].quantity + delta;
            if (newQty <= 0) {
                currentFormulas.splice(existingIndex, 1);
            } else {
                currentFormulas[existingIndex] = { ...currentFormulas[existingIndex], quantity: newQty };
            }
        } else if (delta > 0) {
            currentFormulas.push({ formula: def, quantity: delta });
        }

        onChange({
            formulas: currentFormulas,
            formula: currentFormulas.length > 0 ? currentFormulas[0].formula : primaryFormula
        });
    };

    // ... rest of helper functions ...
    const handleCustomPrice = (id: string, price: number) => {
        const currentFormulas = selectedFormulas.map(sf => {
            if (sf.formula.id === id) {
                return { ...sf, customPrice: price === sf.formula.priceTtc ? undefined : price };
            }
            return sf;
        });
        onChange({ formulas: currentFormulas });
    };

    const getFormulaQty = (id: string) => selectedFormulas.find(f => f.formula.id === id)?.quantity || 0;
    const getFormulaPrice = (id: string) => {
        const sf = selectedFormulas.find(f => f.formula.id === id);
        return sf?.customPrice !== undefined ? sf.customPrice : (formulas.find(f => f.id === id)?.priceTtc || 0);
    };

    const updateOptionQuantity = (name: string, delta: number) => {
        const currentOptions = [...options];
        const existingIndex = currentOptions.findIndex(o => o.name === name);

        if (existingIndex >= 0) {
            const newQty = currentOptions[existingIndex].quantity + delta;
            if (newQty <= 0) {
                currentOptions.splice(existingIndex, 1);
            } else {
                currentOptions[existingIndex] = { ...currentOptions[existingIndex], quantity: newQty, totalTtc: newQty * currentOptions[existingIndex].unitPriceTtc };
            }
        } else if (delta > 0) {
            const catalogItem = [...catalogueChampagnes, ...catalogueExtras].find(i => i.name === name);
            if (catalogItem) {
                currentOptions.push({ ...catalogItem, quantity: delta, totalTtc: delta * catalogItem.unitPriceTtc, vatRate: catalogItem.vatRate });
            }
        }
        onChange({ options: currentOptions });
    };

    const getOptionQty = (name: string) => options.find(o => o.name === name)?.quantity || 0;

    const totalFormulaQty = selectedFormulas.reduce((sum, f) => sum + f.quantity, 0);
    const guestCount = selection.event.guests;
    const isQtyMismatch = totalFormulaQty !== guestCount;

    return (
        <div className="space-y-6">
            <Card className="glass-card p-6 border-none space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-3">
                        <Utensils className="w-4 h-4 text-gold-600" />
                        <h4 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Choisir les Formules</h4>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Total Formules</div>
                        <div className={`text-xs font-black transition-colors ${isQtyMismatch ? 'text-red-500' : 'text-green-600'}`}>
                            {totalFormulaQty} / {guestCount} convives
                        </div>
                    </div>
                </div>

                {isQtyMismatch && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                        <Clock className="w-4 h-4 text-red-500" />
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                            Attention: Le nombre de formules ({totalFormulaQty}) ne correspond pas au nombre de convives ({guestCount}).
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    {/* Render all formulas (Catalog + Selected but not in catalog) */}
                    {formulas.concat(
                        selectedFormulas
                            .map(sf => sf.formula)
                            .filter(sf => !formulas.find(f => f.id === sf.id))
                    ).map(f => {
                        const { available, reason } = getAvailabilityStatus(f);
                        const qty = getFormulaQty(f.id);
                        const isSelected = qty > 0;
                        const price = getFormulaPrice(f.id);
                        const isUnknown = !formulas.find(cat => cat.id === f.id);

                        return (
                            <div
                                key={f.id}
                                className={`p-4 border-2 rounded-xl transition-all relative overflow-hidden ${isSelected ? 'border-gold-500 bg-gold-50/20' : 'border-neutral-100 bg-neutral-50/50'} ${!available && !isSelected ? 'opacity-50 grayscale' : ''}`}
                            >
                                {isUnknown && (
                                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest rounded-sm z-10">
                                        ARCHIVE
                                    </div>
                                )}
                                {!available && (
                                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-dark-900 text-white text-[7px] font-black px-1.5 py-0.5 uppercase tracking-widest rounded-sm z-10">
                                        <Clock className="w-2 h-2 text-gold-500" />
                                        {reason}
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <div className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter">{f.type}</div>
                                        <div className="text-xs font-black text-neutral-900 uppercase">{f.name}</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-neutral-100">
                                        <button onClick={() => handleFormulaQuantity(f.id, -1)} disabled={qty === 0} className="p-1 hover:text-red-500 disabled:opacity-20">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-4 text-center text-[11px] font-black">{qty}</span>
                                        <button
                                            onClick={() => handleFormulaQuantity(f.id, 1)}
                                            disabled={!available && qty === 0}
                                            className="p-1 hover:text-gold-500 disabled:opacity-20"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gold-200/50">
                                        <label className="text-[9px] font-black text-gold-700 uppercase">Prix Pers. (€)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-20 bg-white border border-gold-200 rounded px-2 py-1 text-[10px] font-bold outline-none focus:border-gold-500"
                                            value={price}
                                            onChange={(e) => handleCustomPrice(f.id, parseFloat(e.target.value) || 0)}
                                        />
                                        <span className="text-[9px] text-neutral-400">(Standard: {f.priceTtc}€)</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card className="glass-card p-6 border-none space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
                    <Wine className="w-4 h-4 text-gold-600" />
                    <h4 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Options supplémentaires</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {[...catalogueChampagnes, ...catalogueExtras].map(item => {
                        const qty = getOptionQty(item.name);

                        let hint = "";
                        if (item.name.includes("Café")) {
                            hint = `Conseillé: ${guestCount} (1/pers)`;
                        } else if (item.name.includes("Eau")) {
                            const btlQty = Math.ceil(guestCount / 2);
                            hint = `Conseillé: ${btlQty} (1 btl pour 2 pers)`;
                        } else if (item.name.includes("Gâteau")) {
                            hint = `Conseillé: ${guestCount} (4,5€/pers)`;
                        }

                        return (
                            <div key={item.name} className="flex items-center justify-between p-3 bg-neutral-50/50 rounded-xl border border-neutral-100">
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="text-[10px] font-black text-neutral-900 uppercase truncate">{item.name}</div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-[9px] font-bold text-gold-600">{item.unitPriceTtc}€</div>
                                        {hint && <div className="text-[8px] font-black text-neutral-400 uppercase tracking-tighter italic border-l border-neutral-200 pl-2">{hint}</div>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-lg border border-neutral-100">
                                    <button onClick={() => updateOptionQuantity(item.name, -1)} disabled={qty === 0} className="p-1 hover:text-red-500 disabled:opacity-20">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-4 text-center text-[11px] font-black">{qty}</span>
                                    <button onClick={() => updateOptionQuantity(item.name, 1)} className="p-1 hover:text-gold-500">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Champ Libre (Optionnel) */}
            <Card className="glass-card p-6 border-none space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
                    <Plus className="w-4 h-4 text-gold-600" />
                    <h4 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Ajouter un champ libre (Optionnel)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Libellé libre</label>
                        <Input
                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-12 rounded-xl focus:bg-white focus:border-gold-500 text-xs"
                            placeholder="Ex: Frais de dossier..."
                            value={selection.customItem?.label || ''}
                            onChange={e => onChange({
                                customItem: { ...(selection.customItem || { priceTtc: 0, vatRate: 20, quantity: 1 }), label: e.target.value }
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Quantité</label>
                        <Input
                            type="number"
                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-12 rounded-xl focus:bg-white focus:border-gold-500 text-xs"
                            placeholder="1"
                            value={selection.customItem?.quantity || ''}
                            onChange={e => onChange({
                                customItem: { ...(selection.customItem || { label: '', priceTtc: 0, vatRate: 20 }), quantity: parseInt(e.target.value) || 0 }
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Prix Unit. TTC (€)</label>
                        <Input
                            type="number"
                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-12 rounded-xl focus:bg-white focus:border-gold-500 text-xs"
                            placeholder="0.00"
                            value={selection.customItem?.priceTtc || ''}
                            onChange={e => onChange({
                                customItem: { ...(selection.customItem || { label: '', vatRate: 20, quantity: 1 }), priceTtc: parseFloat(e.target.value) || 0 }
                            })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">TVA (%)</label>
                        <div className="flex p-1 bg-neutral-100 rounded-xl h-12">
                            <button
                                onClick={() => onChange({
                                    customItem: { ...(selection.customItem || { label: '', priceTtc: 0, quantity: 1 }), vatRate: 10 }
                                })}
                                className={`flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selection.customItem?.vatRate === 10 ? 'bg-white text-gold-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                            >
                                10%
                            </button>
                            <button
                                onClick={() => onChange({
                                    customItem: { ...(selection.customItem || { label: '', priceTtc: 0, quantity: 1 }), vatRate: 20 }
                                })}
                                className={`flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${selection.customItem?.vatRate !== 10 ? 'bg-white text-gold-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                            >
                                20%
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// Helper to generate reference (JJMMYY-HH:MM)
const generateReference = (date: Date = new Date()) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}${month}${year}-${hours}:${minutes}`;
};

export function LeadEditor({
    lead: initialLead,
    catalogueFormulas,
    catalogueChampagnes,
    catalogueExtras,
    onClose,
    onUpdate
}: LeadEditorProps) {
    const [activeTab, setActiveTab] = useState<'CONTACT' | 'EVENT' | 'MENU' | 'NOTES'>('CONTACT');
    const [lead, setLead] = useState<QuoteLead>(initialLead);
    const [draft, setDraft] = useState<QuoteLead>(initialLead);
    const [newComment, setNewComment] = useState('');
    const [showInvoiceEditor, setShowInvoiceEditor] = useState(false);
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    const [alertState, setAlertState] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string; duration?: number } | null>(null);
    const catalogueOptions = useMemo(() => [...(catalogueChampagnes || []), ...(catalogueExtras || [])], [catalogueChampagnes, catalogueExtras]);
    const quote = calculateQuoteTotal(draft.selection, catalogueFormulas, catalogueOptions);


    const cartSummary = useMemo(() => {
        const { formulas = [], options = [], customItem, event } = draft.selection;
        const drinkCat = catalogueChampagnes || CHAMPAGNES;
        const extraCat = catalogueExtras || EXTRAS;

        const items: { label: string; qty: number; pu: number; total: number; type: string }[] = [];

        // 1. Formulas (Individual)
        formulas.forEach(f => {
            const qty = f.quantity;
            if (qty > 0) {
                const pu = f.customPrice ?? f.formula.priceTtc;
                items.push({
                    label: f.formula.name,
                    qty,
                    pu,
                    total: qty * pu,
                    type: 'FORMULE'
                });
            }
        });

        // 2. Drinks (Individual)
        options.filter(opt => drinkCat.some(c => c.name === opt.name)).forEach(o => {
            if (o.quantity > 0) {
                items.push({
                    label: o.name,
                    qty: o.quantity,
                    pu: o.unitPriceTtc,
                    total: o.quantity * o.unitPriceTtc,
                    type: 'BOISSON'
                });
            }
        });

        // 3. Extras (Individual)
        options.filter(opt => extraCat.some(e => e.name === opt.name)).forEach(o => {
            if (o.quantity > 0 || o.name === 'Gâteau d’anniversaire') {
                let qty = o.quantity;
                let pu = o.unitPriceTtc;

                if (o.name === 'DJ') {
                    const day = draft.selection.event.date.getDay();
                    if (day === 4 || day === 5 || day === 6) pu = 0;
                }

                if (o.name === 'Gâteau d’anniversaire') {
                    qty = event.guests;
                    pu = 4.5;
                }

                if (qty > 0) {
                    items.push({
                        label: o.name,
                        qty,
                        pu,
                        total: qty * pu,
                        type: 'EXTRA'
                    });
                }
            }
        });

        // 4. Custom Item
        if (customItem && customItem.priceTtc !== 0) {
            items.push({
                label: customItem.label || 'Champ Libre',
                qty: customItem.quantity || 1,
                pu: customItem.priceTtc,
                total: (customItem.quantity || 1) * customItem.priceTtc,
                type: 'EXTRA'
            });
        }

        return items;
    }, [draft.selection, catalogueChampagnes, catalogueExtras]);

    const tabs = [
        { id: 'CONTACT', label: 'Coordonnées', icon: User },
        { id: 'EVENT', label: 'Événement', icon: Calendar },
        { id: 'MENU', label: 'Formules & Options', icon: Utensils },
        { id: 'NOTES', label: 'Remise & Notes', icon: Tag },
    ] as const;

    const handleStatusChange = async (newStatus: LeadStatus) => {
        setDraft(prev => ({ ...prev, status: newStatus }));
        try {
            const updatedLead = await LeadStore.updateLead(draft.id, {
                status: newStatus,
                selection: draft.selection
            });

            if (updatedLead) {
                setLead(updatedLead);
                setDraft(updatedLead);
                onUpdate();
                setAlertState({
                    type: 'success',
                    title: 'Statut mis à jour',
                    duration: 1500
                });
            }
        } catch (error: any) {
            console.error('[LeadEditor] Status update failed:', error);
            setAlertState({
                type: 'error',
                title: 'Erreur',
                message: 'Échec de mise à jour du statut.'
            });
        }
    };

    const handleContactChange = (field: string, value: string | boolean | undefined) => {
        setDraft(prev => ({
            ...prev,
            selection: {
                ...prev.selection,
                contact: { ...prev.selection.contact, [field]: value }
            }
        }));
    };

    const handleEventChange = (updates: Partial<QuoteLead['selection']['event']>) => {
        setDraft(prev => ({
            ...prev,
            selection: {
                ...prev.selection,
                event: { ...prev.selection.event, ...updates }
            }
        }));
    };

    const handleSelectionChange = (updates: Partial<QuoteLead['selection']>) => {
        setDraft(prev => ({
            ...prev,
            selection: {
                ...prev.selection,
                ...updates
            }
        }));
    };

    const handleDiscountChange = (type: 'PERCENT' | 'AMOUNT', value: number) => {
        setDraft(prev => ({
            ...prev,
            selection: {
                ...prev.selection,
                discount: { type, value }
            }
        }));
    };

    const handleInternalNotesChange = (value: string) => {
        setDraft(prev => ({
            ...prev,
            selection: {
                ...prev.selection,
                internalNotes: value
            }
        }));
    };

    const handleSaveChanges = async (showNotification = true) => {
        console.log('[LeadEditor] Saving changes...', draft.selection);
        try {
            const updatedLead = await LeadStore.updateLead(draft.id, {
                status: draft.status,
                selection: draft.selection
            });

            if (updatedLead) {
                setLead(updatedLead);
                setDraft(updatedLead);
                onUpdate();
                if (showNotification) {
                    setAlertState({
                        type: 'success',
                        title: 'Enregistré',
                        duration: 1500
                    });
                }
            } else {
                throw new Error("Le serveur n'a pas renvoyé le dossier mis à jour.");
            }
        } catch (error: any) {
            console.error('[LeadEditor] Save failed:', error);
            setAlertState({
                type: 'error',
                title: 'Erreur de sauvegarde',
                message: error?.message || 'Échec de sauvegarde. Vérifiez votre connexion.'
            });
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const comment = await LeadStore.addComment(lead.id, newComment);
        if (comment) {
            setLead(prev => ({ ...prev, comments: [...prev.comments, comment] }));
            setNewComment('');
            onUpdate();
        }
    };

    const handleSaveInvoice = async (invoiceData: InvoiceData) => {
        try {
            await LeadStore.updateLead(draft.id, {
                invoice: invoiceData
            });
            setDraft(prev => ({ ...prev, invoice: invoiceData }));
            setLead(prev => ({ ...prev, invoice: invoiceData }));
            setShowInvoiceEditor(false);
            onUpdate();
            setAlertState({ type: 'success', title: 'Facture enregistrée !', message: `Facture ${invoiceData.invoiceNumber} créée avec succès.` });
        } catch (error) {
            console.error(error);
            setAlertState({ type: 'error', title: 'Erreur de sauvegarde', message: 'Impossible d\'enregistrer la facture.' });
        }
    };

    const handleResendNotification = async () => {
        setIsSendingNotification(true);
        try {
            const settings = await SettingsStore.getSettings();
            await sendNotificationEmail(draft.selection, draft.id, settings);
            setAlertState({
                type: 'success',
                title: 'Notification envoyée',
                message: 'L\'email de notification a été renvoyé avec succès.'
            });
        } catch (error) {
            console.error(error);
            setAlertState({
                type: 'error',
                title: 'Échec de l\'envoi',
                message: 'Une erreur est survenue lors de l\'envoi de la notification.'
            });
        } finally {
            setIsSendingNotification(false);
        }
    };

    const handleDownloadQuote = async () => {
        try {
            const newRef = generateReference();

            // Update draft selection with the new reference
            const updatedSelection = {
                ...draft.selection,
                lastReference: newRef
            };

            // Force save with new selection before download
            const updatedLead = await LeadStore.updateLead(draft.id, {
                status: draft.status,
                selection: updatedSelection
            });

            if (updatedLead) {
                setLead(updatedLead);
                setDraft(updatedLead);
                onUpdate();
            }

            const blob = await pdf(<PdfDocument selection={updatedSelection} quote={quote} reference={newRef} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Devis_Faubourg_${newRef}_${draft.selection.contact.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setAlertState({
                type: 'success',
                title: 'Devis généré',
                message: `Version ${newRef} enregistrée et téléchargée.`
            });
        } catch (e) {
            console.error("PDF Error", e);
            setAlertState({ type: 'error', title: 'Erreur', message: 'Échec de génération du devis.' });
        }
    };

    const handleDownloadInvoice = async () => {
        if (!draft.invoice) return;
        try {
            const blob = await pdf(
                <InvoicePdfDocument
                    selection={draft.selection}
                    invoice={draft.invoice}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Facture_${draft.invoice.invoiceNumber}_${draft.selection.contact.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("PDF Error", e);
            alert("Erreur lors de la génération du PDF de facture.");
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex items-center gap-6">
                <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-dark-900 hover:bg-dark-900 hover:text-white transition-all shadow-xl shadow-dark-900/5 border border-neutral-100">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-dark-900 uppercase tracking-tighter">Édition Demande #{lead.id}</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em]">Dernière mise à jour : {lead.lastUpdated.toLocaleString()}</p>
                        {lead.selection.lastReference && (
                            <span className="text-[10px] font-black bg-gold-50 text-gold-600 px-3 py-1 rounded-full tracking-tighter border border-gold-100 uppercase">
                                Réf Devis: {lead.selection.lastReference}
                            </span>
                        )}
                        <span className="text-[10px] bg-neutral-100 px-2 rounded font-mono">
                            Formules: {draft.selection.formulas?.length || 0}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Information Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Board - Always Visible at Top */}
                    <Card className="bg-white p-6 border-none shadow-xl shadow-dark-900/5 rounded-[2rem]">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-3 pr-4 border-r border-neutral-100">
                                <Clock className="w-5 h-5 text-gold-600" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-dark-900">Statut</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(['NEW', 'CONTACTED', 'WAITING', 'VALIDATED', 'CANCELLED'] as LeadStatus[]).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleStatusChange(s)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border
                                            ${draft.status === s
                                                ? 'bg-dark-900 border-dark-900 text-white shadow-lg scale-105'
                                                : 'bg-neutral-50 border-neutral-100 text-neutral-400 hover:border-gold-300'}`}
                                    >
                                        {s === 'NEW' ? 'Nouveau' :
                                            s === 'CONTACTED' ? 'Contacté' :
                                                s === 'WAITING' ? 'En attente' :
                                                    s === 'VALIDATED' ? 'Validé' : 'Annulé'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Tab Navigation */}
                    <div className="flex bg-white p-2 rounded-[2rem] border border-neutral-100 shadow-xl shadow-dark-900/5 overflow-x-auto no-scrollbar">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={async () => {
                                        if (activeTab !== tab.id) {
                                            await handleSaveChanges(false); // Silent save before switch
                                            setActiveTab(tab.id);
                                        }
                                    }}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 justify-center
                                        ${isActive ? 'bg-gold-500 text-white shadow-lg' : 'text-neutral-400 hover:text-dark-900 hover:bg-neutral-50'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[500px]">
                        {activeTab === 'CONTACT' && (
                            <Card className="bg-white p-8 border-none shadow-xl shadow-dark-900/5 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
                                    <div className="flex items-center gap-4">
                                        <User className="w-6 h-6 text-gold-600" />
                                        <h3 className="text-lg font-black text-dark-900 uppercase tracking-widest">Coordonnées Client</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Nom Complet</label>
                                        <Input
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.contact.name}
                                            onChange={e => handleContactChange('name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Entreprise</label>
                                        <Input
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.contact.company || ''}
                                            onChange={e => handleContactChange('company', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Email</label>
                                        <Input
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.contact.email}
                                            onChange={e => handleContactChange('email', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Téléphone</label>
                                        <Input
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.contact.phone}
                                            onChange={e => handleContactChange('phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Adresse de la société</label>
                                        <Input
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.contact.address || ''}
                                            onChange={e => handleContactChange('address', e.target.value)}
                                            placeholder="Adresse complète..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Numéro de TVA</label>
                                        <Input
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.contact.vatNumber || ''}
                                            onChange={e => handleContactChange('vatNumber', e.target.value)}
                                            placeholder="FR..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Référence interne / N° de commande</label>
                                        <Input
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.contact.internalRef || ''}
                                            onChange={e => handleContactChange('internalRef', e.target.value)}
                                            placeholder="REF-..."
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Contraintes Alimentaires</label>
                                        <Input
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.contact.allergies || ''}
                                            onChange={e => handleContactChange('allergies', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'EVENT' && (
                            <Card className="bg-white p-8 border-none shadow-xl shadow-dark-900/5 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
                                    <div className="flex items-center gap-4">
                                        <Calendar className="w-6 h-6 text-gold-600" />
                                        <h3 className="text-lg font-black text-dark-900 uppercase tracking-widest">Paramètres Événement</h3>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 flex flex-col">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Date (YYYY-MM-DD)</label>
                                        <Input
                                            type="date"
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.event.date.toISOString().split('T')[0]}
                                            onChange={e => handleEventChange({ date: new Date(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Moment du service</label>
                                        <select
                                            className="w-full h-14 bg-neutral-50 border border-neutral-100 rounded-2xl px-4 text-xs font-black uppercase tracking-widest text-neutral-900 focus:border-gold-500 outline-none transition-all"
                                            value={draft.selection.event.service}
                                            onChange={e => handleEventChange({ service: e.target.value as any })}
                                        >
                                            <option value="LUNCH">☀️ Midi (Déjeuner / Brunch)</option>
                                            <option value="DINNER_1">🌙 Soir - Service 1 (19h-22h)</option>
                                            <option value="DINNER_2">🌙 Soir - Service 2 (22h15+)</option>
                                            <option value="DINNER_FULL">✨ Soir Complet / Privatisation</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Nombre d'Adultes</label>
                                        <Input
                                            type="number"
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.event.guests}
                                            onChange={e => handleEventChange({ guests: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Nombre d'Enfants</label>
                                        <Input
                                            type="number"
                                            className="bg-neutral-50 border-neutral-100 text-neutral-900 h-14 rounded-2xl focus:bg-white focus:border-gold-500"
                                            value={draft.selection.event.childrenGuests || 0}
                                            onChange={e => handleEventChange({ childrenGuests: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'MENU' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <AdminLeadMenuEditor
                                    selection={draft.selection}
                                    onChange={handleSelectionChange}
                                    catalogueFormulas={catalogueFormulas}
                                    catalogueChampagnes={catalogueChampagnes}
                                    catalogueExtras={catalogueExtras}
                                />
                            </div>
                        )}

                        {activeTab === 'NOTES' && (
                            <Card className="bg-white p-8 border-none shadow-xl shadow-dark-900/5 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
                                    <div className="flex items-center gap-4">
                                        <Tag className="w-6 h-6 text-gold-600" />
                                        <h3 className="text-lg font-black text-dark-900 uppercase tracking-widest">Remise & Notes Internes</h3>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Type de Remise</label>
                                            <div className="flex p-1.5 bg-neutral-100 rounded-2xl">
                                                <button
                                                    onClick={() => handleDiscountChange('PERCENT', draft.selection.discount?.value || 0)}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${draft.selection.discount?.type === 'PERCENT' ? 'bg-white text-gold-600 shadow-xl' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                >
                                                    <Percent className="w-3 h-3 inline mr-2" />
                                                    Pourcentage
                                                </button>
                                                <button
                                                    onClick={() => handleDiscountChange('AMOUNT', draft.selection.discount?.value || 0)}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${draft.selection.discount?.type === 'AMOUNT' ? 'bg-white text-gold-600 shadow-xl' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                >
                                                    <Coins className="w-3 h-3 inline mr-2" />
                                                    Montant Fixe
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Valeur de la Remise</label>
                                            <Input
                                                type="number"
                                                className="bg-neutral-50 border-neutral-100 text-neutral-900 h-16 rounded-2xl focus:bg-white focus:border-gold-500"
                                                placeholder="0"
                                                value={draft.selection.discount?.value || ''}
                                                onChange={e => handleDiscountChange(draft.selection.discount?.type || 'PERCENT', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Commission Agence</label>
                                            <div className="flex p-1.5 bg-neutral-100 rounded-2xl">
                                                <button
                                                    onClick={() => setDraft(prev => ({ ...prev, selection: { ...prev.selection, agencyCommission: { type: 'PERCENT', value: prev.selection.agencyCommission?.value || 0 } } }))}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${draft.selection.agencyCommission?.type === 'PERCENT' ? 'bg-white text-gold-600 shadow-xl' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                >
                                                    <Percent className="w-3 h-3 inline mr-2" />
                                                    %
                                                </button>
                                                <button
                                                    onClick={() => setDraft(prev => ({ ...prev, selection: { ...prev.selection, agencyCommission: { type: 'FIXED', value: prev.selection.agencyCommission?.value || 0 } } }))}
                                                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${draft.selection.agencyCommission?.type === 'FIXED' ? 'bg-white text-gold-600 shadow-xl' : 'text-neutral-500 hover:text-neutral-700'}`}
                                                >
                                                    <Coins className="w-3 h-3 inline mr-2" />
                                                    Fixe
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Valeur Commission</label>
                                            <Input
                                                type="number"
                                                className="bg-neutral-50 border-neutral-100 text-neutral-900 h-16 rounded-2xl focus:bg-white focus:border-gold-500"
                                                placeholder="0"
                                                value={draft.selection.agencyCommission?.value || ''}
                                                onChange={e => setDraft(prev => ({ ...prev, selection: { ...prev.selection, agencyCommission: { type: prev.selection.agencyCommission?.type || 'PERCENT', value: parseFloat(e.target.value) || 0 } } }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Commentaires Internes (Admin uniquement)</label>
                                        <textarea
                                            className="w-full h-40 bg-neutral-50 border border-neutral-100 rounded-[2rem] p-6 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-gold-500 focus:bg-white outline-none transition-all resize-none shadow-inner"
                                            placeholder="Notes sur la négociation, particularités logistiques..."
                                            value={draft.selection.internalNotes || ''}
                                            onChange={e => handleInternalNotesChange(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </Card>
                        )}

                    </div>
                </div>

                {/* Right Sidebar: Totals & Comments */}
                <div className="space-y-8">
                    {/* Detailed Selection Summary (Basket) */}
                    {cartSummary.length > 0 && (
                        <Card className="bg-dark-900 p-8 border-none text-white shadow-2xl rounded-[2.5rem] space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <Utensils className="w-5 h-5 text-gold-500" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Détail du panier</h3>
                            </div>

                            <div className="space-y-5 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                                {cartSummary.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start gap-4 group pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm tracking-widest ${item.type === 'FORMULE' ? 'bg-gold-600 text-white' :
                                                    item.type === 'BOISSON' ? 'bg-blue-600 text-white' :
                                                        'bg-neutral-600 text-white'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-black text-white/95 uppercase leading-tight">
                                                {item.label}
                                            </span>
                                            <span className="text-[10px] font-bold text-white/40 mt-1.5 tabular-nums">
                                                {item.qty} × {formatCurrency(item.pu)}
                                            </span>
                                        </div>
                                        <div className="text-sm font-black tracking-tight text-gold-500 whitespace-nowrap pt-5 tabular-nums">
                                            {formatCurrency(item.total)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Financial Summary */}
                    <Card className="gold-gradient p-8 border-none text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Utensils className="w-20 h-20" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">TOTAL DEVIS ACTUEL</div>
                                <div className="text-5xl font-black tracking-tighter tabular-nums drop-shadow-sm">{formatCurrency(quote.totalTtc)}</div>
                            </div>

                            <div className="pt-6 border-t border-white/20 grid grid-cols-2 gap-y-4 gap-x-8">
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/60">HT Total</div>
                                    <div className="text-sm font-black tracking-widest">{formatCurrency(quote.totalHt)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/60">TVA 10%</div>
                                    <div className="text-sm font-black tracking-widest">{formatCurrency(quote.breakdown.vat10.tva)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/60">TVA 20%</div>
                                    <div className="text-sm font-black tracking-widest">{formatCurrency(quote.breakdown.vat20.tva)}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/60">TVA Totale</div>
                                    <div className="text-sm font-black tracking-widest">{formatCurrency(quote.totalTva)}</div>
                                </div>
                                <div className="col-span-2 pt-2">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-white/60">Acompte 30%</div>
                                    <div className="text-base font-black tracking-widest text-white">{formatCurrency(quote.deposit)}</div>
                                </div>
                            </div>

                            <Button
                                onClick={handleDownloadQuote}
                                className="w-full h-16 text-sm font-black uppercase tracking-widest bg-white text-dark-900 gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl border-none mt-4"
                            >
                                <FileText className="w-5 h-5 text-gold-600" />
                                Générer le Devis PDF
                            </Button>

                            {draft.invoice ? (
                                <div className="space-y-2 mt-2">
                                    <Button
                                        onClick={handleDownloadInvoice}
                                        className="w-full h-14 text-xs font-black uppercase tracking-widest bg-dark-900 text-white gap-3 shadow-xl hover:bg-neutral-800 transition-all rounded-2xl border-none"
                                    >
                                        <Download className="w-5 h-5" />
                                        Générer la Facture PDF
                                    </Button>
                                    <Button
                                        onClick={() => setShowInvoiceEditor(true)}
                                        className="w-full h-12 text-[10px] font-black uppercase tracking-widest bg-white/10 text-white gap-3 hover:bg-white/20 transition-all rounded-2xl border border-white/20"
                                    >
                                        <FileEdit className="w-4 h-4" />
                                        Modifier la Facture
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => setShowInvoiceEditor(true)}
                                    className="w-full h-14 text-xs font-black uppercase tracking-widest bg-dark-900 text-white gap-3 shadow-xl hover:bg-neutral-800 transition-all rounded-2xl border-none mt-2"
                                >
                                    <FilePlus className="w-5 h-5" />
                                    Transformer en Facture
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Button
                        onClick={handleResendNotification}
                        disabled={isSendingNotification}
                        className="w-full h-14 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 gap-3 border-blue-100 hover:bg-blue-100 transition-all rounded-2xl"
                        variant="outline"
                    >
                        {isSendingNotification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Renvoyer notification email
                    </Button>

                    {/* Tracking Comments */}
                    <Card className="bg-white p-8 border-none flex flex-col h-[600px] shadow-2xl">
                        <div className="flex items-center gap-4 border-b border-neutral-100 pb-6 mb-6">
                            <MessageSquare className="w-6 h-6 text-gold-600" />
                            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-widest">Suivi & Notes</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6 scrollbar-thin scrollbar-thumb-neutral-200">
                            {lead.comments.map(c => (
                                <div key={c.id} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 space-y-2">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-neutral-500">
                                        <span className="text-neutral-900">{c.author}</span>
                                        <span>{new Date(c.date).toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-neutral-800 leading-relaxed font-semibold">{c.text}</p>
                                </div>
                            ))}
                            {lead.comments.length === 0 && (
                                <div className="text-center py-10 text-[10px] text-neutral-400 font-bold uppercase tracking-widest italic">
                                    Aucun commentaire pour le moment
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAddComment} className="mt-auto space-y-3">
                            <textarea
                                className="w-full h-24 bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-gold-500 focus:bg-white outline-none transition-all resize-none shadow-sm"
                                placeholder="Ajouter un commentaire de suivi..."
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                            />
                            <Button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="w-full h-12 text-xs font-black uppercase tracking-widest gap-2 bg-neutral-900 text-white hover:bg-black"
                            >
                                <Send className="w-4 h-4" />
                                Ajouter Note
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>

            {/* Invoice Editor Modal */}
            {showInvoiceEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <InvoiceEditor
                            existingInvoice={draft.invoice}
                            quoteSelection={draft.selection}
                            onSave={handleSaveInvoice}
                            onCancel={() => setShowInvoiceEditor(false)}
                        />
                    </div>
                </div>
            )}

            {/* Alert Notification */}
            {alertState && (
                <Alert
                    type={alertState.type}
                    title={alertState.title}
                    message={alertState.message}
                    duration={alertState.duration}
                    onClose={() => setAlertState(null)}
                />
            )}
        </div>
    );
}

