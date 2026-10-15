'use client';

import { getLayout } from '@/lib/layouts';
import type { NewspaperFormData } from '@/lib/newspaperForm';
import LimitedField from './LimitedField';
import ImageField from './ImageField';
import styles from './wizard.module.css';

type Group = 'subHeadings' | 'subSubHeadings';

interface ContentFormProps {
  form: NewspaperFormData;
  setField: <K extends keyof NewspaperFormData>(key: K, value: NewspaperFormData[K]) => void;
  setArticle: (group: Group, index: number, key: 'title' | 'content', value: string) => void;
}

// Step 2: fields follow the chosen variant (subCount sub-articles, subSubCount
// briefs). Every long-form field enforces the per-layout character limit.
export default function ContentForm({ form, setField, setArticle }: ContentFormProps) {
  const L = getLayout(form.variant).limits;

  return (
    <>
      {/* ── Masthead ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Masthead</h2>
        <label className={styles.label}>
          Newspaper Brand
          <input
            className={styles.input}
            value={form.brand}
            onChange={(e) => setField('brand', e.target.value)}
            placeholder="e.g. The Tavern Times"
            maxLength={60}
            required
          />
        </label>
        <label className={styles.label}>
          Issue Date
          <input
            className={styles.input}
            value={form.issueDate}
            onChange={(e) => setField('issueDate', e.target.value)}
            placeholder="e.g. 14th of Marpenoth, 1496 DR"
            maxLength={60}
          />
        </label>
        <div className={styles.fieldRow}>
          <label className={styles.label}>
            Est. Year
            <input
              className={styles.input}
              type="number"
              inputMode="numeric"
              min={0}
              value={form.estYear}
              onChange={(e) => setField('estYear', e.target.value)}
              placeholder="e.g. 71"
            />
          </label>
          <label className={styles.label}>
            Est. Era
            <input
              className={styles.input}
              value={form.estEra}
              onChange={(e) => setField('estEra', e.target.value)}
              placeholder="e.g. TR - Tethyreckoning"
              maxLength={40}
            />
          </label>
        </div>
      </section>

      {/* ── Main article ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Main Article</h2>
        <div className={styles.label}>
          <span>Main Image (optional)</span>
          <ImageField value={form.mainImage} onChange={(v) => setField('mainImage', v)} />
        </div>
        <LimitedField
          label="Headline"
          value={form.mainHeading}
          onChange={(v) => setField('mainHeading', v)}
          limit={L.mainTitle}
          placeholder="Dragon Spotted Over Neverwinter!"
          required
        />
        <LimitedField
          label="Article"
          value={form.mainContent}
          onChange={(v) => setField('mainContent', v)}
          limit={L.mainBody}
          placeholder="Write the full story here..."
          multiline
          rows={8}
          required
        />
      </section>

      {/* ── Sub-articles ── */}
      {form.subHeadings.map((sub, i) => (
        <section key={i} className={styles.section}>
          <h2 className={styles.sectionTitle}>Sub Article {i + 1}</h2>
          <LimitedField
            label="Headline"
            value={sub.title}
            onChange={(v) => setArticle('subHeadings', i, 'title', v)}
            limit={L.subTitle}
            placeholder={`Sub-article ${i + 1} title`}
            required
          />
          <LimitedField
            label="Article"
            value={sub.content}
            onChange={(v) => setArticle('subHeadings', i, 'content', v)}
            limit={L.subBody}
            placeholder="Article content..."
            multiline
            rows={4}
            required
          />
        </section>
      ))}

      {/* ── Briefs (sub-sub) ── */}
      {form.subSubHeadings.map((strip, i) => (
        <section key={i} className={styles.section}>
          <h2 className={styles.sectionTitle}>Brief {i + 1}</h2>
          <LimitedField
            label="Headline"
            value={strip.title}
            onChange={(v) => setArticle('subSubHeadings', i, 'title', v)}
            limit={L.subSubTitle}
            placeholder={`Brief ${i + 1} title`}
            required
          />
          <LimitedField
            label="Article"
            value={strip.content}
            onChange={(v) => setArticle('subSubHeadings', i, 'content', v)}
            limit={L.subSubBody}
            placeholder="Brief content..."
            multiline
            rows={2}
            required
          />
        </section>
      ))}
    </>
  );
}
