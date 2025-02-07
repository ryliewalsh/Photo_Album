import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { db } from "./firebase"; // Removed storage import since we use Firestore-stored URLs
import { collection, query, where, getDocs } from "firebase/firestore";

const screen = Dimensions.get("window");

export default function ImageCarousel({ userId }) {
    const [imageURLs, setImageURLs] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [albums, setAlbums] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState(null);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    // Fetch albums when component mounts
    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const albumQuery = query(collection(db, "albums"), where("ownerId", "==", userId));
                const albumSnapshot = await getDocs(albumQuery);
                const albumList = albumSnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                }));

                setAlbums(albumList);

                // Automatically select the first album if available
                if (albumList.length > 0) {
                    setSelectedAlbumId(albumList[0].id);
                }
            } catch (error) {
                console.error("Error fetching albums:", error);
            }
        };

        fetchAlbums();
    }, [userId]);

    // Fetch images when an album is selected
    useEffect(() => {
        const fetchImages = async () => {
            if (!selectedAlbumId) return;

            try {
                const imageQuery = query(
                    collection(db, "images"),
                    where("uploadedBy", "==", userId),
                    where("albumId", "==", selectedAlbumId)
                );
                const querySnapshot = await getDocs(imageQuery);

                if (querySnapshot.empty) {
                    setImageURLs([]);
                    return;
                }

                // Use URLs directly from Firestore instead of fetching them from Storage
                const urls = querySnapshot.docs.map(doc => doc.data().url).filter(url => url !== null);
                setImageURLs(urls);
            } catch (error) {
                console.error("Error fetching images:", error);
            }
        };

        fetchImages();
    }, [selectedAlbumId, userId]); // Runs when selectedAlbumId changes

    // Handle image carousel rotation
    useEffect(() => {
        if (imageURLs.length > 0) {
            const interval = setInterval(() => {
                setCurrentImageIndex(prevIndex => (prevIndex + 1) % imageURLs.length);
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [imageURLs]);

    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const albumRef = collection(db, "albums");
                const q = query(albumRef, where("createdBy", "==", userId));
                const albumSnapshot = await getDocs(q);

                const fetchedAlbums = albumSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setAlbums(fetchedAlbums);
                numAlbums = fetchedAlbums.length;
                console.log("Albums after setState:", albums);

                // Automatically select the first album if none is selected
                if (fetchedAlbums.length > 0 && !selectedAlbum) {
                    setSelectedAlbum(fetchedAlbums[0].id);
                }
            } catch (error) {
                console.error("Error fetching albums:", error);
            }
        };

        if (userId) {
            fetchAlbums();
        }
    }, [userId]);

    return (
        <View style={styles.container}>
            {/* Album Picker */}
            <View style={{ width: '100%', padding: 10, backgroundColor: 'lightgray' }}>
                <Picker
                    selectedValue={selectedAlbumId}
                    onValueChange={(itemValue) => setSelectedAlbumId(itemValue)}
                >
                    {albums.map(album => (
                        <Picker.Item key={album.id} label={album.name} value={album.id} />
                    ))}
                </Picker>
            </View>

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
    picker: {
        width: screen.width * 0.8,
        color: "white",
        backgroundColor: "gray",
        marginBottom: 10,
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
});
