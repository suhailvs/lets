import { useEffect, useState } from 'react';

export default function ImagePicker({ label = 'Upload Image', onImageSelected }) {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageSelected(file);
  };

  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      <input
        className="form-control"
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
      {preview && (
        <div className="mt-3">
          <img src={preview} alt="Preview" className="img-fluid rounded" />
        </div>
      )}
    </div>
  );
}
