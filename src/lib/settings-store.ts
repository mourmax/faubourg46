import { db } from './firebase';
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';
import type { AppSettings } from './types';

const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_DOC = 'global';

const DEFAULT_SETTINGS: AppSettings = {
    whatsappEnabled: true,
    whatsappNumber: '33650154641'
};

export const SettingsStore = {
    async getSettings(): Promise<AppSettings> {
        try {
            const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data() as AppSettings;
            } else {
                // Initialize with defaults if doesn't exist
                await setDoc(docRef, DEFAULT_SETTINGS);
                return DEFAULT_SETTINGS;
            }
        } catch (e) {
            console.error('Error fetching settings', e);
            return DEFAULT_SETTINGS;
        }
    },

    async updateSettings(updates: Partial<AppSettings>): Promise<void> {
        try {
            const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
            await setDoc(docRef, updates, { merge: true });
        } catch (e) {
            console.error('Error updating settings', e);
        }
    },

    subscribeSettings(callback: (settings: AppSettings) => void) {
        const docRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_DOC);
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as AppSettings);
            } else {
                callback(DEFAULT_SETTINGS);
            }
        });
    }
};
