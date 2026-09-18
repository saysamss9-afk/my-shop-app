import React, { useEffect, useState } from 'react';
import { Box, HStack, Text, Icon } from '@gluestack-ui/themed';
import { WifiOff } from 'lucide-react-native';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    return typeof (navigator as any).onLine === 'boolean' ? !(navigator as any).onLine : false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const updateConnection = () => {
      if (typeof navigator === 'undefined') {
        setIsOffline(false);
        return;
      }

      setIsOffline(typeof (navigator as any).onLine === 'boolean' ? !(navigator as any).onLine : false);
    };

    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <Box bg="$error600" px="$4" py="$2">
      <HStack space="md" alignItems="center" justifyContent="center">
        <Icon as={WifiOff} color="white" size="xs" />
        <Text color="white" size="xs" fontWeight="$bold">
          You are currently offline. Some features may be limited.
        </Text>
      </HStack>
    </Box>
  );
};

export default OfflineBanner;
