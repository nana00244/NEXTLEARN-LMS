import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

export const loggingService = {
  logAction: async (userId: string, action: string, details?: string) => {
    try {
      // User requested 'accountant_activity' collection
      const logData = {
        accountantId: userId,
        action,
        details: details || '',
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, "accountant_activity"), logData);
    } catch (error: any) {
      console.error("[Logging] Permission or Write Error:", error.message);
      // Graceful failure for logging so it doesn't block the main transaction
    }
  },

  getLogs: async () => {
    try {
      const q = query(collection(db, "accountant_activity"), orderBy("timestamp", "desc"), limit(100));
      const snap = await getDocs(q);
      
      // Fetch users for hydration
      const usersSnap = await getDocs(collection(db, "users"));
      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

      return snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()?.toISOString() || new Date().toISOString(),
          user: users.find(u => u.id === data.accountantId)
        };
      });
    } catch (error: any) {
      console.error("[Logging] Error fetching activity trail:", error);
      return [];
    }
  }
};