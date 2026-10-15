// Single source of truth for the newspaper layout variants and their
// per-region character limits. Consumed by the create/edit wizard (field
// maxLength + counters), the layout picker/preview, and (indirectly) the
// renderer. The API keeps only a minimal variant -> [subCount, subSubCount]
// map for validation; the precise limits below live ONLY here.

export type VariantId = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

export type Orientation = 'portrait' | 'landscape';

export const DEFAULT_ORIENTATION: Orientation = 'landscape';

export interface LayoutLimits {
  mainTitle: number;
  mainBody: number;
  subTitle: number;
  subBody: number;
  subSubTitle: number;
  subSubBody: number;
}

export interface Layout {
  id: VariantId;
  label: string;
  blurb: string;
  subCount: number;
  subSubCount: number;
  limits: LayoutLimits;
}

// Character limits are illustrative — tune to taste. They are the ONLY place
// precise per-region limits are defined.
export const LAYOUTS: Layout[] = [
  {
    id: 'a',
    label: 'Full Feature',
    blurb: 'One main story',
    subCount: 0,
    subSubCount: 0,
    limits: { mainTitle: 90, mainBody: 2600, subTitle: 0, subBody: 0, subSubTitle: 0, subSubBody: 0 },
  },
  {
    id: 'b',
    label: 'Feature + Sidebar',
    blurb: 'Main + 1 sub',
    subCount: 1,
    subSubCount: 0,
    limits: { mainTitle: 85, mainBody: 1800, subTitle: 70, subBody: 1000, subSubTitle: 0, subSubBody: 0 },
  },
  {
    id: 'c',
    label: 'Classic',
    blurb: 'Main + 2 subs',
    subCount: 2,
    subSubCount: 0,
    limits: { mainTitle: 85, mainBody: 1700, subTitle: 60, subBody: 650, subSubTitle: 0, subSubBody: 0 },
  },
  {
    id: 'd',
    label: 'Triple Sidebar',
    blurb: 'Main + 3 subs',
    subCount: 3,
    subSubCount: 0,
    limits: { mainTitle: 85, mainBody: 1700, subTitle: 55, subBody: 420, subSubTitle: 0, subSubBody: 0 },
  },
  {
    id: 'e',
    label: 'Front Page (light)',
    blurb: 'Main + 2 subs + 2 briefs',
    subCount: 2,
    subSubCount: 2,
    limits: { mainTitle: 80, mainBody: 1400, subTitle: 55, subBody: 480, subSubTitle: 40, subSubBody: 220 },
  },
  {
    id: 'f',
    label: 'Front Page',
    blurb: 'Main + 2 subs + 3 briefs',
    subCount: 2,
    subSubCount: 3,
    limits: { mainTitle: 80, mainBody: 1400, subTitle: 55, subBody: 480, subSubTitle: 40, subSubBody: 200 },
  },
];

export const VARIANTS: VariantId[] = LAYOUTS.map((l) => l.id);

export const DEFAULT_VARIANT: VariantId = 'f';

export function getLayout(id: VariantId): Layout {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[LAYOUTS.length - 1];
}

export function articleCount(layout: Layout): number {
  return 1 + layout.subCount + layout.subSubCount;
}
