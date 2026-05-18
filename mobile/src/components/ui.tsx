import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Field(props: TextInputProps & { label?: string }) {
  return (
    <View style={{ gap: 8 }}>
      {props.label ? <Label>{props.label}</Label> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.navy400}
        style={[styles.input, props.multiline ? styles.multiline : null, props.style]}
      />
    </View>
  );
}

export function AppButton({
  title,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'danger' && styles.dangerButton,
        (disabled || loading) && styles.disabledButton,
      ]}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy950,
  },
  content: {
    flex: 1,
    padding: spacing.page,
    gap: 16,
  },
  card: {
    backgroundColor: colors.navy850,
    borderColor: colors.navy700,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
  },
  label: {
    color: colors.navy300,
    fontSize: 13,
    fontWeight: '700',
  },
  muted: {
    color: colors.navy400,
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.navy700,
    backgroundColor: colors.navy900,
    color: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.teal500,
    paddingHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: colors.navy800,
    borderColor: colors.navy700,
    borderWidth: 1,
  },
  dangerButton: {
    backgroundColor: colors.red,
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '800',
  },
});
