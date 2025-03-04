import React from "react";
import {View, Text, Image, TouchableOpacity, StyleSheet, Dimensions} from "react-native";
import embellishment from "./assets/FrameEmbellishment.png";

export default function HomeScreen({ setMode, handleLogout }) {
    return (
        <View style={styles.container}>
            {/* Frame Logo */}
            <Image source={require("./assets/FRAME.png")} style={styles.logo} />

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => setMode("view")}>
                    <Text style={styles.buttonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => setMode("upload")}>
                    <Text style={styles.buttonText}>Upload</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => setMode("share")}>
                    <Text style={styles.buttonText}>Share</Text>
                </TouchableOpacity>
            </View>



        </View>
    );
}
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "#f4f4f4",
    },
    logo:{
        marginTop: screenHeight * .15,
        marginBottom: screenHeight *.075,
        resizeMode:"cover",
        width: screenWidth,
        height: screenHeight * .2,
        overflow: "hidden",
    },
    buttonContainer: {
        width: "80%",
        alignItems: "center",
    },
    button: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        width: screenWidth * 0.8,
        maxWidth: 300,
        backgroundColor: "white",
        alignItems: "center",
    },
    buttonText: {
        padding: 4,
        fontFamily: "Futura",
        fontSize: 20,
        fontWeight: 'thin',
        marginBottom: 10,
    },
    logoutButton: {
        marginTop: 20,
        padding: 10,
    },
    logoutText: {
        color: "red",
        fontSize: 16,
        fontWeight: "bold",
    },
    embellishment: {
        resizeMode:"cover",
        width: screenWidth,
        height: screenHeight * .15,
        overflow: "hidden",
        position: 'absolute',
        bottom: 0,
        left: 0,
    },

});
