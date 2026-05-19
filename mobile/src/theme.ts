export const colors = {
  // Navy (backgrounds, surfaces)
  navy950: '#0a1622',
  navy900: '#0e1d2c',
  navy850: '#14283a',
  navy800: '#1d3b4f',
  navy700: '#243b53',
  navy600: '#334e68',
  navy500: '#486581',
  navy400: '#9fb3c8',
  navy300: '#bcccdc',
  navy200: '#d9e2ec',
  navy100: '#f0f4f8',

  // Teal (primary brand)
  teal700: '#0d9488',
  teal600: '#0d9c8d',
  teal500: '#0fb8a5',
  teal400: '#2dd4bf',
  teal300: '#5eead4',
  teal200: '#99f6e4',

  // Accent colors
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4',
  yellow: '#fbbf24',
  red: '#ef4444',
  redLight: '#f87171',
  green: '#10b981',
  white: '#ffffff',
};

// Semantic color tokens for status / category badges
export const accentPalettes = {
  teal: { bg: 'rgba(15, 184, 165, 0.12)', border: 'rgba(15, 184, 165, 0.3)', text: colors.teal300, solid: colors.teal500 },
  blue: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', text: colors.blueLight, solid: colors.blue },
  purple: { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc', solid: colors.purple },
  pink: { bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)', text: '#f472b6', solid: colors.pink },
  yellow: { bg: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.3)', text: '#fcd34d', solid: colors.yellow },
  red: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: colors.redLight, solid: colors.red },
  cyan: { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', text: '#22d3ee', solid: colors.cyan },
};

export const gradients = {
  primary: ['#2dd4bf', '#0fb8a5', '#0d9488'] as const,
  primarySoft: ['#5eead4', '#2dd4bf'] as const,
  cool: ['#0fb8a5', '#06b6d4', '#3b82f6'] as const,
  vibrant: ['#0fb8a5', '#3b82f6', '#a855f7'] as const,
  heroBg: ['#0e1d2c', '#14283a', '#0e1d2c'] as const,
  cardSheen: ['rgba(15,184,165,0.08)', 'rgba(15,184,165,0)'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  page: 18,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
};

export const shadows = {
  teal: {
    shadowColor: colors.teal500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: {
    shadowColor: colors.teal400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 6,
  },
};
