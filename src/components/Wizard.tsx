import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuoteSelection, FormulaDefinition } from '../lib/types';
import { FORMULAS as INITIAL_FORMULAS } from '../lib/data';
import { StepContact } from './steps/StepContact';
import { StepService } from './steps/StepService';
import { StepMenu } from './steps/StepMenu';
import { StepSummary } from './steps/StepSummary';
import { Card } from './ui/components';
import { Globe, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { AdminLoginModal } from './AdminLoginModal';

const INITIAL_SELECTION: QuoteSelection = {
    contact: { name: '', email: '', phone: '', company: '' },
    event: { date: new Date(), service: 'DINNER_1', guests: 10 },
    formula: INITIAL_FORMULAS[0],
    options: []
};

export function Wizard() {
    const [step, setStep] = useState(1);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [selection, setSelection] = useState<QuoteSelection>(INITIAL_SELECTION);
    const [formulas] = useState<FormulaDefinition[]>(() => {
        const saved = localStorage.getItem('faubourg_formulas');
        return saved ? JSON.parse(saved) : INITIAL_FORMULAS;
    });
    const { language, setLanguage, t } = useLanguage();

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const steps = [
        { id: 1, label: t.contact.title.split(' ')[0] },
        { id: 2, label: t.event.title.split(' ')[0] },
        { id: 3, label: "Menu" },
        { id: 4, label: "Devis" }
    ];

    const updateContact = (contact: Partial<QuoteSelection['contact']>) => {
        setSelection(prev => ({ ...prev, contact: { ...prev.contact, ...contact } }));
    };

    return (
        <div className="min-h-screen bg-[#fdfdfc] p-4 md:p-12 font-sans text-neutral-900 relative overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[30%] right-[10%] w-[20%] h-[20%] bg-gold-200/5 rounded-full blur-[80px] animate-bounce duration-[10s]" />
            </div>

            <div className="absolute top-6 right-6 flex gap-4 z-50">
                {/* Admin Access Button */}
                <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-neutral-100 text-neutral-400 hover:text-gold-600 hover:border-gold-200 transition-all group shadow-sm"
                >
                    <Lock className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 overflow-hidden whitespace-nowrap">Staff</span>
                </button>

                {/* Language Toggle */}
                <button
                    onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-neutral-100 text-neutral-600 hover:text-gold-600 hover:border-gold-200 transition-all font-black text-[10px] tracking-widest shadow-sm"
                >
                    <Globe className="w-3.5 h-3.5" />
                    {language.toUpperCase()}
                </button>
            </div>

            {showLoginModal && (
                <AdminLoginModal onClose={() => setShowLoginModal(false)} />
            )}

            <div className="max-w-5xl mx-auto space-y-12 relative z-10">
                {/* Header */}
                <header className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 mb-2">
                        <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] leading-none">
                        <span className="gold-text-gradient inline-block hover:scale-[1.02] transition-transform duration-700 cursor-default px-4">FAUBOURG 46</span>
                    </h1>
                    <p className="text-neutral-400 font-extrabold tracking-[0.6em] uppercase text-[11px] max-w-xs mx-auto leading-relaxed">
                        {t.common.subtitle || 'Expérience Événementielle'}
                    </p>
                </header>

                {/* Sophisticated Progress Bar */}
                <div className="max-w-2xl mx-auto pt-4 pb-8">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute top-5 left-8 right-8 h-[2px] bg-neutral-200 -z-10" />
                        <div
                            className="absolute top-5 left-8 h-[2px] bg-gold-600 -z-10 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(175,137,54,0.3)]"
                            style={{ width: `${(step - 1) * 33.3}%` }}
                        />

                        {steps.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => s.id < step && setStep(s.id)}
                                disabled={s.id >= step}
                                className="flex flex-col items-center gap-4 relative group cursor-pointer disabled:cursor-default"
                            >
                                <div className={`
                                    w-11 h-11 rounded-full flex items-center justify-center font-black text-xs transition-all duration-700
                                    ${step > s.id ? 'gold-gradient text-white shadow-lg ring-8 ring-gold-50 group-hover:scale-110' :
                                        step === s.id ? 'bg-white border-4 border-gold-600 text-gold-700 shadow-2xl scale-125 ring-8 ring-gold-100/50' :
                                            'bg-white border-2 border-neutral-200 text-neutral-400'}
                                `}>
                                    {step > s.id ? <Check className="w-5 h-5 stroke-[4]" /> : s.id}
                                </div>
                                <span className={`
                                    text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500
                                    ${step === s.id ? 'text-gold-700 scale-110' :
                                        step > s.id ? 'text-neutral-900' : 'text-neutral-400'}
                                `}>
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Container */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-gold-100 to-gold-50 rounded-[4rem] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
                    <Card className="glass-card relative p-8 md:p-14 min-h-[500px] border-none rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.02, y: -10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="h-full"
                            >
                                {step === 1 && (
                                    <StepContact
                                        contact={selection.contact}
                                        onChange={updateContact}
                                        onNext={nextStep}
                                    />
                                )}
                                {step === 2 && (
                                    <StepService
                                        event={selection.event}
                                        onChange={(evt) => setSelection(prev => ({ ...prev, event: { ...prev.event, ...evt } }))}
                                        onNext={nextStep}
                                        onPrev={prevStep}
                                    />
                                )}
                                {step === 3 && (
                                    <StepMenu
                                        selection={selection}
                                        formulas={formulas}
                                        onChange={(updates) => setSelection(prev => ({ ...prev, ...updates }))}
                                        onNext={nextStep}
                                        onPrev={prevStep}
                                    />
                                )}
                                {step === 4 && (
                                    <StepSummary
                                        selection={selection}
                                        onPrev={prevStep}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </Card>
                </div>

                {/* Floating Navigation Controls */}
                {step > 1 && step < 4 && (
                    <div className="flex justify-center gap-10 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <button
                            onClick={prevStep}
                            className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-neutral-900 transition-colors py-4 px-8"
                        >
                            &larr; {t.common.prev}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Add Check icon from lucide
import { Check } from 'lucide-react';
