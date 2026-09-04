import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
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
import StaffManagementScreen from '../screens/admin/StaffManagementScreen';
import SupplierScreen from '../screens/inventory/SupplierScreen';
import CustomerScreen from '../screens/sales/CustomerScreen';

export type RootStackParamList = {
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
  StaffManagement: { shopId: string };
  Suppliers: { shopId: string };
  Customers: { shopId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
      }}
    >
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
      <Stack.Screen name="StaffManagement" component={StaffManagementScreen} />
      <Stack.Screen name="Suppliers" component={SupplierScreen} />
      <Stack.Screen name="Customers" component={CustomerScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
