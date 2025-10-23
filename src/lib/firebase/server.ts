
import { initializeApp, getApps, getApp, cert, type App, type AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { FIREBASE_CONFIG } from "./config";

let app: App;

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
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, proceeding without it.', e);
        serviceAccount = undefined;
    }

    const options: AppOptions = {
        projectId: FIREBASE_CONFIG.projectId,
    };
    
    if (serviceAccount) {
        options.credential = cert(serviceAccount);
    }
    
    app = initializeApp(options);
    
    return app;
}

// Initialize the app right away to be used by other server modules
app = getAdminApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

    