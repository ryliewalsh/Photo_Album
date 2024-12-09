import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { getAuth, signOut } from "firebase/auth";

export default function Header({ onLogout, user }) {
    const auth = getAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth); // Log out the user
            if (onLogout) onLogout();
        } catch (error) {
            console.error("Logout failed:", error.message);
        }
    };

    return (
        <View style={styles.header}>
            <Text style={styles.title}>Welcome, {user?.email}!</Text>
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        width: "100%",
        top: "5%",
        padding: 10,
        backgroundColor: "#6200ee",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
