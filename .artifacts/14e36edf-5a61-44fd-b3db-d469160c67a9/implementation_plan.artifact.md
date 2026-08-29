# Re-initialize Android Native Folder

This plan outlines the steps to restore the missing `android/` directory and configure it for a production build of the "My Shop" Admin application.

## User Review Required

> [!IMPORTANT]
> **Firebase Configuration**: A `google-services.json` file is required for Firebase (Auth and Firestore) to work on Android. If you have this file, please provide it or place it in `android/app/` once the folder is created.
> **Signing Config**: For a **Production APK**, we will eventually need a keystore file (`.jks` or `.keystore`). For now, I will set up the project structure so you can generate a debug build first, then a production one.

## Proposed Changes

### 1. Infrastructure Restoration
Re-create the native Android project structure using the React Native CLI.

#### [NEW] `android/`
Re-initialize the Android folder by creating a temporary React Native project and migrating the `android/` directory.

#### [NEW] `gradle/wrapper/`
Restore the Gradle wrapper (`gradlew`, `gradlew.bat`, `gradle-wrapper.jar`, `gradle-wrapper.properties`) to enable Gradle builds.

### 2. Native Dependency Configuration
Wire up the existing React Native libraries in the new Android project.

#### [MODIFY] `android/build.gradle` (Project Level)
- Add Google Services classpath.
- Ensure repositories include `google()` and `mavenCentral()`.

#### [MODIFY] `android/app/build.gradle` (App Level)
- Apply the `com.google.gms.google-services` plugin.
- Configure dependencies for `react-native-vector-icons` and other native modules.

### 3. Permissions & Manifest
#### [MODIFY] `android/app/src/main/AndroidManifest.xml`
- Add required permissions (Internet, Camera for Vision Camera, Storage for Printing).
- Configure the application package name (`com.myshop`).

## Verification Plan

### Automated Tests
- Run `npx react-native run-android` to verify the development build.
- Run `./gradlew :app:assembleRelease` (once signing is configured) to verify production APK generation.

### Manual Verification
- Verify the app launches on an emulator/device.
- Confirm Firebase initialization doesn't crash the app.
