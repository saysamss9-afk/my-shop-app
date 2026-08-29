import React from 'react';

declare module 'react-native-sqlite-storage' {
    export namespace SQLite {
        interface SQLiteDatabase {
            executeSql(statement: string, params?: any[]): Promise<[any]>;
            transaction(callback: (tx: any) => void): Promise<void>;
        }
    }
    const SQLite: {
        openDatabase: (params: any) => Promise<SQLite.SQLiteDatabase>;
        enablePromise: (val: boolean) => void;
    };
    export default SQLite;
}

declare module 'react-native-vector-icons/MaterialCommunityIcons' {
    import { Component } from 'react';
    import { IconProps } from 'react-native-vector-icons/Icon';
    export default class MaterialCommunityIcons extends Component<IconProps> {}
}

declare module 'react-native-paper' {
    export * from 'react-native-paper/lib/typescript/index';
    // Force Text to be recognized as a valid JSX element
    import { Text as PaperText } from 'react-native-paper/lib/typescript/components/Typography/Text';
    export const Text: React.ComponentType<any>;
}

declare module 'react-native-print' {
    const RNPrint: any;
    export default RNPrint;
}

declare module 'react-native-vision-camera' {
    export const Camera: any;
    export const useCameraDevice: any;
    export const useCameraPermission: any;
    export const useCodeScanner: any;
}
