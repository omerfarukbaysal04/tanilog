import React, { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  ActivityIndicator,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

export function LinearGradient({ colors: c, style, children, start, end, pointerEvents, ...rest }: any) {
  const bg = Array.isArray(c) && c.length > 0 ? c[Math.floor(c.length / 2)] : colors.teal500;
  return (
    <View style={[style, { backgroundColor: bg }]} {...rest}>
      {children}
    </View>
  );
}

/* ============================================================================
   SCREEN — Safe area + scroll wrapper with dark background
   ============================================================================ */
export function Screen({
  children,
  scroll = true,
  withOrbs = false,
  onRefresh,
  refreshing = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  withOrbs?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {withOrbs && <FloatingOrbs />}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.teal300}
                colors={[colors.teal300, colors.blue]}
                progressBackgroundColor={colors.navy850}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

/* ============================================================================
   APP LOGO — Consistent brand mark used across auth & landing screens
   ============================================================================ */
export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 48 : size === 'lg' ? 96 : 72;
  const iconSz = size === 'sm' ? 24 : size === 'lg' ? 46 : 34;
  const br = size === 'sm' ? 15 : size === 'lg' ? 28 : 22;
  return (
    <View style={[
      logoStyles.box,
      {
        width: dim, height: dim, borderRadius: br,
        shadowColor: colors.teal500,
        shadowOffset: { width: 0, height: size === 'lg' ? 14 : 8 },
        shadowOpacity: 0.55,
        shadowRadius: size === 'lg' ? 22 : 14,
        elevation: size === 'lg' ? 14 : 8,
      },
    ]}>
      <Ionicons name="medical" color={colors.white} size={iconSz} />
    </View>
  );
}

const logoStyles = StyleSheet.create({
  box: {
    backgroundColor: colors.teal500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
  },
});

/* ============================================================================
   EMPTY STATE — Friendly placeholder for empty lists
   ============================================================================ */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={emptyStyles.container}>
      {icon && <View style={emptyStyles.iconWrap}>{icon}</View>}
      <Text style={emptyStyles.title}>{title}</Text>
      {description ? <Text style={emptyStyles.desc}>{description}</Text> : null}
      {action ? <View style={{ marginTop: 4 }}>{action}</View> : null}
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(15,184,165,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(15,184,165,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  desc: {
    color: colors.navy400,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});

/* ============================================================================
   ERROR STATE — Retry-able error screen
   ============================================================================ */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={errorStyles.container}>
      <View style={errorStyles.iconWrap}>
        <Ionicons name="cloud-offline-outline" color={colors.redLight} size={32} />
      </View>
      <Text style={errorStyles.title}>Bir hata oluştu</Text>
      <Text style={errorStyles.message}>{message}</Text>
      {onRetry ? <AppButton title="Tekrar Dene" variant="secondary" onPress={onRetry} size="sm" /> : null}
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 10,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  message: {
    color: colors.navy400,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
});

/* ============================================================================
   FLOATING ORBS — Decorative animated background blobs
   ============================================================================ */
export function FloatingOrbs() {
  const o1 = useRef(new Animated.Value(0)).current;
  const o2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(o1, { toValue: 1, duration: 4500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(o1, { toValue: 0, duration: 4500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(o2, { toValue: 1, duration: 5500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(o2, { toValue: 0, duration: 5500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }, 1200);
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[orbStyles.orb, { backgroundColor: colors.teal500, top: -80, right: -60, opacity: o1.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.30] }), transform: [{ scale: o1.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }] }]} />
      <Animated.View style={[orbStyles.orb, { backgroundColor: colors.blue, bottom: -100, left: -80, opacity: o2.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.28] }), transform: [{ scale: o2.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.07] }) }] }]} />
      <Animated.View style={[orbStyles.orbSmall, { backgroundColor: colors.purple, top: '40%', left: -40, opacity: o1.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.30] }), transform: [{ scale: o1.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }] }]} />
    </View>
  );
}

const orbStyles = StyleSheet.create({
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  orbSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
});

/* ============================================================================
   GLASS CARD — Translucent card with subtle border + optional gradient sheen
   ============================================================================ */
