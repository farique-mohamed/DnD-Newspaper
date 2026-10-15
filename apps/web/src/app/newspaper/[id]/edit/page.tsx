'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NewspaperWizard from '@/components/NewspaperWizard';
import { fromNewspaper, type NewspaperFormData } from '@/lib/newspaperForm';
import styles from '@/components/wizard.module.css';

export default function EditNewspaperPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<NewspaperFormData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`http://localhost:4000/api/newspapers/${id}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('Newspaper not found');
        return r.json();
      })
      .then((n) => {
        if (active) setData(fromNewspaper(n));
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Failed to load newspaper');
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <main className={styles.wrapper}>
        <p className={styles.error}>{error}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className={styles.wrapper}>
        <p className={styles.loading}>Loading…</p>
      </main>
    );
  }
  return <NewspaperWizard mode="edit" id={id} initialData={data} />;
}
