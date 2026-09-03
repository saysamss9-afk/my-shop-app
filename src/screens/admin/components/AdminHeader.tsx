import React from 'react';
import {
  Box,
  Icon,
  Pressable,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { ArrowLeftIcon, CheckIcon } from '@gluestack-ui/themed';

interface Props {
  viewMode: string;
  onBack: () => void;
  onSignOut: () => void;
}

const AdminHeader: React.FC<Props> = ({ viewMode, onBack, onSignOut }) => {
  return (
    <Box bg="$primary800">
      <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
        <Pressable onPress={onBack} p="$2">
          <Icon as={ArrowLeftIcon} color="white" />
        </Pressable>
        <Appbar.Content
          title="Admin Control"
          titleStyle={{ color: 'white', fontWeight: '900', fontSize: 20 }}
          subtitle={viewMode === 'requests' ? "Registration Queue" : "Network Overview"}
          subtitleStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
        />
        <Pressable onPress={onSignOut} p="$3">
          <Icon as={CheckIcon} color="white" />
        </Pressable>
      </Appbar.Header>
    </Box>
  );
};

export default AdminHeader;
