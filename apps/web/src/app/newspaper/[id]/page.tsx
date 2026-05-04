import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './newspaper.module.css';

interface SubHeading {
  id?: string;
  title: string;
  content: string;
}

interface SubSubHeading {
  id?: string;
  title: string;
  content: string;
}

interface Newspaper {
  id: string;
  brand: string;
  mainHeading: string;
  mainContent: string;
  subHeadings: [SubHeading, SubHeading];
  subSubHeadings: [SubSubHeading, SubSubHeading, SubSubHeading];
  createdAt: string;
}

async function getNewspaper(id: string): Promise<Newspaper | null> {
  try {
    const res = await fetch(`http://localhost:4000/api/newspapers/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function NewspaperPage({ params }: { params: { id: string } }) {
  const newspaper = await getNewspaper(params.id);
  if (!newspaper) notFound();

  return (
    <div className={styles.page}>
      {/* ── Brand Header ─────────────────────────────── */}
      <header className={styles.brand}>
        <div className={styles.brandTop}>
          <span className={styles.brandDate}>
            {new Date(newspaper.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <h1 className={styles.brandName}>{newspaper.brand}</h1>
          <span className={styles.brandMotto}>Est. in the Realm of Adventure</span>
        </div>
        <div className={styles.brandRule} />
      </header>

      {/* ── Content Grid ─────────────────────────────── */}
      <div className={styles.content}>
        {/* Left half – Main Article */}
        <article className={styles.mainArticle}>
          <h2 className={styles.mainHeading}>{newspaper.mainHeading}</h2>
          <div className={styles.mainRule} />
          <p className={styles.mainBody}>{newspaper.mainContent}</p>
        </article>

        {/* Right half */}
        <div className={styles.rightColumn}>
          {/* Top 2/3 – Sub-heading articles */}
          <div className={styles.subArticles}>
            {newspaper.subHeadings.map((sub, i) => (
              <article key={sub.id ?? i} className={styles.subArticle}>
                <h3 className={styles.subHeading}>{sub.title}</h3>
                <div className={styles.subRule} />
                <p className={styles.subBody}>{sub.content}</p>
              </article>
            ))}
          </div>

          {/* Bottom 1/3 – Sub-sub strips */}
          <div className={styles.stripRow}>
            {newspaper.subSubHeadings.map((strip, i) => (
              <article key={strip.id ?? i} className={styles.strip}>
                <h4 className={styles.stripHeading}>{strip.title}</h4>
                <div className={styles.stripRule} />
                <p className={styles.stripBody}>{strip.content}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <Link href="/" className={styles.backLink}>← Back to Newspapers</Link>
      </footer>
    </div>
  );
}
