// デザインシステムの基盤となるトークン定義

export const colors = {
  // Primary colors (Green theme for vegetable/natural products)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#16a34a', // Main green
    600: '#15803d',
    700: '#166534',
    800: '#14532d',
    900: '#0f172a',
  },
  
  // Secondary colors (Complementary orange for fruits)
  secondary: {
    50: '#fef7ed',
    100: '#fed7aa',
    200: '#fdba74',
    300: '#fb923c',
    400: '#f97316',
    500: '#ea580c',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Neutral colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  
  // Special colors
  white: '#ffffff',
  black: '#000000',
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const typography = {
  fontFamily: {
    sans: ['Geist', 'system-ui', 'sans-serif'],
    mono: ['Geist Mono', 'Monaco', 'monospace'],
  },
  
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],    // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

// Component variants
export const variants = {
  button: {
    primary: {
      backgroundColor: colors.primary[500],
      color: colors.white,
      '&:hover': {
        backgroundColor: colors.primary[600],
      },
      '&:focus': {
        backgroundColor: colors.primary[600],
        outline: `2px solid ${colors.primary[500]}`,
        outlineOffset: '2px',
      },
      '&:disabled': {
        backgroundColor: colors.gray[300],
        color: colors.gray[500],
        cursor: 'not-allowed',
      },
    },
    secondary: {
      backgroundColor: colors.gray[200],
      color: colors.gray[800],
      '&:hover': {
        backgroundColor: colors.gray[300],
      },
      '&:focus': {
        backgroundColor: colors.gray[300],
        outline: `2px solid ${colors.gray[500]}`,
        outlineOffset: '2px',
      },
      '&:disabled': {
        backgroundColor: colors.gray[100],
        color: colors.gray[400],
        cursor: 'not-allowed',
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary[600],
      border: `1px solid ${colors.primary[300]}`,
      '&:hover': {
        backgroundColor: colors.primary[50],
        borderColor: colors.primary[400],
      },
      '&:focus': {
        backgroundColor: colors.primary[50],
        outline: `2px solid ${colors.primary[500]}`,
        outlineOffset: '2px',
      },
      '&:disabled': {
        borderColor: colors.gray[200],
        color: colors.gray[400],
        cursor: 'not-allowed',
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.gray[600],
      '&:hover': {
        backgroundColor: colors.gray[100],
        color: colors.gray[900],
      },
      '&:focus': {
        backgroundColor: colors.gray[100],
        outline: `2px solid ${colors.gray[500]}`,
        outlineOffset: '2px',
      },
      '&:disabled': {
        color: colors.gray[400],
        cursor: 'not-allowed',
      },
    },
  },
  
  input: {
    default: {
      backgroundColor: colors.white,
      border: `1px solid ${colors.gray[300]}`,
      borderRadius: borderRadius.md,
      color: colors.gray[900],
      '&:focus': {
        outline: `2px solid ${colors.primary[500]}`,
        outlineOffset: '2px',
        borderColor: 'transparent',
      },
      '&:disabled': {
        backgroundColor: colors.gray[50],
        color: colors.gray[500],
        cursor: 'not-allowed',
      },
      '&[aria-invalid="true"]': {
        borderColor: colors.error[500],
        '&:focus': {
          outline: `2px solid ${colors.error[500]}`,
          outlineOffset: '2px',
        },
      },
    },
  },
} as const;

// Animation easing functions
export const easing = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

// Animation durations
export const duration = {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
} as const;