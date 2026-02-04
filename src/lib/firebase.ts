import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// Use auto-detection for protocol (Long Polling vs WebSockets)
// This is more robust than forcing one or the other
export const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
});

console.log("[Firebase] Initialized with Auto-Detect Protocol");
console.log("[Firebase] Project ID:", firebaseConfig.projectId);
function checkApiKey() {
    if (!firebaseConfig.apiKey) {
        console.error("[Firebase] FATAL: API Key missing from .env!");
    }
}
checkApiKey();
