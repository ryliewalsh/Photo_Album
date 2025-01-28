import React, { useState } from 'react';
import {View, Text, TextInput, Switch, Button, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import {MaterialIcons} from "@expo/vector-icons";

export default function UserSettings({setShowSettings}) {
    const [username, setUsername] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [theme, setTheme] = useState('light'); // "light" or "dark"

    const saveSettings = () => {
        // Save settings logic here (e.g., update Firestore, local storage, or backend)
        Alert.alert('Settings Saved', `Username: ${username}\nNotifications: ${notificationsEnabled ? 'On' : 'Off'}\nTheme: ${theme}`);
    };

    const closeSettings = () => {
        setShowSettings(false);

    };

    return (
        <View style={styles.container}>
            <View style={styles.user_container}>
                    <Text style={styles.title}>Settings</Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={closeSettings}
                    >
                        <MaterialIcons name="settings" size={24} color="black" />
                    </TouchableOpacity>

            </View>
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Enable Notifications:</Text>
                <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                />
            </View>

            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Add options here</Text>

            </View>

            <Button title="Save Settings" onPress={saveSettings} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'white',
        zIndex: 1,
    },
    user_container: {

        paddingTop: "10%",
        backgroundColor: "white",
        zIndex: 1,
        flexDirection: "row",

    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    fieldContainer: {
        marginBottom: 20,

    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
    },
    themeButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
});
