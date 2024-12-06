import React, { useState } from "react";
import { Button, Image, View, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage } from "./firebase"; // Import your Firebase setup
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function App() {
    const [image, setImage] = useState(null); // State for the selected image
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        // Open the image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            const uri = result.assets[0].uri;
            setImage(uri);
            await uploadImage(uri);
        }
    };

    const uploadImage = async (uri) => {
        try {
            setUploading(true);
            const response = await fetch(uri);
            const blob = await response.blob();

            // Create a reference in Firebase Storage
            const fileName = `images/${Date.now()}.jpg`;
            const storageRef = ref(storage, fileName);

            // Upload the file
            const snapshot = await uploadBytes(storageRef, blob);

            // Get the download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            Alert.alert("Upload Successful", `Image URL: ${downloadURL}`);
        } catch (error) {
            console.error("Upload failed:", error);
            Alert.alert("Upload Failed", "An error occurred during the upload.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Button
                title="Pick an Image"
                onPress={pickImage}
                disabled={uploading} // Disable button while uploading
            />
            {image && (
                <Image
                    source={{ uri: image }}
                    style={styles.image}
                />
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
    image: {
        width: 200,
        height: 200,
        marginTop: 20,
    },
});
