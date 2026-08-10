import { create } from 'zustand';
import { signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { setAuthIdentity } from '../lib/api/client';
import { useAppStore } from './appStore';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string;
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthStore {
  user: AuthUser | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>(() => ({
  user: null,
  status: 'loading',
  signIn: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  },
  signOut: async () => {
    await firebaseSignOut(auth);
  },
}));

function applyAuthUser(fbUser: { uid: string; email: string | null; displayName: string | null } | null) {
  if (fbUser) {
    const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário';
    setAuthIdentity(displayName);
    useAppStore.getState().setCurrentUser(displayName);
    useAuthStore.setState({
      user: { uid: fbUser.uid, email: fbUser.email, displayName },
      status: 'authenticated',
    });
  } else {
    setAuthIdentity(null);
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
  }
}

let started = false;
export function initAuth(): void {
  if (started) return;
  started = true;
  onAuthStateChanged(auth, (user) => {
    applyAuthUser(user);
  });
}
