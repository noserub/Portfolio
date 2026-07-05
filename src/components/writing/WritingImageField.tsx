import { useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { WritingImage } from './WritingImage';
import {
  WritingImageCropEditor,
  type WritingCropPreviewVariant,
} from './WritingImageCropEditor';
import type { ImageCropFrame } from '../../lib/writingImageFrame';

interface WritingImageFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<void>;
  onClear?: () => void;
  hint?: string;
  crop?: ImageCropFrame | null;
  onCropChange?: (crop: ImageCropFrame | null) => void;
  cropPreview?: WritingCropPreviewVariant;
}

export function WritingImageField({
  id,
  label,
  value,
  onChange,
  onUpload,
  onClear,
  hint,
  crop,
  onCropChange,
  cropPreview = 'figure-inline',
}: WritingImageFieldProps) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {value && onCropChange ? (
        <WritingImageCropEditor
          src={value}
          crop={crop}
          onCropChange={onCropChange}
          previewVariant={cropPreview}
        />
      ) : value ? (
        <div className="modern-writing-image-preview">
          <WritingImage src={value} alt="" className="modern-writing-image-preview__img" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="modern-writing-image-preview__remove"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" aria-hidden />
            Remove
          </Button>
        </div>
      ) : null}
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
      <input
        ref={fileRef}
        id={fileInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onUpload(file);
          e.target.value = '';
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          Upload image
        </Button>
        {value ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange('');
              onCropChange?.(null);
              onClear?.();
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" aria-hidden />
            Remove
          </Button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
