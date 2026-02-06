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
    // Utilisation d'un état local pour la saisie afin d'éviter les lags et pertes de caractères
    const [localContact, setLocalContact] = React.useState(contact);

    // Synchronisation vers le parent avec un délais (debounce) pour éviter les lags
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localContact);
        }, 500); // 500ms de délais
        return () => clearTimeout(timer);
    }, [localContact, onChange]);

    const handleLocalChange = (updates: Partial<QuoteSelection['contact']>) => {
        setLocalContact(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (localContact.name && localContact.email && localContact.phone) {
            onNext();
        }
    };

    return (
        <form id="step-contact-form" onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto py-2">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-widest text-dark-900">{t.contact.title}</h2>
                <p className="text-neutral-500 text-xs font-bold tracking-widest uppercase">{t.contact.subtitle}</p>
            </div>

            <div className="space-y-8">
                {/* Type Toggle */}
                <div className="flex p-1 bg-neutral-100 rounded-none border border-neutral-200">
                    <button
                        type="button"
                        onClick={() => handleLocalChange({ isCompany: false })}
                        className={`flex-1 py-3 px-6 rounded-none text-xs font-black uppercase tracking-widest transition-all ${!localContact.isCompany ? 'bg-dark-900 text-white shadow-sm' : 'text-neutral-500 hover:text-dark-900'}`}
                    >
                        {t.contact.individual}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleLocalChange({ isCompany: true })}
                        className={`flex-1 py-3 px-6 rounded-none text-xs font-black uppercase tracking-widest transition-all ${localContact.isCompany ? 'bg-dark-900 text-white shadow-sm' : 'text-neutral-500 hover:text-dark-900'}`}
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
                                id="contact-name"
                                required
                                className="pl-12 h-14"
                                placeholder="Jean Dupont"
                                value={localContact.name}
                                onChange={e => handleLocalChange({ name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                                {localContact.isCompany ? t.contact.email : 'Email'} *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                                <Input
                                    id="contact-email"
                                    required
                                    type="email"
                                    className="pl-12 h-14"
                                    placeholder="jean@entreprise.fr"
                                    value={localContact.email}
                                    onChange={e => handleLocalChange({ email: e.target.value })}
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
                                    id="contact-phone"
                                    required
                                    type="tel"
                                    className="pl-12 h-14"
                                    placeholder="06 12 34 56 78"
                                    value={localContact.phone}
                                    onChange={e => handleLocalChange({ phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {localContact.isCompany && (
                        <div className="pt-4 border-t border-neutral-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="space-y-2 group">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 group-focus-within:text-gold-600 transition-colors px-1">
                                    {t.contact.company}
                                </label>
                                <div className="relative">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-focus-within:text-gold-500 transition-colors" />
                                    <Input
                                        id="contact-company"
                                        className="pl-12 h-14"
                                        placeholder="Faubourg SAS"
                                        value={localContact.company}
                                        onChange={e => handleLocalChange({ company: e.target.value })}
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
                                        id="contact-address"
                                        className="pl-12 h-14"
                                        placeholder="123 rue de Paris, 75001 Paris"
                                        value={localContact.address}
                                        onChange={e => handleLocalChange({ address: e.target.value })}
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
                                            id="contact-vat"
                                            className="pl-12 h-14"
                                            placeholder="FR 12 345678901"
                                            value={localContact.vatNumber}
                                            onChange={e => handleLocalChange({ vatNumber: e.target.value })}
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
                                            id="contact-ref"
                                            className="pl-12 h-14"
                                            placeholder="REF-2024-001"
                                            value={localContact.internalRef}
                                            onChange={e => handleLocalChange({ internalRef: e.target.value })}
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
                                id="contact-allergies"
                                className="h-14"
                                placeholder={t.contact.allergiesPlaceholder}
                                value={localContact.allergies}
                                onChange={e => handleLocalChange({ allergies: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-200 z-50 flex justify-center">
                <Button
                    type="submit"
                    form="step-contact-form"
                    className="w-full max-w-md h-14 text-sm font-black uppercase tracking-widest shadow-xl bg-dark-900 text-white hover:bg-gold-500 hover:border-gold-600 transition-all rounded-none"
                >
                    {t.common.next}
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>
        </form>
    );
}
