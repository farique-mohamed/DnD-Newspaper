import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
// Base64 image data URLs easily exceed express.json()'s 100kb default, which
// would 413 before validation runs. Raise it comfortably above MAIN_IMAGE_MAX.
app.use(express.json({ limit: '10mb' }));

export interface ArticleItem {
  id: string;
  title: string;
  content: string;
}

export type SubSubHeading = ArticleItem;
export type SubHeading = ArticleItem;

export type Variant = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

// variant -> [subHeadings count, subSubHeadings count].
// Precise per-region CHAR LIMITS live in apps/web/src/lib/layouts.ts — keep this minimal.
const VARIANT_COUNTS: Record<Variant, [number, number]> = {
  a: [0, 0],
  b: [1, 0],
  c: [2, 0],
  d: [3, 0],
  e: [2, 2],
  f: [2, 3], // f == legacy 2 + 3
};

const isVariant = (v: unknown): v is Variant =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(VARIANT_COUNTS, v);

export type Orientation = 'portrait' | 'landscape';

const isOrientation = (o: unknown): o is Orientation => o === 'portrait' || o === 'landscape';

const MAIN_IMAGE_MAX = 5 * 1024 * 1024; // ~5MB string cap; bounds in-memory growth

const todayIssueDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

export interface Newspaper {
  id: string;
  brand: string;
  variant: Variant;
  orientation: Orientation;
  issueDate: string;
  estYear?: number;
  estEra?: string;
  mainHeading: string;
  mainContent: string;
  mainImage?: string;
  subHeadings: SubHeading[];
  subSubHeadings: SubSubHeading[];
  createdAt: string;
}

let newspapers: Newspaper[] = [];

// Get all newspapers
app.get('/api/newspapers', (_req, res) => {
  res.json(newspapers);
});

// Get single newspaper
app.get('/api/newspapers/:id', (req, res) => {
  const paper = newspapers.find((n) => n.id === req.params.id);
  if (!paper) return res.status(404).json({ error: 'Not found' });
  res.json(paper);
});

