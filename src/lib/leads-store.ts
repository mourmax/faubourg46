import { databases, APPWRITE_CONFIG } from './appwrite';
import { ID, Query } from 'appwrite';
import type { QuoteLead, QuoteSelection, LeadComment } from './types';
import { calculateQuoteTotal } from './quote-engine';

const { databaseId, leadsCollectionId } = APPWRITE_CONFIG;

const mapLead = (doc: any): QuoteLead => {
    let selection = doc.selection;
    let comments = doc.comments;
    let invoice = doc.invoice;
    let history = doc.history;

    try {
        if (typeof selection === 'string') selection = JSON.parse(selection);

        // --- Migration & Defaults ---
        if (!selection.formulas || !Array.isArray(selection.formulas)) {
            selection.formulas = [];
            // If we have the old formula (singular) but no formulas (plural), migrate it
            if (selection.formula && selection.formulas.length === 0) {
                selection.formulas.push({
                    formula: selection.formula,
                    quantity: selection.event?.guests || 0
                });
            }
        }

        // Ensure essential fields exist
        if (!selection.options) selection.options = [];
        if (!selection.contact) selection.contact = { name: '', email: '', phone: '' };
        if (!selection.event) selection.event = { date: new Date(), service: 'DINNER_1', guests: 0 };

        // CRITICAL: Restore Date objects from strings
        if (selection?.event?.date && typeof selection.event.date === 'string') {
            selection.event.date = new Date(selection.event.date);
        }
    } catch (e) {
        console.error('[LeadStore] Failed to parse selection JSON', e);
        selection = {
            contact: { name: 'Erreur', email: '', phone: '' },
            event: { date: new Date(), guests: 0, service: 'LUNCH' },
            formula: { id: '', name: '', type: 'BRASSERIE', priceTtc: 0 },
            formulas: [],
            options: []
        };
    }


    try {
        if (typeof history === 'string') history = JSON.parse(history);
        // Restore dates in history items
        if (Array.isArray(history)) {
            history.forEach((h: any) => {
                if (h.event?.date && typeof h.event.date === 'string') {
                    h.event.date = new Date(h.event.date);
                }
            });
        }
    } catch (e) {
        console.error('[LeadStore] Failed to parse history JSON', e);
        history = [];
    }


    try {
        if (typeof comments === 'string') comments = JSON.parse(comments);
    } catch (e) {
        console.error('[LeadStore] Failed to parse comments JSON', e);
        comments = [];
    }

    try {
        if (typeof invoice === 'string') invoice = JSON.parse(invoice);
        // Restore Date objects in invoice
        if (invoice?.invoiceDate && typeof invoice.invoiceDate === 'string') {
            invoice.invoiceDate = new Date(invoice.invoiceDate);
        }
        if (invoice?.depositDate && typeof invoice.depositDate === 'string') {
            invoice.depositDate = new Date(invoice.depositDate);
        }
    } catch (e) {
        console.error('[LeadStore] Failed to parse invoice JSON', e);
        invoice = undefined;
    }

    return {
        ...doc,
        id: doc.$id,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        lastUpdated: doc.lastUpdated ? new Date(doc.lastUpdated) : new Date(),
        selection,
        comments: comments || [],
        history: history || [],
        invoice
    };
};

export const LeadStore = {
    async getLeads(): Promise<QuoteLead[]> {
        console.log('[LeadStore] Fetching leads from Appwrite...');
        try {
            const response = await databases.listDocuments(
                databaseId,
                leadsCollectionId,
                [Query.orderDesc('createdAt')]
            );
            return response.documents.map(mapLead);
        } catch (e) {
            console.error('[LeadStore] Error fetching leads', e);
            throw e;
        }
    },

    async saveLead(selection: QuoteSelection): Promise<QuoteLead> {
        console.log('[LeadStore] Saving lead to Appwrite...');
        try {
            const quote = calculateQuoteTotal(selection);
            const data = {
                status: 'NEW',
                selection: JSON.stringify(selection),
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                comments: JSON.stringify([]),
                totalTtc: quote.totalTtc
            };

            const response = await databases.createDocument(
                databaseId,
                leadsCollectionId,
                ID.unique(),
                data
            );
            return mapLead(response);
        } catch (e) {
            console.error('[LeadStore] Error saving lead', e);
            throw e;
        }
    },

    async updateLead(id: string, updates: Partial<QuoteLead>): Promise<QuoteLead | null> {
        try {
            const leadDoc = await databases.getDocument(databaseId, leadsCollectionId, id);
            const currentLead = mapLead(leadDoc);

            const data: any = {
                ...updates,
                lastUpdated: new Date().toISOString()
            };

            // Manage history of selections
            if (updates.selection) {
                const oldSelection = currentLead.selection;
                const history = currentLead.history || [];

                // Simple stringification check to see if selection actually changed
                const isDifferent = JSON.stringify(oldSelection) !== JSON.stringify(updates.selection);

                if (isDifferent) {
                    const newHistory = [oldSelection, ...history].slice(0, 3);
                    data.history = JSON.stringify(newHistory);
                }
                data.selection = JSON.stringify(updates.selection);

                // Calculate and store total for easier display in dashboard
                const quote = calculateQuoteTotal(updates.selection);
                data.totalTtc = quote.totalTtc;
            }


            if (updates.comments) data.comments = JSON.stringify(updates.comments);
            if (updates.invoice) data.invoice = JSON.stringify(updates.invoice);


            // Appwrite doesn't like id in the data object
            delete data.id;
            delete data.$id;
            delete data.$collectionId;
            delete data.$databaseId;
            delete data.$createdAt;
            delete data.$updatedAt;
            delete data.$permissions;

            const response = await databases.updateDocument(
                databaseId,
                leadsCollectionId,
                id,
                data
            );
            return mapLead(response);
        } catch (e) {
            console.error('[LeadStore] Error updating lead', e);
            return null;
        }
    },

    async addComment(leadId: string, text: string, author: string = 'Admin'): Promise<LeadComment | null> {
        try {
            const leadDoc = await databases.getDocument(databaseId, leadsCollectionId, leadId);
            const comments = JSON.parse(leadDoc.comments || '[]');

            const newComment: LeadComment = {
                id: Math.random().toString(36).substring(2, 9),
                text,
                date: new Date(),
                author
            };

            comments.push(newComment);

            await databases.updateDocument(
                databaseId,
                leadsCollectionId,
                leadId,
                {
                    comments: JSON.stringify(comments),
                    lastUpdated: new Date().toISOString()
                }
            );

            return newComment;
        } catch (e) {
            console.error('[LeadStore] Error adding comment', e);
            return null;
        }
    },

    async deleteLead(id: string): Promise<void> {
        try {
            await databases.deleteDocument(databaseId, leadsCollectionId, id);
        } catch (e) {
            console.error('[LeadStore] Error deleting lead', e);
        }
    }
};
