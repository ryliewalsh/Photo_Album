import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import Firebase Auth
import ImageUploader from "./imageUpload";
import LoginForm from "./login";

export default function App() {
    const [user, setUser] = useState(null); // State for tracking user
    const [loading, setLoading] = useState(true); // State for loading indicator

    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser); // Update user state if logged in
            setLoading(false); // Hide loading spinner when auth state is known
        });

        return () => unsubscribe(); // Cleanup listener on component unmount
    }, []);

    if (loading) {
        return <Text>Loading...</Text>; // Show loading text until Firebase state is ready
    }

    return (
        <View style={styles.container}>
            {user ? <ImageUploader /> : <LoginForm />} {/* Show ImageUploader or LoginForm based on auth */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
