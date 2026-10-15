import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './newspaper.module.css';
import NewspaperLayout from './NewspaperLayout';
import ExportButtons from './ExportButtons';
import type { Newspaper } from '@/lib/types';

async function getNewspaper(id: string): Promise<Newspaper | null> {
  try {
    const res = await fetch(`http://localhost:4000/api/newspapers/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function NewspaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const newspaper = await getNewspaper(id);
  if (!newspaper) notFound();

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
