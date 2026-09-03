import React from 'react';
import { View, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Simple SVG paths for business icons
const PATHS = {
    store: "M20,4H4V2H20V4M21,14V21H19V14H21M3,14H5V21H3V14M1,12V10L12,5L23,10V12H1Z",
    login: "M10,17V14H3V10H10V7L15,12L10,17M7,2H17A2,2 0 0,1 19,4V20A2,2 0 0,1 17,22H7A2,2 0 0,1 5,20V16H7V20H17V4H7V8H5V4A2,2 0 0,1 7,2Z",
    plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",
    group: "M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15.22 17,16.5V19H22V16.5C22,14.67 18.33,13.75 16,13.75C16,13.5 16,13.25 16,13M8,13C5.67,13 2,14.17 2,16.5V19H14V16.5C14,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z",
    cart: "M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7A2,2 0 0,1 5,15C5,14.65 5.07,14.31 5.24,14L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z",
    chart: "M22,21H2V3H4V19H6V10H10V19H12V14H16V19H18V7H22V21Z",
    package: "M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z",
    receipt: "M3,22L4.5,20.5L6,22L7.5,20.5L9,22L10.5,20.5L12,22L13.5,20.5L15,22L16.5,20.5L18,22L19.5,20.5L21,22V2L19.5,3.5L18,2L16.5,3.5L15,2L13.5,3.5L12,2L10.5,3.5L9,2L7.5,3.5L6,2L4.5,3.5L3,2V22M7,7H17V9H7V7M7,11H17V13H7V11M7,15H14V17H7V15Z",
    wallet: "M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V15C10,16.1 10.89,17 12,17H21M12,15H22V8H12V15M16,10.5A1.5,1.5 0 0,1 17.5,12A1.5,1.5 0 0,1 16,13.5A1.5,1.5 0 0,1 14.5,12A1.5,1.5 0 0,1 16,10.5Z",
    layers: "M12,16L22,12L12,8L2,12L12,16M12,20L22,16L12,12L2,16L12,20Z"
};

// Map custom names to MaterialCommunityIcons names for Native fallback
const MAPPING: { [key: string]: string } = {
    store: 'storefront',
    login: 'login-variant',
    plus: 'plus',
    group: 'account-group',
    cart: 'cart',
    chart: 'chart-areaspline',
    package: 'package-variant',
    receipt: 'receipt',
    wallet: 'wallet',
    layers: 'layers'
};

export type IconName = keyof typeof PATHS;

interface Props {
    name: IconName;
    size?: number;
    color?: string;
}

const AppIcon: React.FC<Props> = ({ name, size = 24, color = 'black' }) => {
    const path = PATHS[name];

    if (Platform.OS === 'web') {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
                <path d={path} />
            </svg>
        );
    }

    // On Native, use the already installed react-native-vector-icons
    return <MaterialCommunityIcons name={MAPPING[name]} size={size} color={color} />;
};

export default AppIcon;
