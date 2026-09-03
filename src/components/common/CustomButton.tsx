import React from 'react';
import { StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

interface CustomButtonProps {
  onPress: () => void;
  title: string;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  color?: string;
  textColor?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  title,
  mode = 'contained',
  loading = false,
  disabled = false,
  icon,
  style,
  labelStyle,
  color,
  textColor,
}) => {
  const theme = useTheme();

  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      buttonColor={color || (mode === 'contained' ? theme.colors.primary : undefined)}
      textColor={textColor || (mode === 'contained' ? 'white' : theme.colors.primary)}
      contentStyle={styles.content}
      style={[
        styles.button,
        mode === 'contained' && styles.containedButton,
        style
      ]}
      labelStyle={[styles.label, labelStyle]}
    >
      {title}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
    borderRadius: 12,
  },
  containedButton: Platform.OS === 'web'
    ? {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      }
    : {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
  content: {
    height: 48,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'none',
  },
});

export default CustomButton;