export function GlassCard({
  children,
  style,
  variant = 'default',
  accent,
}: {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'soft';
  accent?: 'teal' | 'blue' | 'purple' | 'pink' | 'yellow' | 'red';
}) {
  const borderColor =
    accent === 'teal' ? 'rgba(15,184,165,0.3)'
    : accent === 'blue' ? 'rgba(59,130,246,0.3)'
    : accent === 'purple' ? 'rgba(168,85,247,0.3)'
    : accent === 'pink' ? 'rgba(236,72,153,0.3)'
    : accent === 'yellow' ? 'rgba(251,191,36,0.35)'
    : accent === 'red' ? 'rgba(239,68,68,0.3)'
    : 'rgba(159,179,200,0.1)';

  return (
    <View style={[
      styles.glassCard,
      variant === 'elevated' && styles.glassCardElevated,
      variant === 'soft' && styles.glassCardSoft,
      accent ? { borderColor } : null,
      style,
    ]}>
      {accent && (
        <LinearGradient
          colors={['rgba(15,184,165,0.06)', 'rgba(15,184,165,0)']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
}

// Backwards-compatible alias
export const Card = GlassCard;

/* ============================================================================
   TYPOGRAPHY
   ============================================================================ */
export function Title({ children, size = 'lg' }: { children: ReactNode; size?: 'lg' | 'xl' | 'md' }) {
  return (
    <Text style={[
      styles.title,
      size === 'xl' && styles.titleXL,
      size === 'md' && styles.titleMD,
    ]}>{children}</Text>
  );
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

/* ============================================================================
   FIELD — Styled text input with optional left icon
   ============================================================================ */
export function Field(props: TextInputProps & { label?: string; icon?: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      {props.label ? <Label>{props.label}</Label> : null}
      <View style={styles.inputWrap}>
        {props.icon ? <View style={styles.inputIcon}>{props.icon}</View> : null}
        <TextInput
          {...props}
          placeholderTextColor={colors.navy500}
          style={[
            styles.input,
            props.icon ? { paddingLeft: 42 } : null,
            props.multiline ? styles.multiline : null,
            props.style,
          ]}
        />
      </View>
    </View>
  );
}

/* ============================================================================
   APP BUTTON — Gradient primary + variants with press-in spring animation
   ============================================================================ */
export function AppButton({
  title,
  onPress,
  loading,
  variant = 'primary',
  disabled,
  icon,
  size = 'md',
  fullWidth = true,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const aStyle = { transform: [{ scale }] };

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, damping: 12, stiffness: 200, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, damping: 12, stiffness: 200, useNativeDriver: true }).start();
  };

  const isPrimary = variant === 'primary';
  const padV = size === 'sm' ? 10 : size === 'lg' ? 16 : 13;
  const padH = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={[styles.buttonText, size === 'sm' && { fontSize: 13 }, size === 'lg' && { fontSize: 16 }]}>
            {title}
          </Text>
        </View>
      )}
    </>
  );

  if (isPrimary) {
    return (
      <Animated.View style={[aStyle, fullWidth ? { width: '100%' } : null]}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[styles.buttonShadow, (disabled || loading) && { opacity: 0.5 }]}
        >
          <LinearGradient
            colors={['#2dd4bf', '#0fb8a5', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, { paddingVertical: padV, paddingHorizontal: padH }]}
          >
            {content}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[aStyle, fullWidth ? { width: '100%' } : null]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          variant === 'secondary' && styles.secondaryButton,
          variant === 'danger' && styles.dangerButton,
          variant === 'ghost' && styles.ghostButton,
          { paddingVertical: padV, paddingHorizontal: padH },
          (disabled || loading) && { opacity: 0.5 },
        ]}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
   TOGGLE ROW — Label + Switch
   ============================================================================ */
export function ToggleRow({
  label,
  value,
  onValueChange,
  description,
}: {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  description?: string;
}) {
  return (
    <View style={{ gap: 2, paddingVertical: 4 }}>
      <View style={toggleStyles.row}>
        <Text style={toggleStyles.label}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.navy700, true: colors.teal500 }}
          thumbColor={colors.white}
          ios_backgroundColor={colors.navy700}
        />
      </View>
      {description ? <Text style={toggleStyles.description}>{description}</Text> : null}
    </View>
  );
}

/* ============================================================================
   STAT CARD — Color-coded value + label
   ============================================================================ */
export function StatCard({
  icon,
  label,
  value,
  accent = 'teal',
  delay = 0,
}: {
  icon?: ReactNode;
  label: string;
  value: string | number;
  accent?: 'teal' | 'blue' | 'purple' | 'pink' | 'yellow';
  delay?: number;
}) {
  const accentColors = {
    teal: { bg: 'rgba(15,184,165,0.12)', border: 'rgba(15,184,165,0.3)', text: colors.teal300 },
    blue: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: colors.blueLight },
    purple: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', text: '#c084fc' },
    pink: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)', text: '#f472b6' },
    yellow: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fcd34d' },
  }[accent];

  return (
    <FadeIn delay={delay} style={statStyles.card}>
      {icon && (
        <View style={[statStyles.iconBg, { backgroundColor: accentColors.bg, borderColor: accentColors.border }]}>
          {icon}
        </View>
      )}
      <Text style={[statStyles.value, { color: accentColors.text }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </FadeIn>
  );
}

/* ============================================================================
   FADE IN — Wrapper that fades + slides children up on mount
   ============================================================================ */
export function FadeIn({
  children,
  delay = 0,
  style,
  distance = 16,
}: {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
  distance?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/* ============================================================================
   STYLES
   ============================================================================ */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy950,
  },
  content: {
    padding: spacing.page,
    gap: 14,
    minHeight: '100%',
  },
  glassCard: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderColor: 'rgba(159,179,200,0.1)',
    borderWidth: 1,
    borderRadius: radius.xxl,
    padding: 18,
    gap: 12,
    overflow: 'hidden',
  },
  glassCardElevated: {
    backgroundColor: 'rgba(29,59,79,0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  glassCardSoft: {
    backgroundColor: 'rgba(15,184,165,0.05)',
    borderColor: 'rgba(15,184,165,0.15)',
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },
  titleXL: {
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.6,
  },
  titleMD: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  subtitle: {
    color: colors.navy300,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Poppins_400Regular',
  },
  label: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  muted: {
    color: colors.navy400,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  inputWrap: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(159,179,200,0.15)',
    backgroundColor: 'rgba(10,22,34,0.7)',
    color: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: 16,
  },
  buttonShadow: {
    borderRadius: radius.md,
    shadowColor: colors.teal500,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  secondaryButton: {
    backgroundColor: 'rgba(29,59,79,0.7)',
    borderColor: 'rgba(159,179,200,0.15)',
    borderWidth: 1,
  },
  dangerButton: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.4)',
    borderWidth: 1,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(159,179,200,0.15)',
    borderWidth: 1,
  },
  buttonText: {
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
    marginRight: 12,
  },
  description: {
    color: colors.navy400,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Poppins_400Regular',
  },
});

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20,40,58,0.55)',
    borderColor: 'rgba(159,179,200,0.1)',
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: 14,
    gap: 8,
    overflow: 'hidden',
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: -0.5,
  },
  label: {
    color: colors.navy400,
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
  },
});
