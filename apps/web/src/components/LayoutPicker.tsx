'use client';

import { useState } from 'react';
import { LAYOUTS, getLayout, articleCount, type VariantId, type Orientation } from '@/lib/layouts';
import LayoutSkeleton, { type SkeletonMode } from './LayoutSkeleton';
import styles from './wizard.module.css';

interface LayoutPickerProps {
  value: VariantId;
  orientation: Orientation;
  onChange: (variant: VariantId) => void;
  onOrientationChange: (orientation: Orientation) => void;
  onNext: () => void;
}

// Step 1: pick one of the six layouts + a page orientation, and preview it
// (diagram or realistic) before advancing. The preview updates live.
export default function LayoutPicker({ value, orientation, onChange, onOrientationChange, onNext }: LayoutPickerProps) {
  const [previewMode, setPreviewMode] = useState<SkeletonMode>('diagram');
  const layout = getLayout(value);

  return (
    <section>
      <h2 className={styles.stepTitle}>Choose a layout</h2>

      <div className={styles.cardGrid}>
        {LAYOUTS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={value === opt.id}
            className={`${styles.card} ${value === opt.id ? styles.cardSelected : ''}`}
            onClick={() => onChange(opt.id)}
          >
            <LayoutSkeleton variant={opt.id} mode="diagram" size="thumb" />
            <span className={styles.cardLabel}>{opt.label}</span>
            <span className={styles.cardCount}>{articleCount(opt)} articles</span>
          </button>
        ))}
      </div>

      <div className={styles.orientationRow}>
        <span className={styles.orientationLabel}>Page orientation</span>
        <div className={styles.previewToggle} role="group" aria-label="Page orientation">
          {(['landscape', 'portrait'] as const).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={orientation === o}
              className={orientation === o ? styles.toggleActive : styles.toggleBtn}
              onClick={() => onOrientationChange(o)}
            >
              {o === 'landscape' ? 'Landscape' : 'Portrait'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.previewPane}>
        <div className={styles.previewHead}>
          <h3 className={styles.previewTitle}>Preview — {layout.label}</h3>
          <div className={styles.previewToggle} role="group" aria-label="Preview style">
            {(['diagram', 'realistic'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={previewMode === m}
                className={previewMode === m ? styles.toggleActive : styles.toggleBtn}
                onClick={() => setPreviewMode(m)}
              >
                {m === 'diagram' ? 'Diagram' : 'Realistic'}
              </button>
            ))}
          </div>
        </div>
        <LayoutSkeleton
          variant={value}
          orientation={orientation}
          mode={previewMode}
          size="large"
          annotate={previewMode === 'diagram'}
        />
      </div>

      <div className={styles.stepNav}>
        <span />
        <button type="button" className={styles.submitBtn} onClick={onNext}>
          Next →
        </button>
      </div>
    </section>
  );
}
