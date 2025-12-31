import firebase from 'firebase/app';
import 'firebase/firestore';
import { Transaction, Expense } from '../types';

let app: firebase.app.App | undefined;
let db: firebase.firestore.Firestore | undefined;

// Initialize Firebase with config provided by user at runtime
export const initFirebase = (config: any) => {
  try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(config);
    } else {
        app = firebase.app();
    }
    db = firebase.firestore();
    console.log("Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

// --- Transactions ---

export const subscribeToTransactions = (callback: (data: Transaction[]) => void) => {
  if (!db) return () => {};
  
  return db.collection('transactions')
    .orderBy('date', 'desc')
    .onSnapshot((snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Transaction[];
        callback(transactions);
    }, (error) => {
        console.error("Transaction subscription error:", error);
        if ((error as any).code === 'permission-denied') {
            alert("🔥 Firestore Error: Permission Denied\n\nPlease go to Firebase Console > Firestore Database > Rules and change:\n\nallow read, write: if false;\n\nTO\n\nallow read, write: if true;");
        }
    });
};

export const addTransactionToDb = async (transaction: Omit<Transaction, 'id'>) => {
  if (!db) throw new Error("Database not connected");
  // Ensure undefined values are not passed (Firebase doesn't like them)
  const cleanData = JSON.parse(JSON.stringify(transaction));
  await db.collection('transactions').add(cleanData);
};

export const updateTransactionInDb = async (transaction: Transaction) => {
  if (!db) throw new Error("Database not connected");
  const { id, ...data } = transaction;
  const cleanData = JSON.parse(JSON.stringify(data));
  await db.collection('transactions').doc(id).update(cleanData);
};

export const deleteTransactionFromDb = async (id: string) => {
  if (!db) throw new Error("Database not connected");
  await db.collection('transactions').doc(id).delete();
};

// --- Expenses ---

export const subscribeToExpenses = (callback: (data: Expense[]) => void) => {
  if (!db) return () => {};
  
  return db.collection('expenses')
    .orderBy('date', 'desc')
    .onSnapshot((snapshot) => {
        const expenses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Expense[];
        callback(expenses);
    }, (error) => {
        console.error("Expense subscription error:", error);
        if ((error as any).code === 'permission-denied') {
             console.warn("Permission denied for expenses.");
        }
    });
};

export const addExpenseToDb = async (expense: Omit<Expense, 'id'>) => {
  if (!db) throw new Error("Database not connected");
  const cleanData = JSON.parse(JSON.stringify(expense));
  await db.collection('expenses').add(cleanData);
};

export const updateExpenseInDb = async (expense: Expense) => {
  if (!db) throw new Error("Database not connected");
  const { id, ...data } = expense;
  const cleanData = JSON.parse(JSON.stringify(data));
  await db.collection('expenses').doc(id).update(cleanData);
};

export const deleteExpenseFromDb = async (id: string) => {
  if (!db) throw new Error("Database not connected");
  await db.collection('expenses').doc(id).delete();
};

// --- Migration Tool ---

export const migrateDataToFirebase = async (transactions: Transaction[], expenses: Expense[]) => {
    if (!db) throw new Error("Database not connected");
    
    const batch = db.batch();
    
    // Limit batch size (Firestore limit is 500, we'll likely be under)
    transactions.forEach(t => {
        // Create new doc ref (don't use old ID to avoid collisions, or use old ID if preferred)
        const ref = db!.collection('transactions').doc(); 
        const { id, ...data } = t;
        batch.set(ref, data);
    });

    expenses.forEach(e => {
        const ref = db!.collection('expenses').doc();
        const { id, ...data } = e;
        batch.set(ref, data);
    });

    await batch.commit();
};