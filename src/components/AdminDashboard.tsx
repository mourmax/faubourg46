import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/components';
import { LogOut, LayoutDashboard, Database, Briefcase } from 'lucide-react';
import { FORMULAS as INITIAL_FORMULAS, CHAMPAGNES as INITIAL_CHAMPAGNES, EXTRAS as INITIAL_EXTRAS } from '../lib/data';
import type { FormulaDefinition, QuoteItem, QuoteLead } from '../lib/types';
import { AdminCatalogue } from './AdminCatalogue';
import { AdminLeads } from './AdminLeads';
import { LeadEditor } from './LeadEditor';

export function AdminDashboard() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState<'CATALOGUE' | 'LEADS'>('LEADS');
    const [editingLead, setEditingLead] = useState<QuoteLead | null>(null);

    const [formulas, setFormulas] = useState<FormulaDefinition[]>(() => {
        const saved = localStorage.getItem('faubourg_formulas');
        return saved ? JSON.parse(saved) : INITIAL_FORMULAS;
    });

    const [champagnes, setChampagnes] = useState<QuoteItem[]>(() => {
        const saved = localStorage.getItem('faubourg_champagnes');
        return saved ? JSON.parse(saved) : INITIAL_CHAMPAGNES;
    });

    const [extras, setExtras] = useState<QuoteItem[]>(() => {
        const saved = localStorage.getItem('faubourg_extras');
        return saved ? JSON.parse(saved) : INITIAL_EXTRAS;
    });

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handlePriceChange = (id: string, newPrice: number) => {
        setFormulas(prev => prev.map(f =>
            f.id === id ? { ...f, priceTtc: newPrice } : f
        ));
    };

    const handleOptionPriceChange = (name: string, newPrice: number, type: 'champagne' | 'extra') => {
        const setter = type === 'champagne' ? setChampagnes : setExtras;
        setter(prev => prev.map(item =>
            item.name === name ? { ...item, unitPriceTtc: newPrice } : item
        ));
    };

    const handleSave = () => {
        localStorage.setItem('faubourg_formulas', JSON.stringify(formulas));
        localStorage.setItem('faubourg_champagnes', JSON.stringify(champagnes));
        localStorage.setItem('faubourg_extras', JSON.stringify(extras));
        alert('Catalogue mis à jour avec succès !');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-neutral-900 p-4 md:p-8 flex flex-col items-center">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] gold-gradient opacity-5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] gold-gradient opacity-5 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-6xl space-y-12 relative z-10 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-white/10 pb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 gold-gradient rounded-lg flex items-center justify-center">
                                <LayoutDashboard className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-4xl font-black gold-text-gradient tracking-tighter">DASHBOARD</h1>
                        </div>
                        <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px] text-center md:text-left">Gestion Faubourg 46</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <button
                            onClick={() => { setCurrentTab('LEADS'); setEditingLead(null); }}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${currentTab === 'LEADS' ? 'gold-gradient text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Briefcase className="w-4 h-4" />
                            Demandes
                        </button>
                        <button
                            onClick={() => { setCurrentTab('CATALOGUE'); setEditingLead(null); }}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${currentTab === 'CATALOGUE' ? 'gold-gradient text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Database className="w-4 h-4" />
                            Catalogue
                        </button>
                        <div className="w-px h-8 bg-white/10 mx-2" />
                        <button onClick={handleLogout} className="p-3 text-neutral-500 hover:text-red-400 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {editingLead ? (
                        <LeadEditor
                            lead={editingLead}
                            onClose={() => setEditingLead(null)}
                            onUpdate={() => { }} // Re-render logic is handled by local state in components if needed
                        />
                    ) : currentTab === 'CATALOGUE' ? (
                        <AdminCatalogue
                            formulas={formulas}
                            champagnes={champagnes}
                            extras={extras}
                            onPriceChange={handlePriceChange}
                            onOptionPriceChange={handleOptionPriceChange}
                            onSave={handleSave}
                        />
                    ) : (
                        <AdminLeads onEdit={setEditingLead} />
                    )}
                </div>

                {!editingLead && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 sr-only md:not-sr-only">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                            className="text-neutral-500 hover:text-white font-bold uppercase tracking-widest text-[10px] bg-neutral-900/80 backdrop-blur-md px-8 h-12 rounded-full border border-white/5"
                        >
                            Retour au site public
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
