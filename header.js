import React, {useEffect, useState} from "react";
import {
    View,
    Text,
    Button,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
    Image
} from "react-native";
import { getAuth, signOut } from "firebase/auth";
import UserSettings from "./userSettings";
import { MaterialIcons } from "@expo/vector-icons";
import logoutIcon from "./assets/logout.png"; // For hamburger menu icon

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
            <View style={styles.header_container}>
                {showDisplay ? (
                    <> <View style={styles.icon_container}>
                            <TouchableOpacity
                                onPress={() => setIsMenuOpen((prev) => !prev)}
                                style={styles.hamburgerButton}
                            >
                                <MaterialIcons name="menu" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLogout} style={styles.buttonImage}>
                                <Image source={logoutIcon} style={styles.buttonImage} />
                            </TouchableOpacity>
                    </View>

                        {isMenuOpen && (
                            <View style={styles.menu}>
                                <View style ={styles.user_container}>
                                    <Text style={styles.title}>Welcome, {user?.email} </Text>

                                    <TouchableOpacity
                                        onPress={handleSettingsTouch}
                                        style={styles.settingsButton}
                                    >
                                        <MaterialIcons name="settings" size={24} color="white" />
                                    </TouchableOpacity>
                                </View>
                                <View style ={styles.user_container}>
                                    <TouchableOpacity onPress={toggleMode} style={styles.button}>
                                        <Text>{`Switch to ${mode === "display" ? "Upload" : "Display"} Mode`}</Text>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        )}
                    </>
                ) : null}
            </View>
        </TouchableWithoutFeedback>
    );

}
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
    header_container: {
        width: "100%",
        paddingTop: screenHeight * .1,
        backgroundColor: "black",
        zIndex: 1,

    },
    icon_container:{
        flexDirection: "row",
        justifyContent: "space-between",
    },
    user_container: {
        width: "100%",

        zIndex: 1,
        flexDirection: "row",
        justifyContent: "space-evenly",

    },
    hamburgerButton: {
        padding: 20,
        marginLeft: 10,

    },
    settingsButton: {
        padding: 0,
        marginLeft: 10,

    },
    menu: {
        padding: screenHeight *.01,
        backgroundColor: "grey",
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        width:"90%",
    },
    buttonImage: {
        width: 50,
        height: 50,
        marginTop: 5,
        marginRight: 10,
    }
});
