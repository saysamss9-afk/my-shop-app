import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text, Icon } from '@gluestack-ui/themed';

interface SilkyButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  icon?: React.ElementType;
  disabled?: boolean;
  loading?: boolean;
}

const SilkyButton: React.FC<SilkyButtonProps> = ({ children, onPress, style, icon: IconComp, disabled, loading }) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        { alignSelf: 'stretch', opacity: (disabled || loading) ? 0.6 : (pressed ? 0.9 : 1) },
        style
      ]}
    >
      <Box
        px="$4"
        py="$3"
        borderRadius="$xl"
        alignItems="center"
        justifyContent="center"
        style={{
          background: (disabled || loading)
            ? '#CBD5E1'
            : 'linear-gradient(90deg, #8956FF 0%, #FF9BDB 100%)',
          boxShadow: (disabled || loading) ? 'none' : '0 14px 40px rgba(138,79,255,0.18)',
          elevation: 4,
          flexDirection: 'row',
        }}
      >
        {loading ? (
          <Text color="white" fontWeight="$bold">Loading...</Text>
        ) : (
          <>
            {IconComp ? <Icon as={IconComp} color="white" style={{ marginRight: 8 }} /> : null}
            <Text color="white" fontWeight="$bold">
              {children}
            </Text>
          </>
        )}
      </Box>
    </Pressable>
  );
};

export default SilkyButton;
