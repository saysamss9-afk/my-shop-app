# Web App Fix, Renaming, and App Enhancements

This plan addresses compilation errors, implements project renaming, and adds requested features to both the Admin and User versions of the application.

## User Review Required

> [!IMPORTANT]
> - The project will be renamed to **"My Shop"** across all targets.
> - **Admin App:** Will now display the number of registered users and the secret shop code for each branch.
> - **User App:** A new button will be added to the "Join Shop" screen allowing users without a code to register via WhatsApp.
> - **Deployment:** The web app will be fixed and deployed to Firebase Hosting.

## Proposed Changes

### 1. Project Renaming

#### [MODIFY] [settings.gradle.kts](file:///C:/Users/Administrator/Abijah%20Shops/settings.gradle.kts)
- Rename `rootProject.name` to `"MyShop"`.

#### [MODIFY] [build.gradle.kts](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/build.gradle.kts)
- Update `resValue` for `app_name` to `"My Shop"` and `"My Admin"`.
- Update `packageName` in `nativeDistributions` to `"MyShop"`.
- Update `namespace` and `applicationId` to `com.myshop`.

#### [MODIFY] [strings.xml](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/androidMain/res/values/strings.xml)
- Update `app_name` to `"My Shop"`.

#### [MODIFY] [index.html](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/jsMain/resources/index.html)
- Update `<title>` to `"My Shop"`.

#### [MODIFY] [AnalyticsRepository.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/data/AnalyticsRepository.kt)
- Update CSV header string to `"My Shop - Business Report"`.

#### [MODIFY] [DashboardScreen.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/ui/dashboard/DashboardScreen.kt)
- Update the app title in the `TopAppBar` to `"My Shop"`.

---

### 2. Admin App Enhancements (Shop Insights)

#### [MODIFY] [PlatformRepository.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/data/PlatformRepository.kt)
- Update `RegisteredShop` data class to include `userCount: Int`.
- Modify `getAllShops()` to fetch the count of documents in the `employees` collection for each `shopId`.

#### [MODIFY] [PlatformDashboardScreen.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/ui/platform/PlatformDashboardScreen.kt)
- Update the UI to display the `userCount` for each branch in the list.
- Ensure the `joinCode` is clearly visible and labeled as the "Secret Shop Code".

---

### 3. User App Enhancements (Registration Support)

#### [MODIFY] [JoinShopScreen.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/ui/join/JoinShopScreen.kt)
- Add a `TextButton` below the "Verify Code" button with the text `"Register your shop"`.
- Implement an action to open a WhatsApp chat with `0554715716` using the `https://wa.me/233554715716` link (assuming Ghana +233 prefix).

---

### 4. Compilation & Dependency Fixes

#### [MODIFY] [libs.versions.toml](file:///C:/Users/Administrator/Abijah%20Shops/gradle/libs.versions.toml)
- Add `compose-icons-extended` library definition.

#### [MODIFY] [build.gradle.kts](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/build.gradle.kts)
- Add `libs.compose.icons.extended` to `commonMain` dependencies.

#### [MODIFY] [AuditRepository.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/data/AuditRepository.kt)
- Remove `java.util.UUID` import (incompatible with JS).

#### [MODIFY] [ShopRepository.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/data/ShopRepository.kt)
- Fix SQLDelight `insertShop` call.

#### [MODIFY] [SaleRepository.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/data/SaleRepository.kt)
- Fix SQLDelight `insertSaleItem` call.

#### [MODIFY] [Koin.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/di/Koin.kt)
- Fix `ProductRepository` registration.

#### [MODIFY] [MainViewModel.kt](file:///C:/Users/Administrator/Abijah%20Shops/composeApp/src/commonMain/kotlin/com/abijahshops/ui/main/MainViewModel.kt)
- Fix `Shop` model constructor.

---

### 5. UI Imports & Icons

- Fix missing `parametersOf`, `Alignment`, and `Icon` imports in:
    - `DashboardScreen.kt`
    - `AnalyticsScreen.kt`
    - `CheckoutScreen.kt`
    - `CustomerScreen.kt`
    - `DashboardPreview.kt`
    - `InventoryScreen.kt`

## Verification Plan

### Automated Tests
- Run `./gradlew :composeApp:jsBrowserDistribution` to verify the web build.
- Run `./gradlew :composeApp:assembleDebug` to verify the Android build.

### Manual Verification
- Deploy the fixed web app to Firebase Hosting.
- Verify the Admin Dashboard shows user counts and shop codes.
- Verify the User App "Join Shop" screen has the new "Register your shop" WhatsApp button.
