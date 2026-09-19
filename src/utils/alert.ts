import { Alert, Platform } from 'react-native';

export const displayAlert = (
  title: string,
  message: string,
  buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[]
) => {
  if (Platform.OS === 'web') {
    // Basic implementation for web
    if (buttons && buttons.length > 1) {
      // If there are multiple buttons, we try to use confirm for the first non-cancel button
      const actionButton = buttons.find(b => b.style !== 'cancel');
      if (window.confirm(`${title}\n\n${message}`)) {
        if (actionButton?.onPress) actionButton.onPress();
      } else {
        const cancelButton = buttons.find(b => b.style === 'cancel');
        if (cancelButton?.onPress) cancelButton.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
