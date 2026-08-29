# Implementation Plan: Abijah Shops Management System

A multi-platform shop management system built with Kotlin Multiplatform (KMP), Compose Multiplatform, and Firebase. This app allows individual shop owners to manage inventory, sales, employees, and suppliers across Windows, Web, Android, and iOS.

## User Review Required

> [!IMPORTANT]
> **Multi-tenancy Architecture**: Since "anyone with the app" can use it, we will use a **Firestore-based Multi-tenancy** model. Each user (Owner) will own one or more `Shop` entities. All data (Sales, Inventory) will be scoped to a `ShopId`.

> [!WARNING]
> **Web Support (Compose Wasm)**: Compose for Web (Wasm) is evolving. While highly functional, certain browser-specific hardware integrations (like USB receipt printers) may require specific JS-interop work.

## Open Questions
- **Sync Priority**: In case of a conflict (e.g., two employees update the same stock item offline), should "Last Write Wins" be the default strategy, or do we need complex merging?
- **Subscription Model**: Will this be a free app, or do we need to plan for a billing/tier system (e.g., Free for 1 shop, Paid for multiple)?

## Proposed Changes

### 1. Project Foundation & Structure
Set up the KMP environment for Windows, Android, iOS, and Web.

#### [NEW] `build.gradle.kts` (Root and Module levels)
- Configure `kotlin-multiplatform`, `compose-multiplatform`, and `sql-delight` plugins.
- Add dependencies: `Koin` (DI), `Ktor` (Networking), `Voyager` (Navigation), and `GitLive Firebase` (KMP Firebase wrapper).

### 2. Data Persistence (Offline-First)
Implement the relational schema for the local database.

#### [NEW] `ShopDb.sq`
- Define tables: `Shops`, `Employees`, `Products`, `Suppliers`, `Sales`, `SaleItems`.
- Create SQLDelight drivers for each platform (Android, iOS, Desktop/Windows, Web).

### 3. Authentication & Multi-Tenancy
Implement the onboarding flow and access control.

#### [NEW] `AuthRepository` & `ShopRepository`
- Firebase Auth for sign-up/login.
- Role-based access control (RBAC) logic: `Owner` > `Manager` > `Staff`.

### 4. Feature: Inventory & Suppliers
#### [NEW] `InventoryScreen` & `SupplierScreen`
- CRUD operations for products and suppliers.
- Stock level alerts and "Low Stock" reports.

### 5. Feature: Sales & POS (Point of Sale)
#### [NEW] `CheckoutScreen`
- Optimized for quick selection (Search/Barcode).
- Local sale recording in SQLDelight for instant performance.
- Background sync to Firebase.

### 6. Sync Engine
#### [NEW] `SyncManager`
- Worker/Job that detects internet availability.
- Uploads local changes to Firestore and fetches updates from other devices.

## Verification Plan

### Automated Tests
- **Unit Tests**: Test sales calculation logic and stock deduction in `commonMain`.
- **Database Tests**: Verify SQLDelight migrations and CRUD operations.
- **Sync Logic**: Mock network failure/recovery to ensure data integrity.

### Manual Verification
- Deploy to Android Emulator and Windows Desktop.
- Perform a sale offline, then turn on internet and verify data appears in Firebase Console.
- Test multi-device sync: Perform a sale on Mobile and check if inventory updates on Windows.
