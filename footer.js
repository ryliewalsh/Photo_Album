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
import Feather from '@expo/vector-icons/Feather';
import embellishment from "./assets/FrameEmbellishment.png";
import Header from "./header"; // For hamburger menu icon

export default function Footer({ onLogout, setMode, mode}) {
    const handleLogout = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
            if (onLogout) onLogout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleReturn = () => {
        setMode("home")
    }




    return (
        <>
            {(mode === "home") && (
                <View style={styles.footer_container}>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={handleReturn} style={styles.logoutButton}>
                            <Feather
                                name="arrow-left-circle"
                                size={28}
                                color={"#f4f4f4"}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                            <Feather name="log-out" size={28} color="black" />
                        </TouchableOpacity>
                    </View>
                    <Image source={embellishment} style={styles.embellishment} />
                </View>
            )}

            {(mode !== "home" && mode !== "view") && (
                <View style={styles.footer_container}>
                    <View style={styles.buttonRow}>
                        <TouchableOpacity onPress={handleReturn} style={styles.logoutButton}>
                            <Feather
                                name="arrow-left-circle"
                                size={28}
                                color={"#f4f4f4"}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                            <Feather name="log-out" size={28} color="#f4f4f4" />
                        </TouchableOpacity>
                    </View>
                    <Image source={embellishment} style={styles.embellishment} />
                </View>
            )}

            {(mode === "view") && (
                <View style={styles.footer_container}>

                </View>
            )}

        </>
    );
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const styles = StyleSheet.create({
    footer_container: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "90%",
        position: "absolute",
        bottom: screenHeight * .1,
        zIndex: 2,
    },
    logoutButton: {
        padding: 10,
    },
    embellishment: {
        width: "100%",
        height: screenHeight * .1,
        resizeMode: "cover",
        position: "absolute",
        bottom: 0,

    },
});
