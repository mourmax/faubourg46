import { db } from './firebase';
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
    getDoc
} from 'firebase/firestore';
import type { QuoteLead, QuoteSelection, LeadComment } from './types';

const LEADS_COLLECTION = 'leads';

// Helper to convert Firestore dates to JS Dates
const mapLead = (docData: any): QuoteLead => {
    try {
        const data = docData.data();
        if (!data) throw new Error('Document data is empty');

        return {
            ...data,
            id: docData.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(data.lastUpdated || Date.now()),
            selection: {
                ...data.selection,
                event: {
                    ...data.selection.event,
                    date: data.selection?.event?.date instanceof Timestamp
                        ? data.selection.event.date.toDate()
                        : new Date(data.selection?.event?.date || Date.now())
                }
            },
            comments: (data.comments || []).map((c: any) => ({
                ...c,
                date: c.date instanceof Timestamp ? c.date.toDate() : new Date(c.date || Date.now())
            }))
        };
    } catch (err) {
        console.error('Critical Error mapping lead:', docData.id, err);
        // Return a safe fallback to prevent UI crash
        return {
            id: docData.id,
            status: 'CANCELLED',
            createdAt: new Date(),
            lastUpdated: new Date(),
            comments: [],
            selection: {
                contact: { name: 'Error Loading', email: '', phone: '', isCompany: false },
                event: { date: new Date(), service: 'DINNER_1', guests: 20 },
                formula: {
                    id: 'f1',
                    name: 'Error',
                    priceTtc: 0,
                    type: 'TAPAS',
                    breakdown: { title: 'Error', items: [] }
                },
                options: []
            }
        } as unknown as QuoteLead;
    }
};

export const LeadStore = {
    async getLeads(): Promise<QuoteLead[]> {
        console.log('[LeadStore] Fetching leads...');
        try {
            const leadsRef = collection(db, LEADS_COLLECTION);
            const q = query(leadsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            console.log(`[LeadStore] Successfully fetched ${querySnapshot.size} leads.`);
            return querySnapshot.docs.map(mapLead);
        } catch (e) {
            console.error('[LeadStore] FATAL: Error fetching leads from Firebase', e);
            // If it's a permission error, it might be due to rules or auth
            if (e instanceof Error && e.message.includes('permission-denied')) {
                console.warn('[LeadStore] Firestore permission denied. Check security rules.');
            }
            return [];
        }
    },

    async saveLead(selection: QuoteSelection): Promise<QuoteLead> {
        console.log('[LeadStore] Saving new lead...', selection.contact.email);
        try {
            // Prepare data for Firestore
            const leadData = {
                status: 'NEW',
                selection: JSON.parse(JSON.stringify(selection)),
                createdAt: Timestamp.now(),
                lastUpdated: Timestamp.now(),
                comments: []
            };

            // Ensure date is a Timestamp
            leadData.selection.event.date = Timestamp.fromDate(selection.event.date);

            const docRef = await addDoc(collection(db, LEADS_COLLECTION), leadData);
            console.log('[LeadStore] Lead saved successfully with ID:', docRef.id);

            return {
                ...leadData,
                id: docRef.id,
                createdAt: leadData.createdAt.toDate(),
                lastUpdated: leadData.lastUpdated.toDate(),
                selection: {
                    ...selection,
                    event: {
                        ...selection.event,
                        date: selection.event.date
                    }
                },
                comments: []
            } as QuoteLead;
        } catch (e) {
            console.error('[LeadStore] FATAL: Error saving lead to Firebase', e);
            throw e; // Rethrow to let the UI handle the failure
        }
    },

    async updateLead(id: string, updates: Partial<QuoteLead>): Promise<QuoteLead | null> {
        try {
            const leadRef = doc(db, LEADS_COLLECTION, id);
            const firestoreUpdates: any = {
                ...updates,
                lastUpdated: Timestamp.now()
            };

            // Remove id from updates if present
            delete firestoreUpdates.id;

            await updateDoc(leadRef, firestoreUpdates);

            // Fetch updated doc to return
            const updatedDoc = await getDoc(leadRef);
            return updatedDoc.exists() ? mapLead(updatedDoc) : null;
        } catch (e) {
            console.error('Error updating lead in Firebase', id, e);
            return null;
        }
    },

    async addComment(leadId: string, text: string, author: string = 'Admin'): Promise<LeadComment | null> {
        try {
            const leadRef = doc(db, LEADS_COLLECTION, leadId);
            const leadDoc = await getDoc(leadRef);
            if (!leadDoc.exists()) return null;

            const data = leadDoc.data();
            const comments = data.comments || [];

            const newComment: LeadComment = {
                id: Math.random().toString(36).substring(2, 9),
                text,
                date: new Date(),
                author
            };

            // Prepare for firestore
            const firestoreComment = {
                ...newComment,
                date: Timestamp.fromDate(newComment.date)
            };

            await updateDoc(leadRef, {
                comments: [...comments, firestoreComment],
                lastUpdated: Timestamp.now()
            });

            return newComment;
        } catch (e) {
            console.error('Error adding comment in Firebase', leadId, e);
            return null;
        }
    },

    async deleteLead(id: string): Promise<void> {
        try {
            await deleteDoc(doc(db, LEADS_COLLECTION, id));
        } catch (e) {
            console.error('Error deleting lead from Firebase', id, e);
        }
    }
};

