# Solid UI, Perfect Buttons, and Background Refinement

This plan aims to elevate the "My Shop" app's visual identity by introducing a refined theme, consistent background management, and high-quality reusable components.

## User Review Required

> [!IMPORTANT]
> The proposed theme uses a **Professional Deep Indigo** and **Electric Cyan** palette, which provides a modern, "solid" business feel. If you have specific brand colors, please let me know.

> [!NOTE]
> I will be introducing a `ScreenWrapper` component. This will change how backgrounds are handled across screens to ensure consistency.

## Proposed Changes

### Theme & Global Styles

#### [MODIFY] [App.tsx](file:///C:/Users/Administrator/My%20Shop/App.tsx)
- Refine the `MD3LightTheme` colors for better contrast and depth.
- Standardize `roundness` and typography.

---

### Core UI Components

#### [NEW] [ScreenWrapper.tsx](file:///C:/Users/Administrator/My%20Shop/src/components/common/ScreenWrapper.tsx)
- A reusable component that handles safe area insets, background color/gradients, and optional scrollable behavior.
- Provides a consistent "solid" background across all screens.

#### [NEW] [CustomButton.tsx](file:///C:/Users/Administrator/My%20Shop/src/components/common/CustomButton.tsx)
- Reusable "Perfect Button" component with:
    - Subtle gradients for primary actions.
    - Haptic-like press feedback (visual).
    - Refined shadows (elevation).
    - Loading states.

---

### Screen Enhancements

#### [MODIFY] [DashboardScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/dashboard/DashboardScreen.tsx)
- Integrate `ScreenWrapper` and `CustomButton`.
- Refine card elevations and spacing to match the new "solid" UI.

## Verification Plan

### Manual Verification
1. Open the app and verify the new background consistency on the **Dashboard**.
2. Interact with the new **Custom Buttons** to check press effects and alignment.
3. Verify that the UI remains responsive and looks "solid" on different screen sizes.
