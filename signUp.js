import React, { useState, useEffect } from 'react';
import {View, Text, Button, TextInput, StyleSheet, Alert, Image, TouchableOpacity, Dimensions} from 'react-native';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import logo from './assets/FRAME.png';
import loginIcon from './assets/login.png';
import embellishment from './assets/FrameEmbellishment.png';

export default function AuthScreen() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSignUp, setShowSignUp] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [userName, setUserName] = useState('');

    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);

        } catch (error) {
            Alert.alert("Login Failed", error.message);
        }
    };

    const handleSignUp = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                firstName,
                lastName,
                userName,
                email,
                albums: [],
            });

            Alert.alert("Sign-Up Successful", "Your account has been created!");
        } catch (error) {
            Alert.alert("Sign-Up Failed", error.message);
        }
    };

    return (
        <View style={styles.content}>
            <Image source={logo} style={styles.logo} />
            {showSignUp ? (
                <>
                    <Text style={styles.title}>Sign Up</Text>
                    <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
                    <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
                    <TextInput style={styles.input} placeholder="Username" value={userName} onChangeText={setUserName} />
                    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
                    <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
                    <Button title="Register Account" onPress={handleSignUp} />
                    <Button title="Return to Login" onPress={() => setShowSignUp(false)} />
                </>
            ) : (
                <>

                        <Text style={styles.title}>Login</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={handleLogin} style={styles.buttonImage}>
                                <Image source={loginIcon} style={styles.buttonImage} />
                            </TouchableOpacity>
                        </View>
                    <Button title="New here? Sign Up" onPress={() => setShowSignUp(true)} />


                </>
            )}
            <Image source={embellishment} style={styles.embellishment} />
        </View>
    );
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({

    logo:{
        marginTop: screenHeight * .15,
        marginBottom: screenHeight *.075,
        resizeMode:"cover",
        width: screenWidth,
        height: screenHeight * .2,
        overflow: "hidden",
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 10,
        backgroundColor: "#f4f4f4",

    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        width: screenWidth * 0.8,
        maxWidth: 300,
        paddingHorizontal: 10,
        backgroundColor: "white",
    },
    title: {
        alignItems: "center",
        fontFamily: "Futura",
        fontSize: 20,
        fontWeight: 'thin',
        marginBottom: 10,
    },
    passwordContainer: {

        flexDirection: 'row',
        alignItems: 'center',
        width: screenWidth * 0.8,
        maxWidth: 300,

    },
    passwordInput: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
    },

    buttonImage: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    embellishment: {
        resizeMode:"cover",
        width: screenWidth,
        height: screenHeight * .15,
        overflow: "hidden",
        position: 'absolute',
        bottom: 0,
        left: 0,
    }
});