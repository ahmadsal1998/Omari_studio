import { useState, useRef } from 'react';
import { api } from '../utils/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  required?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder = 'images',
  label = 'الصورة',
  required = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة (JPEG, PNG, WebP, GIF)');
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
      onChange(data.url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="form-row image-upload-row">
      <label>{label}{required ? ' *' : ''}</label>
      <div className="image-upload-control">
        <div className="image-upload-preview">
          {value ? (
            <>
              <img src={value} alt="" className="image-upload-preview-img" />
              <div className="image-upload-actions">
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'جاري الرفع...' : 'تغيير'}
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => onChange('')}
                  disabled={uploading}
                >
                  إزالة
                </button>
              </div>
            </>
          ) : (
            <div className="image-upload-placeholder">
              <button
                type="button"
                className="image-upload-btn"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'جاري الرفع...' : '+ اختيار صورة'}
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
        {error && <span className="image-upload-error">{error}</span>}
      </div>
    </div>
  );
}
