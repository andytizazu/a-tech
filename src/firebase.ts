import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Firestore persistence failed-precondition (multiple tabs open)');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Firestore persistence unimplemented');
    } else {
      console.error('Firestore persistence error:', err);
    }
  });
}

export const auth = getAuth();


async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.log("Firestore connection state: offline (will utilize offline persistence/cache)");
      } else if (error.message.includes('Missing or insufficient permissions')) {
        // This is actually a good sign - it means we reached the server
        console.log("Firestore reached (permission check verified)");
      } else {
        console.warn("Firestore connection check note:", error.message);
      }
    }
  }
}

// Run connection check with a delay to prevent early startup blocking / warnings
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection();
  }, 3000);
}