/** Validates that an item has non-empty 'title' and 'content' string fields. Allows an optional 'id' string. */
function isValidArticleItem(item: unknown): item is { id?: string; title: string; content: string } {
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

// Create newspaper
app.post('/api/newspapers', (req, res) => {
  const { brand, mainHeading, mainContent, subHeadings, subSubHeadings, variant, orientation, issueDate, estYear, estEra, mainImage } =
    req.body as Omit<Newspaper, 'id' | 'createdAt'>;

  const v: Variant = variant === undefined ? 'f' : (variant as Variant); // legacy default
  if (!isVariant(v)) {
    return res.status(400).json({ error: 'Invalid field: variant (expected a–f)' });
  }
  const [subCount, subSubCount] = VARIANT_COUNTS[v];

  const orient: Orientation = orientation === undefined ? 'landscape' : (orientation as Orientation);
  if (!isOrientation(orient)) {
    return res.status(400).json({ error: 'Invalid field: orientation (portrait|landscape)' });
  }

  if (typeof brand !== 'string' || !brand.trim()) {
    return res.status(400).json({ error: 'Missing or invalid field: brand' });
  }
  if (typeof mainHeading !== 'string' || !mainHeading.trim()) {
    return res.status(400).json({ error: 'Missing or invalid field: mainHeading' });
  }
  if (typeof mainContent !== 'string' || !mainContent.trim()) {
    return res.status(400).json({ error: 'Missing or invalid field: mainContent' });
  }
  if (estYear != null && (typeof estYear !== 'number' || !Number.isFinite(estYear))) {
    return res.status(400).json({ error: 'Invalid field: estYear' });
  }
  if (estEra != null && typeof estEra !== 'string') {
    return res.status(400).json({ error: 'Invalid field: estEra' });
  }
  if (mainImage != null && (typeof mainImage !== 'string' || mainImage.length > MAIN_IMAGE_MAX)) {
    return res.status(400).json({ error: 'Invalid field: mainImage' });
  }
  if (!Array.isArray(subHeadings) || subHeadings.length !== subCount || !subHeadings.every(isValidArticleItem)) {
    return res.status(400).json({ error: `subHeadings must be exactly ${subCount} valid item(s) for variant ${v}` });
  }
  if (!Array.isArray(subSubHeadings) || subSubHeadings.length !== subSubCount || !subSubHeadings.every(isValidArticleItem)) {
    return res
      .status(400)
      .json({ error: `subSubHeadings must be exactly ${subSubCount} valid item(s) for variant ${v}` });
  }

  const newspaper: Newspaper = {
    id: uuidv4(),
    brand: brand.trim(),
    variant: v,
    orientation: orient,
    issueDate: typeof issueDate === 'string' && issueDate.trim() ? issueDate.trim() : todayIssueDate(),
    mainHeading: mainHeading.trim(),
    mainContent: mainContent.trim(),
    subHeadings: subHeadings.map((h) => ({ id: uuidv4(), title: h.title.trim(), content: h.content.trim() })),
    subSubHeadings: subSubHeadings.map((h) => ({ id: uuidv4(), title: h.title.trim(), content: h.content.trim() })),
    createdAt: new Date().toISOString(),
    ...(estYear != null && { estYear }),
    ...(estEra != null && estEra.trim() !== '' && { estEra: estEra.trim() }),
    ...(mainImage != null && mainImage.trim() !== '' && { mainImage: mainImage.trim() }),
  };
  newspapers.push(newspaper);
  res.status(201).json(newspaper);
});

// Update newspaper
app.put('/api/newspapers/:id', (req, res) => {
  const idx = newspapers.findIndex((n) => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const existing = newspapers[idx];

  const { brand, mainHeading, mainContent, subHeadings, subSubHeadings, variant, orientation, issueDate, estYear, estEra, mainImage } =
    req.body as Partial<Omit<Newspaper, 'id' | 'createdAt'>>;

  if (orientation !== undefined && !isOrientation(orientation)) {
    return res.status(400).json({ error: 'Invalid field: orientation (portrait|landscape)' });
  }

  let effectiveVariant: Variant = existing.variant ?? 'f';
  if (variant !== undefined) {
    if (!isVariant(variant)) {
      return res.status(400).json({ error: 'Invalid field: variant (expected a–f)' });
    }
    effectiveVariant = variant;
  }
  const [subCount, subSubCount] = VARIANT_COUNTS[effectiveVariant];

  if (brand !== undefined && (typeof brand !== 'string' || !brand.trim())) {
    return res.status(400).json({ error: 'Missing or invalid field: brand' });
  }
  if (mainHeading !== undefined && (typeof mainHeading !== 'string' || !mainHeading.trim())) {
    return res.status(400).json({ error: 'Missing or invalid field: mainHeading' });
  }
  if (mainContent !== undefined && (typeof mainContent !== 'string' || !mainContent.trim())) {
    return res.status(400).json({ error: 'Missing or invalid field: mainContent' });
  }
  if (issueDate !== undefined && typeof issueDate !== 'string') {
    return res.status(400).json({ error: 'Invalid field: issueDate' });
  }
  if (estYear != null && (typeof estYear !== 'number' || !Number.isFinite(estYear))) {
    return res.status(400).json({ error: 'Invalid field: estYear' });
  }
  if (estEra != null && typeof estEra !== 'string') {
    return res.status(400).json({ error: 'Invalid field: estEra' });
  }
  if (mainImage != null && (typeof mainImage !== 'string' || mainImage.length > MAIN_IMAGE_MAX)) {
    return res.status(400).json({ error: 'Invalid field: mainImage' });
  }
  if (
    subHeadings !== undefined &&
    (!Array.isArray(subHeadings) || subHeadings.length !== subCount || !subHeadings.every(isValidArticleItem))
  ) {
    return res
      .status(400)
      .json({ error: `subHeadings must be exactly ${subCount} valid item(s) for variant ${effectiveVariant}` });
  }
  if (
    subSubHeadings !== undefined &&
    (!Array.isArray(subSubHeadings) || subSubHeadings.length !== subSubCount || !subSubHeadings.every(isValidArticleItem))
  ) {
    return res
      .status(400)
      .json({ error: `subSubHeadings must be exactly ${subSubCount} valid item(s) for variant ${effectiveVariant}` });
  }

  // Changing the variant must not leave stale arrays behind.
  if (variant !== undefined) {
    const finalSub = subHeadings ?? existing.subHeadings;
    const finalSubSub = subSubHeadings ?? existing.subSubHeadings;
    if (finalSub.length !== subCount || finalSubSub.length !== subSubCount) {
      return res.status(400).json({
        error: `Changing variant to ${effectiveVariant} requires subHeadings=${subCount} and subSubHeadings=${subSubCount}`,
      });
    }
  }

  newspapers[idx] = {
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
      subHeadings: subHeadings.map((h) => ({ id: h.id || uuidv4(), title: h.title.trim(), content: h.content.trim() })),
    }),
    ...(subSubHeadings !== undefined && {
      subSubHeadings: subSubHeadings.map((h) => ({
        id: h.id || uuidv4(),
        title: h.title.trim(),
        content: h.content.trim(),
      })),
    }),
  };
  res.json(newspapers[idx]);
});

// Delete newspaper
app.delete('/api/newspapers/:id', (req, res) => {
  newspapers = newspapers.filter((n) => n.id !== req.params.id);
  res.status(204).send();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
