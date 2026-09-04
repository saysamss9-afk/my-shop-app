import React from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getResponsivePadding } from '../../utils/platformStyles';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  withHeader?: boolean;
  contentContainerStyle?: any;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  withHeader = false,
  contentContainerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const horizontalPadding = getResponsivePadding(24);

  const content = (
    <Box
      flex={1}
      pt={withHeader ? 0 : insets.top}
      pb={insets.bottom}
      bg="$surfaceLavender"
      style={{
        background: 'linear-gradient(180deg, #F3ECFF 0%, #E7DBFF 100%)',
      }}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <Box flex={1} px={horizontalPadding} pt="$4">
        {children}
      </Box>
    </Box>
  );

  if (scrollable) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        nestedScrollEnabled
        contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

export default ScreenWrapper;
