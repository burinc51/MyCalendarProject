import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import React, { useEffect } from 'react';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';

type User = {
    email: string;
    name: string;
    picture: string;
};

export default function HomeScreen() {
    const [loading, setLoading] = React.useState(false);
    const [isSignedIn, setIsSignedIn] = React.useState(false);
    const [userInfo, setUserInfo] = React.useState<User | null>(null);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '356083374793-mbdr9e7v0sctd8glmvhsgqnlvkjr14cu.apps.googleusercontent.com',
            offlineAccess: true,
            forceCodeForRefreshToken: true,
        });

        checkIfSignedIn();
    }, []);

    const checkIfSignedIn = async () => {
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
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();

            setIsSignedIn(true);

            // ✅ ส่ง idToken ไปยัง backend
            const idToken = await GoogleSignin.getTokens().then((tokens) => tokens.idToken);

            const response = await fetch('http://192.168.183.82:9001/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken: idToken }),
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

    return (
        <View className="flex-1 justify-center items-center p-5">
            {!isSignedIn ? (
                <GoogleSigninButton
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={signInWithGoogle}
                    disabled={loading}
                />
            ) : (
                <View className="items-center p-5">
                    {userInfo?.picture && (
                        <Image
                            source={{ uri: userInfo.picture }}
                            className="w-24 h-24 rounded-full mb-5 border-2 border-gray-300"
                        />
                    )}

                    <Text className="text-2xl font-bold mb-2 text-center">Welcome, {userInfo?.name || 'User'}!</Text>
                    <Text className="text-base text-gray-600 mb-8 text-center">{userInfo?.email}</Text>

                    <TouchableOpacity
                        className="bg-red-600 py-3 px-6 rounded-full items-center justify-center flex-row shadow-lg min-w-30"
                        onPress={signOut}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold text-base">Sign Out</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
