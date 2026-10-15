'use client';

import { useRef, useState } from 'react';
import styles from './wizard.module.css';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // ~2 MB (base64 inflates this ~+33%)

interface ImageFieldProps {
  value: string;
  onChange: (value: string) => void;
}

// Upload a local image (stored inline as a base64 data URL) OR paste a hosted
// URL — both write the same `mainImage` string, last write wins.
export default function ImageField({ value, onChange }: ImageFieldProps) {
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image is ${(file.size / 1048576).toFixed(1)} MB — the max is 2 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError('Could not read that file.');
    reader.onload = () => onChange(String(reader.result)); // data:image/...;base64,...
    reader.readAsDataURL(file);
  };

  const clear = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = ''; // let the same file re-trigger onChange
    setError('');
  };

  return (
    <div className={styles.imageField}>
      {value ? (
        <div className={styles.imagePreview}>
          {/* Data URLs / arbitrary hosts can't use next/image; a plain <img> is correct. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Main article preview" className={styles.imageThumb} />
          <button type="button" className={styles.imageRemove} onClick={clear}>
            Remove
          </button>
        </div>
      ) : (
        <label
          className={styles.dropzone}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <span>
            Drop an image here or <u>browse</u>
          </span>
          <span className={styles.dropzoneHint}>PNG / JPG, up to 2 MB</span>
        </label>
      )}

      <input
        className={styles.input}
        placeholder="…or paste an image URL"
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => onChange(e.target.value.trim())}
      />

      {error && <p className={styles.imageError}>{error}</p>}
    </div>
  );
}
