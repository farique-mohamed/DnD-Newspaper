import styles from './newspaper.module.css';
import type { Newspaper } from '@/lib/types';

// Presentational newspaper renderer. The markup is variant-agnostic — regions
// appear based on array length — and `data-variant` only drives sizing in CSS.
export default function NewspaperLayout({ paper }: { paper: Newspaper }) {
  const hasSubs = paper.subHeadings.length > 0;
  const hasStrips = paper.subSubHeadings.length > 0;
  const hasEst = paper.estYear != null || !!paper.estEra;

  return (
    <>
      {/* ── Brand Header ─────────────────────────────── */}
      <header className={styles.brand}>
        <div className={styles.brandTop}>
          <span className={styles.brandDate}>{paper.issueDate}</span>
          <h1 className={styles.brandName}>{paper.brand}</h1>
          {hasEst ? (
            <span className={styles.brandMotto}>
              Est.
              {paper.estYear != null ? ` ${paper.estYear}` : ''}
              {paper.estEra ? ` ${paper.estEra}` : ''}
            </span>
          ) : (
            <span className={styles.brandMotto} aria-hidden />
          )}
        </div>
        <div className={styles.brandRule} />
      </header>

      {/* ── Content Grid ─────────────────────────────── */}
      <div className={styles.content} data-variant={paper.variant}>
        {/* Main Article */}
        <article className={styles.mainArticle}>
          {paper.mainImage && (
            <figure className={styles.mainFigure}>
              {/* Data URLs can't go through next/image; a plain <img> is correct here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={paper.mainImage} alt={paper.mainHeading} className={styles.mainImg} />
            </figure>
          )}
          <h2 className={styles.mainHeading}>{paper.mainHeading}</h2>
          <div className={styles.mainRule} />
          <p className={styles.mainBody}>{paper.mainContent}</p>
        </article>

        {/* Right column — sub-articles over strips */}
        {hasSubs && (
          <div className={styles.rightColumn}>
            <div className={styles.subArticles}>
              {paper.subHeadings.map((sub, i) => (
                <article key={sub.id ?? i} className={styles.subArticle}>
                  <h3 className={styles.subHeading}>{sub.title}</h3>
                  <div className={styles.subRule} />
                  <p className={styles.subBody}>{sub.content}</p>
                </article>
              ))}
            </div>

            {hasStrips && (
              <div className={styles.stripRow}>
                {paper.subSubHeadings.map((strip, i) => (
                  <article key={strip.id ?? i} className={styles.strip}>
                    <h4 className={styles.stripHeading}>{strip.title}</h4>
                    <div className={styles.stripRule} />
                    <p className={styles.stripBody}>{strip.content}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
