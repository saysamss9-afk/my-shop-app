# Modern Minimalist UI Transformation

Transform the app's UI to match the modern, minimalist m-banking design provided in the reference image. This involves updating the color palette, typography, border radii, and overall layout components.

## User Review Required

> [!IMPORTANT]
> This change will significantly alter the visual appearance of the app. The primary color will shift from Deep Indigo to a vibrant Purple, and the overall layout will become more "card-heavy" with large rounded corners.

## Proposed Changes

### Global Styling & Theming

#### [MODIFY] [App.tsx](file:///C:/Users/Administrator/My%20Shop/App.tsx)
- Update the React Native Paper theme to use the new purple/pink palette.
- Increase the global `roundness` to 20+.
- Set the default background color to a soft lavender (`#F3ECFF`).

#### [MODIFY] [gluestack-ui.config.ts](file:///C:/Users/Administrator/My%20Shop/src/gluestack-ui.config.ts)
- Refine color tokens to match the reference image exactly.
- Add specific tokens for "surface" backgrounds and "card" styling.

### Core Components

#### [MODIFY] [ScreenWrapper.tsx](file:///C:/Users/Administrator/My%20Shop/src/components/common/ScreenWrapper.tsx)
- Ensure the wrapper provides the correct background color and padding consistency.

### Feature Screens

#### [MODIFY] [DashboardScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/dashboard/DashboardScreen.tsx)
- Re-style the header to match the "Welcome" section in the image.
- Implement the "Primary Actions" as a grid of rounded cards with soft shadows.
- Update the "Hero Insight Card" to match the gradient/vibrant style shown in the reference.
- Apply consistent spacing and typography (larger, bolder headings).

#### [MODIFY] [LoginScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/auth/LoginScreen.tsx)
- Update the login form to use the new card-based styling and rounded inputs.

## Verification Plan

### Manual Verification
- Deploy the app to the web/emulator.
- Verify that the background color is a soft lavender.
- Check that all buttons and cards have large, consistent border radii.
- Ensure icons have the correct tinted backgrounds as per the design.
- Verify readability of text against the new background colors.
