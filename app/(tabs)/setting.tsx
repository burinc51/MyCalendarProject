import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import React, { useEffect } from 'react';

let GoogleSignin: any = null;
let GoogleSigninButton: any = null;

try {
    const googleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSigninModule.GoogleSignin;
    GoogleSigninButton = googleSigninModule.GoogleSigninButton;
} catch (e) {
    console.log('GoogleSignin module not available (likely running in Expo Go)');
}

type User = {
    email: string;
    name: string;
    imageUrl: string;
};

export default function SettingsScreen() {
    const webClientId = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;
    const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || 'http://172.29.176.1:9001';

    const [loading, setLoading] = React.useState(false);
    const [isSignedIn, setIsSignedIn] = React.useState(false);
    const [userInfo, setUserInfo] = React.useState<User | null>(null);
    const [isGoogleAvailable, setIsGoogleAvailable] = React.useState(false);

    useEffect(() => {
        if (GoogleSignin) {
            try {
                GoogleSignin.configure({
                    webClientId: webClientId,
                    offlineAccess: true,
                    forceCodeForRefreshToken: true
                });
                setIsGoogleAvailable(true);
                checkIfSignedIn();
            } catch (err) {
                console.log('GoogleSignin configure error:', err);
            }
        }
    }, []);

    const checkIfSignedIn = async () => {
        if (!GoogleSignin) return;
        try {
            const currentUser = await GoogleSignin.getCurrentUser();
            if (currentUser) {
                setIsSignedIn(true);
            }
        } catch (error) {
            console.error('Check sign in status error:', error);
        }
    };

    const signInWithGoogle = async () => {
        if (!GoogleSignin) {
            Alert.alert(
                'Not Supported',
                'Google Sign-In requires a Development Build or Native App. It is not supported in Expo Go.'
            );
            return;
        }

        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const signInResult = await GoogleSignin.signIn();
            console.log('signInResult: ', signInResult);

            setIsSignedIn(true);

            // Send idToken to backend
            const idToken = await GoogleSignin.getTokens().then((tokens: any) => tokens.idToken);
            console.log('idToken: ', idToken);

            const response = await fetch(`${SERVER_URL}/v1/auth/google-sign-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idToken: idToken })
            });

            const result = response.status === 204 ? null : await response.json();
            setUserInfo(result);
            console.log('Backend response:', result);
        } catch (error) {
            console.error('Google SignIn error:', error);
            Alert.alert('Error', 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        if (!GoogleSignin) return;
        try {
            setLoading(true);
            await GoogleSignin.signOut();
            setUserInfo(null);
            setIsSignedIn(false);
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Google SignOut error:', error);
            Alert.alert('Error', 'Failed to sign out');
        } finally {
            setLoading(false);
        }
    };

    const renderSignInButton = () => {
        if (GoogleSigninButton && isGoogleAvailable) {
            return (
                <GoogleSigninButton
                    size={GoogleSigninButton.Size?.Wide || 1}
                    color={GoogleSigninButton.Color?.Dark || 1}
                    onPress={signInWithGoogle}
                    disabled={loading}
                />
            );
        }

        return (
            <TouchableOpacity
                className="bg-blue-600 py-3 px-6 rounded-full items-center justify-center flex-row shadow-lg"
                onPress={signInWithGoogle}
                disabled={loading}
            >
                <Text className="text-white font-semibold text-base">
                    {isGoogleAvailable ? "Sign in with Google" : "Google Sign-In (Dev Build Only)"}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 justify-center items-center p-5 bg-white">
            {!isSignedIn ? (
                renderSignInButton()
            ) : (
                <View className="items-center p-5">
                    {userInfo?.imageUrl && (
                        <Image
                            source={{ uri: userInfo.imageUrl }}
                            className="w-24 h-24 rounded-full mb-5 border-2 border-gray-300"
                        />
                    )}

                    <Text className="text-2xl font-bold mb-2 text-center text-gray-800">
                        Welcome, {userInfo?.name || 'User'}!
                    </Text>
                    <Text className="text-base text-gray-600 mb-8 text-center">
                        {userInfo?.email}
                    </Text>

                    <TouchableOpacity
                        className="bg-red-600 py-3 px-6 rounded-full items-center justify-center flex-row shadow-lg min-w-30"
                        onPress={signOut}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-semibold text-base">Sign Out</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
