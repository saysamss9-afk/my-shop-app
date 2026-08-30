# Fix TypeScript Errors Across Project

This plan addresses 42+ TypeScript errors identified by `npx tsc --noEmit`. The errors range from missing type definitions to invalid prop types and missing imports.

## Proposed Changes

### Database and Repositories
#### [MODIFY] [database.ts](file:///C:/Users/Administrator/My%20Shop/src/db/database.ts)
- Update import to `import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage'`.
- Use `SQLiteDatabase` instead of `SQLite.SQLiteDatabase`.

#### [MODIFY] Repositories (Analytics, Category, Customer, Product, Sale, Supplier)
- Update imports and constructor parameter types to use `SQLiteDatabase`.

### Screen Fixes
#### [MODIFY] [AdminDashboardScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/admin/AdminDashboardScreen.tsx)
- Import `MapPin`, `User` from `lucide-react-native`.
- Fix `hardShadow` prop values (remove `'0'`).
- Add missing `UserIcon` import (via Lucide).

#### [MODIFY] [AnalyticsScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/analytics/AnalyticsScreen.tsx)
- Import missing icons (`TrendingUp`, `TrendingDown`, `User`, `RefreshCw`) from `lucide-react-native`.
- Remove unsupported `divider` prop from `VStack`.

#### [MODIFY] [CheckoutScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/checkout/CheckoutScreen.tsx)
- Import `Wallet`, `Scan` from `lucide-react-native`.
- Replace unsupported `roundedTopLeft` / `roundedTopRight` with `borderTopLeftRadius` / `borderTopRightRadius` or Gluestack equivalents.
- Remove unsupported `divider` prop from `VStack`.
- Fix height token `h="$14"` to a valid one like `h="$12"` or a raw number.

#### [MODIFY] [ShopRequestScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/auth/ShopRequestScreen.tsx)
- Import `Pressable` from `@gluestack-ui/themed`.
- Import missing icons from `lucide-react-native`.

#### [MODIFY] [ShopSetupScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/auth/ShopSetupScreen.tsx)
- Fix `Text` component type error (likely by ensuring valid children or checking the import source).

#### [MODIFY] [SaleHistoryScreen.tsx](file:///C:/Users/Administrator/My%20Shop/src/screens/sales/SaleHistoryScreen.tsx)
- Import missing icons from `lucide-react-native`.
- Remove unsupported `divider` prop from `HStack`.

## Verification Plan
### Automated Tests
- Run `npx tsc --noEmit` to verify all type errors are resolved.
