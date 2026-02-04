import { useState } from 'react';
import { Card, Button, Input } from './ui/components';
import { LeadStore } from '../lib/leads-store';
import type { QuoteLead, LeadStatus } from '../lib/types';
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
    Coins
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { PdfDocument } from './PdfDocument';

interface LeadEditorProps {
    lead: QuoteLead;
    onClose: () => void;
    onUpdate: () => void;
}

export function LeadEditor({ lead: initialLead, onClose, onUpdate }: LeadEditorProps) {
    const [lead, setLead] = useState<QuoteLead>(initialLead);
    const [newComment, setNewComment] = useState('');
    const quote = calculateQuoteTotal(lead.selection);

    const handleStatusChange = async (newStatus: LeadStatus) => {
        await LeadStore.updateLead(lead.id, { status: newStatus });
        setLead(prev => ({ ...prev, status: newStatus }));
        onUpdate();
    };

    const handleContactChange = async (field: string, value: string | boolean | undefined) => {
        const updatedSelection = {
            ...lead.selection,
            contact: { ...lead.selection.contact, [field]: value }
        };
        await LeadStore.updateLead(lead.id, { selection: updatedSelection });
        setLead(prev => ({ ...prev, selection: updatedSelection }));
        onUpdate();
    };

    const handleEventChange = async (updates: Partial<QuoteLead['selection']['event']>) => {
        const updatedSelection = {
            ...lead.selection,
            event: { ...lead.selection.event, ...updates }
        };
        await LeadStore.updateLead(lead.id, { selection: updatedSelection });
        setLead(prev => ({ ...prev, selection: updatedSelection }));
        onUpdate();
    };

    const handleDiscountChange = async (type: 'PERCENT' | 'AMOUNT', value: number) => {
        const updatedSelection = {
            ...lead.selection,
            discount: { type, value }
        };
        await LeadStore.updateLead(lead.id, { selection: updatedSelection });
        setLead(prev => ({ ...prev, selection: updatedSelection }));
        onUpdate();
    };

    const handleInternalNotesChange = async (value: string) => {
        const updatedSelection = {
            ...lead.selection,
            internalNotes: value
        };
        await LeadStore.updateLead(lead.id, { selection: updatedSelection });
        setLead(prev => ({ ...prev, selection: updatedSelection }));
        onUpdate();
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

    const handleDownload = async () => {
        try {
            const blob = await pdf(<PdfDocument selection={lead.selection} quote={quote} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Devis_REGEN_${lead.id}_${lead.selection.contact.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("PDF Error", e);
            alert("Erreur lors de la génération du PDF.");
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex items-center gap-6">
                <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-gold-500/20 hover:text-gold-500 transition-all border border-white/10">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Édition Demande #{lead.id}</h2>
                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em]">Dernière mise à jour : {lead.lastUpdated.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Information Settings */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Board */}
                    <Card className="glass-card p-8 border-none space-y-6">
                        <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                            <Clock className="w-6 h-6 text-gold-600" />
                            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-widest">Statut du dossier</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {(['NEW', 'CONTACTED', 'WAITING', 'VALIDATED', 'CANCELLED'] as LeadStatus[]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleStatusChange(s)}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2
                                        ${lead.status === s
                                            ? 'gold-gradient border-gold-400 text-white shadow-lg scale-105'
                                            : 'bg-white/5 border-white/10 text-neutral-300 hover:border-white/30 hover:text-white'}`}
                                >
                                    {s === 'NEW' ? 'Nouveau' :
                                        s === 'CONTACTED' ? 'Contacté' :
                                            s === 'WAITING' ? 'En attente' :
                                                s === 'VALIDATED' ? 'Validé' : 'Annulé'}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Contact Info */}
                    <Card className="glass-card p-8 border-none space-y-8">
                        <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                            <User className="w-6 h-6 text-gold-600" />
                            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-widest">Coordonnées Client</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Nom Complet</label>
                                <Input
                                    className="bg-neutral-50 border-neutral-200 text-neutral-900 h-12 rounded-xl focus:bg-white"
                                    value={lead.selection.contact.name}
                                    onChange={e => handleContactChange('name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Entreprise</label>
                                <Input
                                    className="bg-neutral-50 border-neutral-200 text-neutral-900 h-12 rounded-xl focus:bg-white"
                                    value={lead.selection.contact.company || ''}
                                    onChange={e => handleContactChange('company', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Email</label>
                                <Input
                                    className="bg-neutral-50 border-neutral-200 text-neutral-900 h-12 rounded-xl focus:bg-white"
                                    value={lead.selection.contact.email}
                                    onChange={e => handleContactChange('email', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Téléphone</label>
                                <Input
                                    className="bg-neutral-50 border-neutral-200 text-neutral-900 h-12 rounded-xl focus:bg-white"
                                    value={lead.selection.contact.phone}
                                    onChange={e => handleContactChange('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Contraintes Alimentaires</label>
                                <Input
                                    className="bg-neutral-50 border-neutral-200 text-neutral-900 h-12 rounded-xl focus:bg-white"
                                    value={lead.selection.contact.allergies || ''}
                                    onChange={e => handleContactChange('allergies', e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Event Info */}
                    <Card className="glass-card p-8 border-none space-y-8">
                        <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                            <Calendar className="w-6 h-6 text-gold-600" />
                            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-widest">Paramètres Événement</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2 flex flex-col">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Date (YYYY-MM-DD)</label>
                                <Input
                                    type="date"
                                    className="bg-neutral-50 border-neutral-200 text-neutral-900 h-12 rounded-xl focus:bg-white"
                                    value={lead.selection.event.date.toISOString().split('T')[0]}
                                    onChange={e => handleEventChange({ date: new Date(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Nombre d'Adultes</label>
                                <Input
                                    type="number"
                                    className="bg-neutral-50 border-neutral-200 text-neutral-900 h-12 rounded-xl focus:bg-white"
                                    value={lead.selection.event.guests}
                                    onChange={e => handleEventChange({ guests: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            {lead.selection.event.service === 'LUNCH' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Nombre d'Enfants</label>
                                    <Input
                                        type="number"
                                        className="bg-neutral-50 border-neutral-200 text-neutral-900 h-12 rounded-xl focus:bg-white"
                                        value={lead.selection.event.childrenGuests || 0}
                                        onChange={e => handleEventChange({ childrenGuests: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Discount & Internal Notes */}
                    <Card className="glass-card p-8 border-none space-y-8">
                        <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                            <Tag className="w-6 h-6 text-gold-600" />
                            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-widest">Remise & Notes Internes</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Type de Remise</label>
                                    <div className="flex p-1 bg-neutral-100 rounded-xl">
                                        <button
                                            onClick={() => handleDiscountChange('PERCENT', lead.selection.discount?.value || 0)}
                                            className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lead.selection.discount?.type === 'PERCENT' ? 'bg-white text-gold-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            <Percent className="w-3 h-3 inline mr-2" />
                                            Pourcentage
                                        </button>
                                        <button
                                            onClick={() => handleDiscountChange('AMOUNT', lead.selection.discount?.value || 0)}
                                            className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lead.selection.discount?.type === 'AMOUNT' ? 'bg-white text-gold-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                                        >
                                            <Coins className="w-3 h-3 inline mr-2" />
                                            Montant Fixe
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Valeur de la Remise</label>
                                    <Input
                                        type="number"
                                        className="bg-neutral-50 border-neutral-200 text-neutral-900 h-14 rounded-xl focus:bg-white"
                                        placeholder="0"
                                        value={lead.selection.discount?.value || ''}
                                        onChange={e => handleDiscountChange(lead.selection.discount?.type || 'PERCENT', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-2">Commentaires Internes (Visible uniquement admin)</label>
                                <textarea
                                    className="w-full h-32 bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-gold-500 focus:bg-white outline-none transition-all resize-none shadow-sm"
                                    placeholder="Notes sur la négociation, particularités logistiques..."
                                    value={lead.selection.internalNotes || ''}
                                    onChange={e => handleInternalNotesChange(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
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
                                onClick={handleDownload}
                                className="w-full bg-black text-white hover:bg-neutral-900 h-14 font-black gap-3 mt-4 border-none shadow-2xl"
                            >
                                <Download className="w-5 h-5" />
                                GÉNÉRER LE PDF
                            </Button>
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
        </div>
    );
}
