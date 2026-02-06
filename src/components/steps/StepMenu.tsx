import type { QuoteSelection, FormulaDefinition } from '../../lib/types';
import { CHAMPAGNES, EXTRAS } from '../../lib/data';
import { Check, Plus, Minus, Wine, Info, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/components';
import { useLanguage } from '../../contexts/LanguageContext';

interface StepMenuProps {
    selection: QuoteSelection;
    formulas: FormulaDefinition[];
    onChange: (updates: Partial<QuoteSelection>) => void;
    onNext: () => void;
    onPrev: () => void;
    mode: 'formulas' | 'options';
}

export function StepMenu({ selection, formulas, onChange, onNext, onPrev, mode }: StepMenuProps) {
    const { formula, options, event } = selection;
    const { t } = useLanguage();

    const getAvailabilityStatus = (f: FormulaDefinition): { available: boolean; reason?: string } => {
        const day = event.date.getDay(); // 0 = Dimanche, 1-5 = Lun-Ven, 6 = Samedi
        const service = event.service;
        const isWeekend = day === 0 || day === 6;
        const isFestiveNight = day === 5 || day === 6; // Vendredi, Samedi

        // Rule: Tapas is always available
        if (f.type === 'TAPAS' && !f.id.includes('FESTIF')) {
            return { available: true };
        }

        // Rule: Midi Weekday (L-V)
        if (service === 'LUNCH' && !isWeekend) {
            return { available: true };
        }

        // Rule: Midi Weekend (S, D) -> Brunch Only (10h-15h)
        if (service === 'LUNCH' && isWeekend) {
            if (f.id.includes('BRUNCH')) {
                return { available: true };
            }
            return { available: false, reason: "Brunch UNIQUEMENT" };
        }

        // Rule: Brunch is ONLY for Lunch
        if (f.id.includes('BRUNCH') && service !== 'LUNCH') {
            return { available: false, reason: "Brunch midi uniquement" };
        }

        // Rule: Soir (Festif) V, S
        if (isFestiveNight && (service === 'DINNER_1' || service === 'DINNER_FULL')) {
            if (f.id.includes('FESTIF') || f.id.includes('FESTIVE')) {
                return { available: true };
            }
            return { available: false, reason: "Soirée Festive uniquement" };
        }

        // Rule: Soir (Autres) V, S -> Only from 22h15 (Service 2)
        if (isFestiveNight && service === 'DINNER_2') {
            return { available: true };
        }

        // General Restrictions from data.ts
        if (f.restrictions?.days && !f.restrictions.days.includes(day)) {
            return { available: false, reason: "Indisponible ce jour" };
        }

        if (f.restrictions?.maxGuests && event.guests > f.restrictions.maxGuests) {
            return { available: false, reason: `Max ${f.restrictions.maxGuests} pers.` };
        }

        return { available: true };
    };

    const handleFormulaSelect = (id: string, delta: number) => {
        const targetId = (id === 'BRUNCH_CHILD') ? 'BRUNCH_ADULT' : id;
        const selectedDef = formulas.find(f => f.id === targetId);

        if (!selectedDef || !getAvailabilityStatus(selectedDef).available) return;

        const currentFormulas = [...(selection.formulas || [])];
        const existingIndex = currentFormulas.findIndex(f => f.formula.id === id);

        if (existingIndex >= 0) {
            const newQty = currentFormulas[existingIndex].quantity + delta;
            if (newQty <= 0) {
                currentFormulas.splice(existingIndex, 1);
            } else {
                currentFormulas[existingIndex] = { ...currentFormulas[existingIndex], quantity: newQty };
            }
        } else if (delta > 0) {
            currentFormulas.push({ formula: formulas.find(f => f.id === id)!, quantity: delta });
        }

        // Backward compatibility for components still using selection.formula
        const primaryFormula = currentFormulas.length > 0 ? currentFormulas[0].formula : selection.formula;

        onChange({ formulas: currentFormulas, formula: primaryFormula });
    };

    const getFormulaQty = (id: string) => (selection.formulas || []).find(f => f.formula.id === id)?.quantity || 0;

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
        <div className="space-y-8 max-w-6xl mx-auto py-2">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-widest text-dark-900">{mode === 'formulas' ? t.menu.formulas : t.menu.options}</h2>
                <div className="flex justify-center items-center gap-4">
                    <div className="h-px w-8 bg-gold-500" />
                    <p className="text-neutral-500 text-[9px] font-black uppercase tracking-[0.3em]">{mode === 'formulas' ? t.menu.subtitle : "Sublimer votre événement"}</p>
                    <div className="h-px w-8 bg-gold-500" />
                </div>
            </div>

            {mode === 'formulas' && (
                <div className="space-y-6 pb-32">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-2 border-b border-neutral-200 pb-4">
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-widest text-dark-900">
                                Menu
                            </h3>
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
                                const qty = getFormulaQty(f.id);
                                const isSelected = qty > 0;

                                if (!available) {
                                    return (
                                        <div
                                            key={f.id}
                                            className="relative flex flex-col p-6 bg-neutral-50 border border-neutral-200 opacity-60 grayscale blur-[0.5px] group/locked overflow-hidden"
                                        >
                                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-dark-900 text-white text-[9px] font-black px-2 py-1 uppercase tracking-widest">
                                                <Info className="w-3 h-3 text-gold-500" />
                                                {reason}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                                                    {f.type === 'TAPAS' ? 'Tapas' : 'Brasserie'}
                                                </div>
                                                <h4 className="text-lg font-black text-neutral-500 uppercase tracking-widest">
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
                                            transition-all duration-500 relative flex flex-col p-8 border-2 group
                                            ${isSelected
                                                ? 'border-gold-500 bg-white shadow-2xl scale-[1.02] z-10'
                                                : 'bg-white border-neutral-100 hover:border-gold-300 hover:shadow-lg hover:-translate-y-1'}
                                        `}
                                    >
                                        {isSelected && (
                                            <div className={`absolute top-0 right-0 p-2 text-white bg-gold-500`}>
                                                <Check className="w-6 h-6" />
                                            </div>
                                        )}

                                        <div className="space-y-2 mb-8">
                                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isSelected ? 'text-gold-600' : 'text-neutral-500'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-none ${isSelected ? 'bg-gold-500' : 'bg-neutral-300'}`} />
                                                {f.type === 'TAPAS' ? 'Carte des Tapas' : 'Carte Brasserie'}
                                            </div>
                                            <h4 className="text-2xl font-black text-dark-900 tracking-widest uppercase leading-none group-hover:text-gold-600 transition-colors">
                                                {f.name}
                                            </h4>
                                        </div>

                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="text-6xl font-black gold-text-gradient drop-shadow-sm">{Math.floor(f.priceTtc)}</div>
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-black gold-text-gradient">,{(f.priceTtc % 1).toFixed(2).split('.')[1] || '00'} €</span>
                                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">/ Convive</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 bg-neutral-50 p-2 rounded-xl border border-neutral-100 shadow-inner">
                                                <button
                                                    className="h-10 w-10 flex items-center justify-center rounded bg-white hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-all disabled:opacity-30 disabled:hover:bg-white active:scale-90 border border-neutral-100/50"
                                                    onClick={() => handleFormulaSelect(f.id, -1)}
                                                    disabled={qty === 0}
                                                >
                                                    <Minus className="w-5 h-5" />
                                                </button>
                                                <span className="w-10 text-center font-black text-lg text-dark-900 tabular-nums">{qty}</span>
                                                <button
                                                    className="h-10 w-10 flex items-center justify-center rounded bg-white hover:bg-gold-50 text-gold-600 transition-all active:scale-90 border border-neutral-100/50"
                                                    onClick={() => handleFormulaSelect(f.id, 1)}
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-8 mb-12">
                                            <div className="flex items-center gap-4">
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] shrink-0">Inclusions</span>
                                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
                                            </div>
                                            <ul className="space-y-4">
                                                {f.included?.map((inc, i) => (
                                                    <li key={i} className="flex items-start gap-4 text-xs text-neutral-600 font-bold uppercase tracking-wide group/item">
                                                        <div className="w-4 h-4 bg-gold-50 flex items-center justify-center mt-0.5 shrink-0 group-hover/item:bg-gold-500 transition-colors border border-gold-100">
                                                            <div className="w-1 h-1 bg-gold-400 group-hover/item:bg-white" />
                                                        </div>
                                                        {inc.replace('E/P', 'ENTRÉE / PLAT').replace('P/D', 'PLAT / DESSERT').replace('E/P/D', 'ENTRÉE / PLAT / DESSERT')}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {f.description && (
                                            <div className="bg-neutral-50/80 p-6 rounded-[2rem] border border-neutral-100/50 relative overflow-hidden group/desc">
                                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/desc:opacity-30 transition-opacity">
                                                    <Info className="w-8 h-8 text-gold-500" />
                                                </div>
                                                <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest leading-relaxed italic text-center relative z-10">
                                                    "{f.description}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {mode === 'options' && (
                <div className="space-y-6 pb-32">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-2 border-b border-neutral-200 pb-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black uppercase tracking-widest text-dark-900">
                                Options Premium
                            </h3>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Sublimer votre événement</p>
                        </div>
                        <Wine className="w-8 h-8 text-gold-500 opacity-20" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...CHAMPAGNES, ...EXTRAS].map(item => (
                            <div key={item.name} className="flex items-center justify-between p-6 bg-white border border-neutral-100 hover:border-gold-300 hover:shadow-xl transition-all duration-300 group/item">
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-dark-900 group-hover/item:text-gold-600 transition-colors uppercase tracking-widest">{item.name}</div>
                                    <div className="flex items-baseline gap-1">
                                        {item.name === 'DJ' && (event.date.getDay() === 4 || event.date.getDay() === 5 || event.date.getDay() === 6) ? (
                                            <span className="text-green-600 font-black text-xs uppercase tracking-tighter">Offert</span>
                                        ) : (
                                            <>
                                                <span className="text-gold-600 font-black text-lg">{Math.floor(item.unitPriceTtc)}</span>
                                                <span className="text-gold-600/70 font-bold text-[10px]">,{(item.unitPriceTtc % 1).toFixed(2).split('.')[1] || '00'} €</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-neutral-50 p-1 rounded-lg border border-neutral-100 shadow-inner">
                                    <button
                                        className="h-8 w-8 flex items-center justify-center rounded bg-white hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-all disabled:opacity-30 disabled:hover:bg-white active:scale-90 border border-neutral-100/50"
                                        onClick={() => updateOptionQuantity(item.name, -1)}
                                        disabled={getOptionQty(item.name) === 0}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-black text-xs text-dark-900 tabular-nums">{getOptionQty(item.name)}</span>
                                    <button
                                        className="h-8 w-8 flex items-center justify-center rounded bg-white hover:bg-gold-50 text-gold-600 transition-all active:scale-90 border border-neutral-100/50"
                                        onClick={() => updateOptionQuantity(item.name, 1)}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                    disabled={mode === 'formulas' && !formula.id}
                    className="flex-1 max-w-md h-14 text-sm font-black uppercase tracking-widest shadow-xl bg-dark-900 text-white hover:bg-gold-500 hover:border-gold-600 transition-all rounded-none"
                >
                    {t.common.next}
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </div>
    );
}
