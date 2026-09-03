import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Heading, Button, ButtonText, Center, Icon, VStack } from '@gluestack-ui/themed';
import { AlertTriangle } from 'lucide-react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Here you would typically log to an external service
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Center flex={1} bg="$backgroundLight0" p="$6">
          <VStack space="xl" alignItems="center">
            <Center bg="$error100" p="$4" rounded="$full">
              <Icon as={AlertTriangle} size="xl" color="$error600" />
            </Center>
            <VStack space="xs" alignItems="center">
              <Heading size="xl" textAlign="center">Oops! Something went wrong</Heading>
              <Text size="sm" color="$textLight500" textAlign="center">
                The application encountered an unexpected error.
              </Text>
            </VStack>
            {__DEV__ && (
              <View style={styles.errorContainer}>
                <Text size="xs" color="$error600" fontFamily="$mono">
                  {this.state.error?.toString()}
                </Text>
              </View>
            )}
            <Button
              size="md"
              variant="solid"
              action="primary"
              onPress={this.handleReset}
              rounded="$full"
            >
              <ButtonText>Try Again</ButtonText>
            </Button>
          </VStack>
        </Center>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEB2B2',
    maxWidth: '100%',
  },
});

export default ErrorBoundary;
