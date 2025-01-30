import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./firebase"; // Your Firebase configuration
import { collection, query, where, getDocs } from "firebase/firestore";

const screen = Dimensions.get("window");

export default function ImageCarousel({ userId }) {
    const [imageURLs, setImageURLs] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const imageQuery = query(
                    collection(db, "images"),
                    where("uploadedBy", "==", userId)
                );
                const querySnapshot = await getDocs(imageQuery);

                if (querySnapshot.empty) {
                    console.warn("No images found for user:", userId);
                    setImageURLs([]);
                    setLoading(false);
                    return;
                }

                console.log("Fetched documents:", querySnapshot.docs.length);

                const urls = await Promise.all(
                    querySnapshot.docs.map(async (doc) => {
                        const imageData = doc.data();
                        console.log("Image data:", imageData);

                        const imagePath = imageData.storagePath;
                        if (!imagePath) {
                            console.error("storagePath is undefined for document ID:", doc.id);
                            return null;
                        }

                        try {
                            const storageRef = ref(storage, imagePath);
                            return await getDownloadURL(storageRef);
                        } catch (error) {
                            console.error("Error fetching image URL:", error);
                            return null;
                        }
                    })
                );

                setImageURLs(urls.filter(url => url !== null));
                setLoading(false);
            } catch (error) {
                console.error("Error fetching images from Firestore: ", error);
                setLoading(false);
            }
        };

        fetchImages();
    }, [userId]);

    useEffect(() => {
        if (imageURLs.length > 0) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageURLs.length);
            }, 3000); // Change image every 3 seconds

            return () => clearInterval(interval);
        }
    }, [imageURLs]);

    if (loading) {
        return <Text style={styles.loadingText}>Loading...</Text>;
    }

    return (
        <View style={styles.container}>
            {imageURLs.length > 0 ? (
                <Image source={{ uri: imageURLs[currentImageIndex] }} style={styles.image} />
            ) : (
                <Text style={styles.noImagesText}>No images shared with you.</Text>
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
    image: {
        width: screen.width * 0.9, // Avoid stretching to full screen
        height: screen.height * 0.6, // Scale to fit screen better
        resizeMode: "contain",
        borderWidth: 1,
        borderColor: "red", // Debugging: See if the image frame is rendered
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
