import React, {useEffect, useState} from "react";
import {View, Text, Button, StyleSheet, TouchableOpacity, TouchableWithoutFeedback} from "react-native";
import { getAuth, signOut } from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons"; // For hamburger menu icon

export default function Header({ onLogout, user, setMode, mode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State to toggle menu visibility
    const [showDisplay, setDisplay] = useState(false);
    const [menuTimeout, setMenuTimeout] = useState(null);

    const handleTouch = () => {
        setDisplay(true);
        console.log("touch")
    };
    const auth = getAuth();

    useEffect(() => {
        if(showDisplay && isMenuOpen){
            setDisplay(true)
        }
        if (!isMenuOpen) {
            const timer = setTimeout(() => {
                setDisplay(false); // Set showDisplay back to false after 3 seconds
            }, 3000);

            return () => clearTimeout(timer); // Cleanup the timer on component unmount or when showDisplay changes
        }
    }, [showDisplay,isMenuOpen]);
    const handleLogout = async () => {
        try {
            await signOut(auth); // Log out the user
            if (onLogout) onLogout();
        } catch (error) {
            console.error("Logout failed:", error.message);
        }
    };

    const toggleMode = () => {
        // Toggle between "display" and "upload" modes
        setMode((prevMode) => (prevMode === "display" ? "upload" : "display"));
    };
    return (
        <TouchableWithoutFeedback onPress={handleTouch}>
            <View style={styles.container}>
                {showDisplay ? (
                    <>
                        <TouchableOpacity
                            onPress={() => setIsMenuOpen((prev) => !prev)}
                            style={styles.hamburgerButton}
                        >
                            <MaterialIcons name="menu" size={24} color="white" />
                        </TouchableOpacity>

                        {isMenuOpen && (
                            <View style={styles.menu}>
                                <Text style={styles.title}>Welcome, {user?.email}!</Text>
                                <Button title="Logout" onPress={handleLogout} />
                                <Button title={`Switch to ${mode === "display" ? "Upload" : "Display"} Mode`} onPress={toggleMode} />
                            </View>
                        )}
                    </>
                ) : null}
            </View>
        </TouchableWithoutFeedback>
    );

}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        paddingTop: 100, // Adjust based on your app's layout
        backgroundColor: "#6200ee",
    },
    hamburgerButton: {
        padding: 10,
        marginLeft: 10,

    },
    menu: {
        padding: 10,
        backgroundColor: "#6200ee",
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
    },
});
