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
  ModalFooter,
  VStack,
  HStack,
  Text,
  Divider,
  Button,
  ButtonText,
  CloseIcon,
} from '@gluestack-ui/themed';
import { Wallet } from 'lucide-react-native';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  currency: string;
  onConfirm: () => void;
}

const PaymentModal: React.FC<Props> = ({ isOpen, onClose, total, currency, onConfirm }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent rounded="$3xl">
        <ModalHeader>
          <Heading size="lg">Finalize Sale</Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
            <VStack space="xl" py="$6" alignItems="center">
              <VStack space="xs" alignItems="center">
                  <Text size="sm" color="$text500">Amount Due</Text>
                  <Heading size="3xl" color="$primary800" fontWeight="$black">{currency}{total.toFixed(2)}</Heading>
              </VStack>
              <Divider />
              <HStack space="md" alignItems="center" bg="$backgroundLight50" p="$4" rounded="$xl" w="$full">
                  <Icon as={Wallet} color="$text600" />
                  <Text size="md">Method: <Text fontWeight="$bold">CASH</Text></Text>
              </HStack>
            </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" action="secondary" onPress={onClose} mr="$3" borderRadius="$lg">
            <ButtonText>Back</ButtonText>
          </Button>
          <Button action="primary" onPress={onConfirm} borderRadius="$lg" bg="$primary800">
            <ButtonText fontWeight="$bold">Confirm Transaction</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
