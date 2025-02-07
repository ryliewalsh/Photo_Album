import React, { useEffect, useState } from 'react';

import {query, where, getDocs, addDoc, collection, doc, getDoc, updateDoc} from "firebase/firestore";
import {
    Button,
    Image,
    View,
    StyleSheet,
    Alert,
    FlatList,
    Text,
    ActivityIndicator,
    Modal,
    TouchableOpacity,
    TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage, db } from './firebase';
import * as ImageManipulator from 'expo-image-manipulator';


const createAlbum = async (userId, setAlbums, setSelectedAlbum, albumName) => {
    if (!albumName) {
        albumName = "My Pics"; // Default name if not provided
    }

    try {
        const albumRef = collection(db, "albums");

        // **Check how many albums the user already has**
        const q = query(albumRef, where("createdBy", "==", userId));
        const albumSnapshot = await getDocs(q);
        const userAlbums = albumSnapshot.docs.map(doc => doc.data());

        if (userAlbums.length >= 5) {
            Alert.alert("Limit Reached", "You can only create up to 5 albums.");
            return;
        }

        // **Check if an album with the same name already exists**
        const existingAlbum = userAlbums.find(album => album.name.toLowerCase() === albumName.toLowerCase());

        if (existingAlbum) {
            Alert.alert("Album Exists", "An album with this name already exists.");
            return;
        }

        // **Create a new album**
        const newAlbumRef = await addDoc(albumRef, {
            name: albumName,
            createdBy: userId,
            images: [],
            sharedWith: [],
            timestamp: new Date(),
        });

        setSelectedAlbum(newAlbumRef.id);
        setAlbums(prevAlbums => [...prevAlbums, { id: newAlbumRef.id, name: albumName }]);

    } catch (error) {
        console.error("Error creating album:", error);
        Alert.alert("Error", "Failed to create album.");
    }
};

export const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets.length > 0) {
        return result.assets.map((asset) => asset.uri);
    }
    console.log("Image picker canceled");
    return [];
};

const resizeImage = async (uri) => {
    const resized = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
    });
    return resized.uri;
};

export const uploadImage = async (uri, setProgress, userId, albumId) => {
    if (!albumId) {
        Alert.alert("No Album Selected", "Please select an album before uploading.");
        return null;
    }

    try {
        // Fetch the image as a blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Define the file name and reference in Firebase Storage
        const fileName = `images/${userId}.${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);

        // Upload the image to Firebase Storage
        const uploadTask = uploadBytesResumable(storageRef, blob);

        // Track the upload progress
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

        // Wait for the upload to complete and get the download URL
        const snapshot = await uploadTask;
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Add the image metadata to the "images" collection in Firestore
        await addDoc(collection(db, "images"), {
            url: downloadURL,
            uploadedBy: userId,
            albumId: albumId,
            sharedWith: [],
            timestamp: new Date(),
        });

        // Get the current album and update the "images" array
        const albumRef = doc(db, "albums", albumId);
        const albumSnapshot = await getDoc(albumRef);

        if (albumSnapshot.exists()) {
            const albumData = albumSnapshot.data();
            const updatedImages = [...albumData.images, downloadURL]; // Append the new image URL to the existing images array

            // Update the album document with the new images array
            await updateDoc(albumRef, {
                images: updatedImages,
            });
        }

        return downloadURL; // Return the URL of the uploaded image
    } catch (error) {
        console.error("Upload failed:", error);
        Alert.alert("Upload Failed", "An error occurred during the upload.");
        return null;
    }
};


export default function ImageUploader({ userId }) {
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState([]);
    const [progress, setProgress] = useState(0);
    const [albums, setAlbums] = useState([]);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newAlbumName, setNewAlbumName] = useState('');

    const handleCreateAlbum = () => {
        if (newAlbumName) {
            createAlbum(userId, setAlbums, setSelectedAlbum, newAlbumName); // Pass all necessary parameters
            setShowModal(false); // Close modal
            setNewAlbumName(''); // Clear input field
        }
    };

    const handlePickImages = async () => {
        const uris = await pickImages();
        if (uris.length > 0) {
            setImages(uris);
            await handleUploadImages(uris);
        }
    };
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

    const handleUploadImages = async (uris) => {
        try {
            setUploading(true);
            const urls = [];
            for (let i = 0; i < uris.length; i++) {
                const resizedUri = await resizeImage(uris[i]);
                const downloadURL = await uploadImage(resizedUri, setProgress, userId, selectedAlbum);
                if (downloadURL) {
                    urls.push(downloadURL);
                }
            }
            setUploadedUrls(urls);
            Alert.alert("Upload Successful", `Images uploaded successfully`);
        } catch (error) {
            Alert.alert("Upload Failed", error.message);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    useEffect(() => {
        if (userId) {
            const fetchData = async () => {
                await createAlbum(userId, setAlbums, setSelectedAlbum);
            };
            fetchData();
        }
    }, [userId]);

    return (
        <View style={styles.container}>
            <View style={{ width: '100%', padding: 10, backgroundColor: 'lightgray' }}>
                <Picker
                    selectedValue={selectedAlbum}
                    onValueChange={(albumId) => {
                        if (albumId === 'add_new') {
                            setShowModal(true);
                        } else {
                            setSelectedAlbum(albumId);
                        }
                    }}
                >
                    {albums.map((album) => (
                        <Picker.Item key={album.id} label={album.name} value={album.id} />
                    ))}
                    <Picker.Item label="+ Add New Album" value="add_new" />
                </Picker>

                {/* Modal for adding new album */}
                <Modal
                    visible={showModal}
                    animationType="slide"
                    onRequestClose={() => setShowModal(false)}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <Text>Create New Album</Text>
                        <TextInput
                            placeholder="Enter album name"
                            value={newAlbumName}
                            onChangeText={setNewAlbumName}
                            style={{
                                borderWidth: 1,
                                borderColor: 'gray',
                                width: '80%',
                                padding: 10,
                                marginBottom: 20,
                            }}
                        />
                        <Button title="Create" onPress={handleCreateAlbum} />
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <Text style={{ marginTop: 20, color: 'blue' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </View>

            <Button title="Pick and Upload Images" onPress={handlePickImages} disabled={uploading} />
            {uploading && (
                <View style={styles.progressContainer}>
                    <Text>Uploading...</Text>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text>{Math.round(progress)}%</Text>
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
    imagePreview: {
        width: 100,
        height: 100,
        margin: 5,
    },
});
