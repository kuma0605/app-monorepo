import type {TextStyle} from 'react-native';

export const Typography = {
  h1: {fontSize: 34, fontWeight: '700' as const, lineHeight: 41},
  h2: {fontSize: 28, fontWeight: '700' as const, lineHeight: 34},
  h3: {fontSize: 22, fontWeight: '600' as const, lineHeight: 28},
  h4: {fontSize: 20, fontWeight: '600' as const, lineHeight: 25},
  body1: {fontSize: 17, fontWeight: '400' as const, lineHeight: 22},
  body2: {fontSize: 15, fontWeight: '400' as const, lineHeight: 20},
  caption: {fontSize: 12, fontWeight: '400' as const, lineHeight: 16},
  button: {fontSize: 17, fontWeight: '600' as const, lineHeight: 22},
} satisfies Record<string, TextStyle>;
