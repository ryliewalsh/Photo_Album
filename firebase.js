
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCmhzLANJG6rNmbSeNIq8TCud5QrtM-Ex8",
    authDomain: "photo-album-44ba2.firebaseapp.com",
    projectId: "photo-album-44ba2",
    storageBucket: "photo-album-44ba2.firebasestorage.app",
    messagingSenderId: "315037262018",
    appId: "1:315037262018:web:c10a4f8aec3d60e2b25b5b",
    measurementId: "G-ZD101XL0MY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { app, storage };