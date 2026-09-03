import React from 'react';
import {
  Box,
  Icon,
  Pressable,
} from '@gluestack-ui/themed';
import { Appbar } from 'react-native-paper';
import { RefreshCw } from 'lucide-react-native';

interface Props {
  onBack: () => void;
  onRefresh: () => void;
}

const AnalyticsHeader: React.FC<Props> = ({ onBack, onRefresh }) => {
  return (
    <Box bg="$primary800">
      <Appbar.Header style={{ backgroundColor: 'transparent', elevation: 0 }}>
        <Appbar.BackAction color="white" onPress={onBack} />
        <Appbar.Content
          title="Business Intelligence"
          titleStyle={{ color: 'white', fontWeight: '900', fontSize: 20 }}
        />
        <Pressable onPress={onRefresh} p="$3">
          <Icon as={RefreshCw} color="white" size="sm" />
        </Pressable>
      </Appbar.Header>
    </Box>
  );
};

export default AnalyticsHeader;
