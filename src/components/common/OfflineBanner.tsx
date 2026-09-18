import React, { useEffect, useState } from 'react';
import { Box, HStack, Text, Icon } from '@gluestack-ui/themed';
import { WifiOff } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(state.isConnected === false);
    });

    return () => {
      unsubscribe();
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
