import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isElectron = isWeb && typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent);

export const platformShadow = ({
  color = 'rgba(22, 24, 40, 0.12)',
  offsetY = 8,
  radius = 18,
  opacity = 0.12,
}: {
  color?: string;
  offsetY?: number;
  radius?: number;
  opacity?: number;
} = {}) => {
  if (isWeb) {
    return {
      boxShadow: `0 ${offsetY}px ${radius}px ${color}`,
    };
  }

  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: offsetY },
    elevation: 4,
  };
};

export const getButtonHeight = (base = 52) => {
  if (isWeb || isElectron) return Math.max(base, 48);
  if (Platform.OS === 'ios') return base + 2;
  return base;
};

export const getResponsivePadding = (base = 24) => {
  if (isWeb) return base;
  return base - 2;
};
