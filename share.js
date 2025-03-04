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


import {addDoc, collection, doc, getDoc, getDocs, query, deleteDoc, updateDoc, where, arrayUnion} from "firebase/firestore";
import {db} from "./firebase";
import Feather from '@expo/vector-icons/Feather';
import {getAuth, onAuthStateChanged} from "firebase/auth";




export default function ShareScreen({ userId, handleLogout }) {
    const [user, setUser] = useState(null);
    const [userLookup, setUserLookup] = useState(null);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [showFriendModal, setShowFriendModal] = useState(false);
    const [showFDetailsModal, setShowFDetailsModal] = useState(false);
    const [foundId, setFoundId] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);
    const [friendList, setFriendList] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [sharedAlbumList, setSharedAlbumList] = useState([]);
    const [ownedAlbums, setOwnedAlbums] = useState([]);



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
    useEffect(() => {
        if (showFDetailsModal && selectedFriend) {
            console.log("Friend details modal opened for:", selectedFriend);
        }
    }, [showFDetailsModal, selectedFriend]);

    useEffect(() => {
        console.log("showWarningModal changed:", showWarningModal);

    }, [showWarningModal]);
    useEffect(() => {
        console.log("showF changed:", showFDetailsModal);

    }, [showFDetailsModal]);

    useEffect(() => {
        console.log("Updated selectedFriend:", selectedFriend);
    }, [selectedFriend]);

    const openFriendDetails = (friend) => {

        handleGetOwnedAlbums();
        setShowFriendModal(false);
        console.log("Opening modal for friend:", friend);
        setSelectedFriend(friend);
        setShowFDetailsModal(true);

    };



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
    const handleGetOwnedAlbums = async () => {
        try {
            // Reference to the "albums" collection
            const albumsRef = collection(db, "albums");

            // Get all albums where the owner is the current user
            const q = query(albumsRef, where("createdBy", "==", userId));
            const querySnapshot = await getDocs(q);

            const albums = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (albums.length === 0) {
                console.log("No owned albums found.");
            } else {
                console.log("Owned albums:", albums);
            }

            setOwnedAlbums(albums); // Set owned albums to state

        } catch (error) {
            console.error("Error fetching owned albums:", error);
            Alert.alert("Error", error.message);
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

            // Dont allow users to add themselves
            if(foundUserId == user.uid){
                Alert.alert("That's you bro");
                return;
            }
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
            console.log("User Data:", JSON.stringify(userData, null, 2));
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



    const handleDeleteFriend = async () => {
       setShowWarningModal(false)
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnapshot = await getDoc(userDocRef);

            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data();
                const updatedFriends = userData.friends.filter(friendId => friendId !== selectedFriend.id);

                await updateDoc(userDocRef, { friends: updatedFriends });

                const selectedFriendDocRef = doc(db, "users", selectedFriend.id);
                const selectedFriendDocSnapshot = await getDoc(selectedFriendDocRef);
                // Remove current user from deleted friend as well
                if (selectedFriendDocSnapshot.exists()) {
                    const selectedFriendData = selectedFriendDocSnapshot.data();
                    const updatedFriendFriends = selectedFriendData.friends.filter(friendId => friendId !== user.uid);

                    await updateDoc(selectedFriendDocRef, { friends: updatedFriendFriends });
                }

                const albumRef = collection(db, "albums");
                const q3 = query(
                    albumRef,
                    where("createdBy", "==", user.uid),
                    where("sharedWith", "array-contains", selectedFriend.id)
                );

                const albumSnapshot = await getDocs(q3);

                const albumPromises = albumSnapshot.docs.map(async (doc) => {
                    const albumData = doc.data();
                    const updatedShared = albumData.sharedWith.filter(friendId => friendId !== selectedFriend.id);

                    return updateDoc(doc.ref, { sharedWith: updatedShared });
                });

                await Promise.all(albumPromises);

                const albumRef2 = collection(db, "albums");
                const q4 = query(
                    albumRef2,
                    where("createdBy", "==", selectedFriend.id),
                    where("sharedWith", "array-contains", user.uid)
                );

                const albumSnapshot2 = await getDocs(q4);

                const albumPromises2 = albumSnapshot2.docs.map(async (doc) => {
                    const albumData = doc.data();
                    const updatedShared = albumData.sharedWith.filter(friendId => friendId !== user.uid);

                    return updateDoc(doc.ref, { sharedWith: updatedShared });
                });

                await Promise.all(albumPromises2);

                setShowFriendModal(true);
            }
        } catch (error) {
            console.error("Error removing friend:", error);
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
        console.log("Request data:", request);

        try {
            const userDocRef = doc(db, "users", user.uid);
            const requestDocRef = doc(db, "friendRequests", request.id);
            const senderDocRef = doc(db, "users", request.fromUser);
            console.log(senderDocRef)
            console.log(userDocRef)
            console.log(typeof user.uid, typeof request.toUser);
            //update receivers friend list
            await updateDoc(userDocRef, {
                friends: arrayUnion(request.fromUser)
            });

            //update senders friend list
            await updateDoc(senderDocRef, {
                friends: arrayUnion(user.uid)
            });


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


    const handleShareAlbum = async (albumId) => {
        if (!selectedFriend) return;

        try {
            const albumRef = doc(db, "albums", albumId);
            const albumSnap = await getDoc(albumRef);

            if (!albumSnap.exists()) {
                console.error("Album not found!");
                return;
            }

            const albumData = albumSnap.data();
            const updatedSharedWith = albumData.sharedWith ? [...albumData.sharedWith, selectedFriend.id] : [selectedFriend.id];

            await updateDoc(albumRef, { sharedWith: updatedSharedWith });

            console.log(`Album ${albumId} shared with ${selectedFriend.username}`);

            // Refresh the shared albums list
            setSharedAlbumList(prev => [...prev, { id: albumId, name: albumData.name }]);

        } catch (error) {
            console.error("Error sharing album:", error);
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
                                        <TouchableOpacity

                                            onPress={() => openFriendDetails(friend)}
                                            style={styles.friendButton}
                                        >
                                            <Text>{friend.username} </Text>

                                        </TouchableOpacity>

                                    </View>
                                ))
                            )}
                            <Button title="Close" onPress={() => setShowFriendModal(false)} />
                        </View>
                    </View>
                </Modal>
            {/* Warning for Deleting Friend Modal */}
            {showWarningModal && (

            <Modal visible={showWarningModal} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Are you sure you want to remove this friend?</Text>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity onPress={handleDeleteFriend} >
                                <Text style={styles.buttonText}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity  style={styles.cancelButton}>
                                <Text style={styles.buttonText}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            )}

            {/* Friend Details Modal */}
            {showFDetailsModal && selectedFriend && (
                <Modal visible={showFDetailsModal} transparent={true} animationType="slide">

                    <View style={styles.modalContainer}>

                        <View style={styles.modalContent}>

                            {selectedFriend ? (
                                <>

                                    <Text style={styles.modalTitle}>Share Albums with {selectedFriend.username}</Text>

                                    {/* Show Already Shared Albums */}
                                    <Text style={styles.modalTitle}>Shared with {selectedFriend.username}</Text>
                                    {sharedAlbumList.filter(album => album.sharedWith?.includes(selectedFriend.id)).length === 0 ? (
                                        <Text>No shared albums yet.</Text>
                                    ) : (
                                        sharedAlbumList
                                            .filter(album => album.sharedWith?.includes(selectedFriend.id))
                                            .map((album, index) => (
                                                <View key={index} style={styles.Item}>
                                                    <Text>{album.name}</Text>
                                                </View>
                                            ))
                                    )}

                                    {/* Show Available Albums to Share */}
                                    <Text style={styles.modalTitle}>Select an Album to Share</Text>

                                    {ownedAlbums.length === 0 ? (
                                        <Text>You have no albums yet.</Text>
                                    ) : (
                                        ownedAlbums.map((album, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => handleShareAlbum(album.id)}
                                                style={styles.albumItem}
                                            >
                                                <Text>{album.name}</Text>
                                            </TouchableOpacity>
                                        ))
                                    )}

                                    <TouchableOpacity
                                        onPress={() => {


                                            console.log("Before setting showWarningModal:", showWarningModal);
                                            setTimeout(() => {

                                                setShowWarningModal(true);
                                                console.log("After setting showWarningModal:", showWarningModal);
                                            }, 100);
                                            // Short delay
                                        }}
                                        style={styles.closeButton}
                                    >
                                        <Text style={styles.buttonText}>Remove Friend</Text>

                                    </TouchableOpacity>

                                </>
                            ) : (
                                <Text>Loading friend details...</Text>
                            )}
                        </View>
                    </View>
                </Modal>



            )}
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
