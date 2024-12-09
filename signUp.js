import React, { useState } from "react";
import {createUserWithEmailAndPassword, getAuth} from "firebase/auth";

import { Alert, Button, TextInput, StyleSheet, View, Text } from "react-native";

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const signUpHandle = async () => {
        // Log for debugging
        console.log("Signing up with email:", email);
        const auth = getAuth();
        try {
            // Create user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User created:", userCredential); // Log user credential
            Alert.alert("Sign-Up Successful", "Your account has been created!");
        } catch (error) {
            console.error("Sign-Up Error:", error.message); // Log error for debugging
            Alert.alert("Sign-Up Failed", error.message);
        }
    };

    return (
        <View style={styles.content}>
            <Text style={styles.title}>Sign Up</Text>

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

            <Button title="Submit" onPress={signUpHandle} />
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
