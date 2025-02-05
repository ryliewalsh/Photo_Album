import React, {useEffect, useState} from "react";
import {View, Text, Button, StyleSheet, TouchableOpacity, TouchableWithoutFeedback} from "react-native";
import { getAuth, signOut } from "firebase/auth";
import UserSettings from "./userSettings";
import { MaterialIcons } from "@expo/vector-icons"; // For hamburger menu icon

export default function Header({ onLogout, user, setMode, mode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State to toggle menu visibility
    const [showDisplay, setDisplay] = useState(false);
    const [menuTimeout, setMenuTimeout] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

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
    const handleSettingsTouch = () => {
        // Toggle between "display" and "upload" modes
        setShowSettings(true)
    };

    if (showSettings) {
        return <UserSettings setShowSettings={setShowSettings} />; // Pass setShowSettings as a prop
    }

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
                                <View style ={styles.user_container}>
                                    <Text style={styles.title}>Welcome, {user?.email}!</Text>
                                    <TouchableOpacity
                                        onPress={handleSettingsTouch}
                                        style={styles.settingsButton}
                                    >
                                        <MaterialIcons name="settings" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
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
        paddingTop: "30%",
        backgroundColor: "black",
        zIndex: 1,

    },
    user_container: {
        width: "100%",
        paddingTop: "20%",
        backgroundColor: "black",
        zIndex: 1,
        flexDirection: "row",

    },
    hamburgerButton: {
        padding: 20,
        marginLeft: 10,

    },
    settingsButton: {
        padding: 10,
        marginLeft: 10,

    },
    menu: {
        padding: 20,
        backgroundColor: "blue",
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        width:"90%",
    },
});
