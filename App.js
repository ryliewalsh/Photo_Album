import React, { useState, useEffect } from "react";
import {View, Text, TouchableOpacity, StyleSheet, Dimensions, Image} from "react-native";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import AuthScreen from "./signUp";
import ImageUploader from "./imageUpload";
import ImageCarousel from "./galleryView";
import HomeScreen from "./landingPage";
import Header from "./header";
import ShareScreen from "./share";
import Footer from "./footer";
import embellishment from "./assets/FrameEmbellishment.png";

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState("home");

    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if(currentUser) {
                setMode("home");
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
        setMode("home");
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    return (
        <View style={styles.container}>


            {mode === "home" && <HomeScreen setMode={setMode} handleLogout={handleLogout} />}
            {mode === "view" && <ImageCarousel userId={user?.uid} setMode={setMode} />}
            {mode === "upload" && <ImageUploader userId={user?.uid} />}
            {mode === "share" && <ShareScreen userId={user?.uid} handleLogout={handleLogout} />}


            <Footer setMode={setMode} userId={user?.uid} mode={mode} handleLogout={handleLogout} />

        </View>
    );
}
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        marginTop: 20,
        padding: 10,
    },
    backText: {
        color: "#007bff",
        fontSize: 16,
    },
    embellishment: {
        color: "blue",
        resizeMode:"cover",
        width: screenWidth,
        overflow: "hidden",
        position: 'absolute',
        bottom: 0,
        left: 0,
    }

});
