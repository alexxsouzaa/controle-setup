import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBXUhXLZJ_A23cmkMBbifXF7-85fDmwgjc',
  authDomain: 'setflow-boti.firebaseapp.com',
  projectId: 'setflow-boti',
  storageBucket: 'setflow-boti.firebasestorage.app',
  messagingSenderId: '85668635942',
  appId: '1:85668635942:web:e5640ae14e2c74f4bd8de7',
  measurementId: 'G-VFB5RB1R7Y',
};

export const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app);

// Quando habilitado (padrão), os dados são persistidos no Firestore.
// Desative em dev com VITE_FIRESTORE=false para usar o localStorage.
export const useFirestore: boolean = (import.meta.env.VITE_FIRESTORE ?? 'true') !== 'false';
