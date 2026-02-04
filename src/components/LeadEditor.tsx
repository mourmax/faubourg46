import { useState } from 'react';
import { Card, Button, Input } from './ui/components';
import { Alert } from './ui/Alert';
import { LeadStore } from '../lib/leads-store';
import type { QuoteLead, LeadStatus, InvoiceData } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { calculateQuoteTotal } from '../lib/quote-engine';
import {
    ArrowLeft,
    User,
    Calendar,
    Utensils,
    MessageSquare,
    Clock,
    Send,
    Download,
    Tag,
    Percent,
    Coins,
    Save,
    Check,
    Plus,
    Minus,
    Wine,
    FileText
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { PdfDocument } from './PdfDocument';
import { InvoicePdfDocument } from './InvoicePdfDocument';
import { InvoiceEditor } from './InvoiceEditor';
import { CHAMPAGNES, EXTRAS, FORMULAS as INITIAL_FORMULAS } from '../lib/data';

interface LeadEditorProps {
    lead: QuoteLead;
    onClose: () => void;
    onUpdate: () => void;
}

function AdminLeadMenuEditor({ selection, onChange }: { selection: QuoteLead['selection'], onChange: (updates: Partial<QuoteLead['selection']>) => void }) {
    const { formula, options } = selection;
    const formulas = INITIAL_FORMULAS;

    const handleFormulaSelect = (id: string) => {
        const selected = formulas.find(f => f.id === id);
        if (selected) {
            onChange({ formula: selected });
        }
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
            const catalogItem = [...CHAMPAGNES, ...EXTRAS].find(i => i.name === name);
            if (catalogItem) {
                currentOptions.push({ ...catalogItem, quantity: delta, totalTtc: delta * catalogItem.unitPriceTtc, vatRate: catalogItem.vatRate });
            }
        }
        onChange({ options: currentOptions });
    };

    const getOptionQty = (name: string) => options.find(o => o.name === name)?.quantity || 0;

    return (
        <div className="space-y-6">
            <Card className="glass-card p-6 border-none space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
                    <Utensils className="w-4 h-4 text-gold-600" />
                    <h4 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Choisir une Formule</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {formulas.map(f => {
                        const isSelected = formula.id === f.id;
                        return (
                            <div
                                key={f.id}
                                onClick={() => handleFormulaSelect(f.id)}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-gold-500 bg-gold-50/20' : 'border-neutral-100 bg-neutral-50/50 hover:border-gold-200'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter">{f.type}</span>
                                    {isSelected && <Check className="w-3 h-3 text-gold-600" />}
                                </div>
                                <div className="text-xs font-black text-neutral-900 uppercase truncate">{f.name}</div>
                                <div className="text-[10px] font-bold text-gold-600">{f.priceTtc}€</div>
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
                    {[...CHAMPAGNES, ...EXTRAS].map(item => {
                        const qty = getOptionQty(item.name);
                        return (
                            <div key={item.name} className="flex items-center justify-between p-3 bg-neutral-50/50 rounded-xl border border-neutral-100">
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="text-[10px] font-black text-neutral-900 uppercase truncate">{item.name}</div>
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
        </div>
    );
}

export function LeadEditor({ lead: initialLead, onClose, onUpdate }: LeadEditorProps) {
    const [activeTab, setActiveTab] = useState<'CONTACT' | 'EVENT' | 'MENU' | 'NOTES'>('CONTACT');
    const [lead, setLead] = useState<QuoteLead>(initialLead);
    const [draft, setDraft] = useState<QuoteLead>(initialLead);
    const [newComment, setNewComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showInvoiceEditor, setShowInvoiceEditor] = useState(false);
    const [alertState, setAlertState] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string } | null>(null);
    const quote = calculateQuoteTotal(draft.selection);

    const tabs = [
        { id: 'CONTACT', label: 'Coordonnées', icon: User },
        { id: 'EVENT', label: 'Événement', icon: Calendar },
        { id: 'MENU', label: 'Formules & Options', icon: Utensils },
        { id: 'NOTES', label: 'Remise & Notes', icon: Tag },
    ] as const;

    const handleStatusChange = (newStatus: LeadStatus) => {
        setDraft(prev => ({ ...prev, status: newStatus }));
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

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await LeadStore.updateLead(draft.id, {
                status: draft.status,
                selection: draft.selection
            });
            setLead(draft);
            onUpdate();
            setAlertState({ type: 'success', title: 'Modifications enregistrées !', message: 'Les changements ont été sauvegardés avec succès.' });
        } catch (error) {
            console.error(error);
            setAlertState({ type: 'error', title: 'Erreur de sauvegarde', message: 'Impossible d\'enregistrer les modifications.' });
        } finally {
            setIsSaving(false);
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
        setIsSaving(true);
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
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadQuote = async () => {
        try {
            const blob = await pdf(<PdfDocument selection={draft.selection} quote={quote} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Devis_Faubourg_${draft.id}_${draft.selection.contact.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("PDF Error", e);
            alert("Erreur lors de la génération du PDF.");
        }
    };

    const handleDownloadInvoice = async () => {
        if (!draft.invoice) return;
        try {
            const blob = await pdf(
                <InvoicePdfDocument
                    selection={draft.selection}
                    invoice={draft.invoice}
                    quoteTotals={quote}
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
                    <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em]">Dernière mise à jour : {lead.lastUpdated.toLocaleString()}</p>
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
                                    onClick={() => setActiveTab(tab.id)}
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
                                    <Button onClick={handleSaveChanges} disabled={isSaving} className="h-10 px-6 text-[10px] font-black gold-gradient transition-all border-none">
                                        <Save className="w-4 h-4 mr-2" /> {isSaving ? 'EN COURS...' : 'ENREGISTRER'}
                                    </Button>
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
                                    <Button onClick={handleSaveChanges} disabled={isSaving} className="h-10 px-6 text-[10px] font-black gold-gradient transition-all border-none">
                                        <Save className="w-4 h-4 mr-2" /> {isSaving ? 'EN COURS...' : 'ENREGISTRER'}
                                    </Button>
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
                                />
                                <div className="p-2">
                                    <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full h-16 text-sm font-black gold-gradient text-white gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-2xl border-none">
                                        <Save className="w-6 h-6" />
                                        {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER LE MENU'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'NOTES' && (
                            <Card className="bg-white p-8 border-none shadow-xl shadow-dark-900/5 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
                                    <div className="flex items-center gap-4">
                                        <Tag className="w-6 h-6 text-gold-600" />
                                        <h3 className="text-lg font-black text-dark-900 uppercase tracking-widest">Remise & Notes Internes</h3>
                                    </div>
                                    <Button onClick={handleSaveChanges} disabled={isSaving} className="h-10 px-6 text-[10px] font-black gold-gradient transition-all border-none">
                                        <Save className="w-4 h-4 mr-2" /> {isSaving ? 'EN COURS...' : 'ENREGISTRER'}
                                    </Button>
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
                    {/* Financial Summary */}
                    <Card className="gold-gradient p-8 border-none text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Utensils className="w-20 h-20" />
                        </div>
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-1">
                                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Total Devis Regénéré</div>
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
                                className="w-full bg-black text-white hover:bg-neutral-900 h-14 font-black gap-3 mt-4 border-none shadow-2xl"
                            >
                                <Download className="w-5 h-5" />
                                GÉNÉRER LE PDF
                            </Button>

                            {!draft.invoice ? (
                                <Button
                                    onClick={() => setShowInvoiceEditor(true)}
                                    className="w-full gold-gradient text-white hover:opacity-90 h-14 font-black gap-3 mt-3 border-none shadow-2xl"
                                >
                                    <FileText className="w-5 h-5" />
                                    CRÉER UNE FACTURE
                                </Button>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-1">Facture</div>
                                        <div className="text-lg font-black text-white">{draft.invoice.invoiceNumber}</div>
                                        <div className="text-[9px] text-white/70 mt-1">{draft.invoice.invoiceDate.toLocaleDateString('fr-FR')}</div>
                                    </div>
                                    <Button
                                        onClick={handleDownloadInvoice}
                                        className="w-full bg-white text-dark-900 hover:bg-neutral-100 h-12 font-black gap-3 border-none shadow-xl text-xs"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF FACTURE
                                    </Button>
                                    <Button
                                        onClick={() => setShowInvoiceEditor(true)}
                                        className="w-full bg-white/10 text-white hover:bg-white/20 h-10 font-black gap-2 border border-white/30 text-[10px]"
                                    >
                                        Modifier
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

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
                    onClose={() => setAlertState(null)}
                />
            )}
        </div>
    );
}
