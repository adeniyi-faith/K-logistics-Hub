import { IconName } from '../components/icons';
import { Frequency, FREQUENCIES } from '../data/types';

/** The picture shown next to each expense category. */
export function categoryIcon(category: string): IconName {
  return (
    (
      {
        Fuel: 'fuel',
        'Staff pay': 'users',
        Transport: 'truck',
        'Bike care': 'bike',
        Repairs: 'wrench',
        Packaging: 'box',
      } as Record<string, IconName>
    )[category] ?? 'tag'
  );
}

export function frequencyLabel(f: Frequency): string {
  return FREQUENCIES.find((x) => x.value === f)?.label ?? '';
}
