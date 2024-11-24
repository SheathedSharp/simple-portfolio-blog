// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';




// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB-I5g_U6T-W7WOUVzTSx1-P0mvArOxDGs",
    authDomain: "hiddensharp-web-site-project.firebaseapp.com",
    databaseURL: "https://hiddensharp-web-site-project-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hiddensharp-web-site-project",
    storageBucket: "hiddensharp-web-site-project.firebasestorage.app",
    messagingSenderId: "694551904090",
    appId: "1:694551904090:web:1ff163244114cdd715fd63"
};




// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 