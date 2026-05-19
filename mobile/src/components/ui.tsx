import React, { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  Easing,
  Image,
  Modal,
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
const LOGO_IMG = require('../../assets/logo-white-text.png');

export function AppLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const width = size === 'sm' ? 110 : size === 'lg' ? 200 : 150;
  const height = size === 'sm' ? 36 : size === 'lg' ? 66 : 50;
  return (
    <Image
      source={LOGO_IMG}
      style={{ width, height, resizeMode: 'contain' }}
    />
  );
}

/* ============================================================================
   PREMIUM GATE — Standard "premium required" card with bullets + upgrade CTA
   ============================================================================ */
export function PremiumGate({
  title,
  description,
  bullets,
  icon = 'star',
}: {
  title: string;
  description: string;
  bullets?: string[];
  icon?: string;
}) {
  const { Ionicons } = require('@expo/vector-icons');
  const router = require('expo-router').router;
  return (
    <GlassCard accent="yellow">
      <View style={{ alignItems: 'center', gap: 6 }}>
        <View style={pgStyles.iconBox}>
          <Ionicons name={icon} color={colors.yellow} size={28} />
        </View>
        <Text style={pgStyles.title}>{title}</Text>
        <View style={pgStyles.premiumBadge}>
          <Ionicons name="star" color={colors.yellow} size={11} />
          <Text style={pgStyles.premiumText}>Premium Özellik</Text>
        </View>
      </View>
      <Text style={pgStyles.desc}>{description}</Text>
      {bullets && bullets.length > 0 && (
        <View style={{ gap: 6, marginTop: 4 }}>
          {bullets.map((b, i) => (
            <View key={i} style={pgStyles.bulletRow}>
              <Ionicons name="checkmark-circle" color={colors.teal300} size={16} />
              <Text style={pgStyles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}
      <AppButton
        title="Premium'a Geç"
        onPress={() => router.push('/billing')}
        icon={<Ionicons name="sparkles-outline" color={colors.white} size={18} />}
      />
    </GlassCard>
  );
}

const pgStyles = StyleSheet.create({
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: 'rgba(251,191,36,0.4)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    color: colors.yellow,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  desc: {
    color: colors.navy300,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 19,
    textAlign: 'center',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    color: colors.navy200,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
    lineHeight: 18,
  },
});

/* ============================================================================
   PREMIUM PROMO BANNER — Compact CTA banner for free users on non-gated screens
   ============================================================================ */
export function PremiumPromo({
  text = 'Premium ile sınırsız AI, sınırsız belge ve aile takibi',
}: { text?: string }) {
  const { Ionicons } = require('@expo/vector-icons');
  const router = require('expo-router').router;
  return (
    <View style={promoStyles.banner}>
      <View style={promoStyles.iconWrap}>
        <Ionicons name="sparkles" color={colors.yellow} size={16} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={promoStyles.title}>Premium'a Geç</Text>
        <Text style={promoStyles.desc} numberOfLines={2}>{text}</Text>
      </View>
      <View
        onTouchEnd={() => router.push('/billing')}
        style={promoStyles.cta}
      >
        <Text style={promoStyles.ctaText}>Yükselt</Text>
      </View>
    </View>
  );
}

const promoStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(251,191,36,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    borderRadius: 16,
    padding: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.yellow,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  desc: {
    color: colors.navy300,
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 15,
  },
  cta: {
    backgroundColor: colors.yellow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaText: {
    color: '#1f1300',
    fontSize: 12,
    fontFamily: 'Poppins_800ExtraBold',
  },
});

/* ============================================================================
   USAGE LIMIT BAR — Shows daily usage with progress and upgrade CTA
   ============================================================================ */
export function UsageLimitBar({
  label,
  used,
  total,
  isPremium,
}: {
  label: string;
  used: number;
  total: number;
  isPremium?: boolean;
}) {
  const { Ionicons } = require('@expo/vector-icons');
  if (isPremium) {
    return (
      <View style={usageStyles.row}>
        <View style={usageStyles.iconBg}>
          <Ionicons name="infinite" color={colors.teal300} size={14} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={usageStyles.label}>{label}</Text>
          <Text style={usageStyles.value}>Sınırsız (Premium)</Text>
        </View>
      </View>
    );
  }
  const remaining = Math.max(0, total - used);
  const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const isFull = remaining === 0;
  return (
    <View style={usageStyles.row}>
      <View style={[usageStyles.iconBg, isFull && { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.3)' }]}>
        <Ionicons name={isFull ? 'lock-closed' : 'flash'} color={isFull ? colors.red : colors.yellow} size={14} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={usageStyles.label}>{label}</Text>
          <Text style={[usageStyles.value, isFull && { color: colors.redLight }]}>{used}/{total}</Text>
        </View>
        <View style={usageStyles.track}>
          <View style={[usageStyles.fill, { width: `${percent}%` }, isFull && { backgroundColor: colors.red }]} />
        </View>
      </View>
    </View>
  );
}

const usageStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  iconBg: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.navy200,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  value: {
    color: colors.teal300,
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(159,179,200,0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.yellow,
    borderRadius: 3,
  },
});

/* ============================================================================
   RENAME PROMPT — Modal dialog for renaming items
   ============================================================================ */
export function RenamePrompt({
  visible,
  currentName,
  onClose,
  onSubmit,
  title = 'Yeniden Adlandır',
  placeholder = 'Yeni ad',
}: {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void> | void;
  title?: string;
  placeholder?: string;
}) {
  const [value, setValueLocal] = useState(currentName);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setValueLocal(currentName); }, [currentName, visible]);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setBusy(true);
    try {
      await onSubmit(value.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={renameStyles.overlay}>
        <View style={renameStyles.box}>
          <Text style={renameStyles.title}>{title}</Text>
          <TextInput
            value={value}
            onChangeText={setValueLocal}
            placeholder={placeholder}
            placeholderTextColor={colors.navy500}
            style={renameStyles.input}
            autoFocus
            selectTextOnFocus
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppButton title="İptal" variant="secondary" onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton title="Kaydet" onPress={handleSubmit} loading={busy} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const renameStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    backgroundColor: colors.navy900,
    borderColor: 'rgba(159,179,200,0.15)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  input: {
    backgroundColor: 'rgba(10,22,34,0.7)',
    borderColor: 'rgba(159,179,200,0.15)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    minHeight: 48,
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
