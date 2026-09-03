import React from 'react';
import {
  Heading,
  Icon,
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  Pressable,
  Center,
  Text,
  Box,
  CloseIcon,
} from '@gluestack-ui/themed';
import AppIcon from '../../../components/common/AppIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mode: 'UNIT' | 'BULK') => void;
}

const EntryTypeModal: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader borderBottomWidth={0}>
          <Heading size="lg" fontWeight="$black">Choose Entry Type</Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody pb="$6">
          <VStack space="md">
            <Pressable
              onPress={() => onSelect('UNIT')}
            >
              {({ pressed }: any) => (
                <Box
                  p="$4"
                  rounded="$2xl"
                  bg={pressed ? '$backgroundLight100' : '$white'}
                  borderWidth={1}
                  borderColor="$borderLight"
                  style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}
                >
                  <HStack space="md" alignItems="center">
                    <Center w={48} h={48} bg="$primary50" rounded="$xl">
                      <AppIcon name="package" size={24} color="#6E3BE6" />
                    </Center>
                    <VStack flex={1}>
                      <Text fontWeight="$bold" color="$text900">Single Unit Item</Text>
                      <Text size="xs" color="$text500">Retail items sold individually (e.g. 1 can of soda)</Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </Pressable>

            <Pressable
              onPress={() => onSelect('BULK')}
            >
              {({ pressed }: any) => (
                <Box
                  p="$4"
                  rounded="$2xl"
                  bg={pressed ? '$backgroundLight100' : '$white'}
                  borderWidth={1}
                  borderColor="$borderLight"
                  style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}
                >
                  <HStack space="md" alignItems="center">
                    <Center w={48} h={48} bg="$warning50" rounded="$xl">
                      <AppIcon name="layers" size={24} color="#F59E0B" />
                    </Center>
                    <VStack flex={1}>
                      <Text fontWeight="$bold" color="$text900">Carton / Bulk Item</Text>
                      <Text size="xs" color="$text500">Items sold in packs or cartons (e.g. 1 case of soda)</Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </Pressable>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EntryTypeModal;

