import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Define interface for the raw JSON file (snake_case)
interface RawServiceAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri?: string;
    token_uri?: string;
    auth_provider_x509_cert_url?: string;
    client_x509_cert_url?: string;
}

try {
    let rawServiceAccount: RawServiceAccount | undefined;

    // 1. Try to load from Environment Variable (Render/Production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            rawServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) as RawServiceAccount;
        } catch (e) {
            // Warn only, then fall back to file
            console.warn('Warning: Could not parse FIREBASE_SERVICE_ACCOUNT env var. Falling back to key file.');
        }
    }

    // 2. Fallback to local file (Development)
    if (!rawServiceAccount) {
        try {
            // Using require to load JSON synchronously
            rawServiceAccount = require('../../serviceAccountKey.json');
        } catch (e) {
            console.error('Could not load serviceAccountKey.json. Ensure it exists in backend root.');
            throw e;
        }
    }

    // 3. Validation & Sanitization
    if (!rawServiceAccount || !rawServiceAccount.private_key) {
        throw new Error('Firebase Private Key is missing. Check serviceAccountKey.json or .env');
    }

    if (rawServiceAccount.private_key.includes('PLACEHOLDER')) {
        throw new Error('Firebase Private Key is still a PLACEHOLDER. Please replace serviceAccountKey.json with the real file from Firebase Console.');
    }

    // Fix newlines in private key if they are escaped literal "\n"
    const privateKey = rawServiceAccount.private_key.replace(/\\n/g, '\n');

    // 4. Map to Admin SDK format (camelCase)
    const serviceAccount: admin.ServiceAccount = {
        projectId: rawServiceAccount.project_id,
        clientEmail: rawServiceAccount.client_email,
        privateKey: privateKey,
    };

    // 5. Initialize
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized Successfully');

} catch (error: any) {
    console.error('Firebase Initialization Error:', error.message);
    process.exit(1); // Fatal error, stop server to prevent confusing crashes later
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const auth = admin.auth();

export { admin, db, auth };
