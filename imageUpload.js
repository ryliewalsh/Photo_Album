
import React, { useState } from 'react';
import { Button, Image, View, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export const pickImage = async () => {
    // Open the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
        return result.assets[0].uri;
    }
    console.log("Image picker canceled");
    return null;
};

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
    }
};

export default function ImageUploader() {
    const [image, setImage] = useState(null); // State for the selected image
    const [uploading, setUploading] = useState(false);

    const handlePickImage = async () => {
        const uri = await pickImage();
        if (uri) {
            setImage(uri);
            await handleUploadImage(uri);
        }
    };

    const handleUploadImage = async (uri) => {
        try {
            setUploading(true);
            const downloadURL = await uploadImage(uri); // Upload image and get URL
            Alert.alert("Upload Successful", `Image URL: ${downloadURL}`);
        } catch (error) {
            Alert.alert("Upload Failed", error.message);
        } finally {
            setUploading(false); // Stop the upload process
        }
    };

    return (
        <View style={styles.container}>
            <Button
                title="Pick and Upload Image"
                onPress={handlePickImage}
                disabled={uploading}
            />
            {image && <Image source={{ uri: image }} style={styles.image} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    image: {
        width: 200,
        height: 200,
        marginTop: 20,
    },
});
