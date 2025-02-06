import React, {useEffect, useState} from 'react';
import {query, where, getDocs, updateDoc, collection, addDoc, doc} from "firebase/firestore";
import { Button, Image, View, StyleSheet, Alert, FlatList, Text, ActivityIndicator } from 'react-native';
import {Picker} from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage, db} from './firebase'; // Import db
import * as ImageManipulator from 'expo-image-manipulator';


const createDefaultAlbum = async (userId, setAlbums, setSelectedAlbum) => {
    if (!userId) {
        console.error("User ID is undefined or null");
        return; // Exit early if userId is not available
    }
    try {

        const albumRef = collection(db, "albums");
        const q = query(albumRef, where("createdBy", "==", userId));
        const albumSnapshot = await getDocs(q);

        if (albumSnapshot.empty) {
            // Create default album
            const newAlbumRef = await addDoc(albumRef, {
                name: "My Pics",
                createdBy: userId,
                images: [],
                sharedWith: [],
                timestamp: new Date(),
            });

            setSelectedAlbum(newAlbumRef.id); // Set as default album
            setAlbums([{ id: newAlbumRef.id, name: "My Pics" }]);
        } else {
            const albumList = albumSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAlbums(albumList);
            setSelectedAlbum(albumList[0].id);
        }
    } catch (error) {
        console.error("Error creating default album:", error);
    }
};

// Function to pick multiple images
export const pickImages = async () => {
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

// Function to resize image
const resizeImage = async (uri) => {
    const resized = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
    });
    return resized.uri;
};



export const uploadImage = async (uri, setProgress, userId) => {
    console.log(userId);
    try {
        const response = await fetch(uri);
        const blob = await response.blob();

        const fileName = `images/${userId}.${Date.now()}.jpg`; // Store images under user ID
        const storageRef = ref(storage, fileName);

        // Upload with progress
        const uploadTask = uploadBytesResumable(storageRef, blob);

        // Monitor upload progress
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(progress);
            },
            (error) => {
                console.error("Upload failed:", error);
                Alert.alert("Upload Failed", "An error occurred during the upload.");
            }
        );

        const snapshot = await uploadTask;
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Store image metadata in Firestore
        await addDoc(collection(db, "images"), {
            url: downloadURL,
            uploadedBy: userId,
            albumId: null, // Albums can be added later
            sharedWith: [], // Empty initially
            timestamp: new Date(),
        });

        return downloadURL;
    } catch (error) {
        console.error("Upload failed: in UPload image outer", error);
        Alert.alert("Upload Failed", "An error occurred during the upload.");
        return null;
    }
};


export default function ImageUploader({ userId }) {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [progress, setProgress] = useState(0); // Track upload progress
    const [albums, setAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);


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
                const resizedUri = await resizeImage(uris[i]); // Resize image
                const downloadURL = await uploadImage(resizedUri, setProgress, userId);
                if (downloadURL) {
                    urls.push(downloadURL);
                }
            }
            setUploadedUrls(urls);
            Alert.alert("Upload Successful", `Images uploaded successfully`);
        } catch (error) {
            Alert.alert("Upload Failed in handleUploadImages", error.message);
        } finally {
            setUploading(false);
            setProgress(0); // Reset progress after upload completes
        }
    };

    // Function to handle sharing an image (to a user)


    const handleShareImage = async (imageUrl, sharedWithUserId) => {
        try {
            const imageQuery = query(collection(db, "images"), where("url", "==", imageUrl));
            const snapshot = await getDocs(imageQuery);

            if (snapshot.empty) {
                console.log("Image not found");
                return;
            }

            const imageDoc = snapshot.docs[0];
            await updateDoc(imageDoc.ref, {
                sharedWith: [...imageDoc.data().sharedWith, sharedWithUserId],
            });

            Alert.alert("Image Shared", "The image has been shared successfully.");
        } catch (error) {
            console.error("Error sharing image: ", error);
            Alert.alert("Sharing Failed", "An error occurred while sharing the image.");
        }
    };
    useEffect(() => {
        if (userId) {
            const fetchData = async () => {
                await createDefaultAlbum(userId, setAlbums, setSelectedAlbum); // Pass userId here
            };
            fetchData();
        }
    }, [userId]);
    console.log(albums)
    return (
        <View style={styles.container}>

            <Picker
                selectedValue={selectedAlbum}
                onValueChange={(albumId) => setSelectedAlbum(albumId)}
            >
                {albums.map((album) => (
                    <Picker.Item key={album.id} label={album.name} value={album.id} />
                ))}
            </Picker>
            <Button
                title="Pick and Upload Images"
                onPress={handlePickImages}
                disabled={uploading}
            />
            {uploading && (
                <View style={styles.progressContainer}>
                    <Text>Uploading...</Text>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text>{Math.round(progress)}%</Text>
                </View>
            )}
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
                            <View style={styles.uploadedImageContainer}>
                                <Image source={{ uri: item }} style={styles.imagePreview} />
                                <Button
                                    title="Share"
                                    onPress={() => handleShareImage(item, 'sharedUserId')} // Pass the recipient's user ID
                                />
                            </View>
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
    progressContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    previewContainer: {
        marginTop: 20,
    },
    uploadedContainer: {
        marginTop: 20,
    },
    uploadedImageContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    imagePreview: {
        width: 100,
        height: 100,
        margin: 5,
    },



});
