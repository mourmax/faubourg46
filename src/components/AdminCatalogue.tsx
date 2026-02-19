import { Card, Button, Input } from './ui/components';
import type { FormulaDefinition, QuoteItem, VatRate } from '../lib/types';
import { Save, Wine, PlusCircle } from 'lucide-react';

interface AdminCatalogueProps {
    formulas: FormulaDefinition[];
    champagnes: QuoteItem[];
    extras: QuoteItem[];
    onFormulaChange: (id: string, field: 'part10Ht' | 'part20Ht', value: number) => void;
    onOptionChange: (name: string, field: 'unitPriceHt' | 'vatRate', value: number, type: 'champagne' | 'extra') => void;
    onSave: () => void;
}

export function AdminCatalogue({
    formulas,
    champagnes,
    extras,
    onFormulaChange,
    onOptionChange,
    onSave
}: AdminCatalogueProps) {
    return (
        <div className="space-y-12 pb-20">
            {/* --- FORMULAS --- */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-dark-900 uppercase tracking-widest border-l-4 border-gold-500 pl-4">Tarification Formules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formulas.map(f => (
                        <Card key={f.id} className="bg-white p-8 border border-neutral-100 shadow-xl shadow-dark-900/5 hover:border-gold-300 transition-all group rounded-[2rem]">
                            <div className="space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="text-neutral-900 font-black text-xl tracking-tight uppercase">{f.name}</div>
                                        <div className="text-[10px] text-neutral-500 font-black uppercase tracking-wider">
                                            {f.type === 'TAPAS' ? '🌙 Menu Tapas' : '☀️ Menu Brasserie'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-gold-600 uppercase tracking-widest">Total TTC</div>
                                        <div className="text-xl font-black text-dark-900">{(f.part10Ht * 1.1 + f.part20Ht * 1.2).toFixed(2)}€</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500 text-blue-600">Part HT (TVA 10%)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="bg-blue-50/50 border-blue-100 text-neutral-900 h-12 text-lg font-black"
                                            value={f.part10Ht}
                                            onChange={e => onFormulaChange(f.id, 'part10Ht', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-neutral-500 text-purple-600">Part HT (TVA 20%)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="bg-purple-50/50 border-purple-100 text-neutral-900 h-12 text-lg font-black"
                                            value={f.part20Ht}
                                            onChange={e => onFormulaChange(f.id, 'part20Ht', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* --- CHAMPAGNES --- */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 border-l-4 border-gold-500 pl-4">
                    <h2 className="text-xl font-black text-dark-900 uppercase tracking-widest">Champagnes & Vins</h2>
                    <Wine className="w-5 h-5 text-gold-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {champagnes.map(item => (
                        <Card key={item.name} className="bg-white p-6 border border-neutral-100 shadow-lg shadow-dark-900/5 rounded-2xl">
                            <div className="space-y-4">
                                <div className="text-[11px] font-black text-neutral-900 uppercase tracking-tight leading-tight min-h-[2.5em]">{item.name}</div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Prix HT</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="bg-black/5 border-neutral-100 text-neutral-900 h-10 text-sm font-black"
                                            value={item.unitPriceHt}
                                            onChange={e => onOptionChange(item.name, 'unitPriceHt', parseFloat(e.target.value) || 0, 'champagne')}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">TVA %</label>
                                        <select
                                            className="w-full bg-black/5 border-neutral-100 text-neutral-900 h-10 text-sm font-black rounded-lg px-2 appearance-none focus:outline-none focus:ring-1 focus:ring-gold-500"
                                            value={item.vatRate}
                                            onChange={e => onOptionChange(item.name, 'vatRate', parseInt(e.target.value) as VatRate, 'champagne')}
                                        >
                                            <option value={10}>10%</option>
                                            <option value={20}>20%</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-dashed border-neutral-100 flex justify-between items-center">
                                    <span className="text-[8px] font-black uppercase text-neutral-400">Total TTC</span>
                                    <span className="text-sm font-black text-gold-600">{(item.unitPriceHt * (1 + item.vatRate / 100)).toFixed(2)}€</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* --- EXTRAS --- */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 border-l-4 border-gold-500 pl-4">
                    <h2 className="text-xl font-black text-dark-900 uppercase tracking-widest">Options & Services</h2>
                    <PlusCircle className="w-5 h-5 text-gold-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {extras.map(item => (
                        <Card key={item.name} className="bg-white p-6 border border-neutral-100 shadow-lg shadow-dark-900/5 rounded-2xl">
                            <div className="space-y-4">
                                <div className="text-[11px] font-black text-neutral-900 uppercase tracking-tight">{item.name}</div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Forfait HT</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="bg-black/5 border-neutral-100 text-neutral-900 h-10 text-sm font-black"
                                            value={item.unitPriceHt}
                                            onChange={e => onOptionChange(item.name, 'unitPriceHt', parseFloat(e.target.value) || 0, 'extra')}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">TVA %</label>
                                        <select
                                            className="w-full bg-black/5 border-neutral-100 text-neutral-900 h-10 text-sm font-black rounded-lg px-2 appearance-none focus:outline-none focus:ring-1 focus:ring-gold-500"
                                            value={item.vatRate}
                                            onChange={e => onOptionChange(item.name, 'vatRate', parseInt(e.target.value) as VatRate, 'extra')}
                                        >
                                            <option value={10}>10%</option>
                                            <option value={20}>20%</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-dashed border-neutral-100 flex justify-between items-center">
                                    <span className="text-[8px] font-black uppercase text-neutral-400">Total TTC</span>
                                    <span className="text-sm font-black text-gold-600">{(item.unitPriceHt * (1 + item.vatRate / 100)).toFixed(2)}€</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-8 sticky bottom-8 p-0 rounded-3xl z-50 pointer-events-none">
                <Button onClick={onSave} className="gap-4 px-12 h-16 text-lg font-black uppercase tracking-widest shadow-xl gold-gradient pointer-events-auto hover:scale-105 active:scale-95 transition-all">
                    <Save className="w-6 h-6" />
                    Tout Enregistrer
                </Button>
            </div>
        </div>
    );
}
