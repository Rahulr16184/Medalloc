
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

// This function ensures that we initialize the app only once.
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }

    let serviceAccount;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        }
    } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
        serviceAccount = undefined;
    }

    const app = initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
    });
    
    return app;
}

app = getAdminApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
