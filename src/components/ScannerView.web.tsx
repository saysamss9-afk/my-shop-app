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
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScan, setLastScan] = useState(0);
  const [scanFeedback, setScanFeedback] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let detector: any = null;
    let isMounted = true;

    const startCamera = async () => {
      try {
        console.log('ScannerView: Requesting camera access...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!isMounted) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);

          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            if (isMounted) setIsStreamReady(true);
          };
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

        // Start scanning loop if detector is available
        if (detector) {
            const scan = async () => {
              if (detector && videoRef.current && isMounted && isActive) {
                try {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes.length > 0) {
                    const now = Date.now();
                    if (now - lastScan > 1500) {
                      const code = barcodes[0].rawValue;
                      setLastScan(now);

                      // Feedback
                      setScanFeedback(true);
                      setTimeout(() => { if (isMounted) setScanFeedback(false); }, 300);
                      if ('vibrate' in navigator) navigator.vibrate(100);

                      onScan(code);
                    }
                  }
                } catch (e) {
                  // Detection error, ignore and continue
                }
              }
              if (isMounted) animationFrameId = requestAnimationFrame(scan);
            };
            scan();
        }

      } catch (err: any) {
        console.error('ScannerView: Error accessing camera:', err);
        if (isMounted) {
            setHasPermission(false);
            setError(err.name === 'NotAllowedError' ? 'Camera permission denied.' : 'Could not access camera.');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, onScan]); // removed lastScan to avoid loop, using ref-like state for throttling

  return (
    <View style={styles.container}>
      {/* Video element must ALWAYS be in DOM for the ref to work in startCamera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          position: 'absolute',
          opacity: isStreamReady ? 1 : 0
        }}
      />

      {!isStreamReady && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F3ECFF" />
          <Text style={styles.text}>Initializing camera...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.text}>{error}</Text>
        </View>
      )}

      {isStreamReady && scanFeedback && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 255, 0, 0.3)', zIndex: 10 }]} />
      )}

      {isStreamReady && (
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
          <Text style={styles.instruction}>Align barcode within the square</Text>
        </View>
      )}
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
    position: 'relative'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    padding: 20
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
    zIndex: 5
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
