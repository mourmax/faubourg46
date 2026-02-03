import type { QuoteSelection, FormulaDefinition } from '../../lib/types';
import { CHAMPAGNES, EXTRAS } from '../../lib/data';
import { Check, Plus, Minus, Wine, Info, ArrowRight } from 'lucide-react';
import { Button } from '../ui/components';
import { useLanguage } from '../../contexts/LanguageContext';

interface StepMenuProps {
    selection: QuoteSelection;
    formulas: FormulaDefinition[];
    onChange: (updates: Partial<QuoteSelection>) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function StepMenu({ selection, formulas, onChange, onNext }: StepMenuProps) {
    const { formula, options, event } = selection;
    const { t } = useLanguage();

    const getAvailabilityStatus = (f: FormulaDefinition): { available: boolean; reason?: string } => {
        const day = event.date.getDay();
        const service = event.service as string;
        const isFriSat = day === 5 || day === 6;

        if (service === 'LUNCH') {
            if (!f.id.includes('BRUNCH')) {
                return { available: false, reason: "Uniquement disponible au dîner" };
            }
            if (f.restrictions?.days && !f.restrictions.days.includes(day)) {
                return { available: false, reason: "Brunch uniquement le Samedi & Dimanche" };
            }
            return { available: true };
        }

        if (f.id.includes('BRUNCH') && service !== 'LUNCH') {
            return { available: false, reason: "Uniquement disponible au déjeuner (Brunch)" };
        }

        if (isFriSat) {
            if (service === 'DINNER_1' || service === 'DINNER_FULL') {
                if (!(f.id.includes('FESTIF') || f.id.includes('FESTIVE'))) {
                    return { available: false, reason: "Vendredi/Samedi (1er service) : Formules FESTIVE uniquement" };
                }
            }
        }

        if (f.restrictions?.days && !f.restrictions.days.includes(day)) {
            return { available: false, reason: "Non disponible ce jour de la semaine" };
        }
        if (f.restrictions?.services && !f.restrictions.services.includes(event.service)) {
            return { available: false, reason: "Non disponible pour ce créneau horaire" };
        }

        if (f.restrictions?.maxGuests && event.guests > f.restrictions.maxGuests) {
            return { available: false, reason: `Limité à ${f.restrictions.maxGuests} pers. maximum` };
        }

        return { available: true };
    };

    const handleFormulaSelect = (id: string) => {
        const selected = formulas.find(f => f.id === id);
        if (selected && getAvailabilityStatus(selected).available) {
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
                currentOptions.push({ ...catalogItem, quantity: delta, totalTtc: delta * catalogItem.unitPriceTtc, vatRate: 20 });
            }
        }
        onChange({ options: currentOptions });
    };

    const getOptionQty = (name: string) => options.find(o => o.name === name)?.quantity || 0;

    return (
        <div className="space-y-16 max-w-6xl mx-auto py-8">
            <div className="text-center space-y-4">
                <h2 className="text-5xl font-black gold-text-gradient tracking-tighter uppercase">{t.menu.title}</h2>
                <div className="flex justify-center items-center gap-4">
                    <div className="h-px w-12 bg-gold-300" />
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.4em]">{t.menu.subtitle}</p>
                    <div className="h-px w-12 bg-gold-300" />
                </div>
            </div>

