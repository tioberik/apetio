import palette from './palette.json';

export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  /** Primary brand — teal (§11) */
  primary: string;
  primaryText: string;
  /** "Preko cilja" — amber */
  amber: string;
  /** Voda — sky */
  sky: string;
  /** Suplementi — violet */
  violet: string;
}

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    ...palette.light,
    primary: palette.brand.primary,
    primaryText: '#ffffff',
    amber: palette.brand.amber,
    sky: palette.brand.sky,
    violet: palette.brand.violet,
  },
  dark: {
    ...palette.dark,
    primary: palette.brand.primaryDark,
    primaryText: '#042f2a',
    amber: palette.brand.amberDark,
    sky: palette.brand.skyDark,
    violet: palette.brand.violetDark,
  },
};
