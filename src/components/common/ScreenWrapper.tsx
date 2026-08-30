import React from 'react';
import { ScrollView, StatusBar, Platform } from 'react-native';
import { Box } from '@gluestack-ui/themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const content = (
    <Box
      flex={1}
      pt={withHeader ? 0 : insets.top}
      pb={insets.bottom}
      bg="$backgroundLight50"
    >
      <StatusBar
        barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </Box>
  );

  if (scrollable) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

export default ScreenWrapper;
