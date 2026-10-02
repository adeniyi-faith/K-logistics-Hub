import { useStore } from '../store/AppStore';

const plural = (w: string) => (/[^aeiou]y$/i.test(w) ? `${w.slice(0, -1)}ies` : `${w}s`);
const lower = (w: string) => w.toLowerCase();

/**
 * The app's word for a sale is always "Order". Riders use the business's own word
 * (Business settings → Words we use), e.g. w.Riders "Dispatch riders".
 */
export function wordsFor(words: { sale: string; rider: string }) {
  const sale = 'Order';
  const rider = words.rider || 'Rider';
  return {
    Sale: sale,
    Sales: plural(sale),
    sale: lower(sale),
    sales: lower(plural(sale)),
    Rider: rider,
    Riders: plural(rider),
    rider: lower(rider),
    riders: lower(plural(rider)),
  };
}

export type Words = ReturnType<typeof wordsFor>;

export function useWords(): Words {
  const { state } = useStore();
  return wordsFor(state.settings.words);
}
