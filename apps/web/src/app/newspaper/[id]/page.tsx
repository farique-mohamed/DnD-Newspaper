'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './newspaper.module.css';
import NewspaperLayout from './NewspaperLayout';
import ExportButtons from './ExportButtons';
import { getNewspaper } from '@/lib/store';
import type { Newspaper } from '@/lib/types';

export default function NewspaperPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  // 'loading' until the client reads localStorage; then 'ready' or 'missing'.
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    const found = getNewspaper(id);
    setNewspaper(found);
    setStatus(found ? 'ready' : 'missing');
  }, [id]);

  if (status === 'loading') {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading…</p>
      </main>
    );
  }

  if (status === 'missing' || !newspaper) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Newspaper not found.</p>
        <Link href="/" className={styles.backLink}>
          ← Back to Newspapers
        </Link>
      </main>
    );
  }

  const orientation = newspaper.orientation ?? 'landscape';
  // Injected per-paper so the PDF uses this newspaper's own orientation on a
  // single, full-bleed A3 page. margin:0 lets the cream paper fill the sheet
  // edge-to-edge (no white border); #newspaper-sheet is pinned to the full page
  // height so content never spills onto a second page. Breathing room lives
  // inside the sheet as cream padding (see .page in newspaper.module.css).
  const printCss = `@media print {
    @page { size: A3 ${orientation}; margin: 0; }
    #newspaper-sheet { height: ${orientation === 'portrait' ? '420mm' : '297mm'}; }
  }`;

  return (
    <>
      <div id="newspaper-sheet" className={styles.page} data-orientation={orientation}>
        <div id="sheet-inner" className={styles.sheetInner}>
          <NewspaperLayout paper={newspaper} />
        </div>

        <footer className={styles.footer}>
          <Link href="/" className={styles.backLink}>
            ← Back to Newspapers
          </Link>
          <Link href={`/newspaper/${newspaper.id}/edit`} className={styles.backLink}>
            ✎ Edit
          </Link>
          <ExportButtons title={newspaper.brand} />
        </footer>
      </div>
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
    </>
  );
}
