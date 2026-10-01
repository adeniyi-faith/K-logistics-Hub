import { SvgXml } from 'react-native-svg';

import { colors } from '../theme';
import { IconName, ICONS } from './icons';

export function Icon({
  name,
  size = 20,
  color = colors.navy,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const xml =
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" ` +
    `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}
