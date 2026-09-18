import { useWindowDimensions } from 'react-native';
import { isWeb } from '../utils/platformStyles';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;

  // Standard breakpoint for tablets is 600dp (smallest side)
  const smallestDimension = Math.min(width, height);
  const isTablet = smallestDimension >= 600;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isLargeScreen: isTablet || (isWeb && width > 1024),
  };
};
