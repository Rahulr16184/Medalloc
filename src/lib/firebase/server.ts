
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// This function ensures that we initialize the app only once, making it safe for serverless environments.
// It checks if an app is already initialized, and if not, it creates a new one.
const getAdminApp = (): App => {
    if (getApps().length > 0) {
        return getApp();
    }
    
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    return initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
    });
};

const app = getAdminApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
