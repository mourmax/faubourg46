import React from 'react';
import { Input, Button } from '../ui/components';
import type { QuoteSelection } from '../../lib/types';
import { User, Mail, Phone, Building, ArrowRight, MapPin, Hash, CreditCard } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface StepContactProps {
    contact: QuoteSelection['contact'];
    onChange: (contact: Partial<QuoteSelection['contact']>) => void;
    onNext: () => void;
}

export function StepContact({ contact, onChange, onNext }: StepContactProps) {
    const { t } = useLanguage();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (contact.name && contact.email && contact.phone) {
            onNext();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10 max-w-xl mx-auto py-4">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-black gold-text-gradient tracking-tight">{t.contact.title}</h2>
                <p className="text-neutral-400 text-sm font-medium tracking-wide uppercase">{t.contact.subtitle}</p>
            </div>

            <div className="space-y-8">
                {/* Type Toggle */}
                <div className="flex p-1 bg-neutral-100 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => onChange({ isCompany: false })}
                        className={`flex-1 py-3 px-6 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${!contact.isCompany ? 'bg-white text-gold-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                        {t.contact.individual}
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange({ isCompany: true })}
                        className={`flex-1 py-3 px-6 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${contact.isCompany ? 'bg-white text-gold-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                    >
                        {t.contact.pro}
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                            {t.contact.name} *
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                            <Input
                                required
                                className="pl-12 h-14"
                                placeholder="Jean Dupont"
                                value={contact.name}
                                onChange={e => onChange({ name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                                {t.contact.email} *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                                <Input
                                    required
                                    type="email"
                                    className="pl-12 h-14"
                                    placeholder="jean@entreprise.fr"
                                    value={contact.email}
                                    onChange={e => onChange({ email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                                {t.contact.phone} *
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                                <Input
                                    required
                                    type="tel"
                                    className="pl-12 h-14"
                                    placeholder="06 12 34 56 78"
                                    value={contact.phone}
                                    onChange={e => onChange({ phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {contact.isCompany && (
                        <div className="pt-4 border-t border-neutral-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                                    {t.contact.company}
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                                    <Input
                                        className="pl-12 h-14"
                                        placeholder="Faubourg SAS"
                                        value={contact.company}
                                        onChange={e => onChange({ company: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                                    {t.contact.address}
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                                    <Input
                                        className="pl-12 h-14"
                                        placeholder="123 rue de Paris, 75001 Paris"
                                        value={contact.address}
                                        onChange={e => onChange({ address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                                        {t.contact.vatNumber}
                                    </label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                                        <Input
                                            className="pl-12 h-14"
                                            placeholder="FR 12 345678901"
                                            value={contact.vatNumber}
                                            onChange={e => onChange({ vatNumber: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 group">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                                        {t.contact.internalRef}
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                                        <Input
                                            className="pl-12 h-14"
                                            placeholder="REF-2024-001"
                                            value={contact.internalRef}
                                            onChange={e => onChange({ internalRef: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-neutral-100 space-y-2 group">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                            {t.contact.allergies}
                        </label>
                        <div className="relative">
                            <Input
                                className="h-14"
                                placeholder={t.contact.allergiesPlaceholder}
                                value={contact.allergies}
                                onChange={e => onChange({ allergies: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Button type="submit" className="w-full h-16 text-xl font-black gap-3 tracking-tighter shadow-xl gold-gradient border-b-4 border-gold-700 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {t.common.next}
                <ArrowRight className="w-6 h-6" />
            </Button>
        </form>
    );
}
