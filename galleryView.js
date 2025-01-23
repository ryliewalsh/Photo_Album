import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text , Dimensions} from "react-native";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
const screen = Dimensions.get("window");
export default function ImageCarousel() {

    const [imageURLs, setImageURLs] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const imagesRef = ref(storage, "images/");

                // List all files in the 'images' folder
                const result = await listAll(imagesRef);
                const urls = await Promise.all(
                    result.items.map(async (itemRef) => {
                        const url = await getDownloadURL(itemRef);
                        return url;
                    })
                );

                setImageURLs(urls);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching images: ", error);
                setLoading(false);
            }
        };

        fetchImages();
    }, []);

    useEffect(() => {
        if (imageURLs.length > 0) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prevIndex) => {

                    return (prevIndex + 1) % imageURLs.length; // Loop back to the first image after the last
                });
            }, 10000); // Change image every 3 seconds


            return () => clearInterval(interval);
        }
    }, [imageURLs]);

    if (loading) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={styles.container}>
            {imageURLs.length > 0 && (
                <Image source={{ uri: imageURLs[currentImageIndex] }} style={styles.image} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: screen.width,
        height:screen.height,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
    },
    image: {
        width: screen.width,
        height:screen.height,
        resizeMode: "contain",

    },
});
