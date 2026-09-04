import React from 'react';

// Mock for react-native-sqlite-storage
export const SQLite = {
  enablePromise: () => {},
  openDatabase: async () => ({
    executeSql: async () => [{ rows: { length: 0, item: () => null } }],
    transaction: (cb) => cb({ executeSql: async () => [{ rows: { length: 0, item: () => null } }] }),
  }),
};

export const enablePromise = () => {};
export const openDatabase = async () => SQLite.openDatabase();

// Mocks for other native modules
export const RNPrint = {
  print: async () => console.log('Print not supported on web'),
};

export const Camera = () => null;
export const useCameraDevice = () => null;
export const useCameraPermission = () => ({ hasPermission: true, requestPermission: async () => true });
export const useCodeScanner = () => null;

/**
 * Utility to flatten React Native style arrays for use in standard DOM style attributes.
 */
const flattenStyle = (style) => {
    if (!style) return {};
    if (!Array.isArray(style)) return style;
    return style.reduce((acc, curr) => {
        return { ...acc, ...(Array.isArray(curr) ? flattenStyle(curr) : curr) };
    }, {});
};

// Icons Mock - Uses inline SVG/icon-safe fallbacks for Web compatibility without external network requests.
export const MaterialCommunityIcons = ({ name, size, color, style }) => {
    const flatStyle = flattenStyle(style);
    return (
        <i
            className={`mdi mdi-${name}`}
            style={{
                fontSize: size,
                color: color,
                ...flatStyle
            }}
        />
    );
};

export default MaterialCommunityIcons;
