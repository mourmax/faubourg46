import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/components';
import { LogOut, LayoutDashboard, Database, Briefcase, Plus, Settings, MessageCircle, Save, Loader2, Mail } from 'lucide-react';
import { FORMULAS as INITIAL_FORMULAS, CHAMPAGNES as INITIAL_CHAMPAGNES, EXTRAS as INITIAL_EXTRAS, INITIAL_SELECTION } from '../lib/data';
import type { FormulaDefinition, QuoteItem, QuoteLead, AppSettings } from '../lib/types';
import { AdminCatalogue } from './AdminCatalogue';
import { AdminLeads } from './AdminLeads';
import { LeadEditor } from './LeadEditor';
import { LeadStore } from '../lib/leads-store';
import { SettingsStore } from '../lib/settings-store';

export function AdminDashboard() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState<'CATALOGUE' | 'LEADS' | 'SETTINGS'>('LEADS');
    const [editingLead, setEditingLead] = useState<QuoteLead | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isSavingSettings, setIsSavingSettings] = useState(false);


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

    const handleToggleWhatsapp = () => {
        const currentStatus = settings?.whatsappEnabled ?? false;
        const newStatus = !currentStatus;

        const updatedSettings: AppSettings = {
            whatsappEnabled: newStatus,
            whatsappNumber: settings?.whatsappNumber || '33600000000',
            notificationEmail: settings?.notificationEmail || 'matis@example.com',
            emailJsPublicKey: settings?.emailJsPublicKey || '',
            emailJsTemplateId: settings?.emailJsTemplateId || '',
            emailJsServiceId: settings?.emailJsServiceId || 'service_54e2uef',
            emailJsPrivateKey: settings?.emailJsPrivateKey || '',
            emailQuoteSubject: settings?.emailQuoteSubject || '',
            emailQuoteBody: settings?.emailQuoteBody || '',
            emailInvoiceSubject: settings?.emailInvoiceSubject || '',
            emailInvoiceBody: settings?.emailInvoiceBody || ''
        };

        setSettings(updatedSettings);
    };


    const handleUpdateWhatsappNumber = (num: string) => {
        if (!settings) return;
        setSettings({ ...settings, whatsappNumber: num });
    };

    const handleUpdateSettings = (updates: Partial<AppSettings>) => {
        if (!settings) return;
        setSettings({ ...settings, ...updates });
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        setIsSavingSettings(true);
        try {
            await SettingsStore.updateSettings(settings);
            alert('Réglages sauvegardés avec succès !');
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la sauvegarde des réglages.');
        } finally {
            setIsSavingSettings(false);
        }
    };


    const handleCreateLead = async () => {
        try {
            const newLead = await LeadStore.saveLead(INITIAL_SELECTION);
            if (newLead) {
                setEditingLead(newLead);
                setCurrentTab('LEADS');
            } else {
                alert("Erreur lors de la création du devis.");
            }
        } catch (error) {
            console.error(error);
            alert("Échec de connexion au serveur.");
        }
    };

    const handleFormulaChange = (id: string, field: 'part10Ht' | 'part20Ht', value: number) => {
        setFormulas(prev => prev.map(f => {
            if (f.id === id) {
                const updated = { ...f, [field]: value };
                updated.priceTtc = Number((updated.part10Ht * 1.1 + updated.part20Ht * 1.2).toFixed(2));
                return updated;
            }
            return f;
        }));
    };

    const handleOptionChange = (name: string, field: 'unitPriceHt' | 'vatRate', value: number, type: 'champagne' | 'extra') => {
        const setter = type === 'champagne' ? setChampagnes : setExtras;
        setter(prev => prev.map(item => {
            if (item.name === name) {
                const updated = { ...item, [field]: value };
                updated.unitPriceTtc = Number((updated.unitPriceHt * (1 + (updated.vatRate || 20) / 100)).toFixed(2));
                return updated;
            }
            return item;
        }));
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
        <div className="min-h-screen bg-neutral-50 p-4 md:p-8 flex flex-col items-center">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-gold-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-6xl space-y-12 relative z-10 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end border-b border-neutral-200 pb-8 gap-6">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                            <div className="w-12 h-12 bg-dark-900 rounded-2xl flex items-center justify-center shadow-xl shadow-dark-900/10">
                                <LayoutDashboard className="w-6 h-6 text-gold-500" />
                            </div>
                            <h1 className="text-4xl font-black text-dark-900 tracking-tighter uppercase">DASHBOARD</h1>
                        </div>
                        <p className="text-neutral-400 font-black uppercase tracking-[0.3em] text-[10px]">Gestion Faubourg 46</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 bg-white p-2 rounded-2xl shadow-xl shadow-dark-900/5 border border-neutral-100">
                        <button
                            onClick={() => { setCurrentTab('LEADS'); setEditingLead(null); }}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${currentTab === 'LEADS' ? 'bg-dark-900 text-white shadow-lg' : 'text-neutral-500 hover:text-dark-900 hover:bg-neutral-50'}`}
                        >
                            <Briefcase className="w-4 h-4" />
                            Demandes
                        </button>
                        <button
                            onClick={() => { setCurrentTab('CATALOGUE'); setEditingLead(null); }}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${currentTab === 'CATALOGUE' ? 'bg-dark-900 text-white shadow-lg' : 'text-neutral-500 hover:text-dark-900 hover:bg-neutral-50'}`}
                        >
                            <Database className="w-4 h-4" />
                            Catalogue
                        </button>

                        <button
                            onClick={() => { setCurrentTab('SETTINGS'); setEditingLead(null); }}
                            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${currentTab === 'SETTINGS' ? 'bg-dark-900 text-white shadow-lg' : 'text-neutral-500 hover:text-dark-900 hover:bg-neutral-50'}`}
                        >
                            <Settings className="w-4 h-4" />
                            Réglages
                        </button>

                        <div className="w-px h-8 bg-neutral-200 mx-2 hidden md:block" />

                        <button
                            onClick={handleCreateLead}
                            className="flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-gold-500 text-white hover:bg-gold-600 shadow-xl shadow-gold-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau Devis
                        </button>

                        <div className="w-px h-8 bg-neutral-200 mx-2" />

                        <button onClick={handleLogout} className="p-3 text-neutral-400 hover:text-red-500 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {editingLead ? (
                        <LeadEditor
                            key={editingLead.id}
                            lead={editingLead}
                            catalogueFormulas={formulas}
                            catalogueChampagnes={champagnes}
                            catalogueExtras={extras}
                            onClose={() => { setEditingLead(null); setRefreshTrigger(t => t + 1); }}
                            onUpdate={() => setRefreshTrigger(t => t + 1)}
                        />
                    ) : currentTab === 'CATALOGUE' ? (
                        <AdminCatalogue
                            formulas={formulas}
                            champagnes={champagnes}
                            extras={extras}
                            onFormulaChange={handleFormulaChange}
                            onOptionChange={handleOptionChange}
                            onSave={handleSave}
                        />
                    ) : currentTab === 'SETTINGS' ? (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-dark-900/5 space-y-8 border border-neutral-100">
                                <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                        <MessageCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-dark-900 uppercase tracking-widest">Intégration WhatsApp</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                                        <div>
                                            <p className="text-dark-900 font-black uppercase tracking-widest text-sm">Afficher le bouton Public</p>
                                            <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider mt-1">Active le bouton flottant sur le formulaire client</p>
                                        </div>
                                        <button
                                            onClick={handleToggleWhatsapp}
                                            className={`w-16 h-8 rounded-full transition-all relative ${settings?.whatsappEnabled ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-neutral-300'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings?.whatsappEnabled ? 'left-9' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-2">Numéro WhatsApp</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gold-600 font-black z-10">+</span>
                                            <input
                                                className="w-full h-14 bg-white border border-neutral-200 rounded-2xl px-10 text-dark-900 font-black focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all placeholder:text-neutral-300"
                                                value={settings?.whatsappNumber || ''}
                                                onChange={(e) => handleUpdateWhatsappNumber(e.target.value)}
                                                placeholder="336..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-dark-900/5 space-y-8 border border-neutral-100">
                                <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Database className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-dark-900 uppercase tracking-widest">Notifications Email (EmailJS)</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-2">Email de réception</label>
                                        <input
                                            className="w-full h-14 bg-white border border-neutral-200 rounded-2xl px-6 text-dark-900 font-black focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all placeholder:text-neutral-300"
                                            value={settings?.notificationEmail || ''}
                                            onChange={(e) => handleUpdateSettings({ notificationEmail: e.target.value })}
                                            placeholder="votre@email.com"
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-2">Service ID</label>
                                            <input
                                                className="w-full h-14 bg-white border border-neutral-200 rounded-2xl px-6 text-dark-900 font-black focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all placeholder:text-neutral-300 text-xs"
                                                value={settings?.emailJsServiceId || ''}
                                                onChange={(e) => handleUpdateSettings({ emailJsServiceId: e.target.value })}
                                                placeholder="service_..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-2">Public Key</label>
                                            <input
                                                className="w-full h-14 bg-white border border-neutral-200 rounded-2xl px-6 text-dark-900 font-black focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all placeholder:text-neutral-300 text-xs"
                                                value={settings?.emailJsPublicKey || ''}
                                                onChange={(e) => handleUpdateSettings({ emailJsPublicKey: e.target.value })}
                                                placeholder="pk_..."
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-2">Template ID</label>
                                            <input
                                                className="w-full h-14 bg-white border border-neutral-200 rounded-2xl px-6 text-dark-900 font-black focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all placeholder:text-neutral-300 text-xs"
                                                value={settings?.emailJsTemplateId || ''}
                                                onChange={(e) => handleUpdateSettings({ emailJsTemplateId: e.target.value })}
                                                placeholder="template_..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-2">Private Key (Access Token)</label>
                                        <input
                                            type="password"
                                            className="w-full h-14 bg-white border border-neutral-200 rounded-2xl px-6 text-dark-900 font-black focus:border-gold-500 focus:ring-4 focus:ring-gold-500/5 outline-none transition-all placeholder:text-neutral-300 text-xs"
                                            value={settings?.emailJsPrivateKey || ''}
                                            onChange={(e) => handleUpdateSettings({ emailJsPrivateKey: e.target.value })}
                                            placeholder="Indispensable si configuré sur EmailJS"
                                        />
                                    </div>

                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                        <p className="text-[10px] text-blue-800 font-bold uppercase tracking-widest leading-relaxed">
                                            ℹ️ Service ID utilisé : <code className="bg-blue-100 px-1 rounded">service_54e2uef</code>.
                                            Assurez-vous que vos variables de template EmailJS correspondent à : <code className="bg-blue-100 px-1 rounded">client_name</code>, <code className="bg-blue-100 px-1 rounded">client_email</code>, <code className="bg-blue-100 px-1 rounded">summary_html</code>, etc.
                                        </p>
                                    </div>

                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-dark-900/5 space-y-8 border border-neutral-100">
                                <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
                                    <div className="w-10 h-10 bg-gold-50 rounded-xl flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-gold-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-dark-900 uppercase tracking-widest">Templates d'Email</h3>
                                </div>

                                <div className="space-y-10">
                                    {/* Devis Template */}
                                    <div className="space-y-6">
                                        <h4 className="text-[12px] font-black text-gold-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            Envoi de Devis
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Objet du mail</label>
                                                <input
                                                    className="w-full h-14 bg-neutral-50 border border-neutral-200 rounded-2xl px-6 text-dark-900 font-black focus:border-gold-500 outline-none transition-all"
                                                    value={settings?.emailQuoteSubject || ''}
                                                    onChange={(e) => handleUpdateSettings({ emailQuoteSubject: e.target.value })}
                                                    placeholder="Objet..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Corps du message</label>
                                                <textarea
                                                    className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-[2rem] p-6 text-sm font-medium text-dark-900 focus:border-gold-500 outline-none transition-all resize-none"
                                                    value={settings?.emailQuoteBody || ''}
                                                    onChange={(e) => handleUpdateSettings({ emailQuoteBody: e.target.value })}
                                                    placeholder="Message..."
                                                />
                                                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight mt-1 ml-2">
                                                    💡 Placeholders: <code className="bg-neutral-100 px-1 rounded text-gold-600">{"{{client_name}}"}</code>, <code className="bg-neutral-100 px-1 rounded text-gold-600">{"{{event_date}}"}</code>, <code className="bg-neutral-100 px-1 rounded text-gold-600">{"{{selection_summary}}"}</code>, <code className="bg-neutral-100 px-1 rounded text-gold-600">{"{{total_amount}}"}</code>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Facture Template */}
                                    <div className="space-y-6 pt-6 border-t border-dashed border-neutral-100">
                                        <h4 className="text-[12px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Plus className="w-4 h-4" />
                                            Envoi de Facture
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Objet du mail</label>
                                                <input
                                                    className="w-full h-14 bg-neutral-50 border border-neutral-200 rounded-2xl px-6 text-dark-900 font-black focus:border-gold-500 outline-none transition-all"
                                                    value={settings?.emailInvoiceSubject || ''}
                                                    onChange={(e) => handleUpdateSettings({ emailInvoiceSubject: e.target.value })}
                                                    placeholder="Objet..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Corps du message</label>
                                                <textarea
                                                    className="w-full h-40 bg-neutral-50 border border-neutral-200 rounded-[2rem] p-6 text-sm font-medium text-dark-900 focus:border-gold-500 outline-none transition-all resize-none"
                                                    value={settings?.emailInvoiceBody || ''}
                                                    onChange={(e) => handleUpdateSettings({ emailInvoiceBody: e.target.value })}
                                                    placeholder="Message..."
                                                />
                                                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-tight mt-1 ml-2">
                                                    💡 Placeholders: <code className="bg-neutral-100 px-1 rounded text-gold-600">{"{{client_name}}"}</code>, <code className="bg-neutral-100 px-1 rounded text-gold-600">{"{{event_date}}"}</code>, <code className="bg-neutral-100 px-1 rounded text-gold-600">{"{{selection_summary}}"}</code>, <code className="bg-neutral-100 px-1 rounded text-gold-600">{"{{total_amount}}"}</code>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gold-50 border border-gold-100 rounded-2xl">
                                        <p className="text-[10px] text-gold-700 font-black uppercase tracking-widest italic flex items-center gap-2">
                                            <span>💡</span>
                                            Le bouton d'accès au document est automatiquement ajouté à la fin de tous les e-mails.
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            onClick={handleSaveSettings}
                                            disabled={isSavingSettings}
                                            className="w-full h-16 text-sm font-black uppercase tracking-widest gold-gradient text-white gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all rounded-[1.5rem] border-none"
                                        >
                                            {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            {isSavingSettings ? 'SAUVEGARDE...' : 'ENREGISTRER LES TEMPLATES'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <AdminLeads
                            key={refreshTrigger}
                            onEdit={setEditingLead}
                            formulas={formulas}
                            champagnes={champagnes}
                            extras={extras}
                        />
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
