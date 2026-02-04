import { Card, Button, Input } from './ui/components';
import type { FormulaDefinition, QuoteItem } from '../lib/types';
import { Save, Wine, PlusCircle } from 'lucide-react';

interface AdminCatalogueProps {
    formulas: FormulaDefinition[];
    champagnes: QuoteItem[];
    extras: QuoteItem[];
    onPriceChange: (id: string, newPrice: number) => void;
    onOptionPriceChange: (name: string, newPrice: number, type: 'champagne' | 'extra') => void;
    onSave: () => void;
}

export function AdminCatalogue({
    formulas,
    champagnes,
    extras,
    onPriceChange,
    onOptionPriceChange,
    onSave
}: AdminCatalogueProps) {
    return (
        <div className="space-y-12 pb-20">
            {/* --- FORMULAS --- */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-white uppercase tracking-widest border-l-4 border-gold-500 pl-4">Tarification Formules</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formulas.map(f => (
                        <Card key={f.id} className="glass-card p-6 border-none hover:ring-2 hover:ring-gold-500/20 transition-all group">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="text-neutral-900 font-black text-xl tracking-tight uppercase">{f.name}</div>
                                        <div className="text-[10px] text-neutral-500 font-black uppercase tracking-wider">
                                            {f.type === 'TAPAS' ? '🌙 Menu Tapas' : '☀️ Menu Brasserie'}
                                        </div>
                                    </div>
                                    <div className="text-gold-500 font-black opacity-20 group-hover:opacity-100 transition-opacity">€</div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Prix TTC / Convive</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            className="bg-black/5 border-neutral-200 text-neutral-900 h-14 text-xl font-black focus:border-gold-500 focus:ring-1 focus:ring-gold-500 pl-6"
                                            value={f.priceTtc}
                                            onChange={e => onPriceChange(f.id, parseFloat(e.target.value) || 0)}
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
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Champagnes & Vins</h2>
                    <Wine className="w-5 h-5 text-gold-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {champagnes.map(item => (
                        <Card key={item.name} className="glass-card p-5 border-none">
                            <div className="space-y-3">
                                <div className="text-[11px] font-black text-neutral-900 uppercase tracking-tight leading-tight min-h-[2em]">{item.name}</div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Prix Unitaire TTC</label>
                                    <Input
                                        type="number"
                                        className="bg-black/5 border-neutral-100 text-neutral-900 h-10 text-sm font-black"
                                        value={item.unitPriceTtc}
                                        onChange={e => onOptionPriceChange(item.name, parseFloat(e.target.value) || 0, 'champagne')}
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* --- EXTRAS --- */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 border-l-4 border-gold-500 pl-4">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Options & Services</h2>
                    <PlusCircle className="w-5 h-5 text-gold-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extras.map(item => (
                        <Card key={item.name} className="glass-card p-5 border-none">
                            <div className="space-y-3">
                                <div className="text-[11px] font-black text-neutral-900 uppercase tracking-tight">{item.name}</div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Forfait TTC</label>
                                    <Input
                                        type="number"
                                        className="bg-black/5 border-neutral-100 text-neutral-900 h-10 text-sm font-black"
                                        value={item.unitPriceTtc}
                                        onChange={e => onOptionPriceChange(item.name, parseFloat(e.target.value) || 0, 'extra')}
                                    />
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
