// Pure, React-free helpers for the create/edit wizard form state:
// the form shape, factories, the submit payload builder, and the prefill
// mapper used by the edit page.

import {
  getLayout,
  DEFAULT_VARIANT,
  DEFAULT_ORIENTATION,
  LAYOUTS,
  type VariantId,
  type Orientation,
} from './layouts';
import type { Newspaper, ArticleItem } from './types';

export interface ArticleForm {
  id?: string; // preserved when editing so the API updates the item in place
  title: string;
  content: string;
}

export interface NewspaperFormData {
  variant: VariantId;
  orientation: Orientation;
  brand: string;
  issueDate: string; // free text (D&D calendars differ); '' until useEffect fills today
  estYear: string; // string in the form; -> number | null on submit
  estEra: string;
  mainImage: string; // base64 data URL, pasted http(s) URL, or ''
  mainHeading: string;
  mainContent: string;
  subHeadings: ArticleForm[];
  subSubHeadings: ArticleForm[];
}

export const emptyArticle = (): ArticleForm => ({ title: '', content: '' });

export function createEmptyForm(variant: VariantId = DEFAULT_VARIANT): NewspaperFormData {
  const layout = getLayout(variant);
  return {
    variant,
    orientation: DEFAULT_ORIENTATION,
    brand: '',
    issueDate: '',
    estYear: '',
    estEra: '',
    mainImage: '',
    mainHeading: '',
    mainContent: '',
    subHeadings: Array.from({ length: layout.subCount }, emptyArticle),
    subSubHeadings: Array.from({ length: layout.subSubCount }, emptyArticle),
  };
}

export function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export interface NewspaperPayload {
  variant: VariantId;
  orientation: Orientation;
  brand: string;
  issueDate: string;
  estYear: number | null;
  estEra: string | null;
  mainImage: string | null;
  mainHeading: string;
  mainContent: string;
  subHeadings: ArticleItem[];
  subSubHeadings: ArticleItem[];
}

function cleanItem(a: ArticleForm): ArticleItem {
  return {
    ...(a.id ? { id: a.id } : {}),
    title: a.title.trim(),
    content: a.content.trim(),
  };
}

export function buildPayload(form: NewspaperFormData): NewspaperPayload {
  const yearStr = form.estYear.trim();
  const year = yearStr === '' ? null : Number(yearStr);
  return {
    variant: form.variant,
    orientation: form.orientation,
    brand: form.brand.trim(),
    issueDate: form.issueDate.trim() || formatToday(),
    estYear: year !== null && Number.isFinite(year) ? year : null,
    estEra: form.estEra.trim() || null,
    mainImage: form.mainImage.trim() || null,
    mainHeading: form.mainHeading.trim(),
    mainContent: form.mainContent.trim(),
    subHeadings: form.subHeadings.map(cleanItem),
    subSubHeadings: form.subSubHeadings.map(cleanItem),
  };
}

function inferVariant(subLen: number, subSubLen: number): VariantId {
  return LAYOUTS.find((l) => l.subCount === subLen && l.subSubCount === subSubLen)?.id ?? DEFAULT_VARIANT;
}

// Map an API newspaper into editable form state. Preserves server ids, fills
// missing (older) fields with blanks, and infers the variant from array
// lengths when the API hasn't stored one.
export function fromNewspaper(n: Newspaper): NewspaperFormData {
  const variant = n.variant ?? inferVariant(n.subHeadings?.length ?? 0, n.subSubHeadings?.length ?? 0);
  const layout = getLayout(variant);
  const map = (arr: ArticleItem[] = [], len: number): ArticleForm[] =>
    Array.from({ length: len }, (_, i) => ({
      id: arr[i]?.id,
      title: arr[i]?.title ?? '',
      content: arr[i]?.content ?? '',
    }));
  return {
    variant,
    orientation: n.orientation ?? DEFAULT_ORIENTATION,
    brand: n.brand ?? '',
    issueDate: n.issueDate ?? '',
    estYear: n.estYear != null ? String(n.estYear) : '',
    estEra: n.estEra ?? '',
    mainImage: n.mainImage ?? '',
    mainHeading: n.mainHeading ?? '',
    mainContent: n.mainContent ?? '',
    subHeadings: map(n.subHeadings, layout.subCount),
    subSubHeadings: map(n.subSubHeadings, layout.subSubCount),
  };
}
