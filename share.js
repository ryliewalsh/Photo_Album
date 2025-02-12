import React, {useState} from "react";
import {View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert, TextInput, Button} from "react-native";
import embellishment from "./assets/FrameEmbellishment.png";
import {createUserWithEmailAndPassword} from "firebase/auth";
import {collection, doc, getDocs, query, setDoc, where} from "firebase/firestore";
import {db} from "./firebase";

export default function ShareScreen({  handleLogout }) {
    const [user, setUser] = useState(null);
    const [userLookup, setUserLookup] = useState(null);
    const handleLookup = async () => {
            try {
                const albumRef = collection(db, "users");
                const q = query(albumRef, where("userName", "==", userLookup));

                const userSnapshot = await getDocs(q);
                console.log(userSnapshot)


                if (userSnapshot.empty) {
                    Alert.alert("User not found");
                    return;
                }

                let userData = null;
                userSnapshot.forEach((doc) => {
                    userData = { id: doc.id, ...doc.data() };
                });
                console.log("User found:", userData);
            Alert.alert("Look up success");
        } catch (error) {
            Alert.alert("Look up Failed", error.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Frame Logo */}
            <Image source={require("./assets/FRAME.png")} style={styles.logo} />


            <Text style={styles.title}>Add friends</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={userLookup}
                onChangeText={setUserLookup}
            />
            <Button title="Find" onPress={handleLookup} />
            {/* Logout Button */}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <Image source={embellishment} style={styles.embellishment} />
        </View>
    );
}
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#f4f4f4",
    },
    logo:{
        marginTop: screenHeight * .15,
        marginBottom: screenHeight *.075,
        resizeMode:"cover",
        width: screenWidth,
        height: screenHeight * .2,
        overflow: "hidden",
    },
    buttonContainer: {
        width: "80%",
        alignItems: "center",
    },
    button: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        width: screenWidth * 0.8,
        maxWidth: 300,
        backgroundColor: "white",
        alignItems: "center",
    },
    buttonText: {
        padding: 4,
        fontFamily: "Futura",
        fontSize: 20,
        fontWeight: 'thin',
        marginBottom: 10,
    },
    logoutButton: {
        marginTop: 20,
        padding: 10,
    },
    logoutText: {
        color: "red",
        fontSize: 16,
        fontWeight: "bold",
    },
    embellishment: {
        resizeMode:"cover",
        width: screenWidth,
        height: screenHeight * .15,
        overflow: "hidden",
        position: 'absolute',
        bottom: 0,
        left: 0,
    },

});
