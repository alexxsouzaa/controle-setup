import { initializeApp, type FirebaseApp } from 'firebase/app';
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

export const hasFirebaseConfig: boolean = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const cleanConfig = Object.fromEntries(Object.entries(firebaseConfig).filter(([, v]) => Boolean(v)));

export const app: FirebaseApp | undefined = hasFirebaseConfig ? initializeApp(cleanConfig) : undefined;
export const db: Firestore | undefined = app ? getFirestore(app) : undefined;

// Quando habilitado (padrão), os dados são persistidos no Firestore.
// Desative em dev com VITE_FIRESTORE=false para usar o localStorage.
export const useFirestore: boolean = hasFirebaseConfig && (import.meta.env.VITE_FIRESTORE ?? 'true') !== 'false';
