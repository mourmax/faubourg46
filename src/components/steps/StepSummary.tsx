import type { QuoteSelection } from '../../lib/types';
import { calculateQuoteTotal } from '../../lib/quote-engine';
import { formatCurrency } from '../../lib/utils';
import { Download, FileText, Share2, ArrowLeft, Trophy, Sparkles, Building2, CalendarDays, Users2, ShieldCheck } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { PdfDocument } from '../PdfDocument';
import { useLanguage } from '../../contexts/LanguageContext';

import { useRef, useEffect } from 'react';
import { LeadStore } from '../../lib/leads-store';

interface StepSummaryProps {
    selection: QuoteSelection;
    onPrev: () => void;
}

export function StepSummary({ selection, onPrev }: StepSummaryProps) {
    const quote = calculateQuoteTotal(selection);
    const { contact, event, formula, options } = selection;
    const { t } = useLanguage();
    const hasSaved = useRef(false);

    useEffect(() => {
        if (!hasSaved.current) {
            LeadStore.saveLead(selection);
            hasSaved.current = true;
        }
    }, [selection]);

    const handleDownload = async () => {
        try {
            const blob = await pdf(<PdfDocument selection={selection} quote={quote} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Devis_Faubourg46_${contact.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("PDF Error", e);
            alert("Erreur lors de la génération du PDF.");
        }
    };

    return (
        <div className="space-y-16 max-w-5xl mx-auto py-8">
            <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-24 h-24 gold-gradient rounded-[2rem] shadow-2xl mb-4 animate-in zoom-in duration-700 rotate-3">
                    <Trophy className="w-12 h-12 text-white stroke-[2.5]" />
                </div>
                <h2 className="text-6xl font-black gold-text-gradient tracking-tighter uppercase">{t.summary.title}</h2>
                <div className="flex justify-center items-center gap-6">
                    <div className="h-px w-16 bg-gold-300/30" />
                    <p className="text-neutral-500 text-[11px] font-black uppercase tracking-[0.6em]">{t.summary.subtitle}</p>
                    <div className="h-px w-16 bg-gold-300/30" />
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-start">
                {/* Left: Event Invitation Card */}
                <div className="lg:col-span-7 space-y-8 animate-in slide-in-from-left duration-1000">
                    <div className="bg-white p-12 rounded-[4rem] shadow-premium border border-neutral-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/5 rounded-full -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-1000" />

                        <div className="space-y-10 relative z-10">
                            <div className="flex items-center gap-4 border-b border-neutral-50 pb-8">
                                <Sparkles className="w-6 h-6 text-gold-500" />
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-neutral-500">Récapitulatif de votre événement</h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gold-600 uppercase tracking-widest">
                                        <Building2 className="w-3.5 h-3.5" /> Client
                                    </div>
                                    <div className="text-2xl font-black text-neutral-900 leading-tight">{contact.name}</div>
                                    <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest italic">{contact.company || 'Particulier'}</div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gold-600 uppercase tracking-widest">
                                        <CalendarDays className="w-3.5 h-3.5" /> Date & Service
                                    </div>
                                    <div className="text-2xl font-black text-neutral-900 leading-tight">
                                        {event.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </div>
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">{event.service.replace('_', ' ')}</div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gold-600 uppercase tracking-widest">
                                        <Users2 className="w-3.5 h-3.5" /> Convives
                                    </div>
                                    <div className="text-2xl font-black text-neutral-900 leading-tight">
                                        {event.guests} ADULTE{event.guests > 1 ? 'S' : ''}
                                        {event.childrenGuests && event.childrenGuests > 0 ? ` + ${event.childrenGuests} ENFANT${event.childrenGuests > 1 ? 'S' : ''}` : ''}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gold-600 uppercase tracking-widest">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Formule
                                    </div>
                                    <div className="text-2xl font-black text-neutral-900 leading-tight uppercase tracking-tighter">{formula.name}</div>
                                </div>
                            </div>

                            {options.length > 0 && (
                                <div className="pt-8 border-t border-neutral-50">
                                    <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-6">Options Sélectionnées</div>
                                    <div className="flex flex-wrap gap-3">
                                        {options.map(opt => (
                                            <div key={opt.name} className="px-5 py-2.5 bg-neutral-50 rounded-full text-[11px] font-black text-neutral-600 border border-neutral-100 uppercase tracking-tight">
                                                {opt.quantity}x {opt.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={onPrev}
                            className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] text-neutral-400 hover:text-gold-600 transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                            Modifier les détails
                        </button>
                    </div>
                </div>

                {/* Right: Financial Breakdown Card */}
                <div className="lg:col-span-5 space-y-8 animate-in slide-in-from-right duration-1000">
                    <div className="bg-neutral-900 rounded-[4rem] p-12 text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(175,137,54,0.15),transparent_70%)]" />

                        <div className="relative z-10 space-y-10">
                            <div className="space-y-2">
                                <div className="text-[11px] font-black text-gold-500/60 uppercase tracking-[0.5em]">Total de l'estimation</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-7xl font-black text-white tracking-tighter">{Math.floor(quote.totalTtc)}</span>
                                    <span className="text-3xl font-black text-gold-500">,{(quote.totalTtc % 1).toFixed(2).split('.')[1] || '00'} €</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-white/10">
                                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-neutral-500">
                                    <span>Montant HT</span>
                                    <span className="text-white/80">{formatCurrency(quote.totalHt)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-neutral-500">
                                    <span>TVA Totale</span>
                                    <span className="text-white/80">{formatCurrency(quote.totalTva)}</span>
                                </div>
                            </div>

                            <div className="bg-gold-500/10 border border-gold-500/20 p-8 rounded-[2.5rem] space-y-2">
                                <div className="text-[10px] font-black text-gold-500 uppercase tracking-[0.4em]">Acompte de confirmation</div>
                                <div className="text-3xl font-black text-white">{formatCurrency(quote.deposit)}</div>
                                <p className="text-white/60 font-medium leading-relaxed italic mt-4">
                                    L'acompte est nécessaire pour verrouiller la privatisation du créneau.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={handleDownload}
                                    className="w-full h-20 gold-gradient rounded-full text-lg font-black text-white hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-4 uppercase tracking-[0.1em] group"
                                >
                                    <Download className="w-6 h-6 group-hover:animate-bounce" />
                                    Télécharger le Devis
                                </button>
                                <button className="w-full h-16 rounded-full border-2 border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest">
                                    <Share2 className="w-4 h-4" /> Partager l'aperçu
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white/50 backdrop-blur-md rounded-[3rem] border border-neutral-100 flex items-start gap-4">
                        <FileText className="w-6 h-6 text-neutral-300 shrink-0" />
                        <p className="text-[11px] text-neutral-600 font-bold uppercase tracking-widest leading-relaxed">
                            Ce document est une estimation pré-remplie. Le devis définitif sera validé par notre équipe après réception de votre demande.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
