import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  Firestore,
  writeBatch
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  Auth,
  User 
} from 'firebase/auth';
import { Transaction, Expense } from '../types';

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

// Initialize Firebase with config provided by user at runtime
export const initFirebase = (config: any) => {
  try {
    if (!app) {
        app = initializeApp(config);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("Firebase initialized successfully");
    } else {
        if (!auth) auth = getAuth(app);
        if (!db) db = getFirestore(app);
    }
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

// --- Auth ---

export const loginWithGoogle = async () => {
  if (!auth) throw new Error("Authentication service not initialized. Check your config.");
  
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error: any) {
    console.error("Login failed", error);
    if (error.code === 'auth/unauthorized-domain') {
        throw new Error(`Domain not authorized. Go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add this domain.`);
    } else if (error.code === 'auth/configuration-not-found') {
        throw new Error(`Google Auth not enabled. Go to Firebase Console -> Authentication -> Sign-in method and enable Google.`);
    }
    throw error;
  }
};

export const logoutUser = async () => {
    if(!auth) return;
    await signOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
};

// --- Transactions ---

export const subscribeToTransactions = (callback: (data: Transaction[]) => void) => {
  if (!db || !auth?.currentUser) return () => {};
  
  // SECURE: Only query data belonging to the logged-in user
  const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
    callback(transactions);
  }, (error) => {
    console.error("Transaction subscription error:", error);
  });
};

export const addTransactionToDb = async (transaction: Omit<Transaction, 'id'>) => {
  if (!db || !auth?.currentUser) throw new Error("Database not connected or User not logged in");
  
  // SECURE: Attach User ID
  const dataWithAuth = {
      ...transaction,
      userId: auth.currentUser.uid
  };
  
  // Ensure undefined values are not passed
  const cleanData = JSON.parse(JSON.stringify(dataWithAuth));
  await addDoc(collection(db, 'transactions'), cleanData);
};

export const updateTransactionInDb = async (transaction: Transaction) => {
  if (!db || !auth?.currentUser) throw new Error("Database not connected");
  
  // SECURE: Ensure we don't accidentally strip the userId or change ownership
  const { id, ...data } = transaction;
  const dataWithAuth = {
      ...data,
      userId: auth.currentUser.uid 
  };
  
  const cleanData = JSON.parse(JSON.stringify(dataWithAuth));
  await updateDoc(doc(db, 'transactions', id), cleanData);
};

export const deleteTransactionFromDb = async (id: string) => {
  if (!db) throw new Error("Database not connected");
  await deleteDoc(doc(db, 'transactions', id));
};

// --- Expenses ---

export const subscribeToExpenses = (callback: (data: Expense[]) => void) => {
  if (!db || !auth?.currentUser) return () => {};
  
  const q = query(
      collection(db, 'expenses'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Expense[];
    callback(expenses);
  }, (error) => {
    console.error("Expense subscription error:", error);
  });
};

export const addExpenseToDb = async (expense: Omit<Expense, 'id'>) => {
  if (!db || !auth?.currentUser) throw new Error("Database not connected");
  
  const dataWithAuth = {
      ...expense,
      userId: auth.currentUser.uid
  };

  const cleanData = JSON.parse(JSON.stringify(dataWithAuth));
  await addDoc(collection(db, 'expenses'), cleanData);
};

export const updateExpenseInDb = async (expense: Expense) => {
  if (!db || !auth?.currentUser) throw new Error("Database not connected");
  
  const { id, ...data } = expense;
  const dataWithAuth = {
      ...data,
      userId: auth.currentUser.uid
  };

  const cleanData = JSON.parse(JSON.stringify(dataWithAuth));
  await updateDoc(doc(db, 'expenses', id), cleanData);
};

export const deleteExpenseFromDb = async (id: string) => {
  if (!db) throw new Error("Database not connected");
  await deleteDoc(doc(db, 'expenses', id));
};

// --- Migration Tool ---

export const migrateDataToFirebase = async (transactions: Transaction[], expenses: Expense[]) => {
    if (!db || !auth?.currentUser) throw new Error("Database not connected or User not logged in");
    
    const batch = writeBatch(db);
    const uid = auth.currentUser.uid;
    
    transactions.forEach(t => {
        const ref = doc(collection(db, 'transactions')); 
        const { id, ...data } = t;
        // Attach UID during migration
        batch.set(ref, { ...data, userId: uid });
    });

    expenses.forEach(e => {
        const ref = doc(collection(db, 'expenses'));
        const { id, ...data } = e;
        batch.set(ref, { ...data, userId: uid });
    });

    await batch.commit();
};