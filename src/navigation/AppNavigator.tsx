import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/auth/SplashScreen';
import LandingScreen from '../screens/auth/LandingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import JoinShopScreen from '../screens/auth/JoinShopScreen';
import ShopSetupScreen from '../screens/auth/ShopSetupScreen';
import ShopRequestScreen from '../screens/auth/ShopRequestScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import SaleHistoryScreen from '../screens/sales/SaleHistoryScreen';
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import DailyReportScreen from '../screens/analytics/DailyReportScreen';
import ExpenseManagementScreen from '../screens/analytics/ExpenseManagementScreen';
import ProfitLossScreen from '../screens/analytics/ProfitLossScreen';
import StaffManagementScreen from '../screens/admin/StaffManagementScreen';
import BranchManagementScreen from '../screens/admin/BranchManagementScreen';
import SupplierScreen from '../screens/inventory/SupplierScreen';
import PurchaseScreen from '../screens/inventory/PurchaseScreen';
import PurchaseHistoryScreen from '../screens/inventory/PurchaseHistoryScreen';
import CustomerScreen from '../screens/sales/CustomerScreen';
import CategoryManagementScreen from '../screens/inventory/CategoryManagementScreen';

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Login: undefined;
  Register: undefined;
  JoinShop: undefined;
  ShopSetup: undefined;
  ShopRequest: undefined;
  AdminDashboard: undefined;
  Dashboard: { shopId: string; employeeId: string; userRole: string; shopName?: string };
  Inventory: { shopId: string; userRole: string };
  Checkout: { shopId: string; employeeId: string };
  SaleHistory: { shopId: string };
  Analytics: { shopId: string };
  DailyReport: { shopId: string };
  Expenses: { shopId: string };
  ProfitLoss: { shopId: string; userRole: string };
  StaffManagement: { shopId: string };
  BranchManagement: { shopId: string };
  Suppliers: { shopId: string };
  Purchase: { shopId: string; initialSupplierId?: string };
  PurchaseHistory: { shopId: string };
  Customers: { shopId: string };
  CategoryManagement: { shopId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="JoinShop" component={JoinShopScreen} />
      <Stack.Screen name="ShopSetup" component={ShopSetupScreen} />
      <Stack.Screen name="ShopRequest" component={ShopRequestScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="SaleHistory" component={SaleHistoryScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="DailyReport" component={DailyReportScreen} />
      <Stack.Screen name="Expenses" component={ExpenseManagementScreen} />
      <Stack.Screen name="ProfitLoss" component={ProfitLossScreen} />
      <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
      <Stack.Screen name="BranchManagement" component={BranchManagementScreen} />
      <Stack.Screen name="Suppliers" component={SupplierScreen} />
      <Stack.Screen name="Purchase" component={PurchaseScreen} />
      <Stack.Screen name="PurchaseHistory" component={PurchaseHistoryScreen} />
      <Stack.Screen name="Customers" component={CustomerScreen} />
      <Stack.Screen name="CategoryManagement" component={CategoryManagementScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
