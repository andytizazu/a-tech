import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Suppress internal Firestore connection state transition and transport logs
setLogLevel('silent');

const app = initializeApp(firebaseConfig);

// Initialize Firestore with auto-detect long polling and resilient multi-tab cache
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: typeof window !== 'undefined' ? persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }) : undefined
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

