import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnCtVFsG41yiENIEIJY23QZj0F0dmME-4",
  authDomain: "sons-of-anarchy-11386.firebaseapp.com",
  projectId: "sons-of-anarchy-11386",
  storageBucket: "sons-of-anarchy-11386.firebasestorage.app",
  messagingSenderId: "556557231783",
  appId: "1:556557231783:web:edc14e86853a9837501d82",
  measurementId: "G-VQB3MWT058",
};

const hasConfig = Object.values(firebaseConfig).some(
  (value) => typeof value === "string" && value.trim() !== ""
);

let db = null;
let auth = null;
if (hasConfig) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isAnalyticsSupported()
      .then((supported) => {
        if (supported) {
          getAnalytics(app);
        }
      })
      .catch(() => undefined);
  } catch (error) {
    console.warn("Firebase init failed", error);
  }
}

const getDocValue = async (key) => {
  if (!db) return null;
  try {
    const snapshot = await getDoc(doc(db, "soa_store", key));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return data?.value ?? null;
  } catch (error) {
    console.warn("Firebase read failed", error);
    return null;
  }
};

const setDocValue = async (key, value) => {
  if (!db) return;
  try {
    await setDoc(
      doc(db, "soa_store", key),
      {
        value,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("Firebase write failed", error);
    throw error;
  }
};

window.firebaseStore = {
  enabled: Boolean(db),
  getDocValue,
  setDocValue,
};

window.firebaseAuth = {
  enabled: Boolean(auth),
  auth,
  onAuthStateChanged: (callback) => (auth ? onAuthStateChanged(auth, callback) : null),
  signIn: (email, password) =>
    auth ? signInWithEmailAndPassword(auth, email, password) : Promise.reject(new Error("Auth not initialized")),
  signUp: (email, password) =>
    auth ? createUserWithEmailAndPassword(auth, email, password) : Promise.reject(new Error("Auth not initialized")),
  signOut: () => (auth ? signOut(auth) : Promise.reject(new Error("Auth not initialized"))),
};
