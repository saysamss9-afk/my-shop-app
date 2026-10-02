import React, { useEffect } from 'react';
import { Box, VStack, HStack, Text, Center } from '@gluestack-ui/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { ShoppingBag, Loader2, Store, Sparkles } from 'lucide-react-native';

export type ModernLoaderVariant = 'dots' | 'pulse' | 'card' | 'fullScreen' | 'ring';

interface ModernLoaderProps {
  label?: string;
  subLabel?: string;
  variant?: ModernLoaderVariant;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  icon?: 'shopping-bag' | 'store' | 'sparkles' | 'none';
}

const Dot: React.FC<{ delay: number; color?: string; sizePx?: number }> = ({
  delay,
  color = '#2563EB',
  sizePx = 12,
}) => {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.2, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 600, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [delay, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Box
        style={{
          width: sizePx,
          height: sizePx,
          borderRadius: sizePx / 2,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
};

const RotatingRing: React.FC<{ color?: string; sizePx?: number }> = ({
  color = '#2563EB',
  sizePx = 36,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(rotation);
    };
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Loader2 size={sizePx} color={color} />
    </Animated.View>
  );
};

const PulseWave: React.FC<{ color?: string; children?: React.ReactNode }> = ({
  color = '#2563EB',
  children,
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.35, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Box alignItems="center" justifyContent="center" position="relative" w={80} h={80}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: color,
          },
        ]}
      />
      <Box
        w={56}
        h={56}
        rounded="$full"
        bg="$backgroundCard"
        alignItems="center"
        justifyContent="center"
        elevation={2}
        shadowColor="$black"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
      >
        {children || <ShoppingBag size={26} color={color} />}
      </Box>
    </Box>
  );
};

export const ModernLoader: React.FC<ModernLoaderProps> = ({
  label = 'Loading...',
  subLabel,
  variant = 'card',
  color = '#2563EB',
  size = 'md',
  icon = 'shopping-bag',
}) => {
  const dotSize = size === 'sm' ? 8 : size === 'lg' ? 14 : 10;
  const ringSize = size === 'sm' ? 24 : size === 'lg' ? 44 : 32;

  const renderIcon = () => {
    switch (icon) {
      case 'store':
        return <Store size={26} color={color} />;
      case 'sparkles':
        return <Sparkles size={26} color={color} />;
      case 'shopping-bag':
        return <ShoppingBag size={26} color={color} />;
      default:
        return null;
    }
  };

  // 1. Dots Variant
  if (variant === 'dots') {
    return (
      <VStack space="xs" alignItems="center" justifyContent="center" py="$2">
        <HStack space="xs" alignItems="center">
          <Dot delay={0} color={color} sizePx={dotSize} />
          <Dot delay={200} color={color} sizePx={dotSize} />
          <Dot delay={400} color={color} sizePx={dotSize} />
        </HStack>
        {label ? (
          <Text size="xs" color="$text500" fontWeight="$medium" mt="$1">
            {label}
          </Text>
        ) : null}
      </VStack>
    );
  }

  // 2. Ring / Spinner Variant
  if (variant === 'ring') {
    return (
      <VStack space="xs" alignItems="center" justifyContent="center" py="$2">
        <RotatingRing color={color} sizePx={ringSize} />
        {label ? (
          <Text size="xs" color="$text600" fontWeight="$medium" mt="$1">
            {label}
          </Text>
        ) : null}
      </VStack>
    );
  }

  // 3. Pulse Wave Variant
  if (variant === 'pulse') {
    return (
      <VStack space="md" alignItems="center" justifyContent="center" py="$4">
        <PulseWave color={color}>{renderIcon()}</PulseWave>
        <VStack space="xs" alignItems="center">
          {label ? (
            <Text size="sm" color="$text800" fontWeight="$bold">
              {label}
            </Text>
          ) : null}
          {subLabel ? (
            <Text size="xs" color="$text500">
              {subLabel}
            </Text>
          ) : null}
        </VStack>
      </VStack>
    );
  }

  // Content inside Card / FullScreen
  const cardContent = (
    <Box
      bg="$backgroundCard"
      px="$6"
      py="$5"
      rounded="$2xl"
      shadowColor="$black"
      shadowOffset={{ width: 0, height: 4 }}
      shadowOpacity={0.08}
      shadowRadius={12}
      borderWidth={1}
      borderColor="$borderLight100"
      alignItems="center"
      maxWidth={280}
      width="90%"
    >
      <VStack space="md" alignItems="center">
        {icon !== 'none' ? (
          <PulseWave color={color}>{renderIcon()}</PulseWave>
        ) : (
          <RotatingRing color={color} sizePx={36} />
        )}

        <HStack space="xs" alignItems="center" my="$1">
          <Dot delay={0} color={color} sizePx={dotSize} />
          <Dot delay={200} color={color} sizePx={dotSize} />
          <Dot delay={400} color={color} sizePx={dotSize} />
        </HStack>

        <VStack space="xs" alignItems="center">
          {label ? (
            <Text size="sm" color="$text800" fontWeight="$bold" textAlign="center">
              {label}
            </Text>
          ) : null}
          {subLabel ? (
            <Text size="xs" color="$text500" textAlign="center">
              {subLabel}
            </Text>
          ) : null}
        </VStack>
      </VStack>
    </Box>
  );

  // 4. FullScreen Variant
  if (variant === 'fullScreen') {
    return (
      <Center flex={1} bg="$background0" p="$4">
        {cardContent}
      </Center>
    );
  }

  // 5. Default Card Variant
  return (
    <Center flex={1} p="$4">
      {cardContent}
    </Center>
  );
};

export default ModernLoader;
