import React from 'react';
import {
  Box,
  Icon,
  Pressable,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { LogOut, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  viewMode: string;
  onBack: () => void;
  onSignOut: () => void;
}

const AdminHeader: React.FC<Props> = ({ viewMode, onBack, onSignOut }) => {
  const insets = useSafeAreaInsets();
  return (
    <Box bg="$primary800" pt={insets.top}>
      <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
        <Pressable onPress={onBack} p="$2.5" bg="rgba(255,255,255,0.15)" rounded="$full" ml="$2">
          <ArrowLeft size={22} color="#ffffff" />
        </Pressable>
        <Appbar.Content
          title="Admin Control"
          titleStyle={{ color: 'white', fontWeight: '900', fontSize: 20 }}
          subtitle={viewMode === 'requests' ? "Registration Queue" : "Network Overview"}
          subtitleStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
        />
        <Pressable onPress={onSignOut} p="$3">
          <Icon as={LogOut} color="white" size="sm" />
        </Pressable>
      </Appbar.Header>
    </Box>
  );
};

export default AdminHeader;
