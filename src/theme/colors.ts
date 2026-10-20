/**
 * Light theme tokens from Rep App Prototype (3) (1).html
 * --color-bg / surface / text / accent / neutrals / accents
 */
export const Colors = {
  /** --color-accent */
  primary: '#6A5DC0',
  /** --color-accent-800 */
  primaryLight: '#E7E5FE',
  /** --color-accent-500 */
  primaryMuted: '#968AE0',
  /** --color-accent-2 */
  accent: '#7972A9',
  /** --color-accent-900 */
  accentSoft: '#F5F4FF',
  /** --color-accent-700 */
  accentSoft2: '#D2CEFD',
  /** --color-accent-300 (inverted scale: darker purple) */
  accentDeep: '#5D5294',
  /** --color-accent-100 */
  accentInk: '#2B2741',

  /** --color-bg */
  background: '#F4F5FA',
  /** --color-surface */
  surface: '#FCFCFF',
  /** --color-neutral-900 / accent-900 soft */
  surfaceMuted: '#F3F5FE',

  /** --color-text / neutral-100 */
  textPrimary: '#292B31',
  /** --color-neutral-300 */
  textSecondary: '#595D6C',
  /** --color-neutral-400 */
  textMuted: '#75798C',
  /** --color-neutral-500 */
  textPlaceholder: '#9397AB',

  /** --color-neutral-800 / divider */
  border: '#E4E7F5',
  borderLight: '#E4E7F5',
  /** --color-neutral-700 */
  borderMuted: '#CFD3E5',

  statusActive: '#6A5DC0',
  statusActiveText: '#6A5DC0',
  statusActiveBg: '#E7E5FE',
  statusInProgress: '#796CBF',
  statusInProgressBg: '#E7E5FE',
  statusOpen: '#6A5DC0',
  statusOpenBg: '#FCFCFF',
  statusClosed: '#75798C',
  statusClosedBg: '#F3F5FE',
  statusLapsed: '#6A5DC0',
  statusLapsedBg: '#FCFCFF',
  statusResigned: '#75798C',
  statusResignedBg: '#F3F5FE',

  liveBadge: '#E7E5FE',
  liveBadgeText: '#2B2741',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  tabBar: '#FCFCFF',
  tabBarActive: '#6A5DC0',
  tabBarInactive: '#9397AB',
  tabBarBorder: '#E4E7F5',

  /** Splash / dark brand surfaces from prototype */
  splashBase: '#2B2741',
  splashMid: '#5D5294',
  splashGlow: '#968AE0',
};

/** Border radii from prototype --radius-* */
export const Radii = {
  sm: 4,
  md: 8,
  lg: 14,
  xl: 28,
  pill: 999,
} as const;

/** Soft shadows approximating --shadow-sm/md */
export const Shadows = {
  sm: {
    shadowColor: '#292B31',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 0,
    borderWidth: 1,
    borderColor: '#E4E7F5',
    elevation: 1,
  },
  md: {
    shadowColor: '#292B31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E7F5',
    elevation: 3,
  },
} as const;
