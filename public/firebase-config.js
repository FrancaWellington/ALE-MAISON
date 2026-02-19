import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// Adicionei updateDoc e getDoc na linha abaixo
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// SUAS CHAVES (Mantenha as suas chaves reais aqui!)
const firebaseConfig = {
    apiKey: "AIzaSyBNaWkNCyWE3zoz0LClGDcCH2nwfqlvwY0", 
    authDomain: "ale-maison-ea459.firebaseapp.com",
    projectId: "ale-maison-ea459",
    storageBucket: "ale-maison-ea459.firebasestorage.app",
    messagingSenderId: "1095901138446",
    appId: "1:1095901138446:web:5f06a30656ade802a2b65f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exportando as novas funções também
export { db, auth, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, signInWithEmailAndPassword, onAuthStateChanged, signOut };