// app.config.js
module.exports = {
    expo: {
        name: "MyCalendarProject",
        slug: "MyCalendarProject",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "myapp",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        ios: {
            bundleIdentifier: "com.gotzila.MyCalendarProject",
            supportsTablet: true
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.gotzila.MyCalendarProject",
            googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff"
                }
            ],
            "expo-font",
            "expo-web-browser",
            [
                "@react-native-google-signin/google-signin",
                {
                    iosUrlScheme: "com.googleusercontent.apps.356083374793-t4nfsju601v0lectntcq17pqvaui9l2u"
                }
            ],
            [
                "expo-notifications",
                {
                    icon: "./assets/images/notification-icon.png",
                    color: "#e74c3c"
                }
            ],
            [
                "expo-image-picker",
                {
                    photosPermission: "Allow access to your photos to insert images into notes",
                    cameraPermission: "Allow camera access to take photos for notes"
                }
            ]
        ],
        experiments: {
            typedRoutes: true
        },
        extra: {
            router: {
                origin: false
            },
            eas: {
                projectId: "4b12d89a-d8f0-44eb-b817-7f4640458ad5"
            }
        },
        owner: "mycalendarproject",
        runtimeVersion: "1.0.0",
        updates: {
            url: "https://u.expo.dev/4b12d89a-d8f0-44eb-b817-7f4640458ad5"
        }
    }
};