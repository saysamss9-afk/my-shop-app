import React from 'react';
import { ScrollView, StatusBar, useWindowDimensions } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getResponsivePadding } from '../../utils/platformStyles';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  withHeader?: boolean;
  contentContainerStyle?: any;
  backgroundColor?: string;
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  withHeader = false,
  contentContainerStyle,
  backgroundColor,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const horizontalPadding = getResponsivePadding(width, 24);

  const bg = backgroundColor || '#F2EFE9';

  const content = (
    <Box
      flex={1}
      pt={withHeader ? 0 : insets.top}
      pb={insets.bottom}
      style={{
        backgroundColor: bg,
      } as any}
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
        contentContainerStyle={[{ flexGrow: 1, backgroundColor: bg }, contentContainerStyle]}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

export default ScreenWrapper;
