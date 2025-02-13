import React, {useEffect, useState} from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Alert,
    TextInput,
    Button,
    Modal
} from "react-native";
import embellishment from "./assets/FrameEmbellishment.png";

import {addDoc, collection, doc, getDoc, getDocs, query, deleteDoc, updateDoc, where, arrayUnion} from "firebase/firestore";
import {db} from "./firebase";
import Feather from '@expo/vector-icons/Feather';
import {getAuth, onAuthStateChanged} from "firebase/auth";




export default function ShareScreen({  handleLogout }) {
    const [user, setUser] = useState(null);
    const [userLookup, setUserLookup] = useState(null);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [showFriendModal, setShowFriendModal] = useState(false);
    const [foundId, setFoundId] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);
    const [friendList, setFriendList] = useState([]);
    const [requestsWithNames, setRequestsWithNames] = useState([]);



    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (showNotifModal) {
            handleFriendRequest();
        }
    }, [showNotifModal]);


    useEffect(() => {
        if (showFriendModal) {
            handleGetFriends();
        }
    }, [showFriendModal]);

    const getUserName = async (userId) => {
        try {
            console.log("Fetching username for userID:", userId);

            const userDocRef = doc(db, "users", userId); // Directly reference document by ID
            const userDocSnap = await getDoc(userDocRef);
            console.log("username", userDocSnap.data().userName)
            return userDocSnap.data().userName;
        } catch (error) {
            console.error("Username retrieval failed:", error.message);
            return "Unknown User";
        }
    };

    const handleLookup = async () => {
        try {
            const userRef = collection(db, "users");
            const q = query(userRef, where("userName", "==", userLookup));

            const userSnapshot = await getDocs(q);

            if (userSnapshot.empty) {
                Alert.alert("User not found");
                return;
            }


            const foundUser = userSnapshot.docs[0].data();
            const foundUserId = userSnapshot.docs[0].id;
            // Check if the found user is already a friend
            const currentUserRef = doc(db, "users", user.uid);
            const currentUserDoc = await getDoc(currentUserRef);
            const currentUserData = currentUserDoc.data();

            if (currentUserData.friends && currentUserData.friends.includes(foundUserId)) {
                Alert.alert("Already friends", "You are already friends with this user.");
                return;
            }
            setFoundId(foundUserId);

            console.log("User found:", foundUserId);


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

    // list friends and allow deletes
    const handleGetFriends = async () => {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            console.log("Fetching friends of:", user.uid);

            if (!userDocSnap.exists()) {
                console.warn(`No user found with userID: ${user.uid}`);
                return [];
            }

            const userData = userDocSnap.data();
            const friends = userData.friends || [];

            console.log("Raw friends array:", JSON.stringify(friends, null, 2));

            if (!Array.isArray(friends) || friends.length === 0) {
                console.log("No friends found.");
                setFriendRequests([]);
                return;
            }

            console.log("Fetching usernames for:", friends);

            const friendsList = await Promise.all(
                friends.map(async (friend, index) => {
                    const friendId = typeof friend === "string" ? friend : friend?.id;

                    if (!friendId) {
                        console.warn(`Skipping invalid friend at index ${index}:`, friend);
                        return null;
                    }

                    try {
                        const username = await getUserName(friendId);
                        console.log(`Username for ${friendId}:`, username);
                        return username ? { id: friendId, username } : null;
                    } catch (error) {
                        console.error(`Error fetching username for ${friendId}:`, error);
                        return null;
                    }
                })
            );

            setFriendList(friendsList.filter(friend => friend !== null));
        } catch (error) {
            console.error("Error in handleGetFriends:", error);
            Alert.alert("Error", error.message);
        }
    };





    //check for friend requests and handle reply
    const handleFriendRequest = async () => {
        try {
            const friendRequestsRef = collection(db, "friendRequests");
            const q = query(friendRequestsRef, where("toUser", "==", user.uid));

            console.log("Fetching friend requests for:", user.uid);

            const friendRequestsSnapshot = await getDocs(q);



            // Fetch each user's name
            const requests = await Promise.all(
                friendRequestsSnapshot.docs.map(async (docSnap) => {
                    const requestData = docSnap.data();
                    const senderUserName = await getUserName(requestData.fromUser);

                    return {
                        id: docSnap.id,
                        fromUser: requestData.fromUser,
                        userName: senderUserName,
                        status: requestData.status,
                    };
                })
            );

            setFriendRequests(requests);
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    //accepting requests updates friendRequests and adds User ref to users friends
    const acceptRequest = async (request) => {
        console.log("Request data:", request); // Log the request to check its structure

        try {
            const userDocRef = doc(db, "users", user.uid);
            const friendDocRef = doc(db, "users", request.fromUser);
            const requestDocRef = doc(db, "friendRequests", request.id);


            await updateDoc(userDocRef, {
                friends: arrayUnion(friendDocRef)
            });

            // update requests displayed
            await deleteDoc(requestDocRef);
            setFriendRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== request.id)
            );

            console.log("Friend request accepted!");

        } catch (error) {
            console.error("Error adding friend:", error);
            Alert.alert("Error", "Error adding friend: " + error.message);
        }
    };

    const declineRequest = async (request) => {
        console.log("Request data:", request); // Log the request to check its structure

        try {

            const requestDocRef = doc(db, "friendRequests", request.id);

            // update requests displayed
            await deleteDoc(requestDocRef);
            setFriendRequests((prevRequests) =>
                prevRequests.filter((req) => req.id !== request.id)
            );

            console.log("Friend request denied");

        } catch (error) {
            console.error("Error denying friend:", error);
            Alert.alert("Error", "Error denying friend: " + error.message);
        }
    };



    return (
        <View style={styles.container}>
            {/* Friend Request Modal */}
            <Modal visible={showNotifModal} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>

                        {friendRequests.length === 0 ? (
                            <Text>No new friend requests</Text>
                        ) : (
                            friendRequests.map((request, index) => (
                                <View key={index} style={styles.requestItem}>
                                    <Text>{request.userName} has sent you a request</Text>
                                    <View style={styles.buttonRow}>
                                        <Button title="Accept" onPress={() => acceptRequest(request)} />
                                        <Button title="Decline" onPress={() => declineRequest(request)} />
                                    </View>
                                </View>
                            ))
                        )}
                        <Button title="Close" onPress={() => setShowNotifModal(false)} />
                    </View>
                </View>
            </Modal>

                {/* Friend List Modal */}
                <Modal visible={showFriendModal} transparent={true} animationType="slide">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>

                            {friendList.length === 0 ? (
                                <Text>No Friends yet... Add someone!</Text>
                            ) : (
                                friendList.map((friend, index) => (
                                    <View key={index} style={styles.requestItem}>
                                        <Text>{friend.username} </Text>
                                    </View>
                                ))
                            )}
                            <Button title="Close" onPress={() => setShowFriendModal(false)} />
                        </View>
                    </View>
                </Modal>
            <View style ={styles.user_container}>

                <TouchableOpacity
                    onPress={() => setShowNotifModal(true)}
                    style={styles.settingsButton}
                >
                    <Feather name="inbox" size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowFriendModal(true)}
                    style={styles.friendButton}
                >
                    <Feather name="users" size={24} color="black" />
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
        marginTop: screenHeight * .1,
        zIndex: 2,
        flexDirection: "row",
        justifyContent:"space-between",
        paddingHorizontal: 10,

    },
    requestItem: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: "#f1f1f1",
        borderRadius: 5,
        width: "100%",
        alignItems: "center",
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
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "80%",
        padding: 20,
        backgroundColor: "white",
        borderRadius: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 5,
    },
    friendButton: {
        padding: 0,
        marginRight: 1,


    },


});
