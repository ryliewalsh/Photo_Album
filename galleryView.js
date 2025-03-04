import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, Dimensions, Modal, TouchableOpacity } from "react-native";
import { db } from "./firebase"; // Assuming you have Firebase initialized
import { collection, query, where, getDocs } from "firebase/firestore";
import Feather from "@expo/vector-icons/Feather";

const screen = Dimensions.get("window");

export default function ImageCarousel({ userId, setMode }) {
    const [imageURLs, setImageURLs] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [albums, setAlbums] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Fetch both owned and shared albums when component mounts
    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                // Fetch albums owned by the user
                const ownedAlbumQuery = query(collection(db, "albums"), where("createdBy", "==", userId));
                const ownedAlbumSnapshot = await getDocs(ownedAlbumQuery);
                const ownedAlbumList = ownedAlbumSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    type: "owned",
                }));

                // Fetch albums shared with the user
                const sharedAlbumQuery = query(collection(db, "albums"), where("sharedWith", "array-contains", userId));
                const sharedAlbumSnapshot = await getDocs(sharedAlbumQuery);
                const sharedAlbumList = sharedAlbumSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    type: "shared",
                }));

                const allAlbums = [...ownedAlbumList, ...sharedAlbumList];
                setAlbums(allAlbums);

                if (allAlbums.length > 0 && !selectedAlbumId) {
                    setSelectedAlbumId(allAlbums[0].id);
                }
            } catch (error) {
                console.error("Error fetching albums:", error);
            }
        };

        fetchAlbums();
    }, [userId]);

    // Fetch images when an album is selected (both owned and shared albums)
    useEffect(() => {
        const fetchImages = async () => {
            if (!selectedAlbumId) return;

            try {
                const imageQuery = query(
                    collection(db, "images"),
                    where("albumId", "==", selectedAlbumId)
                );
                const querySnapshot = await getDocs(imageQuery);

                if (querySnapshot.empty) {
                    setImageURLs([]);
                    return;
                }

                const urls = querySnapshot.docs.map(doc => doc.data().url).filter(url => url !== null);
                setImageURLs(urls);
            } catch (error) {
                console.error("Error fetching images:", error);
            }
        };

        fetchImages();
    }, [selectedAlbumId, userId]);

    // Handle image carousel rotation
    useEffect(() => {
        if (imageURLs.length > 0) {
            const interval = setInterval(() => {
                setCurrentImageIndex(prevIndex => (prevIndex + 1) % imageURLs.length);
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [imageURLs]);

    const handleReturn = () => {
        setMode("home");
    };

    return (
        <View style={styles.container}>
            {/* Album Picker Button */}
            <TouchableOpacity
                style={styles.albumButton}
                onPress={() => setModalVisible(true)}>
                <Text style={styles.buttonText}>Select Album</Text>
            </TouchableOpacity>

            {/* Back Button Outside of Modal */}
            <View style={styles.buttonRow}>
                <TouchableOpacity onPress={handleReturn} style={styles.logoutButton}>
                    <Feather
                        name="arrow-left-circle"
                        size={28}
                        color={"#f4f4f4"}
                    />
                </TouchableOpacity>
            </View>

            {/* Modal for selecting album */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select an Album</Text>
                        {albums.map(album => (
                            <TouchableOpacity
                                key={album.id}
                                style={styles.albumOption}
                                onPress={() => {
                                    setSelectedAlbumId(album.id);
                                    setModalVisible(false);
                                }}>
                                <Text>{album.name} ({album.type})</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Image Display */}
            {imageURLs.length > 0 ? (
                <Image source={{ uri: imageURLs[currentImageIndex] }} style={styles.image} />
            ) : (
                <Text style={styles.noImagesText}>No images in this album.</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: screen.width,
        height: screen.height,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
    },
    albumButton: {
        padding: 10,
        backgroundColor: "gray",
        borderRadius: 5,
    },
    buttonText: {
        color: "white",
        fontSize: 18,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        backgroundColor: "white",
        padding: 20,
        width: screen.width * 0.8,
        borderRadius: 10,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 10,
    },
    albumOption: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: "#f0f0f0",
        borderRadius: 5,
        width: "100%",
        alignItems: "center",
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: "red",
        padding: 10,
        borderRadius: 5,
    },
    closeText: {
        color: "white",
        fontSize: 18,
    },
    image: {
        width: screen.width * 0.9,
        height: screen.height * 0.6,
        resizeMode: "contain",
    },
    noImagesText: {
        color: "white",
        fontSize: 20,
        textAlign: "center",
        marginTop: 20,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        position: "absolute",
        top: screen.height * 0.05,
        zIndex: 10,  // Ensure this is above the modal content
        width: "100%",
        paddingHorizontal: 20,
    },
    logoutButton: {
        padding: 10,
        backgroundColor: "transparent",
    },
});
