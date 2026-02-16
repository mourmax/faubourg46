import type { QuoteSelection } from '../../lib/types';
import { calculateQuoteTotal } from '../../lib/quote-engine';
import { formatCurrency } from '../../lib/utils';
import { Download, FileText, ArrowLeft, Building2, CalendarDays, Users2, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/components';
import { pdf } from '@react-pdf/renderer';
import { PdfDocument } from '../PdfDocument';
import { useLanguage } from '../../contexts/LanguageContext';

import { useRef, useEffect } from 'react';
import { LeadStore } from '../../lib/leads-store';
import { SettingsStore } from '../../lib/settings-store';
import { sendNotificationEmail } from '../../lib/notifications';

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
        const saveAndNotify = async () => {
            if (!hasSaved.current) {
                // 1. Save Lead
                const newLead = await LeadStore.saveLead(selection);
                
                if (newLead) {
                    // 2. Fetch Settings
                    const settings = await SettingsStore.getSettings();
                    
                    // 3. Generate PDF for attachment
                    let pdfBlob: Blob | undefined;
                    try {
                        pdfBlob = await pdf(<PdfDocument selection={selection} quote={quote} />).toBlob();
                    } catch (e) {
                        console.error('Failed to generate PDF for notification', e);
                    }

                    // 4. Send Email Notification
                    await sendNotificationEmail(selection, settings, pdfBlob);
                }
                
                hasSaved.current = true;
            }
        };
        saveAndNotify();
    }, [selection, quote]);


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
        <div className="space-y-8 max-w-5xl mx-auto py-2">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-widest text-dark-900">{t.summary.title}</h2>
                <div className="flex justify-center items-center gap-4">
                    <div className="h-px w-8 bg-gold-500" />
                    <p className="text-neutral-500 text-[9px] font-black uppercase tracking-[0.3em]">{t.summary.subtitle}</p>
                    <div className="h-px w-8 bg-gold-500" />
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start pb-32">
                {/* Left: Event Invitation Card */}
                <div className="lg:col-span-7 space-y-6 animate-in slide-in-from-left duration-1000">
                    <div className="bg-white p-8 border border-neutral-200 shadow-sm relative overflow-hidden group">

                        <div className="space-y-10 relative z-10">
                            <div className="flex items-center gap-4 border-b border-neutral-50 pb-8">
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
                                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
                                        {(() => {
                                            const isWeekend = event.date.getDay() === 5 || event.date.getDay() === 6;
                                            if (event.service === 'LUNCH') return t.services.LUNCH;
                                            if (event.service === 'DINNER_1') return t.services.DINNER_1;
                                            if (event.service === 'DINNER_2') return t.services.DINNER_2;
                                            if (event.service === 'DINNER_FULL') return isWeekend ? t.services.DINNER_FULL : t.services.DINNER_STD;
                                            return event.service;
                                        })()}
                                    </div>
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
                                        <ShieldCheck className="w-3.5 h-3.5" /> Formule{selection.formulas.length > 1 ? 's' : ''}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {/* Formulas */}
                                        {(selection.formulas || []).map((sf, idx) => (
                                            <div key={idx} className="text-2xl font-black text-neutral-900 leading-tight uppercase tracking-tighter">
                                                {sf.quantity}x {sf.formula.name}
                                            </div>
                                        ))}
                                        {(!selection.formulas || selection.formulas.length === 0) && formula && (
                                            <div className="text-2xl font-black text-neutral-900 leading-tight uppercase tracking-tighter">
                                                {formula.name}
                                            </div>
                                        )}
                                    </div>
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

                </div>
            </div>

            {/* Right: Financial Breakdown Card */}
            {/* Right: Financial Breakdown Card */}
            <div className="lg:col-span-5 space-y-6 animate-in slide-in-from-right duration-1000">
                <div className="bg-dark-900 p-8 text-white shadow-xl relative overflow-hidden group border border-dark-900">
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

                        <div className="bg-gold-500/10 border border-gold-500/20 p-6 space-y-2">
                            <div className="text-[9px] font-black text-gold-500 uppercase tracking-[0.4em]">Acompte de confirmation</div>
                            <div className="text-3xl font-black text-white">{formatCurrency(quote.deposit)}</div>
                            <p className="text-white/60 font-medium leading-relaxed italic text-xs mt-2">
                                L'acompte est nécessaire pour verrouiller la privatisation du créneau.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border border-neutral-200 flex items-start gap-4 shadow-sm">
                    <FileText className="w-5 h-5 text-neutral-400 shrink-0" />
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest leading-relaxed">
                        Ce document est une estimation pré-remplie. Le devis définitif sera validé par notre équipe après réception de votre demande.
                    </p>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-200 z-50 flex justify-center gap-4">
                <Button
                    onClick={onPrev}
                    variant="outline"
                    className="w-1/3 max-w-[150px] h-14 text-xs font-black uppercase tracking-widest border-dark-900 text-dark-900 hover:bg-neutral-100 rounded-none"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t.common.prev}
                </Button>
                <Button
                    onClick={handleDownload}
                    className="flex-1 max-w-md h-14 text-sm font-black uppercase tracking-widest shadow-xl bg-gold-500 text-white hover:bg-gold-400 hover:border-gold-500 transition-all rounded-none gap-2 animate-pulse"
                >
                    <Download className="w-5 h-5" />
                    Télécharger le Devis
                </Button>
            </div>
        </div >
    );
}
