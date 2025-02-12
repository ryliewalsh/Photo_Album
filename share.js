import React, {useEffect, useState} from "react";
import {View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert, TextInput, Button} from "react-native";
import embellishment from "./assets/FrameEmbellishment.png";

import {addDoc, collection, doc, getDocs, query, setDoc, where} from "firebase/firestore";
import {db} from "./firebase";
import Feather from '@expo/vector-icons/Feather';
import {getAuth, onAuthStateChanged} from "firebase/auth";



export default function ShareScreen({  handleLogout }) {
    const [user, setUser] = useState(null);
    const [userLookup, setUserLookup] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [foundId, setFoundId] = useState(null);



    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

        });

        return () => unsubscribe();
    }, []);


    const handleLookup = async () => {
        try {
            const albumRef = collection(db, "users");
            const q = query(albumRef, where("userName", "==", userLookup));

            const userSnapshot = await getDocs(q);

            if (userSnapshot.empty) {
                Alert.alert("User not found");
                return;
            }

            // Get the first matching user document
            const foundUser = userSnapshot.docs[0].data();
            const foundUserId = userSnapshot.docs[0].id; // Correct way to get user ID

            setFoundId(foundUserId); // Update state

            console.log("User found:", foundUserId);

            // Pass the foundUserId directly instead of waiting for state update
            sendFriendRequest(foundUserId);

        } catch (error) {
            Alert.alert("Lookup Failed", error.message);
        }
    };

    const sendFriendRequest = async (toUserId) => {
        try {
            const friendRequestsRef = collection(db, "friendRequests");

            // Check if a request already exists
            const q = query(
                friendRequestsRef,
                where("fromUser", "==", user.uid),
                where("toUser", "==", toUserId)
            );

            const userSnapshot = await getDocs(q);

            if (!userSnapshot.empty) {
                console.log("Request already sent");
                Alert.alert("Friend Request", "You have already sent a request to this user.");
                return;
            }

            // If no existing request, send a new friend request
            await addDoc(friendRequestsRef, {
                fromUser: user.uid,
                toUser: toUserId,
                status: "pending",
                timestamp: Date.now(),
            });

            Alert.alert("Success", "Friend request sent!");

        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    //check for friend requests and handle reply
    const handleFriendRequest = async () =>{

    }

    return (
        <View style={styles.container}>
            <View style ={styles.user_container}>

                <TouchableOpacity
                    onPress={() => setShowModal(true)}
                    style={styles.settingsButton}
                >
                    <Feather name="inbox" size={24} color="black" />
                </TouchableOpacity>
            </View>
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
    user_container: {
        width: "100%",

        zIndex: 2,


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
