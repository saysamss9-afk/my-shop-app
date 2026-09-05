import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ScannerViewProps {
  onScan: (code: string) => void;
  isActive: boolean;
}

export const ScannerView: React.FC<ScannerViewProps> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Scanner is not available on Web/Electron.</Text>
      <Text style={styles.subtext}>Please use manual entry or a hardware USB scanner.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtext: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  }
});
