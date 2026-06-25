import { useState, useRef, useEffect } from 'react';
import { centerCrop, makeAspectCrop, type Crop, PixelCrop } from 'react-image-crop';

export interface UseMediaPickerReturn {
  // State
  selectedFile: File | null;
  previewUrl: string | null;
  isCropping: boolean;
  srcUrl: string | null;
  crop: Crop | undefined;
  completedCrop: PixelCrop | null;
  isVideo: boolean;
  isGif: boolean;

  // Refs
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;

  // Handlers
  handleIconClick: (e: React.MouseEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTriggerCrop: (e: React.MouseEvent) => void;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  handleCropComplete: () => Promise<void>;
  handleRemoveImage: (e: React.MouseEvent) => void;
  cancelCrop: () => void;
  setCrop: (crop: Crop) => void;
  setCompletedCrop: (crop: PixelCrop) => void;

  // Reset (utile après soumission)
  reset: () => void;
}

export function useMediaPicker(): UseMediaPickerReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleTriggerCrop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setSrcUrl(reader.result as string);
      setIsCropping(true);
    });
    reader.readAsDataURL(selectedFile);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 16 / 9, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-image.jpeg', { type: 'image/jpeg' });
          setSelectedFile(croppedFile);
          setIsCropping(false);
          setSrcUrl(null);
        }
        resolve();
      }, 'image/jpeg', 0.9);
    });
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelCrop = () => {
    setIsCropping(false);
    setSrcUrl(null);
  };

  const reset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isVideo = selectedFile?.type.startsWith('video/') ?? false;
  const isGif = selectedFile?.type === 'image/gif';

  return {
    selectedFile,
    previewUrl,
    isCropping,
    srcUrl,
    crop,
    completedCrop,
    isVideo,
    isGif,
    fileInputRef,
    imgRef,
    handleIconClick,
    handleFileChange,
    handleTriggerCrop,
    onImageLoad,
    handleCropComplete,
    handleRemoveImage,
    cancelCrop,
    setCrop,
    setCompletedCrop,
    reset,
  };
}