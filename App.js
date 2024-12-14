import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ImageUploader from "./imageUpload";
import LoginForm from "./login";
import Header from "./header"; // Import Header component
import ImageFetcher from "./galleryView";
import ImageCarousel from "./galleryView";

export default function App() {
    const [user, setUser] = useState(null); // State for tracking user
    const [loading, setLoading] = useState(true); // State for loading indicator
    const [mode, setMode] = useState("display"); // State for tracking current mode ("display" or "upload")

    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser); // Update user state if logged in
            setLoading(false); // Hide loading spinner when auth state is known
        });

        return () => unsubscribe(); // Cleanup listener on component unmount
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!user) {
        return <LoginForm />; // Show login form if no user is logged in
    }

    return (
        <View style={styles.container}>
            {/* Pass the user and setMode to Header */}
            <Header user={user} onLogout={() => setUser(null)} setMode={setMode} mode={mode} />

            {/* Conditionally render content based on the current mode */}
            {mode === "display" ? (
                <ImageUploader/>
            ) : (
                <ImageUploader />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
