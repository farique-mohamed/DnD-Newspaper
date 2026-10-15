'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NewspaperWizard from '@/components/NewspaperWizard';
import { fromNewspaper, type NewspaperFormData } from '@/lib/newspaperForm';
import { getNewspaper } from '@/lib/store';
import styles from '@/components/wizard.module.css';

export default function EditNewspaperPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<NewspaperFormData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // localStorage is client-only, so read after mount.
    const n = getNewspaper(id);
    if (n) setData(fromNewspaper(n));
    else setError('Newspaper not found');
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
