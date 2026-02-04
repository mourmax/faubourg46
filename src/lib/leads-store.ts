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
    const data = docData.data();
    return {
        ...data,
        id: docData.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(data.lastUpdated),
        selection: {
            ...data.selection,
            event: {
                ...data.selection.event,
                date: data.selection.event.date instanceof Timestamp
                    ? data.selection.event.date.toDate()
                    : new Date(data.selection.event.date)
            }
        },
        comments: (data.comments || []).map((c: any) => ({
            ...c,
            date: c.date instanceof Timestamp ? c.date.toDate() : new Date(c.date)
        }))
    };
};

export const LeadStore = {
    async getLeads(): Promise<QuoteLead[]> {
        try {
            const leadsRef = collection(db, LEADS_COLLECTION);
            const q = query(leadsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(mapLead);
        } catch (e) {
            console.error('Error fetching leads from Firebase', e);
            return [];
        }
    },

    async saveLead(selection: QuoteSelection): Promise<QuoteLead> {
        // Prepare data for Firestore (Firestore can handle nested objects but not all JS objects like Date directly)
        const leadData = {
            status: 'NEW',
            selection: JSON.parse(JSON.stringify(selection)), // Already handling dates as strings usually in clone, but let's be safe
            createdAt: Timestamp.now(),
            lastUpdated: Timestamp.now(),
            comments: []
        };

        // Ensure date is a Timestamp
        leadData.selection.event.date = Timestamp.fromDate(selection.event.date);

        const docRef = await addDoc(collection(db, LEADS_COLLECTION), leadData);

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

