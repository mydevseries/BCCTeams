import {
  BrandVariants,
  Theme,
  createDarkTheme,
  createHighContrastTheme,
  createLightTheme,
} from '@fluentui/react-components';

/**
 * 16-step Fluent Brand Ramp generated from BCC Teams Primary Brand Teal (#0E7C86)
 */
export const bccTealRamp: BrandVariants = {
  10: '#041A1D',
  20: '#072B30',
  30: '#0A3C43',
  40: '#0C4E57',
  50: '#0E5F6A',
  60: '#0E6F7C',
  70: '#0E7C86', // Base BCC Brand Color
  80: '#128D98',
  90: '#179EAA',
  100: '#1DAFBD',
  110: '#29C0CD',
  120: '#3DD1DE',
  130: '#5EE0EB',
  140: '#87ECF4',
  150: '#B9F4F9',
  160: '#E6FBFC',
};

export const bccLightTheme: Theme = createLightTheme(bccTealRamp);
export const bccDarkTheme: Theme = createDarkTheme(bccTealRamp);
export const bccHighContrastTheme: Theme = createHighContrastTheme();
