import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, StyleSheet, Alert } from 'react-native';
import {getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import SignUp from './signUp';

export default function LoginForm() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showSignUp, setShowSignUp] = useState(false);

    const auth = getAuth();

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

    // Toggle between login and signup view
    const handleSignUp = () => {
        setShowSignUp(true);
    };

    if (user) {
        return (
            <View style={styles.content}>
                <Text>Welcome, {user.email}</Text>
                <Button title="Log Out" onPress={() => signOut(auth)} />
            </View>
        );
    }

    return (
        <View style={styles.content}>
            {showSignUp ? (
                <SignUp />
            ) : (
                <>
                    <Text>Please log in to continue.</Text>
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
                    <Button title="Sign Up" onPress={handleSignUp} />
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
});
