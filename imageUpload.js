import React, { useState } from 'react';
import { Button, Image, View, StyleSheet, Alert, FlatList, Text} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

// Function to pick multiple images
export const pickImages = async () => {
    // Open the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true, // Allow selecting multiple images
    });

    if (!result.canceled && result.assets.length > 0) {
        return result.assets.map((asset) => asset.uri);
    }
    console.log("Image picker canceled");
    return [];
};

// Function to upload image to Firebase Storage
export const uploadImage = async (uri) => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();

        // Create a reference in Firebase Storage
        const fileName = `images/${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, blob);

        // Get the download URL
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Upload failed:", error);
        Alert.alert("Upload Failed", "An error occurred during the upload.");
        return null;
    }
};

export default function ImageUploader() {
    const [images, setImages] = useState([]); // State for the selected images
    const [uploading, setUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState([]); // State for storing uploaded image URLs

    const handlePickImages = async () => {
        const uris = await pickImages();
        if (uris.length > 0) {
            setImages(uris);
            await handleUploadImages(uris);
        }
    };

    const handleUploadImages = async (uris) => {
        try {
            setUploading(true);
            const urls = [];
            for (let i = 0; i < uris.length; i++) {
                const downloadURL = await uploadImage(uris[i]); // Upload each image and get URL
                if (downloadURL) {
                    urls.push(downloadURL);
                }
            }
            setUploadedUrls(urls); // Store uploaded image URLs
            Alert.alert("Upload Successful", `Images uploaded successfully`);
        } catch (error) {
            Alert.alert("Upload Failed", error.message);
        } finally {
            setUploading(false); // Stop the upload process
        }
    };

    return (
        <View style={styles.container}>
            <Button
                title="Pick and Upload Images"
                onPress={handlePickImages}
                disabled={uploading}
            />
            {images.length > 0 && (
                <View style={styles.previewContainer}>
                    <Text>Selected Images:</Text>
                    <FlatList
                        data={images}
                        renderItem={({ item }) => (
                            <Image source={{ uri: item }} style={styles.imagePreview} />
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                    />
                </View>
            )}
            {uploadedUrls.length > 0 && (
                <View style={styles.uploadedContainer}>
                    <Text>Uploaded Images:</Text>
                    <FlatList
                        data={uploadedUrls}
                        renderItem={({ item }) => (
                            <Image source={{ uri: item }} style={styles.imagePreview} />
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    previewContainer: {
        marginTop: 20,
    },
    uploadedContainer: {
        marginTop: 20,
    },
    imagePreview: {
        width: 100,
        height: 100,
        margin: 5,
    },
});
