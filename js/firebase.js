import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

const firebaseConfig = {

    apiKey: "AIzaSyB1P2P-3dR6DDKyEbglxQ4ElGd5au006n4",

    authDomain: "test-1619e.firebaseapp.com",

    databaseURL:
        "https://test-1619e-default-rtdb.firebaseio.com/",

    projectId:
        "test-1619e",

    storageBucket:
        "test-1619e.firebasestorage.app",

    messagingSenderId:
        "374500672512",

    appId:
        "1:374500672512:web:6c5529a84b56ce017204e5"
};


const app =
    initializeApp(firebaseConfig);


export const auth =
    getAuth(app);


export const database =
    getDatabase(app);
