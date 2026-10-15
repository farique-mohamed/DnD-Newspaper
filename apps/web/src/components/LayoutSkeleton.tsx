import { getLayout, type VariantId, type Orientation } from '@/lib/layouts';
import styles from './wizard.module.css';

export type SkeletonMode = 'diagram' | 'realistic';

// One geometry renderer shared by the thumbnails and the large preview. It
// mirrors the real newspaper arrangement (main left; subs stacked top-right;
// strips in a bottom row); `mode` only swaps the cell contents.
const SAMPLE = {
  mainTitle: 'Dragon Spotted Over Neverwinter',
  mainBody:
    'A great wyrm circled the spires at dusk, scattering the night market and setting the watch ablaze with rumor and alarm across every ward of the city.',
  subTitle: 'Guild Raises the Bounty',
  subBody: 'Adventurers gather at the Yawning Portal as the reward for the beast climbs to a small fortune in gold.',
  stripTitle: 'Market Watch',
  stripBody: 'Grain prices climb as caravans stall on the High Road.',
};

const diaClass = { main: styles.diaMain, sub: styles.diaSub, strip: styles.diaStrip } as const;
const realClass = { main: styles.realMain, sub: styles.realSub, strip: styles.realStrip } as const;

interface CellProps {
  kind: 'main' | 'sub' | 'strip';
  mode: SkeletonMode;
  title: string;
  body: string;
  titleLimit: number;
  bodyLimit: number;
  annotate: boolean;
}

function Cell({ kind, mode, title, body, titleLimit, bodyLimit, annotate }: CellProps) {
  if (mode === 'realistic') {
    return (
      <div className={realClass[kind]}>
        <div className={styles.realTitle}>{title}</div>
        <div className={styles.realBody}>{body}</div>
      </div>
    );
  }
  return (
    <div className={diaClass[kind]}>
      <span className={`${styles.diaBar} ${styles.diaBarTitle}`} />
      <span className={styles.diaBar} />
      <span className={styles.diaBar} />
      {annotate && (
        <span className={styles.diaLimit}>
          t:{titleLimit} · b:{bodyLimit}
        </span>
      )}
    </div>
  );
}

interface LayoutSkeletonProps {
  variant: VariantId;
  mode?: SkeletonMode;
  size?: 'thumb' | 'large';
  annotate?: boolean;
  orientation?: Orientation;
}

export default function LayoutSkeleton({
  variant,
  mode = 'diagram',
  size = 'thumb',
  annotate = false,
  orientation = 'landscape',
}: LayoutSkeletonProps) {
  const layout = getLayout(variant);
  const L = layout.limits;
  const hasRight = layout.subCount > 0 || layout.subSubCount > 0;

  const boxClass = [
    styles.skeleton,
    size === 'large' ? styles.skeletonLarge : styles.skeletonThumb,
    size === 'large' && orientation === 'portrait' ? styles.skeletonPortrait : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={boxClass}>
      <div className={styles.skMain}>
        <Cell
          kind="main"
          mode={mode}
          title={SAMPLE.mainTitle}
          body={SAMPLE.mainBody}
          titleLimit={L.mainTitle}
          bodyLimit={L.mainBody}
          annotate={annotate}
        />
      </div>

      {hasRight && (
        <div className={styles.skRight}>
          {layout.subCount > 0 && (
            <div className={styles.skSubs}>
              {Array.from({ length: layout.subCount }, (_, i) => (
                <Cell
                  key={i}
                  kind="sub"
                  mode={mode}
                  title={SAMPLE.subTitle}
                  body={SAMPLE.subBody}
                  titleLimit={L.subTitle}
                  bodyLimit={L.subBody}
                  annotate={annotate}
                />
              ))}
            </div>
          )}
          {layout.subSubCount > 0 && (
            <div className={styles.skStrips}>
              {Array.from({ length: layout.subSubCount }, (_, i) => (
                <Cell
                  key={i}
                  kind="strip"
                  mode={mode}
                  title={SAMPLE.stripTitle}
                  body={SAMPLE.stripBody}
                  titleLimit={L.subSubTitle}
                  bodyLimit={L.subSubBody}
                  annotate={annotate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
