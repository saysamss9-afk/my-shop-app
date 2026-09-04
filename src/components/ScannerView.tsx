import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Vibration, Animated } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';

interface ScannerViewProps {
  onScan: (code: string) => void;
  isActive: boolean;
}

export const requestCameraPermissionSafely = async (): Promise<'granted' | 'denied' | 'not-required'> => {
  if (typeof Camera?.requestCameraPermission !== 'function') {
    return 'not-required';
  }

  const status = await Camera.requestCameraPermission();
  return status === 'granted' ? 'granted' : 'denied';
};

export const ScannerView: React.FC<ScannerViewProps> = ({ onScan, isActive }) => {
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [lastScan, setLastScan] = useState(0);
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      const status = await requestCameraPermissionSafely();
      if (!isCancelled) {
        setHasPermission(status === 'granted' || status === 'not-required');
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  const triggerFeedback = () => {
    // Haptic feedback
    Vibration.vibrate(100);

    // Visual feedback (Green flash)
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'qr', 'code-128'],
    onCodeScanned: (codes: any[]) => {
      const now = Date.now();
      // 1.5 second throttle to avoid double scans
      if (now - lastScan > 1500 && codes.length > 0 && codes[0].value) {
        setLastScan(now);
        triggerFeedback();
        onScan(codes[0].value);
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required to scan barcodes.</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.text}>Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'green', opacity: flashAnim }
        ]}
        pointerEvents="none"
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instruction}>Align barcode within the square</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  instruction: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
