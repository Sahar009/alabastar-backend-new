import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin SDK configuration
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      // Initialize Firebase Admin SDK
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE || 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      // Validate required environment variables
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        console.warn('Firebase Admin SDK not configured. Google Sign-In will not work.');
        return false;
      }

      // Initialize the app
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('Firebase Admin SDK initialized successfully');
      return true;
    } else {
      console.log('Firebase Admin SDK already initialized');
      return true;
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    return false;
  }
};

// Get Firebase Auth instance
const getFirebaseAuth = () => {
  try {
    return getAuth();
  } catch (error) {
    console.error('Error getting Firebase Auth instance:', error);
    return null;
  }
};

export { initializeFirebase, getFirebaseAuth }; 