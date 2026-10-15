// Canonical Newspaper types. These describe what the client store (./store.ts)
// persists to localStorage; the create, edit, view, and home pages all import
// from here instead of redefining the shape.

import type { VariantId, Orientation } from './layouts';

export type { VariantId, Orientation };

export interface ArticleItem {
  id?: string; // present on API responses; absent while composing
  title: string;
  content: string;
}

export interface Newspaper {
  id: string;
  brand: string;
  variant: VariantId;
  orientation: Orientation;
  issueDate: string;
  estYear?: number;
  estEra?: string;
  mainHeading: string;
  mainContent: string;
  mainImage?: string;
  subHeadings: ArticleItem[];
  subSubHeadings: ArticleItem[];
  createdAt: string;
}
