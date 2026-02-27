import { useState, useRef } from 'react';
import { api } from '../utils/api';

const MAX_IMAGES = 4;

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  primaryIndex: number;
  onPrimaryChange: (index: number) => void;
  folder?: string;
  label?: string;
  required?: boolean;
  maxCount?: number;
}

export function MultiImageUpload({
  value,
  onChange,
  primaryIndex,
  onPrimaryChange,
  folder = 'images',
  label = 'الصور',
  required = false,
  maxCount = MAX_IMAGES,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [limitError, setLimitError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const urls = Array.isArray(value) ? value : [];
  const canAdd = urls.length < maxCount;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setLimitError('');
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة (JPEG, PNG, WebP, GIF)');
      e.target.value = '';
      return;
    }
    if (urls.length >= maxCount) {
      setLimitError(`الحد الأقصى ${maxCount} صور خلفية. يرجى إزالة صورة قبل الإضافة.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<{ url: string }>(
        `/upload/image?folder=${encodeURIComponent(folder)}`,
        formData
      );
      const next = [...urls, data.url];
      onChange(next);
      if (next.length === 1) onPrimaryChange(0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeAt = (index: number) => {
    const next = urls.filter((_, i) => i !== index);
    onChange(next);
    if (primaryIndex >= next.length) {
      onPrimaryChange(Math.max(0, next.length - 1));
    } else if (index < primaryIndex) {
      onPrimaryChange(primaryIndex - 1);
    }
  };

  const replaceAt = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة (JPEG, PNG, WebP, GIF)');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<{ url: string }>(
        `/upload/image?folder=${encodeURIComponent(folder)}`,
        formData
      );
      const next = urls.map((u, i) => (i === index ? data.url : u));
      onChange(next);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const setPrimary = (index: number) => {
    if (index >= 0 && index < urls.length) onPrimaryChange(index);
  };

  return (
    <div className="form-row multi-image-upload-row">
      <label>
        {label}
        {required ? ' *' : ''}
        <span className="multi-image-upload-hint"> (حد أقصى {maxCount} صور)</span>
      </label>
      <div className="multi-image-upload-control">
        <div className="multi-image-upload-grid">
          {urls.map((url, i) => (
            <div key={`${url}-${i}`} className="multi-image-upload-card">
              <div className="multi-image-upload-preview">
                <img src={url} alt="" className="multi-image-upload-preview-img" />
                {primaryIndex === i && (
                  <span className="multi-image-upload-primary-badge" aria-hidden>رئيسية</span>
                )}
              </div>
              <div className="multi-image-upload-actions">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => document.getElementById(`replace-hero-${i}`)?.click()}
                  disabled={uploading}
                >
                  استبدال
                </button>
                <input
                  id={`replace-hero-${i}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={(ev) => { replaceAt(i, ev); }}
                />
                {primaryIndex !== i && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setPrimary(i)}
                    disabled={uploading}
                  >
                    تعيين رئيسية
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => removeAt(i)}
                  disabled={uploading}
                >
                  إزالة
                </button>
              </div>
            </div>
          ))}
          {canAdd && (
            <div className="multi-image-upload-add">
              <button
                type="button"
                className="multi-image-upload-add-btn"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'جاري الرفع...' : `+ إضافة صورة (${urls.length}/${maxCount})`}
              </button>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {limitError && <span className="multi-image-upload-error">{limitError}</span>}
        {error && <span className="multi-image-upload-error">{error}</span>}
      </div>
    </div>
  );
}
