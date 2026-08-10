import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Configuração lida de variáveis de ambiente (nunca versionar as chaves).
// Valores reais ficam em .env (ignorado pelo git); placeholders em .env.example.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const cleanConfig = Object.fromEntries(Object.entries(firebaseConfig).filter(([, v]) => Boolean(v)));

export const app = initializeApp(cleanConfig);
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
