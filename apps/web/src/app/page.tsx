import Link from 'next/link';
import styles from './page.module.css';

async function getNewspapers() {
  try {
    const res = await fetch('http://localhost:4000/api/newspapers', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const newspapers = await getNewspapers();

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
            {newspapers.map((n: { id: string; brand: string; mainHeading: string; createdAt: string }) => (
              <li key={n.id}>
                <Link href={`/newspaper/${n.id}`}>
                  <strong>{n.brand}</strong> — {n.mainHeading}
                  <span className={styles.date}>{new Date(n.createdAt).toLocaleDateString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
