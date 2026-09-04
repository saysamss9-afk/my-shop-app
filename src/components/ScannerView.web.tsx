import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';

interface ScannerViewProps {
  onScan: (code: string) => void;
  isActive: boolean;
}

export const requestCameraPermissionSafely = async (): Promise<'granted' | 'denied' | 'not-required'> => {
  return 'not-required';
};

export const ScannerView: React.FC<ScannerViewProps> = ({ onScan, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let detector: any = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }

        // Check for BarcodeDetector support
        if ('BarcodeDetector' in window) {
          // @ts-ignore
          const formats = await BarcodeDetector.getSupportedFormats();
          if (formats.length > 0) {
             // @ts-ignore
            detector = new BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128']
            });
          }
        }

        if (!detector) {
            console.warn('BarcodeDetector API not supported in this browser.');
            setError('Barcode scanning is not supported in this browser. Please use Chrome.');
        }

        setIsScanning(true);
      } catch (err: any) {
        console.error('Error accessing camera:', err);
        setHasPermission(false);
        setError(err.message === 'Permission denied' ? 'Camera permission denied.' : 'Could not access camera.');
      }
    };

    const scan = async () => {
      if (detector && videoRef.current && isActive && isScanning) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const now = Date.now();
            if (now - lastScan > 1500) {
              const code = barcodes[0].rawValue;
              setLastScan(now);

              // Feedback
              setScanFeedback(true);
              setTimeout(() => setScanFeedback(false), 300);
              if ('vibrate' in navigator) navigator.vibrate(100);

              onScan(code);
            }
          }
        } catch (e) {
          // Detection error, ignore and continue
        }
      }
      animationFrameId = requestAnimationFrame(scan);
    };

    startCamera().then(() => {
        if (detector) scan();
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, isScanning]);

  if (hasPermission === false || error) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{error || 'Camera permission is required.'}</Text>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#F3ECFF" />
        <Text style={styles.text}>Requesting camera access...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute'
        }}
      />

      {scanFeedback && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 255, 0, 0.3)' }]} />
      )}

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
    overflow: 'hidden',
  },
  text: {
    color: 'white',
    textAlign: 'center',
    padding: 20,
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
