export interface ServiceCategorySource {
  name: string;
  category?: string | null;
}

export const CATEGORY_ORDER = ['Hair Cut', 'Beard', 'Packages', 'Care & Styling', 'Color', 'Other'];

const CATEGORY_ALIASES: Record<string, string> = {
  cut: 'Hair Cut',
  haircut: 'Hair Cut',
  hair: 'Hair Cut',
  grooming: 'Beard',
  beard: 'Beard',
  shave: 'Beard',
  combo: 'Packages',
  combos: 'Packages',
  package: 'Packages',
  packages: 'Packages',
  wellness: 'Care & Styling',
  care: 'Care & Styling',
  styling: 'Care & Styling',
  color: 'Color',
  colour: 'Color',
};

function normalizeCategory(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function getServiceCategoryName(service: ServiceCategorySource): string {
  const savedCategory = service.category?.trim();
  if (savedCategory) {
    return CATEGORY_ALIASES[normalizeCategory(savedCategory)] ?? savedCategory;
  }

  const name = service.name.toLowerCase();
  if (name.includes('combo') || name.includes('package')) return 'Packages';
  if (name.includes('beard') || name.includes('shave')) return 'Beard';
  if (name.includes('color') || name.includes('colour') || name.includes('highlight') || name.includes('grey')) return 'Color';
  if (name.includes('facial') || name.includes('wash') || name.includes('style')) return 'Care & Styling';
  if (name.includes('hair') || name.includes('cut') || name.includes('fade')) return 'Hair Cut';

  return 'Other';
}

export function sortCategoryEntries<T>(entries: [string, T][]): [string, T][] {
  return entries.sort(([a], [b]) => {
    const aIndex = CATEGORY_ORDER.indexOf(a);
    const bIndex = CATEGORY_ORDER.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? CATEGORY_ORDER.length : aIndex) -
        (bIndex === -1 ? CATEGORY_ORDER.length : bIndex);
    }
    return a.localeCompare(b);
  });
}