            <div className="space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-neutral-100 pb-8">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-neutral-900">
                            Nos <span className="gold-text-gradient">Formules</span> Groupes
                        </h3>
                        <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mt-1">Sélectionnez l'expérience qui vous ressemble</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {[...formulas]
                        .sort((a, b) => {
                            const availA = getAvailabilityStatus(a).available ? 1 : 0;
                            const availB = getAvailabilityStatus(b).available ? 1 : 0;
                            return availB - availA;
                        })
                        .map(f => {
                            const { available, reason } = getAvailabilityStatus(f);
                            const isSelected = formula.id === f.id;

                            if (!available) {
                                return (
                                    <div
                                        key={f.id}
                                        className="relative flex flex-col p-8 rounded-[2.5rem] bg-neutral-50/50 border-2 border-dashed border-neutral-100 opacity-40 grayscale blur-[0.5px] group/locked overflow-hidden"
                                    >
                                        <div className="absolute top-4 right-6 flex items-center gap-2 bg-neutral-900 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-tighter shadow-lg">
                                            <Info className="w-3 h-3 text-gold-500" />
                                            {reason}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                                {f.type === 'TAPAS' ? 'Tapas' : 'Brasserie'}
                                            </div>
                                            <h4 className="text-xl font-black text-neutral-500 uppercase tracking-tighter">
                                                {f.name}
                                            </h4>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={f.id}
                                    className={`
                                        cursor-pointer transition-all duration-700 relative flex flex-col p-10 rounded-[3rem] border-2 group
                                        ${isSelected
                                            ? 'border-gold-500 bg-white shadow-[0_40px_80px_-20px_rgba(175,137,54,0.25)] ring-1 ring-gold-200 scale-[1.05] z-10'
                                            : 'bg-white/50 border-neutral-100 hover:border-gold-300 hover:shadow-xl hover:-translate-y-2'}
                                    `}
                                    onClick={() => handleFormulaSelect(f.id)}
                                >
                                    {isSelected && (
                                        <div className="absolute -top-3 -right-3 w-16 h-16 gold-gradient rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in-50 duration-500 ring-8 ring-white">
                                            <Check className="w-8 h-8 text-white stroke-[4]" />
                                        </div>
                                    )}

                                    <div className="space-y-2 mb-10">
                                        <div className={`text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ${isSelected ? 'text-gold-700' : 'text-neutral-500'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-gold-500 animate-pulse' : 'bg-neutral-200'}`} />
                                            {f.type === 'TAPAS' ? 'Carte des Tapas' : 'Carte Brasserie'}
                                        </div>
                                        <h4 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase leading-none group-hover:text-gold-700 transition-colors">
                                            {f.name}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-3 mb-12">
                                        <div className="text-6xl font-black gold-text-gradient drop-shadow-sm">{Math.floor(f.priceTtc)}</div>
                                        <div className="flex flex-col">
                                            <span className="text-2xl font-black gold-text-gradient">,{(f.priceTtc % 1).toFixed(2).split('.')[1] || '00'} €</span>
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">/ Convive</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-8 mb-12">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] shrink-0">Inclusions</span>
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
                                        </div>
                                        <ul className="grid grid-cols-1 gap-4">
                                            {f.included?.map((inc, i) => (
                                                <li key={i} className="flex items-start gap-4 text-[14px] text-neutral-600 font-semibold leading-snug group/item">
                                                    <div className="w-5 h-5 rounded-full bg-gold-50 flex items-center justify-center mt-0.5 shrink-0 group-hover/item:bg-gold-500 transition-colors">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gold-400 group-hover/item:bg-white" />
                                                    </div>
                                                    {inc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {f.description && (
                                        <div className="bg-neutral-50/80 p-6 rounded-[2rem] border border-neutral-100/50 relative overflow-hidden group/desc">
                                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/desc:opacity-30 transition-opacity">
                                                <Info className="w-8 h-8 text-gold-500" />
                                            </div>
                                            <p className="text-[12px] text-neutral-600 font-bold uppercase tracking-tight leading-relaxed italic text-center relative z-10">
                                                "{f.description}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>

            <div className="relative group/options pt-16">
                <div className="absolute inset-0 bg-neutral-900 rounded-[4rem] -z-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(175,137,54,0.15),transparent_60%)]" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gold-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="p-12 md:p-20 space-y-12">
                    <div className="flex justify-between items-end border-b border-white/10 pb-10">
                        <div className="space-y-2">
                            <h3 className="text-4xl font-black gold-text-gradient tracking-tighter uppercase mb-4">Options Premium</h3>
                            <div className="flex items-center gap-3">
                                <span className="w-16 h-[2px] bg-gradient-to-r from-gold-500 to-transparent" />
                                <p className="text-neutral-500 text-[11px] font-black uppercase tracking-[0.4em]">Sublimer votre événement</p>
                            </div>
                        </div>
                        <Wine className="w-12 h-12 text-gold-500 opacity-40 animate-pulse" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {[...CHAMPAGNES, ...EXTRAS].map(item => (
                            <div key={item.name} className="flex items-center justify-between p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/5 hover:border-gold-500/40 hover:bg-white/[0.08] transition-all duration-500 group/item backdrop-blur-sm">
                                <div className="flex-1 pr-6 space-y-1">
                                    <div className="text-[13px] font-black text-white group-hover/item:text-gold-400 transition-colors uppercase tracking-widest leading-tight">{item.name}</div>
                                    <div className="flex items-baseline gap-2">
                                        {item.name === 'DJ' && (event.date.getDay() === 4 || event.date.getDay() === 5 || event.date.getDay() === 6) ? (
                                            <span className="text-green-500 font-black text-2xl uppercase tracking-tighter">Offert</span>
                                        ) : (
                                            <>
                                                <span className="text-gold-500 font-black text-2xl">{Math.floor(item.unitPriceTtc)}</span>
                                                <span className="text-gold-500/70 font-bold text-xs">,{(item.unitPriceTtc % 1).toFixed(2).split('.')[1] || '00'} €</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 bg-black/60 p-4 rounded-[2rem] border border-white/10 shadow-2xl">
                                    <button
                                        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 transition-all disabled:opacity-10 disabled:hover:bg-white/5"
                                        onClick={() => updateOptionQuantity(item.name, -1)}
                                        disabled={getOptionQty(item.name) === 0}
                                    >
                                        <Minus className="w-6 h-6 stroke-[3]" />
                                    </button>
                                    <span className="w-8 text-center font-black text-3xl text-white tabular-nums">{getOptionQty(item.name)}</span>
                                    <button
                                        className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-gold-500/30 text-white hover:text-gold-400 transition-all"
                                        onClick={() => updateOptionQuantity(item.name, 1)}
                                    >
                                        <Plus className="w-6 h-6 stroke-[3]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-12 pb-8">
                <Button onClick={onNext} className="h-24 px-20 text-3xl font-black gap-6 tracking-tighter rounded-[2.5rem] gold-gradient shadow-[0_40px_80px_-15px_rgba(175,137,54,0.4)] hover:scale-105 active:scale-95 transition-all group border-b-8 border-gold-700">
                    {t.common.next}
                    <ArrowRight className="w-10 h-10 group-hover:translate-x-3 transition-transform" />
                </Button>
            </div>
        </div>
    );
}
