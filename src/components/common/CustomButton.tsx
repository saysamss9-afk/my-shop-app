import React from 'react';
import type { ViewStyle, TextStyle } from 'react-native';
import { StyleSheet, Platform } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { getAppShadow } from '../../utils/platformStyles';

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
  containedButton: getAppShadow({
    color: 'rgba(0, 0, 0, 0.2)',
    offsetY: 2,
    radius: 8,
    opacity: 0.2
  }) as any,
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
