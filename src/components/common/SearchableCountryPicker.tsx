import React, { useState, useMemo } from 'react';
import { Modal, FlatList, Platform } from 'react-native';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  Pressable,
  CloseIcon,
  Icon,
  Heading,
  Button,
  ButtonIcon,
} from '@gluestack-ui/themed';
import { Search } from 'lucide-react-native';
import { ALL_COUNTRY_NAMES } from '../../utils/geoData';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (country: string) => void;
  selectedCountry?: string;
}

const SearchableCountryPicker: React.FC<Props> = ({ isOpen, onClose, onSelect, selectedCountry }) => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const isRTL = i18n.language === 'ar';
  const textAlign = isRTL ? 'right' : 'left';
  const flexDir = isRTL ? 'row-reverse' : 'row';

  const filteredCountries = useMemo(() => {
    return ALL_COUNTRY_NAMES.filter(name =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const renderItem = ({ item }: { item: string }) => (
    <Pressable
      onPress={() => {
        onSelect(item);
        setSearchQuery('');
        onClose();
      }}
      p="$4"
      borderBottomWidth={1}
      borderBottomColor="$borderLight"
      bg={selectedCountry === item ? '$primary50' : 'transparent'}
    >
      <Text size="md" color={selectedCountry === item ? '$primary700' : '$text900'} textAlign={textAlign}>
        {item}
      </Text>
    </Pressable>
  );

  return (
    <Modal
      visible={isOpen}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <Box flex={1} bg="rgba(0,0,0,0.5)" justifyContent="flex-end">
        <Box
          bg="$white"
          h="80%"
          borderTopLeftRadius={32}
          borderTopRightRadius={32}
          p="$6"
        >
          <VStack space="lg" flex={1}>
            <HStack justifyContent="space-between" alignItems="center" flexDirection={flexDir}>
              <Heading size="lg">{t('auth.select_country')}</Heading>
              <Pressable onPress={onClose} p="$2">
                <Icon as={CloseIcon} size="lg" />
              </Pressable>
            </HStack>

            <Input variant="outline" size="md" borderRadius={12} flexDirection={flexDir}>
              <InputSlot pl="$3">
                <Icon as={Search} size="sm" />
              </InputSlot>
              <InputField
                placeholder={t('common.search_placeholder') || "Search country..."}
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign={textAlign}
              />
            </Input>

            <FlatList
              data={filteredCountries}
              renderItem={renderItem}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
            />
          </VStack>
        </Box>
      </Box>
    </Modal>
  );
};

export default SearchableCountryPicker;
