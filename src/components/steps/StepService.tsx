import React from 'react';
import { Input, Button } from '../ui/components';
import type { QuoteSelection } from '../../lib/types';
import { Calendar, Users, Clock, ArrowRight, ArrowLeft, Sun, Moon, Stars, Zap, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface StepServiceProps {
    event: QuoteSelection['event'];
    onChange: (event: Partial<QuoteSelection['event']>) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function StepService({ event, onChange, onNext, onPrev }: StepServiceProps) {
    const { t, language } = useLanguage();
    const [localEvent, setLocalEvent] = React.useState(event);

    // Sync to parent with debounce
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localEvent);
        }, 500);
        return () => clearTimeout(timer);
    }, [localEvent, onChange]);

    const handleLocalChange = (updates: Partial<QuoteSelection['event']>) => {
        setLocalEvent(prev => ({ ...prev, ...updates }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        const newDay = newDate.getDay();
        const isNewWeekend = newDay === 5 || newDay === 6;

        // If switching to a weekday/Sunday and a seating-specific dinner was selected, switch to full
        if (!isNewWeekend && (localEvent.service === 'DINNER_1' || localEvent.service === 'DINNER_2')) {
            handleLocalChange({ date: newDate, service: 'DINNER_FULL' });
        } else {
            handleLocalChange({ date: newDate });
        }
    };

    const formatDate = (date: Date) => {
        try {
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    const isWeekend = localEvent.date.getDay() === 5 || localEvent.date.getDay() === 6;

    const serviceLabels: Record<string, any> = {
        LUNCH: { label: t.services.LUNCH, sub: language === 'fr' ? 'Ambiance Brasserie' : 'Brasserie Vibe', icon: Sun },
        DINNER_1: { label: t.services.DINNER_1, sub: language === 'fr' ? 'Première partie de soirée' : 'Early evening glow', icon: Moon },
        DINNER_2: { label: t.services.DINNER_2, sub: language === 'fr' ? 'Ambiance Festive' : 'Festive Atmosphere', icon: Stars },
        DINNER_FULL: {
            label: isWeekend ? t.services.DINNER_FULL : t.services.DINNER_STD,
            sub: isWeekend
                ? (language === 'fr' ? 'L\'expérience intégrale' : 'The total experience')
                : (language === 'fr' ? 'Ambiance Faubourg' : 'Faubourg Atmosphere'),
            icon: isWeekend ? Zap : Moon
        },
    };

    const allServices = [
        { id: 'LUNCH', ...serviceLabels['LUNCH'], time: '12h00 - 15h00' },
        { id: 'DINNER_1', ...serviceLabels['DINNER_1'], time: '19h30 - 21h50' },
        { id: 'DINNER_2', ...serviceLabels['DINNER_2'], time: '22h15 - Fermeture' },
        { id: 'DINNER_FULL', ...serviceLabels['DINNER_FULL'], time: '19h30 - Fermeture' },
    ];

    const services = allServices.filter(s => {
        if (isWeekend) return true;
        // On weekdays and Sunday, only show Lunch and a generic Dinner
        return s.id === 'LUNCH' || s.id === 'DINNER_FULL';
    });

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-2">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-widest text-dark-900">{t.event.title}</h2>
                <div className="flex justify-center items-center gap-4">
                    <div className="h-px w-8 bg-gold-500" />
                    <p className="text-neutral-500 text-[9px] font-black uppercase tracking-[0.3em]">{t.event.subtitle}</p>
                    <div className="h-px w-8 bg-gold-500" />
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 pb-32">
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
                                id="event-date"
                                type="date"
                                required
                                className="h-16 border-none bg-transparent pl-6 font-black text-neutral-900 focus:ring-0"
                                value={formatDate(localEvent.date)}
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
                                id="event-guests"
                                type="number"
                                required
                                min={9}
                                className="h-16 border-none bg-transparent pl-6 font-black text-neutral-900 focus:ring-0"
                                value={localEvent.guests}
                                onChange={e => handleLocalChange({ guests: parseInt(e.target.value) || 9 })}
                            />
                        </div>
                        <div className="p-3 bg-gold-50 border border-gold-200 rounded-xl">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gold-800">
                                ⚠️ Minimum 9 personnes pour les réservations de groupe
                            </p>
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
                                    id="event-kids"
                                    type="number"
                                    min={0}
                                    className="h-16 border-none bg-transparent pl-6 font-black text-neutral-900 focus:ring-0"
                                    value={localEvent.childrenGuests || 0}
                                    onChange={e => handleLocalChange({ childrenGuests: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2">
                        <Info className="w-5 h-5 text-gold-600" />
                        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest leading-relaxed">
                            {t.event.subtitle}
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
                                        group/btn relative overflow-hidden flex items-center p-4 border transition-all duration-300
                                        ${isActive
                                            ? 'border-dark-900 bg-dark-900 text-white shadow-xl'
                                            : 'border-neutral-200 bg-white hover:border-gold-500 hover:text-gold-600'}
                                    `}
                                    onClick={() => handleLocalChange({ service: svc.id as any })}
                                >
                                    <div className={`
                                        w-12 h-12 flex items-center justify-center transition-all duration-300 mr-4 border
                                        ${isActive ? 'border-gold-500 bg-gold-500 text-white' : 'border-neutral-200 bg-neutral-50 text-neutral-400 group-hover/btn:border-gold-500 group-hover/btn:text-gold-500'}
                                    `}>
                                        <Icon className="w-6 h-6 stroke-[1.5]" />
                                    </div>

                                    <div className="flex-1 text-left">
                                        <div className={`font-black uppercase tracking-widest text-sm leading-none ${isActive ? 'text-white' : 'text-dark-900'}`}>
                                            {svc.label}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 opacity-80">
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{svc.sub}</span>
                                            <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-gold-500' : 'bg-neutral-300'}`} />
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest">
                                                <Clock className="w-3 h-3" /> {svc.time}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
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
                    onClick={onNext}
                    disabled={!localEvent.date || !localEvent.guests || !localEvent.service}
                    className="flex-1 max-w-md h-14 text-sm font-black uppercase tracking-widest shadow-xl bg-dark-900 text-white hover:bg-gold-500 hover:border-gold-600 transition-all rounded-none"
                >
                    {t.common.next}
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div >
    );
}
