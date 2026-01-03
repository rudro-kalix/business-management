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
    // If app exists, we assume it's initialized. 
    // Ideally we would check if config changed, but for this simple app, 
    // if the user needs to change config, they should use the "Disconnect" button which reloads the page.
    if (!app) {
        app = initializeApp(config);
        db = getFirestore(app);
        auth = getAuth(app);
        console.log("Firebase initialized successfully");
    } else {
        // Ensure auth is retrieved if app was already around but auth wasn't used yet (edge case)
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
    // Add context to common errors
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
  if (!db) return () => {};
  
  const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
    callback(transactions);
  }, (error) => {
    console.error("Transaction subscription error:", error);
    if (error.code === 'permission-denied') {
        // This is expected if user is not logged in and rules require auth
        console.warn("Permission denied (Auth required).");
    }
  });
};

export const addTransactionToDb = async (transaction: Omit<Transaction, 'id'>) => {
  if (!db) throw new Error("Database not connected");
  // Ensure undefined values are not passed (Firebase doesn't like them)
  const cleanData = JSON.parse(JSON.stringify(transaction));
  await addDoc(collection(db, 'transactions'), cleanData);
};

export const updateTransactionInDb = async (transaction: Transaction) => {
  if (!db) throw new Error("Database not connected");
  const { id, ...data } = transaction;
  const cleanData = JSON.parse(JSON.stringify(data));
  await updateDoc(doc(db, 'transactions', id), cleanData);
};

export const deleteTransactionFromDb = async (id: string) => {
  if (!db) throw new Error("Database not connected");
  await deleteDoc(doc(db, 'transactions', id));
};

// --- Expenses ---

export const subscribeToExpenses = (callback: (data: Expense[]) => void) => {
  if (!db) return () => {};
  
  const q = query(collection(db, 'expenses'), orderBy('date', 'desc'));
  
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
  if (!db) throw new Error("Database not connected");
  const cleanData = JSON.parse(JSON.stringify(expense));
  await addDoc(collection(db, 'expenses'), cleanData);
};

export const updateExpenseInDb = async (expense: Expense) => {
  if (!db) throw new Error("Database not connected");
  const { id, ...data } = expense;
  const cleanData = JSON.parse(JSON.stringify(data));
  await updateDoc(doc(db, 'expenses', id), cleanData);
};

export const deleteExpenseFromDb = async (id: string) => {
  if (!db) throw new Error("Database not connected");
  await deleteDoc(doc(db, 'expenses', id));
};

// --- Migration Tool ---

export const migrateDataToFirebase = async (transactions: Transaction[], expenses: Expense[]) => {
    if (!db) throw new Error("Database not connected");
    
    const batch = writeBatch(db);
    
    // Limit batch size (Firestore limit is 500, we'll likely be under)
    transactions.forEach(t => {
        // Create new doc ref (don't use old ID to avoid collisions, or use old ID if preferred)
        const ref = doc(collection(db, 'transactions')); 
        const { id, ...data } = t;
        batch.set(ref, data);
    });

    expenses.forEach(e => {
        const ref = doc(collection(db, 'expenses'));
        const { id, ...data } = e;
        batch.set(ref, data);
    });

    await batch.commit();
};