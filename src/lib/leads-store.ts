import type { QuoteLead, QuoteSelection, LeadComment } from './types';

const STORAGE_KEY = 'faubourg_leads';

export const LeadStore = {
    getLeads(): QuoteLead[] {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return [];
        try {
            const parsed = JSON.parse(saved);
            return parsed.map((lead: any) => ({
                ...lead,
                createdAt: new Date(lead.createdAt),
                lastUpdated: new Date(lead.lastUpdated),
                selection: {
                    ...lead.selection,
                    event: {
                        ...lead.selection.event,
                        date: new Date(lead.selection.event.date)
                    }
                },
                comments: lead.comments.map((c: any) => ({
                    ...c,
                    date: new Date(c.date)
                }))
            }));
        } catch (e) {
            console.error('Error parsing leads', e);
            return [];
        }
    },

    saveLead(selection: QuoteSelection): QuoteLead {
        const leads = this.getLeads();
        const newLead: QuoteLead = {
            id: Math.random().toString(36).substring(2, 9).toUpperCase(),
            status: 'NEW',
            selection: JSON.parse(JSON.stringify(selection)), // Deep clone
            createdAt: new Date(),
            lastUpdated: new Date(),
            comments: []
        };

        leads.unshift(newLead);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
        return newLead;
    },

    updateLead(id: string, updates: Partial<QuoteLead>): QuoteLead | null {
        const leads = this.getLeads();
        const index = leads.findIndex(l => l.id === id);
        if (index === -1) return null;

        leads[index] = {
            ...leads[index],
            ...updates,
            lastUpdated: new Date()
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
        return leads[index];
    },

    addComment(leadId: string, text: string, author: string = 'Admin'): LeadComment | null {
        const leads = this.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return null;

        const newComment: LeadComment = {
            id: Math.random().toString(36).substring(2, 9),
            text,
            date: new Date(),
            author
        };

        lead.comments.push(newComment);
        lead.lastUpdated = new Date();

        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
        return newComment;
    },

    deleteLead(id: string) {
        const leads = this.getLeads().filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    }
};
