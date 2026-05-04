'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './create.module.css';

interface FormData {
  brand: string;
  mainHeading: string;
  mainContent: string;
  subHeadings: [{ title: string; content: string }, { title: string; content: string }];
  subSubHeadings: [
    { title: string; content: string },
    { title: string; content: string },
    { title: string; content: string },
  ];
}

const initialForm: FormData = {
  brand: '',
  mainHeading: '',
  mainContent: '',
  subHeadings: [
    { title: '', content: '' },
    { title: '', content: '' },
  ],
  subSubHeadings: [
    { title: '', content: '' },
    { title: '', content: '' },
    { title: '', content: '' },
  ],
};

export default function CreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (path: string, value: string) => {
    setForm((prev) => {
      const next = structuredClone(prev) as unknown as Record<string, unknown>;
      const parts = path.split('.');
      let obj = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const idx = Number(parts[i + 1]);
        if (!isNaN(idx)) {
          obj = (obj[key] as Record<string, unknown>[])[idx] as Record<string, unknown>;
          i++;
        } else {
          obj = obj[key] as Record<string, unknown>;
        }
      }
      obj[parts[parts.length - 1]] = value;
      return next as unknown as FormData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/newspapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create newspaper');
      const data = await res.json();
      router.push(`/newspaper/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.pageTitle}>Create Your Newspaper</h1>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Brand */}
        <section className={styles.section}>
          <label className={styles.label}>
            Newspaper Brand
            <input
              className={styles.input}
              value={form.brand}
              onChange={(e) => setField('brand', e.target.value)}
              placeholder="e.g. The Tavern Times"
              required
            />
          </label>
        </section>

        {/* Main Heading */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Main Heading</h2>
          <label className={styles.label}>
            Headline
            <input
              className={styles.input}
              value={form.mainHeading}
              onChange={(e) => setField('mainHeading', e.target.value)}
              placeholder="Dragon Spotted Over Neverwinter!"
              required
            />
          </label>
          <label className={styles.label}>
            Article
            <textarea
              className={styles.textarea}
              value={form.mainContent}
              onChange={(e) => setField('mainContent', e.target.value)}
              placeholder="Write the full story here..."
              rows={8}
              required
            />
          </label>
        </section>

        {/* Sub Headings */}
        {([0, 1] as const).map((i) => (
          <section key={i} className={styles.section}>
            <h2 className={styles.sectionTitle}>Sub Heading {i + 1}</h2>
            <label className={styles.label}>
              Headline
              <input
                className={styles.input}
                value={form.subHeadings[i].title}
                onChange={(e) => setField(`subHeadings.${i}.title`, e.target.value)}
                placeholder={`Sub-heading ${i + 1} title`}
                required
              />
            </label>
            <label className={styles.label}>
              Article
              <textarea
                className={styles.textarea}
                value={form.subHeadings[i].content}
                onChange={(e) => setField(`subHeadings.${i}.content`, e.target.value)}
                placeholder="Article content..."
                rows={4}
                required
              />
            </label>
          </section>
        ))}

        {/* Sub-sub Headings */}
        {([0, 1, 2] as const).map((i) => (
          <section key={i} className={styles.section}>
            <h2 className={styles.sectionTitle}>Sub-Sub Heading {i + 1}</h2>
            <label className={styles.label}>
              Headline
              <input
                className={styles.input}
                value={form.subSubHeadings[i].title}
                onChange={(e) => setField(`subSubHeadings.${i}.title`, e.target.value)}
                placeholder={`Sub-sub heading ${i + 1} title`}
                required
              />
            </label>
            <label className={styles.label}>
              Article
              <textarea
                className={styles.textarea}
                value={form.subSubHeadings[i].content}
                onChange={(e) => setField(`subSubHeadings.${i}.content`, e.target.value)}
                placeholder="Brief article content..."
                rows={2}
                required
              />
            </label>
          </section>
        ))}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Creating…' : 'Create Newspaper →'}
        </button>
      </form>
    </main>
  );
}
