import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Your Firebase config file

const createUserIfNotExist = async (userId, userData) => {
    const userRef = doc(db, "users", userId);

    // Check if user document already exists
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
        // If document doesn't exist, create it
        await setDoc(userRef, userData);
        console.log("User created!");
    } else {
        console.log("User already exists!");
    }
};
