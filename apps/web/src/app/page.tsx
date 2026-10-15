'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { listNewspapers } from '@/lib/store';
import type { Newspaper } from '@/lib/types';

type NewspaperRow = Pick<Newspaper, 'id' | 'brand' | 'mainHeading' | 'createdAt' | 'issueDate'>;

export default function HomePage() {
  // Read on the client only — localStorage isn't available during SSR, so the
  // first paint shows an empty list and the effect fills it after hydration.
  const [newspapers, setNewspapers] = useState<NewspaperRow[]>([]);

  useEffect(() => {
    setNewspapers(listNewspapers());
  }, []);

  return (
    <main className={styles.home}>
      <h1 className={styles.siteTitle}>⚔️ D&amp;D Newspaper Builder</h1>
      <p className={styles.subtitle}>Create dramatic newspapers for your tabletop adventures.</p>
      <Link href="/create" className={styles.createBtn}>
        + Create New Newspaper
      </Link>

      {newspapers.length > 0 && (
        <section className={styles.list}>
          <h2>Your Newspapers</h2>
          <ul>
            {newspapers.map((n) => (
              <li key={n.id} className={styles.row}>
                <Link href={`/newspaper/${n.id}`} className={styles.rowLink}>
                  <span>
                    <strong>{n.brand}</strong> — {n.mainHeading}
                  </span>
                  <span className={styles.date}>
                    {n.issueDate || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '')}
                  </span>
                </Link>
                <Link href={`/newspaper/${n.id}/edit`} className={styles.editLink}>
                  ✎ Edit
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
