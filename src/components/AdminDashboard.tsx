import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/components';
import { LogOut, LayoutDashboard, Database, Briefcase, Plus, Settings, MessageCircle } from 'lucide-react';
import { FORMULAS as INITIAL_FORMULAS, CHAMPAGNES as INITIAL_CHAMPAGNES, EXTRAS as INITIAL_EXTRAS, INITIAL_SELECTION } from '../lib/data';
import type { FormulaDefinition, QuoteItem, QuoteLead, AppSettings } from '../lib/types';
import { AdminCatalogue } from './AdminCatalogue';
import { AdminLeads } from './AdminLeads';
import { LeadEditor } from './LeadEditor';
import { LeadStore } from '../lib/leads-store';
import { SettingsStore } from '../lib/settings-store';
import { Card } from './ui/components';

export function AdminDashboard() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState<'CATALOGUE' | 'LEADS' | 'SETTINGS'>('LEADS');
    const [editingLead, setEditingLead] = useState<QuoteLead | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [settings, setSettings] = useState<AppSettings | null>(null);

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
        } else {
            SettingsStore.getSettings().then(setSettings);
        }
    }, [isAuthenticated, navigate]);

    const handleToggleWhatsapp = async () => {
        if (!settings) return;
        const newStatus = !settings.whatsappEnabled;
        await SettingsStore.updateSettings({ whatsappEnabled: newStatus });
        setSettings({ ...settings, whatsappEnabled: newStatus });
    };

    const handleUpdateWhatsappNumber = async (num: string) => {
        if (!settings) return;
        await SettingsStore.updateSettings({ whatsappNumber: num });
        setSettings({ ...settings, whatsappNumber: num });
    };

    const handleCreateLead = async () => {
        const newLead = await LeadStore.saveLead(INITIAL_SELECTION);
        setEditingLead(newLead);
        setCurrentTab('LEADS');
    };

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

                    <div className="flex flex-wrap items-center justify-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
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

                        <button
                            onClick={() => { setCurrentTab('SETTINGS'); setEditingLead(null); }}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${currentTab === 'SETTINGS' ? 'gold-gradient text-white shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Settings className="w-4 h-4" />
                            Réglages
                        </button>

                        <div className="w-px h-8 bg-white/10 mx-2 hidden md:block" />

                        <button
                            onClick={handleCreateLead}
                            className="flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white/10 text-white hover:bg-gold-500 hover:shadow-lg border border-white/10"
                        >
                            <Plus className="w-4 h-4 text-gold-500 group-hover:text-white" />
                            Nouveau Devis
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
                            onClose={() => { setEditingLead(null); setRefreshTrigger(t => t + 1); }}
                            onUpdate={() => setRefreshTrigger(t => t + 1)}
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
                    ) : currentTab === 'SETTINGS' ? (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <Card className="glass-card p-10 border-none space-y-8">
                                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                                    <MessageCircle className="w-6 h-6 text-gold-500" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Intégration WhatsApp</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <div>
                                            <p className="text-white font-black uppercase tracking-widest text-sm">Afficher le bouton Public</p>
                                            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider mt-1">Active le bouton flottant sur le formulaire client</p>
                                        </div>
                                        <button
                                            onClick={handleToggleWhatsapp}
                                            className={`w-16 h-8 rounded-full transition-all relative ${settings?.whatsappEnabled ? 'bg-gold-500' : 'bg-neutral-700'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.whatsappEnabled ? 'left-9' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-2">Numéro WhatsApp (Format: 336...)</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-500 font-black">+</span>
                                            <input
                                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-10 text-white font-black focus:border-gold-500 outline-none transition-all"
                                                value={settings?.whatsappNumber || ''}
                                                onChange={(e) => handleUpdateWhatsappNumber(e.target.value)}
                                                placeholder="336..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <AdminLeads key={refreshTrigger} onEdit={setEditingLead} />
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
