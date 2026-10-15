// Browser-side persistence for newspapers, backed by localStorage. This is the
// single source of truth for stored papers now that there is no API server:
// the create/edit/view/home pages all go through these functions. The id/date
// generation and the per-variant validation that used to live in the Express
// app (apps/api) were ported here verbatim so bad data still can't be saved.

import type { NewspaperPayload } from './newspaperForm';
import type { Newspaper, ArticleItem, VariantId, Orientation } from './types';

const STORAGE_KEY = 'dnd-newspapers';

// variant -> [subHeadings count, subSubHeadings count]. Precise per-region CHAR
// LIMITS live in ./layouts.ts — this stays minimal, matching the old API map.
const VARIANT_COUNTS: Record<VariantId, [number, number]> = {
  a: [0, 0],
  b: [1, 0],
  c: [2, 0],
  d: [3, 0],
  e: [2, 2],
  f: [2, 3],
};

const MAIN_IMAGE_MAX = 5 * 1024 * 1024; // ~5MB string cap; bounds localStorage growth

const isVariant = (v: unknown): v is VariantId =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(VARIANT_COUNTS, v);

const isOrientation = (o: unknown): o is Orientation => o === 'portrait' || o === 'landscape';

/** Validates that an item has non-empty 'title' and 'content' strings; allows an optional 'id' string. */
function isValidArticleItem(item: unknown): item is ArticleItem {
  if (!item || typeof item !== 'object') return false;
  const { id, title, content } = item as Record<string, unknown>;
  return (
    (id === undefined || typeof id === 'string') &&
    typeof title === 'string' &&
    title.trim().length > 0 &&
    typeof content === 'string' &&
    content.trim().length > 0
  );
}

function todayIssueDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts where crypto.randomUUID is unavailable.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- localStorage access (guarded: SSR has no window; private mode/quota can throw) ---

