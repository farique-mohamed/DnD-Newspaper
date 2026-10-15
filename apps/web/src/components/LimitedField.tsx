import { useId } from 'react';
import styles from './wizard.module.css';

// One-line switch between the two enforcement strategies. The user chose a HARD
// cap: native maxLength stops typing at the limit. Flip to 'soft' to allow
// overflow (counter turns red, submit blocked) — the wizard already gates on it.
export const CAP_MODE: 'hard' | 'soft' = 'hard';

interface LimitedFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  limit: number;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}

export default function LimitedField({
  label,
  value,
  onChange,
  limit,
  multiline = false,
  rows = 4,
  placeholder,
  required,
}: LimitedFieldProps) {
  const id = useId();
  const countId = `${id}-count`;
  const over = value.length > limit; // strict '>' — a value equal to the limit is fine

  const shared = {
    id,
    className: multiline ? styles.textarea : styles.input,
    value,
    placeholder,
    required,
    maxLength: CAP_MODE === 'hard' ? limit : undefined,
    'aria-describedby': countId,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };

  return (
    <label className={styles.label} htmlFor={id}>
      <span className={styles.labelRow}>
        <span>
          {label}
          {required ? ' *' : ''}
        </span>
        <span id={countId} className={`${styles.counter} ${over ? styles.counterOver : ''}`} aria-live="polite">
          {value.length} / {limit}
        </span>
      </span>
      {multiline ? <textarea {...shared} rows={rows} /> : <input {...shared} />}
    </label>
  );
}
