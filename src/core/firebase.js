import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, remove, get, onDisconnect, serverTimestamp } from 'firebase/database';

// Default/demo values for Firebase configuration
// These are used when environment variables are not set
const DEMO_CONFIG = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  databaseURL: "https://demo-project-default-rtdb.firebaseio.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Firebase configuration - users should replace with their own config
// To set up your own Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project
// 3. Enable Realtime Database
// 4. Set database rules to allow read/write
// 5. Copy your config here
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEMO_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEMO_CONFIG.authDomain,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || DEMO_CONFIG.databaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEMO_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEMO_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEMO_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEMO_CONFIG.appId
};

// Check if Firebase is properly configured (not using demo values)
export const isFirebaseConfigured = () => {
  const hasApiKey = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== DEMO_CONFIG.apiKey;
  const hasDatabaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL && import.meta.env.VITE_FIREBASE_DATABASE_URL !== DEMO_CONFIG.databaseURL;
  const hasProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_PROJECT_ID !== DEMO_CONFIG.projectId;
  
  return hasApiKey && hasDatabaseUrl && hasProjectId;
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, onValue, update, remove, get, onDisconnect, serverTimestamp };
