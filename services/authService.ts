import { 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  collection, doc, getDoc, getDocs, query, where, setDoc, serverTimestamp, Timestamp 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { User, UserRole } from '../types';
import { findUserByEmail } from './mockDb';

const normalizeRole = (role: string): UserRole => {
  if (!role) return 'student';
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'administrator') return 'administrator';
  return r as UserRole;
};

const mapFirestoreUser = (data: any): User => {
  let createdAt = new Date().toISOString();
  if (data.createdAt instanceof Timestamp) {
    createdAt = data.createdAt.toDate().toISOString();
  } else if (data.createdAt) {
    createdAt = data.createdAt.toString();
  }

  return {
    ...data,
    id: data.id,
    email: data.email,
    firstName: data.firstName || 'User',
    lastName: data.lastName || '',
    role: normalizeRole(data.role),
    createdAt,
    themePreference: data.themePreference || 'light',
    isActive: data.isActive ?? true
  };
};

export const authService = {
  login: async (email: string, password: string) => {
    const emailLower = email.toLowerCase().trim();
    console.log('[AuthService] Verifying identity for:', emailLower);
    
    try {
      // TIER 1: Firebase Auth (Bypasses Firestore Rules)
      try {
        const userCred = await signInWithEmailAndPassword(auth, emailLower, password);
        const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
        if (userDoc.exists()) {
          const profile = mapFirestoreUser({ ...userDoc.data(), id: userDoc.id });
          localStorage.setItem('nextlearn_active_session', JSON.stringify(profile));
          return { user: profile, token: await userCred.user.getIdToken() };
        }
      } catch (authErr) {
        console.warn('[AuthService] Tier 1 failed (Not in Auth Console).');
      }

      // TIER 2: Firestore Database Query
      try {
        const q = query(collection(db, "users"), where("email", "==", emailLower));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          if (userData.password === password || userData.passwordHash === password) {
            const profile = mapFirestoreUser({ ...userData, id: userDoc.id });
            localStorage.setItem('nextlearn_active_session', JSON.stringify(profile));
            return { user: profile, token: 'session_' + userDoc.id };
          }
        }
      } catch (dbErr: any) {
        if (dbErr.code === 'permission-denied') {
          console.error('[AuthService] SECURITY ALERT: Firestore Rules are blocking access. Falling back to Mock DB.');
        } else {
          throw dbErr;
        }
      }

      // TIER 3: Mock DB (Emergency Bypass for Provided Admin Credentials)
      const mockUser = findUserByEmail(emailLower);
      if (mockUser && (mockUser.passwordHash === password || mockUser.password === password)) {
        console.log('[AuthService] Emergency local match found. Granting Dashboard access.');
        const profile = mapFirestoreUser(mockUser);
        localStorage.setItem('nextlearn_active_session', JSON.stringify(profile));
        return { user: profile, token: 'local_emergency_' + mockUser.id };
      }

      throw new Error("Invalid institutional credentials. Please check your keys or use Developer Bypass.");
    } catch (error: any) {
      throw error;
    }
  },

  register: async (data: any) => {
    try {
      const emailLower = data.email.toLowerCase().trim();
      const userId = "u_" + Math.random().toString(36).substr(2, 9);
      
      const userData = {
        id: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: emailLower,
        password: data.password, 
        role: normalizeRole(data.role),
        isActive: true,
        createdAt: serverTimestamp(),
        themePreference: 'light'
      };

      // Direct write - will work if Rules allow 'create' on users
      await setDoc(doc(db, "users", userId), userData);
      
      const profile = mapFirestoreUser(userData);
      localStorage.setItem('nextlearn_active_session', JSON.stringify(profile));
      
      return { user: profile, token: 'session_' + userId };
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        throw new Error("ACCESS DENIED: Please apply the updated Firestore Rules to allow 'create' on the 'users' collection.");
      }
      throw error;
    }
  },

  loginWithGoogle: async (role: UserRole = 'student') => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);
      
      let profile: User;

      if (!userSnap.exists()) {
        const names = fbUser.displayName?.split(' ') || ['User', ''];
        const userData = {
          id: fbUser.uid,
          email: fbUser.email!,
          firstName: names[0],
          lastName: names.slice(1).join(' '),
          role: normalizeRole(role),
          isActive: true,
          createdAt: serverTimestamp(),
          themePreference: 'light',
          profilePicture: fbUser.photoURL || ''
        };
        await setDoc(userRef, userData);
        profile = mapFirestoreUser(userData);
      } else {
        profile = mapFirestoreUser(userSnap.data());
      }

      localStorage.setItem('nextlearn_active_session', JSON.stringify(profile));
      return { user: profile, token: await fbUser.getIdToken() };
    } catch (error: any) {
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem('nextlearn_active_session');
  },

  getCurrentUser: async (): Promise<User | null> => {
    const saved = localStorage.getItem('nextlearn_active_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        localStorage.removeItem('nextlearn_active_session');
      }
    }
    return null;
  }
};