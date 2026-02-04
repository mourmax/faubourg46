import { databases, APPWRITE_CONFIG } from './appwrite';
import { ID, Query } from 'appwrite';
import type { QuoteLead, QuoteSelection, LeadComment } from './types';

const { databaseId, leadsCollectionId } = APPWRITE_CONFIG;

const mapLead = (doc: any): QuoteLead => {
    let selection = doc.selection;
    let comments = doc.comments;

    try {
        if (typeof selection === 'string') selection = JSON.parse(selection);
        // CRITICAL: Restore Date objects from strings
        if (selection?.event?.date && typeof selection.event.date === 'string') {
            selection.event.date = new Date(selection.event.date);
        }
    } catch (e) {
        console.error('[LeadStore] Failed to parse selection JSON', e);
        selection = { contact: { name: 'Erreur', email: '', phone: '' }, event: { date: new Date(), guests: 0, service: 'LUNCH' }, formula: { id: '', name: '', type: 'BRASSERIE', priceTtc: 0 }, options: [] };
    }

    try {
        if (typeof comments === 'string') comments = JSON.parse(comments);
    } catch (e) {
        console.error('[LeadStore] Failed to parse comments JSON', e);
        comments = [];
    }

    return {
        ...doc,
        id: doc.$id,
        createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
        lastUpdated: doc.lastUpdated ? new Date(doc.lastUpdated) : new Date(),
        selection,
        comments: comments || []
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
            const data = {
                status: 'NEW',
                selection: JSON.stringify(selection),
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                comments: JSON.stringify([])
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
            const data: any = {
                ...updates,
                lastUpdated: new Date().toISOString()
            };

            if (updates.selection) data.selection = JSON.stringify(updates.selection);
            if (updates.comments) data.comments = JSON.stringify(updates.comments);

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

            const response = await databases.updateDocument(
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
