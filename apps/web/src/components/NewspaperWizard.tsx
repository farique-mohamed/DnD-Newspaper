'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLayout, type VariantId } from '@/lib/layouts';
import {
  type NewspaperFormData,
  type ArticleForm,
  createEmptyForm,
  emptyArticle,
  buildPayload,
  formatToday,
} from '@/lib/newspaperForm';
import LayoutPicker from './LayoutPicker';
import ContentForm from './ContentForm';
import { CAP_MODE } from './LimitedField';
import styles from './wizard.module.css';

const API = 'http://localhost:4000/api/newspapers';
const MAX_ITEMS = 3;

type Group = 'subHeadings' | 'subSubHeadings';

interface NewspaperWizardProps {
  mode: 'create' | 'edit';
  id?: string;
  initialData?: NewspaperFormData;
}

const padTo = (arr: ArticleForm[], n: number): ArticleForm[] =>
  Array.from({ length: n }, (_, i) => arr[i] ?? emptyArticle());

function overflows(form: NewspaperFormData): boolean {
  const L = getLayout(form.variant).limits;
  return (
    form.mainHeading.length > L.mainTitle ||
    form.mainContent.length > L.mainBody ||
    form.subHeadings.some((s) => s.title.length > L.subTitle || s.content.length > L.subBody) ||
    form.subSubHeadings.some((s) => s.title.length > L.subSubTitle || s.content.length > L.subSubBody)
  );
}

export default function NewspaperWizard({ mode, id, initialData }: NewspaperWizardProps) {
  const router = useRouter();
  const [form, setForm] = useState<NewspaperFormData>(() => initialData ?? createEmptyForm());
  const [step, setStep] = useState<1 | 2>(mode === 'edit' ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Retains text for indices hidden by a smaller layout, so f -> a -> f restores it.
  const stashRef = useRef<Record<Group, ArticleForm[]>>({
    subHeadings: padTo(form.subHeadings, MAX_ITEMS),
    subSubHeadings: padTo(form.subSubHeadings, MAX_ITEMS),
  });

  // Default the issue date to today — set after mount to avoid a hydration mismatch.
  useEffect(() => {
    setForm((prev) => (prev.issueDate ? prev : { ...prev, issueDate: formatToday() }));
  }, []);

  const setField = <K extends keyof NewspaperFormData>(key: K, value: NewspaperFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setArticle = (group: Group, index: number, key: 'title' | 'content', value: string) => {
    setForm((prev) => {
      const next = prev[group].map((a, i) => (i === index ? { ...a, [key]: value } : a));
      stashRef.current[group][index] = next[index];
      return { ...prev, [group]: next };
    });
  };

  const changeVariant = (variant: VariantId) => {
    setForm((prev) => {
      const { subCount, subSubCount } = getLayout(variant);
      const take = (group: Group, len: number): ArticleForm[] =>
        Array.from({ length: len }, (_, i) => prev[group][i] ?? stashRef.current[group][i] ?? emptyArticle());
      return {
        ...prev,
        variant,
        subHeadings: take('subHeadings', subCount),
        subSubHeadings: take('subSubHeadings', subSubCount),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const year = form.estYear.trim();
    if (year !== '' && !/^\d+$/.test(year)) {
      setError('Est. Year must be a whole number.');
      return;
    }
    if (CAP_MODE === 'soft' && overflows(form)) {
      setError('Some fields exceed their character limit.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const url = mode === 'create' ? API : `${API}/${id}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
      });
      if (!res.ok) throw new Error('Failed to save newspaper');
      const data = await res.json();
      router.push(`/newspaper/${mode === 'create' ? data.id : id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.pageTitle}>{mode === 'edit' ? 'Edit Newspaper' : 'Create Your Newspaper'}</h1>

      <div className={styles.stepper}>
        <button
          type="button"
          className={`${styles.stepDot} ${step === 1 ? styles.stepDotActive : ''}`}
          onClick={() => setStep(1)}
        >
          1 · Layout
        </button>
        <span className={styles.stepLabel}>→</span>
        <button
          type="button"
          className={`${styles.stepDot} ${step === 2 ? styles.stepDotActive : ''}`}
          onClick={() => setStep(2)}
        >
          2 · Content
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {step === 1 ? (
        <LayoutPicker
          value={form.variant}
          orientation={form.orientation}
          onChange={changeVariant}
          onOrientationChange={(o) => setField('orientation', o)}
          onNext={() => setStep(2)}
        />
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <ContentForm form={form} setField={setField} setArticle={setArticle} />
          <div className={styles.stepNav}>
            <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
              ← Back
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || (CAP_MODE === 'soft' && overflows(form))}
            >
              {loading ? 'Saving…' : mode === 'edit' ? 'Save Changes →' : 'Create Newspaper →'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
