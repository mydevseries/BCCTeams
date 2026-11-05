import {
  BrandVariants,
  Theme,
  createDarkTheme,
  createHighContrastTheme,
  createLightTheme,
} from '@fluentui/react-components';

/**
 * 16-step Fluent Brand Ramp generated from BCC Teams Primary Brand Violet (#7A3E9D).
 *
 * Distinct original identity:
 * - Does NOT use Microsoft Teams purple (#6264A7, #5B5FC7, #464775).
 * - Warm royal violet hue (~278°), high-contrast accessibility.
 * - WCAG AA compliant across light (#ffffff) and dark (#292929, #1f1f1f) modes.
 */
export const bccVioletRamp: BrandVariants = {
  10: '#1B0A26',
  20: '#260E36',
  30: '#35154B',
  40: '#461D62',
  50: '#562479',
  60: '#682D90',
  70: '#7A3E9D', // Base BCC Brand Violet
  80: '#8B48B2',
  90: '#9E59C7',
  100: '#B875DF', // High contrast on dark backgrounds (>4.5:1 WCAG AA)
  110: '#C78BE7', // Text & links in dark theme (>5.7:1 WCAG AA)
  120: '#D5A2EF', // Hover link in dark theme (>7.0:1 WCAG AA)
  130: '#E2B9F6',
  140: '#EDCEFA',
  150: '#F6E4FC',
  160: '#FAF2FD',
};

// Aliases for compatibility
export const bccBrandRamp: BrandVariants = bccVioletRamp;
export const bccTealRamp: BrandVariants = bccVioletRamp;

export const bccLightTheme: Theme = createLightTheme(bccVioletRamp);

export const bccDarkTheme: Theme = {
  ...createDarkTheme(bccVioletRamp),
  // Ensure readable links, text, and selection in dark mode with >5.7:1 WCAG AA contrast
  colorBrandForeground1: bccVioletRamp[110], // #C78BE7
  colorBrandForeground2: bccVioletRamp[120], // #D5A2EF
  colorBrandForegroundLink: bccVioletRamp[110], // #C78BE7
  colorBrandForegroundLinkHover: bccVioletRamp[120], // #D5A2EF
  colorBrandForegroundLinkPressed: bccVioletRamp[100], // #B875DF
  colorBrandForegroundLinkSelected: bccVioletRamp[110],
  colorNeutralForeground2BrandSelected: bccVioletRamp[110],
  colorNeutralForeground3BrandSelected: bccVioletRamp[110],
  colorCompoundBrandForeground1: bccVioletRamp[110],
  colorCompoundBrandForeground1Hover: bccVioletRamp[120],
};

export const bccHighContrastTheme: Theme = createHighContrastTheme();
