import React from 'react';
import { Input, Button } from '../ui/components';
import type { QuoteSelection } from '../../lib/types';
import { Calendar, Users, Clock, ArrowRight, Sun, Moon, Stars, Zap, Info, Check } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface StepServiceProps {
    event: QuoteSelection['event'];
    onChange: (event: Partial<QuoteSelection['event']>) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function StepService({ event, onChange, onNext }: StepServiceProps) {
    const { t, language } = useLanguage();

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ date: new Date(e.target.value) });
    };

    const formatDate = (date: Date) => {
        try {
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const serviceLabels: Record<string, Record<string, any>> = {
        fr: {
            LUNCH: { label: 'Déjeuner (Midi)', sub: 'Ambiance Brasserie', icon: Sun },
            DINNER_1: { label: 'Dîner - Service 1', sub: 'Première partie de soirée', icon: Moon },
            DINNER_2: { label: 'Dîner - Service 2', sub: 'Ambiance Festive', icon: Stars },
            DINNER_FULL: { label: 'Dîner - Soirée Complète', sub: 'L\'expérience intégrale', icon: Zap },
        },
        en: {
            LUNCH: { label: 'Lunch', sub: 'Brasserie Vibe', icon: Sun },
            DINNER_1: { label: 'Dinner - 1st Seating', sub: 'Early evening glow', icon: Moon },
            DINNER_2: { label: 'Dinner - 2nd Seating', sub: 'Festive Atmosphere', icon: Stars },
            DINNER_FULL: { label: 'Dinner - Full Evening', sub: 'The total experience', icon: Zap },
        }
    };

    const services = [
        { id: 'LUNCH', ...serviceLabels[language]['LUNCH'], time: '12h00 - 15h00' },
        { id: 'DINNER_1', ...serviceLabels[language]['DINNER_1'], time: '19h30 - 21h50' },
        { id: 'DINNER_2', ...serviceLabels[language]['DINNER_2'], time: '22h15 - Fermeture' },
        { id: 'DINNER_FULL', ...serviceLabels[language]['DINNER_FULL'], time: '19h30 - Fermeture' },
    ];

    return (
        <div className="space-y-16 max-w-4xl mx-auto py-8">
            <div className="text-center space-y-4">
                <h2 className="text-5xl font-black gold-text-gradient tracking-tighter uppercase">{t.event.title}</h2>
                <div className="flex justify-center items-center gap-4">
                    <div className="h-px w-12 bg-gold-300" />
                    <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.4em]">{t.event.subtitle}</p>
                    <div className="h-px w-12 bg-gold-300" />
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-16">
                {/* Left: Date & Guests */}
                <div className="lg:col-span-5 space-y-12">
                    <div className="space-y-4 group">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-gold-500" />
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors">
                                {t.event.dateLabel}
                            </label>
                        </div>
                        <div className="relative overflow-hidden rounded-[2rem] bg-white border-2 border-neutral-100 group-focus-within:border-gold-500 transition-all duration-500 shadow-sm group-focus-within:shadow-xl">
                            <Input
                                type="date"
                                required
                                className="h-16 border-none bg-transparent pl-6 font-black text-neutral-900 focus:ring-0"
                                value={formatDate(event.date)}
                                onChange={handleDateChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 group">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-gold-500" />
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors">
                                {t.event.guestsLabel} (Adultes)
                            </label>
                        </div>
                        <div className="relative overflow-hidden rounded-[2rem] bg-white border-2 border-neutral-100 group-focus-within:border-gold-500 transition-all duration-500 shadow-sm group-focus-within:shadow-xl">
                            <Input
                                type="number"
                                required
                                min={1}
                                className="h-16 border-none bg-transparent pl-6 font-black text-neutral-900 focus:ring-0"
                                value={event.guests}
                                onChange={e => onChange({ guests: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {event.service === 'LUNCH' && (
                        <div className="space-y-4 group animate-in slide-in-from-top duration-500">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-gold-200" />
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors">
                                    Nombre d'enfants (-12 ans)
                                </label>
                            </div>
                            <div className="relative overflow-hidden rounded-[2rem] bg-white/50 border-2 border-dashed border-neutral-100 group-focus-within:border-gold-400 transition-all duration-500 shadow-sm group-focus-within:shadow-lg">
                                <Input
                                    type="number"
                                    min={0}
                                    className="h-16 border-none bg-transparent pl-6 font-black text-neutral-900 focus:ring-0"
                                    value={event.childrenGuests || 0}
                                    onChange={e => onChange({ childrenGuests: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="p-8 bg-gold-50/50 rounded-[2.5rem] border border-gold-100/50 space-y-3">
                        <Info className="w-6 h-6 text-gold-600" />
                        <p className="text-[10px] text-gold-800/60 font-black uppercase tracking-widest leading-relaxed">
                            Les disponibilités sont mises à jour en temps réel selon le calendrier Faubourg 46.
                        </p>
                    </div>
                </div>

                {/* Right: Service Selection */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Zap className="w-4 h-4 text-gold-500" />
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">
                            {t.event.serviceLabel}
                        </label>
                    </div>

                    <div className="grid gap-4">
                        {services.map(svc => {
                            const Icon = svc.icon;
                            const isActive = event.service === svc.id;

                            return (
                                <button
                                    key={svc.id}
                                    className={`
                                        group/btn relative overflow-hidden flex items-center p-6 rounded-[2.5rem] border-2 transition-all duration-700
                                        ${isActive
                                            ? 'border-gold-500 bg-white shadow-[0_30px_60px_-15px_rgba(175,137,54,0.15)] ring-1 ring-gold-200 translate-x-4'
                                            : 'border-neutral-50 bg-white/50 hover:border-gold-300 hover:bg-white'}
                                    `}
                                    onClick={() => onChange({ service: svc.id as any })}
                                >
                                    {isActive && (
                                        <div className="absolute inset-y-0 left-0 w-2 gold-gradient" />
                                    )}

                                    <div className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 mr-6
                                        ${isActive ? 'gold-gradient text-white rotate-12 scale-110 shadow-lg' : 'bg-neutral-100 text-neutral-400 group-hover/btn:bg-gold-50 group-hover/btn:text-gold-500'}
                                    `}>
                                        <Icon className="w-7 h-7 stroke-[2.5]" />
                                    </div>

                                    <div className="flex-1 text-left">
                                        <div className={`font-black uppercase tracking-tight text-lg leading-none ${isActive ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                            {svc.label}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{svc.sub}</span>
                                            <div className="w-1 h-1 rounded-full bg-gold-300" />
                                            <div className="flex items-center gap-1.5 text-[9px] text-gold-600 font-black uppercase tracking-widest">
                                                <Clock className="w-3 h-3" /> {svc.time}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`
                                        h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500
                                        ${isActive ? 'border-gold-500 bg-gold-50 text-gold-600' : 'border-neutral-100 bg-transparent text-transparent'}
                                    `}>
                                        <Check className="w-5 h-5 stroke-[4]" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <Button onClick={onNext} className="h-20 px-16 text-2xl font-black gap-4 tracking-tighter rounded-full gold-gradient shadow-[0_20px_40px_-10px_rgba(175,137,54,0.3)] hover:scale-105 active:scale-95 transition-all group">
                    {t.common.next}
                    <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                </Button>
            </div>
        </div>
    );
}
