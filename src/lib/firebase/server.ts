
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

// This function ensures we initialize the app only once.
const getAdminApp = (): App => {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
  });
};

const app = getAdminApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
