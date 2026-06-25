"use client";

import { Check, Crop as CropIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactCrop, { type Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface MediaPreviewProps {
  // Preview
  previewUrl: string;
  isVideo: boolean;
  isGif: boolean;
  onTriggerCrop: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;

  // Crop modal
  isCropping: boolean;
  srcUrl: string | null;
  crop: Crop | undefined;
  imgRef: React.RefObject<HTMLImageElement|null>;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: PixelCrop) => void;
  onCropSave: () => void;
  onCropCancel: () => void;
}

export default function MediaPreview({
  previewUrl,
  isVideo,
  isGif,
  onTriggerCrop,
  onRemove,
  isCropping,
  srcUrl,
  crop,
  imgRef,
  onImageLoad,
  onCropChange,
  onCropComplete,
  onCropSave,
  onCropCancel,
}: MediaPreviewProps) {
  const { t } = useTranslation('common');

  return (
    <>
      {/* Zone d'aperçu */}
      <div className="relative my-3 w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 group">
        {isVideo ? (
          <video
            src={previewUrl}
            controls
            muted
            className="w-full h-full object-contain max-h-[50vh]"
          />
        ) : (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-contain max-h-[50vh]"
          />
        )}

        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {!isVideo && !isGif && (
            <button
              type="button"
              onClick={onTriggerCrop}
              className="p-1.5 rounded-full bg-black/70 hover:bg-black/80 text-white transition-colors backdrop-blur-sm"
              title={t('edit.ajust_image')}
            >
              <CropIcon size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-full bg-black/70 hover:bg-black/80 text-white transition-colors backdrop-blur-sm"
            title={t('media.remove')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Modale de recadrage */}
      {isCropping && srcUrl && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full flex flex-col max-h-[90vh]">
            <h3 className="text-lg font-bold mb-3 text-gray-900">{t('edit.ajust_image')}</h3>
            <div className="overflow-auto flex-1 flex justify-center items-center bg-gray-100 rounded-xl p-2">
              <ReactCrop
                crop={crop}
                onChange={onCropChange}
                onComplete={onCropComplete}
                aspect={16 / 9}
              >
                <img
                  ref={imgRef}
                  src={srcUrl}
                  alt="Crop target"
                  onLoad={onImageLoad}
                  className="max-h-[50vh] object-contain"
                />
              </ReactCrop>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onCropCancel}
                className="px-4 py-2 border border-gray-300 rounded-full text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t('edit.cancel')}
              </button>
              <button
                type="button"
                onClick={onCropSave}
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-full text-sm font-semibold flex items-center gap-1"
              >
                <Check size={16} /> {t('edit.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}