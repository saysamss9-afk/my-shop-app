import React from 'react';
import {
  Box,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  CloseIcon,
} from '@gluestack-ui/themed';
import { platformShadow } from '../../../utils/platformStyles';

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const InventorySearch: React.FC<Props> = ({ searchQuery, setSearchQuery }) => {
  return (
    <Box px="$5" pb="$4">
      <Input variant="outline" size="md" borderRadius={20} bg="$white" borderWidth={0} style={{ ...platformShadow({ offsetY: 4, radius: 16, color: 'rgba(0,0,0,0.04)' }) }}>
        <InputSlot pl="$4">
          <InputIcon as={SearchIcon} color="$primary600" />
        </InputSlot>
        <InputField
          placeholder="Search name, barcode or SKU..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="$text400"
        />
        {searchQuery.length > 0 && (
           <InputSlot pr="$4" onPress={() => setSearchQuery('')}>
             <InputIcon as={CloseIcon} />
           </InputSlot>
        )}
      </Input>
    </Box>
  );
};

export default InventorySearch;