function readAll(): Newspaper[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Newspaper[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Newspaper[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Most likely QuotaExceededError: base64 images can exceed the ~5MB origin
    // limit quickly. Surface it so the wizard can show a real message.
    throw new Error('Could not save — browser storage is full (large images can exceed the limit).');
  }
}

// --- Public API ---

export function listNewspapers(): Newspaper[] {
  return readAll();
}

export function getNewspaper(id: string): Newspaper | null {
  return readAll().find((n) => n.id === id) ?? null;
}

export function createNewspaper(input: NewspaperPayload): Newspaper {
  const v: VariantId = input.variant === undefined ? 'f' : input.variant; // legacy default
  if (!isVariant(v)) throw new Error('Invalid field: variant (expected a–f)');
  const [subCount, subSubCount] = VARIANT_COUNTS[v];

  const orient: Orientation = input.orientation === undefined ? 'landscape' : input.orientation;
  if (!isOrientation(orient)) throw new Error('Invalid field: orientation (portrait|landscape)');

  if (typeof input.brand !== 'string' || !input.brand.trim()) {
    throw new Error('Missing or invalid field: brand');
  }
  if (typeof input.mainHeading !== 'string' || !input.mainHeading.trim()) {
    throw new Error('Missing or invalid field: mainHeading');
  }
  if (typeof input.mainContent !== 'string' || !input.mainContent.trim()) {
    throw new Error('Missing or invalid field: mainContent');
  }
  if (input.estYear != null && (typeof input.estYear !== 'number' || !Number.isFinite(input.estYear))) {
    throw new Error('Invalid field: estYear');
  }
  if (input.estEra != null && typeof input.estEra !== 'string') {
    throw new Error('Invalid field: estEra');
  }
  if (input.mainImage != null && (typeof input.mainImage !== 'string' || input.mainImage.length > MAIN_IMAGE_MAX)) {
    throw new Error('Invalid field: mainImage');
  }
  if (!Array.isArray(input.subHeadings) || input.subHeadings.length !== subCount || !input.subHeadings.every(isValidArticleItem)) {
    throw new Error(`subHeadings must be exactly ${subCount} valid item(s) for variant ${v}`);
  }
  if (!Array.isArray(input.subSubHeadings) || input.subSubHeadings.length !== subSubCount || !input.subSubHeadings.every(isValidArticleItem)) {
    throw new Error(`subSubHeadings must be exactly ${subSubCount} valid item(s) for variant ${v}`);
  }

  const newspaper: Newspaper = {
    id: newId(),
    brand: input.brand.trim(),
    variant: v,
    orientation: orient,
    issueDate: typeof input.issueDate === 'string' && input.issueDate.trim() ? input.issueDate.trim() : todayIssueDate(),
    mainHeading: input.mainHeading.trim(),
    mainContent: input.mainContent.trim(),
    subHeadings: input.subHeadings.map((h) => ({ id: newId(), title: h.title.trim(), content: h.content.trim() })),
    subSubHeadings: input.subSubHeadings.map((h) => ({ id: newId(), title: h.title.trim(), content: h.content.trim() })),
    createdAt: new Date().toISOString(),
    ...(input.estYear != null && { estYear: input.estYear }),
    ...(input.estEra != null && input.estEra.trim() !== '' && { estEra: input.estEra.trim() }),
    ...(input.mainImage != null && input.mainImage.trim() !== '' && { mainImage: input.mainImage.trim() }),
  };

  const list = readAll();
  list.push(newspaper);
  writeAll(list);
  return newspaper;
}

export function updateNewspaper(id: string, input: Partial<NewspaperPayload>): Newspaper {
  const list = readAll();
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('Not found');
  const existing = list[idx];

  const { brand, mainHeading, mainContent, subHeadings, subSubHeadings, variant, orientation, issueDate, estYear, estEra, mainImage } =
    input;

  if (orientation !== undefined && !isOrientation(orientation)) {
    throw new Error('Invalid field: orientation (portrait|landscape)');
  }

  let effectiveVariant: VariantId = existing.variant ?? 'f';
  if (variant !== undefined) {
    if (!isVariant(variant)) throw new Error('Invalid field: variant (expected a–f)');
    effectiveVariant = variant;
  }
  const [subCount, subSubCount] = VARIANT_COUNTS[effectiveVariant];

  if (brand !== undefined && (typeof brand !== 'string' || !brand.trim())) {
    throw new Error('Missing or invalid field: brand');
  }
  if (mainHeading !== undefined && (typeof mainHeading !== 'string' || !mainHeading.trim())) {
    throw new Error('Missing or invalid field: mainHeading');
  }
  if (mainContent !== undefined && (typeof mainContent !== 'string' || !mainContent.trim())) {
    throw new Error('Missing or invalid field: mainContent');
  }
  if (issueDate !== undefined && typeof issueDate !== 'string') {
    throw new Error('Invalid field: issueDate');
  }
  if (estYear != null && (typeof estYear !== 'number' || !Number.isFinite(estYear))) {
    throw new Error('Invalid field: estYear');
  }
  if (estEra != null && typeof estEra !== 'string') {
    throw new Error('Invalid field: estEra');
  }
  if (mainImage != null && (typeof mainImage !== 'string' || mainImage.length > MAIN_IMAGE_MAX)) {
    throw new Error('Invalid field: mainImage');
  }
  if (subHeadings !== undefined && (!Array.isArray(subHeadings) || subHeadings.length !== subCount || !subHeadings.every(isValidArticleItem))) {
    throw new Error(`subHeadings must be exactly ${subCount} valid item(s) for variant ${effectiveVariant}`);
  }
  if (
    subSubHeadings !== undefined &&
    (!Array.isArray(subSubHeadings) || subSubHeadings.length !== subSubCount || !subSubHeadings.every(isValidArticleItem))
  ) {
    throw new Error(`subSubHeadings must be exactly ${subSubCount} valid item(s) for variant ${effectiveVariant}`);
  }

  // Changing the variant must not leave stale arrays behind.
  if (variant !== undefined) {
    const finalSub = subHeadings ?? existing.subHeadings;
    const finalSubSub = subSubHeadings ?? existing.subSubHeadings;
    if (finalSub.length !== subCount || finalSubSub.length !== subSubCount) {
      throw new Error(
        `Changing variant to ${effectiveVariant} requires subHeadings=${subCount} and subSubHeadings=${subSubCount}`,
      );
    }
  }

  const updated: Newspaper = {
    ...existing,
    ...(variant !== undefined && { variant: effectiveVariant }),
    ...(orientation !== undefined && { orientation }),
    ...(brand !== undefined && { brand: brand.trim() }),
    ...(mainHeading !== undefined && { mainHeading: mainHeading.trim() }),
    ...(mainContent !== undefined && { mainContent: mainContent.trim() }),
    ...(issueDate !== undefined && { issueDate: issueDate.trim() || existing.issueDate }),
    ...(estYear !== undefined && { estYear: estYear === null ? undefined : estYear }),
    ...(estEra !== undefined && { estEra: estEra && estEra.trim() ? estEra.trim() : undefined }),
    ...(mainImage !== undefined && { mainImage: mainImage && mainImage.trim() ? mainImage.trim() : undefined }),
    ...(subHeadings !== undefined && {
      subHeadings: subHeadings.map((h) => ({ id: h.id || newId(), title: h.title.trim(), content: h.content.trim() })),
    }),
    ...(subSubHeadings !== undefined && {
      subSubHeadings: subSubHeadings.map((h) => ({ id: h.id || newId(), title: h.title.trim(), content: h.content.trim() })),
    }),
  };

  list[idx] = updated;
  writeAll(list);
  return updated;
}

export function deleteNewspaper(id: string): void {
  writeAll(readAll().filter((n) => n.id !== id));
}
