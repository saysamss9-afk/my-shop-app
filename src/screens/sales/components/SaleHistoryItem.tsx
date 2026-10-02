import React, { useCallback } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Heading,
  Icon,
  Pressable,
  Center,
} from '@gluestack-ui/themed';
import { RotateCcw } from 'lucide-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAppShadow } from '../../../utils/platformStyles';
import { useTranslation } from 'react-i18next';

interface Props {
  item: any;
  currency: string;
  onRevert: (id: string) => void;
  onPress: (item: any) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const SaleHistoryItem: React.FC<Props> = ({
  item,
  currency,
  onRevert,
  onPress,
  isSelected = false,
  onToggleSelect
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const flexDir = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  const formatDate = (timestamp: number) => {
    const value = Number(timestamp) || 0;
    if (!value) return 'Unknown date';
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Unknown date';
    return (
      date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const totalAmount = Number(item?.totalAmount ?? 0);
  const formattedAmount = totalAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const staffName = item?.staffName || 'Staff';
  const rawId = String(item?.id || '').slice(-8).toUpperCase();
  const saleCode = rawId ? `#${rawId}` : '#SALE';

  const handleCardPress = useCallback(() => {
    if (onPress) onPress(item);
  }, [onPress, item]);

  const handleToggle = useCallback((e: any) => {
    e?.stopPropagation?.();
    if (onToggleSelect && item?.id) {
      onToggleSelect(item.id);
    }
  }, [onToggleSelect, item?.id]);

  const handleRevertPress = useCallback((e: any) => {
    e?.stopPropagation?.();
    if (onRevert && item?.id) {
      onRevert(item.id);
    }
  }, [onRevert, item?.id]);

  return (
    <Pressable
      onPress={handleCardPress}
      bg="$white"
      p="$3.5"
      rounded="$2xl"
      mb="$3"
      borderWidth={1}
      borderColor="$borderLight"
      style={{
        ...getAppShadow({ offsetY: 2, radius: 8, color: 'rgba(0,0,0,0.03)' })
      }}
      sx={{
        ':active': { bg: '$backgroundLight50' }
      }}
    >
      <VStack space="xs">
        {/* Top Header Row: Checkbox + Icon + Sale ID <----> Total Amount */}
        <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
          <HStack space="xs" alignItems="center" flex={1} flexShrink={1} mr="$2" flexDirection={flexDir}>
            {onToggleSelect && (
              <Pressable
                onPress={handleToggle}
                accessibilityLabel="Select sale transaction"
                accessibilityRole="checkbox"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Center
                  w={24}
                  h={24}
                  rounded="$full"
                  borderWidth={2}
                  borderColor={isSelected ? "$primary600" : "$text300"}
                  bg={isSelected ? "$primary600" : "transparent"}
                >
                  {isSelected && <MaterialCommunityIcons name="check" size={14} color="white" />}
                </Center>
              </Pressable>
            )}

            <Center w={32} h={32} rounded="$lg" bg="$primary50" flexShrink={0}>
              <MaterialCommunityIcons name="receipt" size={16} color="#1A237E" />
            </Center>

            <Heading
              size="sm"
              color="$text900"
              fontWeight="$bold"
              numberOfLines={1}
              ellipsizeMode="tail"
              textAlign={textAlign}
              style={{ flexShrink: 1 }}
            >
              {saleCode}
            </Heading>
          </HStack>

          {/* Amount on Top Right */}
          <Box flexShrink={0} alignItems={isRTL ? "flex-start" : "flex-end"}>
            <Text
              size="md"
              fontWeight="$black"
              color={item?.isReverted === 1 ? "$text400" : "$text900"}
              style={item?.isReverted === 1 ? { textDecorationLine: 'line-through' } : {}}
              numberOfLines={1}
            >
              {currency}{formattedAmount}
            </Text>
          </Box>
        </HStack>

        {/* Bottom Details Row: Date & Staff Info <----> Action Button */}
        <HStack
          justifyContent="space-between"
          alignItems="center"
          pt="$2"
          mt="$1"
          borderTopWidth={1}
          borderColor="$backgroundLight100"
          flexDirection={flexDir}
        >
          <VStack flex={1} flexShrink={1} mr="$2" space="2xs">
            <HStack space="xs" alignItems="center" flexDirection={flexDir}>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#888" />
              <Text size="xs" color="$text500" numberOfLines={1} ellipsizeMode="tail" textAlign={textAlign}>
                {formatDate(item?.timestamp)}
              </Text>
            </HStack>

            <HStack space="xs" alignItems="center" flexDirection={flexDir}>
              <MaterialCommunityIcons name="account-tie" size={12} color="#888" />
              <Text size="xs" color="$text600" fontWeight="$medium" numberOfLines={1} ellipsizeMode="tail" textAlign={textAlign}>
                {staffName}
              </Text>
            </HStack>
          </VStack>

          {/* Action Button / Badge on Bottom Right */}
          <Box flexShrink={0}>
            {item?.isReverted === 1 ? (
              <Box bg="$error50" px="$2.5" py="$1" rounded="$md">
                <Text size="2xs" color="$error700" fontWeight="$bold">REVERTED</Text>
              </Box>
            ) : (
              <Pressable
                onPress={handleRevertPress}
                px="$3"
                py="$1.5"
                minHeight={32}
                justifyContent="center"
                bg="$error600"
                rounded="$lg"
                accessibilityLabel="Reverse Transaction"
                accessibilityRole="button"
                style={getAppShadow({ offsetY: 2, radius: 4, color: 'rgba(219,68,85,0.2)' })}
                sx={{
                  ':active': { bg: '$error700' }
                }}
              >
                <HStack space="xs" alignItems="center" flexDirection={flexDir}>
                  <Icon as={RotateCcw} color="$white" size="2xs" />
                  <Text color="$white" size="2xs" fontWeight="$bold">Reverse</Text>
                </HStack>
              </Pressable>
            )}
          </Box>
        </HStack>
      </VStack>
    </Pressable>
  );
};

export default React.memo(SaleHistoryItem, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.currency === nextProps.currency &&
    prevProps.item?.id === nextProps.item?.id &&
    prevProps.item?.totalAmount === nextProps.item?.totalAmount &&
    prevProps.item?.isReverted === nextProps.item?.isReverted &&
    prevProps.item?.timestamp === nextProps.item?.timestamp &&
    prevProps.item?.staffName === nextProps.item?.staffName
  );
});
