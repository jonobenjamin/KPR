// Firebase configuration for KPR Monitoring Portal (same project as PWA)
const firebaseConfig = {
  apiKey: "AIzaSyCHpJdRUch5Na_6HgM6dxgWxfoKeciPo_s",
  authDomain: "wildlifetracker-4d28b.firebaseapp.com",
  projectId: "wildlifetracker-4d28b",
  storageBucket: "wildlifetracker-4d28b.firebasestorage.app",
  messagingSenderId: "209541121506",
  appId: "1:209541121506:web:7fe9890f91be06dc4ba5bb",
  measurementId: "G-4XLR7JTEEH"
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithCustomToken, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "wildlifetracker-db");

window.firebasePortal = {
  auth,
  db,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
};
