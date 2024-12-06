import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ImageUploader from "./imageUpload";
import LoginForm from "./login";
import Header from "./header";

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
            <Header user={user} onLogout={() => setUser(null)} />
            <ImageUploader /> {/* Always display ImageUploader below the header */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
