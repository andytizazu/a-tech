import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. The client is offline.");
      } else if (error.message.includes('Missing or insufficient permissions')) {
        // This is actually a good sign - it means we reached the server
        console.log("Firestore reached (permission denied as expected)");
      } else {
        console.error("Firestore connection test error:", error);
      }
    }
  }
}
testConnection();
