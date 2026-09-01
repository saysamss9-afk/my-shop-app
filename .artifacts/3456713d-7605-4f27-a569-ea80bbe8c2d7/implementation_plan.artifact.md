# Implementation Plan: Fix Admin Crash and Merge App Versions

The admin version of the app currently crashes immediately upon launch. Additionally, the user wants to merge the "admin" and "user" versions into a single APK suitable for the Play Store. Since the app already handles role-based navigation at the JavaScript level, having separate build flavors is redundant and likely contributing to the crash due to configuration mismatches.

## User Review Required

> [!IMPORTANT]
> This plan will consolidate the app into a single `applicationId` (`com.abijahshops`). The "Admin" flavor will be removed, and the app will distinguish between admin and user roles based on the logged-in user's credentials (which is already implemented in `LoginScreen.tsx`).

> [!WARNING]
> Renaming the application ID might require updates in the Firebase Console if not already done. However, `google-services.json` already contains both `com.abijahshops` and `com.abijahshops.admin`, so it should remain compatible.

## Proposed Changes

### Android Build Configuration

#### [MODIFY] [build.gradle](file:///C:/Users/Administrator/My%20Shop/android/app/build.gradle)
- Remove `flavorDimensions "app"` and the `productFlavors` block.
- Set `applicationId "com.abijahshops"` in `defaultConfig`.
- Ensure `namespace` remains `com.abijahshops.admin` to maintain compatibility with existing Kotlin/Java code without needing a full package rename.

#### [DELETE] [admin resources](file:///C:/Users/Administrator/My%20Shop/android/app/src/admin)
- Remove the flavor-specific resource directories.

#### [DELETE] [user resources](file:///C:/Users/Administrator/My%20Shop/android/app/src/user)
- Remove the flavor-specific resource directories.

### Android Manifest & Code

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/Administrator/My%20Shop/android/app/src/main/AndroidManifest.xml)
- Ensure the `app_name` string points to a consistent resource.
- Verify activity and application names match the consolidated package structure.

## Verification Plan

### Automated Tests
- Run `./gradlew assembleDebug` to ensure the project builds correctly without flavors.

### Manual Verification
- Deploy the app to a device.
- Verify that it no longer crashes on launch.
- Log in as the admin (UID: `l2JP5nnzVSP6gd8aSDEqI60Tbfl2`) and verify access to the `AdminDashboard`.
- Log in as a regular user and verify access to the standard `Dashboard`.
