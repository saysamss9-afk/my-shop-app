import React, { useState, useEffect } from 'react';
import {
  Box,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  SearchIcon,
  CloseIcon,
} from '@gluestack-ui/themed';
import { getAppShadow } from '../../../utils/platformStyles';

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const InventorySearch: React.FC<Props> = ({ searchQuery, setSearchQuery }) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [localQuery, setSearchQuery]);

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
  };

  return (
    <Box px="$5" pb="$4">
      <Input variant="outline" size="md" borderRadius={20} bg="$white" borderWidth={0} style={{ ...getAppShadow({ offsetY: 4, radius: 16, color: 'rgba(0,0,0,0.04)' }) }}>
        <InputSlot pl="$4">
          <InputIcon as={SearchIcon} color="$primary600" />
        </InputSlot>
        <InputField
          placeholder="Search name, barcode or SKU..."
          value={localQuery}
          onChangeText={setLocalQuery}
          placeholderTextColor="$text400"
        />
        {localQuery.length > 0 && (
           <InputSlot pr="$4" onPress={handleClear}>
             <Icon as={CloseIcon} />
           </InputSlot>
        )}
      </Input>
    </Box>
  );
};

export default InventorySearch;
