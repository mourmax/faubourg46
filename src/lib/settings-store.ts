import { databases, APPWRITE_CONFIG } from './appwrite';
import type { AppSettings } from './types';

const { databaseId, settingsCollectionId } = APPWRITE_CONFIG;
const GLOBAL_SETTINGS_ID = 'global';

const DEFAULT_SETTINGS: AppSettings = {
    whatsappEnabled: true,
    whatsappNumber: '33650154641',
    notificationEmail: 'matis@example.com',
    emailJsPublicKey: '',
    emailJsTemplateId: '',
    emailJsServiceId: 'service_54e2uef',
    emailJsPrivateKey: '',
    emailQuoteSubject: 'Votre Devis Faubourg 46',
    emailQuoteBody: 'Bonjour {{client_name}},\n\nSuite à votre demande, nous avons le plaisir de vous transmettre le devis pour votre événement.\n\nVous pouvez consulter et télécharger le document complet en cliquant sur le bouton ci-dessous.',
    emailInvoiceSubject: 'Votre Facture Faubourg 46',
    emailInvoiceBody: 'Bonjour {{client_name}},\n\nVeuillez trouver ci-joint votre facture pour votre événement.\n\nVous pouvez consulter et télécharger le document complet en cliquant sur le bouton ci-dessous.'
};

export const SettingsStore = {
    async getSettings(): Promise<AppSettings> {
        try {
            const doc = await databases.getDocument(databaseId, settingsCollectionId, GLOBAL_SETTINGS_ID);
            return {
                whatsappEnabled: doc.whatsappEnabled,
                whatsappNumber: doc.whatsappNumber,
                notificationEmail: doc.notificationEmail || DEFAULT_SETTINGS.notificationEmail,
                emailJsPublicKey: doc.emailJsPublicKey || DEFAULT_SETTINGS.emailJsPublicKey,
                emailJsTemplateId: doc.emailJsTemplateId || DEFAULT_SETTINGS.emailJsTemplateId,
                emailJsServiceId: doc.emailJsServiceId || DEFAULT_SETTINGS.emailJsServiceId,
                emailJsPrivateKey: doc.emailJsPrivateKey || DEFAULT_SETTINGS.emailJsPrivateKey,
                emailQuoteSubject: doc.emailQuoteSubject || DEFAULT_SETTINGS.emailQuoteSubject,
                emailQuoteBody: doc.emailQuoteBody || DEFAULT_SETTINGS.emailQuoteBody,
                emailInvoiceSubject: doc.emailInvoiceSubject || DEFAULT_SETTINGS.emailInvoiceSubject,
                emailInvoiceBody: doc.emailInvoiceBody || DEFAULT_SETTINGS.emailInvoiceBody
            };
        } catch (e: any) {

            if (e.code === 404) {
                // Initialize if not exists
                try {
                    await databases.createDocument(
                        databaseId,
                        settingsCollectionId,
                        GLOBAL_SETTINGS_ID,
                        DEFAULT_SETTINGS
                    );
                } catch (err) {
                    console.error('Failed to create default settings', err);
                }
                return DEFAULT_SETTINGS;
            }
            console.error('Error fetching settings', e);
            return DEFAULT_SETTINGS;
        }
    },

    async updateSettings(updates: Partial<AppSettings>): Promise<void> {
        try {
            await databases.updateDocument(
                databaseId,
                settingsCollectionId,
                GLOBAL_SETTINGS_ID,
                updates
            );
        } catch (e) {
            console.error('Error updating settings', e);
        }
    },

    subscribeSettings(callback: (settings: AppSettings) => void) {
        // Appwrite Realtime could be used here, but for now we fallback to a fetch
        this.getSettings().then(callback);
        // We return a dummy unsubscribe
        return () => { };
    }
};
