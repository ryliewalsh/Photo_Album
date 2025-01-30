import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, Dimensions } from "react-native";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { db, auth } from "./firebase"; // Your Firebase configuration
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
                    where("uploadedBy", "array-contains", userId)
                );
                const querySnapshot = await getDocs(imageQuery);

                const urls = [];
                querySnapshot.forEach((doc) => {
                    const imagePath = doc.data().storagePath;
                    urls.push(imagePath);
                });

                setImageURLs(urls);
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
                setCurrentImageIndex((prevIndex) => {
                    return (prevIndex + 1) % imageURLs.length; // Loop back to the first image after the last
                });
            }, 3000); // Change image every 3 seconds

            return () => clearInterval(interval);
        }
    }, [imageURLs]);

    if (loading) {
        return <Text>Loading...</Text>;
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
        width: screen.width,
        height: screen.height,
        resizeMode: "contain",
    },
    noImagesText: {
        color: "white",
        fontSize: 20,
        textAlign: "center",
        marginTop: 20,
    },
});
