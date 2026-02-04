import { useState, useEffect } from 'react';
import { Card, Input } from './ui/components';
import { LeadStore } from '../lib/leads-store';
import type { QuoteLead, LeadStatus } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { calculateQuoteTotal } from '../lib/quote-engine';
import {
    Search,
    Calendar,
    Mail,
    Clock,
    MessageSquare,
    ChevronRight,
    Filter,
    Trash2,
    Briefcase
} from 'lucide-react';

interface AdminLeadsProps {
    onEdit: (lead: QuoteLead) => void;
}

export function AdminLeads({ onEdit }: AdminLeadsProps) {
    const [leads, setLeads] = useState<QuoteLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const data = await LeadStore.getLeads();
            setLeads(data);
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Supprimer cette demande ?')) {
            await LeadStore.deleteLead(id);
            fetchLeads();
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.selection.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.selection.contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: LeadStatus) => {
        switch (status) {
            case 'NEW': return 'bg-blue-500 text-white';
            case 'CONTACTED': return 'bg-amber-500 text-white';
            case 'WAITING': return 'bg-purple-500 text-white';
            case 'VALIDATED': return 'bg-green-500 text-white';
            case 'CANCELLED': return 'bg-neutral-500 text-white';
            default: return 'bg-neutral-200 text-neutral-600';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
                <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-center space-y-2">
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs animate-pulse">Chargement des données...</p>
                    <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-tighter opacity-50">Connexion à Firestore en cours</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <Input
                        placeholder="Rechercher par nom, email ou ID..."
                        className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 rounded-2xl"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-5 h-5 text-gold-500 shrink-0" />
                    <select
                        className="bg-neutral-800 text-white border border-white/10 rounded-xl h-12 px-4 text-xs font-bold uppercase tracking-widest focus:ring-gold-500 outline-none"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">Tous les statuts</option>
                        <option value="NEW">Nouveau</option>
                        <option value="CONTACTED">Contacté</option>
                        <option value="WAITING">En attente</option>
                        <option value="VALIDATED">Validé</option>
                        <option value="CANCELLED">Annulé</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredLeads.map(lead => {
                    const quote = calculateQuoteTotal(lead.selection);

                    return (
                        <Card
                            key={lead.id}
                            className="bg-white hover:bg-neutral-50 transition-all border-none shadow-xl group cursor-pointer overflow-hidden p-0"
                            onClick={() => onEdit(lead)}
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Status Side Bar */}
                                <div className={`w-2 md:w-3 ${getStatusColor(lead.status).split(' ')[0]}`} />

                                <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center">
                                    <div className="flex-1 space-y-4 w-full">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black bg-neutral-200 text-neutral-600 px-3 py-1 rounded-full tracking-tighter">
                                                        #{lead.id}
                                                    </span>
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${getStatusColor(lead.status)}`}>
                                                        {lead.status === 'NEW' ? 'Nouveau' :
                                                            lead.status === 'CONTACTED' ? 'Contacté' :
                                                                lead.status === 'WAITING' ? 'En attente' :
                                                                    lead.status === 'VALIDATED' ? 'Validé' : 'Annulé'}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-black text-neutral-900 uppercase tracking-tight flex items-center gap-3">
                                                    {lead.selection.contact.name}
                                                    {lead.selection.contact.company && (
                                                        <span className="text-xs font-bold text-neutral-400 border border-neutral-100 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <Briefcase className="w-3 h-3" />
                                                            {lead.selection.contact.company}
                                                        </span>
                                                    )}
                                                </h3>
                                            </div>
                                            <div className="text-right sr-only md:not-sr-only">
                                                <div className="text-2xl font-black text-gold-700">{formatCurrency(quote.totalTtc)}</div>
                                                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Estimation TTC</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-neutral-100">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                    <Calendar className="w-3.5 h-3.5 text-gold-500" /> Date
                                                </div>
                                                <div className="text-xs font-black text-neutral-900">
                                                    {lead.selection.event.date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                    <Clock className="w-3.5 h-3.5 text-gold-500" /> Service
                                                </div>
                                                <div className="text-xs font-black text-neutral-900 uppercase tracking-tighter">
                                                    {lead.selection.event.service.replace('_', ' ')}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                    <Mail className="w-3.5 h-3.5 text-gold-500" /> Email
                                                </div>
                                                <div className="text-xs font-black text-neutral-900 truncate max-w-[150px]">
                                                    {lead.selection.contact.email}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                    <MessageSquare className="w-3.5 h-3.5 text-gold-500" /> Comm.
                                                </div>
                                                <div className="text-xs font-black text-neutral-900">
                                                    {lead.comments.length} message(s)
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => handleDelete(lead.id, e)}
                                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-neutral-50 text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-all border border-neutral-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gold-50 text-gold-600 group-hover:bg-gold-500 group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight className="w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {filteredLeads.length === 0 && (
                    <div className="text-center py-32 space-y-6 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/5 mb-2">
                            <Search className="w-8 h-8 text-neutral-600" />
                        </div>
                        <div className="space-y-2">
                            <div className="text-neutral-500 font-black text-2xl uppercase tracking-[0.2em]">Aucune demande</div>
                            <p className="text-neutral-600 text-xs font-bold uppercase tracking-widest">
                                {leads.length === 0 ? "La base de données est actuellement vide" : "Aucun résultat pour cette recherche"}
                            </p>
                        </div>
                        {leads.length === 0 && (
                            <button
                                onClick={fetchLeads}
                                className="text-gold-500 text-[10px] font-black uppercase tracking-widest hover:text-gold-400 transition-colors"
                            >
                                Rafraîchir la connexion
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
