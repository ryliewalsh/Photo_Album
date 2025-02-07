import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const screen = Dimensions.get("window");

export default function ImageCarousel({ userId }) {
    const [imageURLs, setImageURLs] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [albums, setAlbums] = useState([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState(null);

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

            setLoading(true);
            try {
                const imageQuery = query(
                    collection(db, "images"),
                    where("uploadedBy", "==", userId),
                    where("albumId", "==", selectedAlbumId)
                );
                const querySnapshot = await getDocs(imageQuery);

                if (querySnapshot.empty) {
                    setImageURLs([]);
                    setLoading(false);
                    return;
                }

                // Fetch URLs from Firestore paths
                const urls = await Promise.all(
                    querySnapshot.docs.map(async doc => {
                        const imageData = doc.data();
                        if (!imageData.url) return null;

                        try {
                            const storageRef = ref(storage, imageData.url);
                            return await getDownloadURL(storageRef);
                        } catch (error) {
                            console.error("Error fetching image URL:", error);
                            return null;
                        }
                    })
                );

                setImageURLs(urls.filter(url => url !== null));
            } catch (error) {
                console.error("Error fetching images:", error);
            } finally {
                setLoading(false);
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

    return (
        <View style={styles.container}>
            {albums.length > 0 && (
                <Picker
                    selectedValue={selectedAlbumId}
                    onValueChange={(itemValue) => setSelectedAlbumId(itemValue)}
                    style={styles.picker}
                >
                    {albums.map(album => (
                        <Picker.Item key={album.id} label={album.name} value={album.id} />
                    ))}
                </Picker>
            )}

            {loading ? (
                <Text style={styles.loadingText}>Loading...</Text>
            ) : imageURLs.length > 0 ? (
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
    loadingText: {
        color: "white",
        fontSize: 20,
    },
});
