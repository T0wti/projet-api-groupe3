'use client';

import { useState, useEffect } from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const DEFAULT_AVATAR = '/images/default-avatar.png';

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-32 h-32',
};

export default function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  const [imgSrc, setImgSrc] = useState(src || DEFAULT_AVATAR);

  useEffect(() => {
    setImgSrc(src || DEFAULT_AVATAR);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(DEFAULT_AVATAR)}
      className={`${sizeClasses[size]} rounded-full object-cover bg-gray-200 shrink-0`}
    />
  );
}
