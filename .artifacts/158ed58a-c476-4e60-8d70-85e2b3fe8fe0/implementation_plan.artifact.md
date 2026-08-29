# Platform Migration: Kotlin Multiplatform to React Native (TypeScript)

This plan outlines the steps to migrate the "My Shop" application from a Kotlin Multiplatform (KMP) architecture to a React Native project using TypeScript.

## User Review Required

> [!WARNING]
> This is a destructive migration. The existing Kotlin code will be replaced with TypeScript and React components.
> While React Native supports Android and iOS, the current Desktop and Web targets in your KMP project will require additional setup (React Native Web/Desktop) or may be lost if not explicitly addressed.

> [!IMPORTANT]
> React Native setup requires a different development environment (Node.js, npm/yarn, watchman, etc.). Ensure your environment is ready before proceeding.

## Proposed Changes

The migration will be performed in phases to ensure data integrity and feature parity.

---

### Phase 1: Project Initialization & Infrastructure

Initialize the React Native project and set up the core cross-platform infrastructure.

#### [NEW] [package.json](file:///C:/Users/Administrator/My%20Shop/package.json)
Initialize a new React Native project with TypeScript.

#### [NEW] [App.tsx](file:///C:/Users/Administrator/My%20Shop/App.tsx)
The main entry point for the React Native application, setting up Navigation and Global Providers.

#### [NEW] [src/navigation/AppNavigator.tsx](file:///C:/Users/Administrator/My%20Shop/src/navigation/AppNavigator.tsx)
Setting up React Navigation to replicate the Voyager-based navigation in the KMP app.

---

### Phase 2: Data Layer Migration

Migrate the SQLDelight database and Firebase synchronization logic to TypeScript.

#### [NEW] [src/db/database.ts](file:///C:/Users/Administrator/My%20Shop/src/db/database.ts)
Implement the SQLite database using `react-native-quick-sqlite` or `expo-sqlite`, replicating the schema from `AppDatabase.sq`.

#### [NEW] [src/repositories/](file:///C:/Users/Administrator/My%20Shop/src/repositories/)
Rewrite repositories (Product, Sale, Customer, etc.) in TypeScript, interfacing with the local database and Firebase.

#### [NEW] [src/sync/SyncManager.ts](file:///C:/Users/Administrator/My%20Shop/src/sync/SyncManager.ts)
Migrate the `SyncManager` logic to handle background synchronization with Firestore.

---

### Phase 3: Feature & UI Migration

Rewrite the UI screens using React Native components and Material 3 design principles (e.g., using `react-native-paper`).

#### [NEW] [src/screens/auth/](file:///C:/Users/Administrator/My%20Shop/src/screens/auth/)
Migrate Login, Register, and Join Shop screens.

#### [NEW] [src/screens/inventory/](file:///C:/Users/Administrator/My%20Shop/src/screens/inventory/)
Migrate Inventory and Category management screens.

#### [NEW] [src/screens/sales/](file:///C:/Users/Administrator/My%20Shop/src/screens/sales/)
Migrate Checkout and Sale History screens.

#### [NEW] [src/screens/dashboard/](file:///C:/Users/Administrator/My%20Shop/src/screens/dashboard/)
Migrate Analytics and Dashboard screens.

---

### Phase 4: Native Modules & Cleanup

Integrate native features and remove the old KMP project structure.

#### [NEW] [src/services/PrintingService.ts](file:///C:/Users/Administrator/My%20Shop/src/services/PrintingService.ts)
Implement PDF generation and printing using React Native libraries.

#### [DELETE] [composeApp/](file:///C:/Users/Administrator/My%20Shop/composeApp/)
Remove the original Kotlin source code once migration is verified.

## Verification Plan

### Automated Tests
- Run `npm test` to verify business logic and repository unit tests.
- Run `npx react-native run-android` / `run-ios` to verify the build process.

### Manual Verification
1. **Auth Flow**: Verify login and registration works with Firebase.
2. **Inventory**: Add/Edit products and verify they persist in the local database.
3. **Sales**: Complete a checkout and verify the sale record is created and synced.
4. **Sync**: Verify that local changes are reflected in Firebase Firestore.
5. **PDF**: Verify receipt generation and export functionality.
