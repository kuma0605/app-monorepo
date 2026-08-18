export * from './colors';
export * from './spacing';
export * from './typography';

import {LightColors} from './colors';
import {Spacing, BorderRadius} from './spacing';
import {Typography} from './typography';

export interface Theme {
  colors: typeof LightColors;
  isDark: boolean;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  typography: typeof Typography;
}
