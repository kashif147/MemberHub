import { Text, TextInput, StyleSheet } from 'react-native';

/**
 * Inter — same family as Rep App Prototype (--font-heading / --font-body).
 * Linked from assets/fonts via react-native.config.js.
 */
export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

/** Prototype heading weight is 500 */
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
};

export const Typography = StyleSheet.create({
  h1: {
    fontFamily: FontFamily.medium,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.45,
  },
  h2: {
    fontFamily: FontFamily.medium,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 20,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  kicker: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
  button: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
  },
});

/**
 * Apply Inter as the default Text / TextInput face app-wide.
 * Call once from App.tsx before rendering.
 */
export function applyGlobalTypography() {
  const base = { fontFamily: FontFamily.regular };

  // React Native still honors defaultProps for Text/TextInput styles.
  const TextAny = Text as typeof Text & {
    defaultProps?: { style?: unknown; allowFontScaling?: boolean };
  };
  const InputAny = TextInput as typeof TextInput & {
    defaultProps?: { style?: unknown; allowFontScaling?: boolean };
  };

  const prevText = TextAny.defaultProps?.style;
  TextAny.defaultProps = {
    ...(TextAny.defaultProps || {}),
    style: prevText ? [base, prevText] : base,
    allowFontScaling: true,
  };

  const prevInput = InputAny.defaultProps?.style;
  InputAny.defaultProps = {
    ...(InputAny.defaultProps || {}),
    style: prevInput ? [base, prevInput] : base,
    allowFontScaling: true,
  };
}
