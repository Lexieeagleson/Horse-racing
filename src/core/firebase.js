import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, remove, get, onDisconnect, serverTimestamp } from 'firebase/database';

// Firebase configuration - users should replace with their own config
// To set up your own Firebase:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project
// 3. Enable Realtime Database
// 4. Set database rules to allow read/write
// 5. Copy your config here
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://demo-project-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Check if Firebase is properly configured (not using demo values)
export const isFirebaseConfigured = () => {
  const hasApiKey = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== "demo-api-key";
  const hasDatabaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL && import.meta.env.VITE_FIREBASE_DATABASE_URL !== "https://demo-project-default-rtdb.firebaseio.com";
  const hasProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_PROJECT_ID !== "demo-project";
  
  return hasApiKey && hasDatabaseUrl && hasProjectId;
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, set, onValue, update, remove, get, onDisconnect, serverTimestamp };
