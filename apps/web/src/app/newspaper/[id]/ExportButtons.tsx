'use client';

import { useEffect, useState } from 'react';
import styles from './newspaper.module.css';

// --- PDF: measure the paper's natural height at the A3 print width and set
// --print-scale so .sheetInner shrinks to fit exactly one page (no clipping,
// crisp vector text). Measured on a detached clone with flex neutralised,
// because the live flex-fill layout (flex-basis:0) collapses when measured. ---
function computeFitScale() {
  const sheet = document.getElementById('newspaper-sheet');
  const inner = document.getElementById('sheet-inner');
  if (!sheet || !inner) return;

  const MM = 96 / 25.4;
  const portrait = sheet.getAttribute('data-orientation') === 'portrait';
  const pageHmm = portrait ? 420 : 297;
  const pageWmm = portrait ? 297 : 420;
  const availH = (pageHmm - 16) * MM;
  const contentW = (pageWmm - 20) * MM;

  const clone = inner.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.cssText =
    `position:fixed;left:-10000px;top:0;visibility:hidden;display:block;flex:none;transform:none;width:${contentW}px;max-width:none;`;
  clone.querySelectorAll<HTMLElement>('*').forEach((el) => {
    el.style.flex = 'none';
    el.style.minHeight = '0';
  });
  document.body.appendChild(clone);
  const naturalH = clone.offsetHeight;
  document.body.removeChild(clone);

  const scale = naturalH > availH && naturalH > 0 ? availH / naturalH : 1;
  sheet.style.setProperty('--print-scale', String(scale));
}

// Neutralise only the VERTICAL flex-fillers (keep .strip flex:1 — that is the
// horizontal sharing of the three briefs), matching the print stylesheet.
const VERTICAL_FLEX = ['mainArticle', 'rightColumn', 'subArticles', 'subArticle', 'stripRow'] as const;

export default function ExportButtons({ title }: { title: string }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    computeFitScale();
    window.addEventListener('load', computeFitScale);
    window.addEventListener('beforeprint', computeFitScale);
    return () => {
      window.removeEventListener('load', computeFitScale);
      window.removeEventListener('beforeprint', computeFitScale);
    };
  }, []);

  const slug = (title || 'newspaper').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'newspaper';

  const handleJpg = async () => {
    const live = document.getElementById('sheet-inner');
    if (!live || busy) return;
    setBusy(true);
    try {
      const { default: html2canvas } = await import('html2canvas');

      // Natural-flow clone (so short papers aren't stretched, tall ones aren't
      // clipped, and the brief row keeps its 3-up layout).
      const width = live.offsetWidth;
      const inner = live.cloneNode(true) as HTMLElement;
      inner.removeAttribute('id');
      inner.style.cssText = `display:block;flex:none;transform:none;width:${width}px;max-width:none;`;
      VERTICAL_FLEX.forEach((key) => {
        inner.querySelectorAll<HTMLElement>(`.${styles[key]}`).forEach((el) => {
          el.style.flex = 'none';
        });
      });
      // html2canvas can't draw the soft-hyphen glyph, which makes justified text
      // look like broken words ("des cribed"); turn hyphenation off for the image.
      inner.querySelectorAll<HTMLElement>('p').forEach((p) => {
        p.style.setProperty('hyphens', 'none');
        p.style.setProperty('-webkit-hyphens', 'none');
      });

      // Wrap in a cream margin so the newspaper isn't flush to the image edge.
      const PAD = 40;
      const wrapper = document.createElement('div');
      wrapper.style.cssText =
        `position:fixed;left:-10000px;top:0;display:block;background:#f5f0e8;padding:${Math.round(PAD * 0.85)}px ${PAD}px;width:${width + PAD * 2}px;`;
      wrapper.appendChild(inner);
      document.body.appendChild(wrapper);

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: '#f5f0e8', useCORS: true });
      } finally {
        document.body.removeChild(wrapper);
      }

      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.95));
      if (!blob) throw new Error('Could not encode image');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug}.jpg`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // Keep the anchor + object URL alive briefly so the download isn't canceled.
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 1500);
    } catch (e) {
      console.error('JPG export failed:', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={styles.exportBtn} onClick={() => window.print()}>
        Print / Save as PDF
      </button>
      <button type="button" className={styles.exportBtn} onClick={handleJpg} disabled={busy}>
        {busy ? 'Rendering…' : 'Download JPG'}
      </button>
    </>
  );
}
