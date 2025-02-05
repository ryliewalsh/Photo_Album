import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export default function AuthScreen() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSignUp, setShowSignUp] = useState(false); // Toggle between login and signup

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
            Alert.alert("Login Successful", "You are now logged in!");
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
            {showSignUp ? (
                <>
                    <Text style={styles.title}>Sign Up</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={userName}
                        onChangeText={setUserName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <Button title="Sign Up" onPress={handleSignUp} />
                    <Button title="Go to Login" onPress={() => setShowSignUp(false)} />
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
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <Button title="Log In" onPress={handleLogin} />
                    <Button title="Go to Sign Up" onPress={() => setShowSignUp(true)} />
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        alignItems: 'center',
        padding: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        width: 200,
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
