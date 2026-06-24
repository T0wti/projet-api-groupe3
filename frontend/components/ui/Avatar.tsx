'use client';

import { useState } from 'react';

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
  const resolvedSrc = src || DEFAULT_AVATAR;
  const [imgSrc, setImgSrc] = useState(resolvedSrc);

  if (imgSrc !== resolvedSrc && imgSrc !== DEFAULT_AVATAR) {
    setImgSrc(resolvedSrc);
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(DEFAULT_AVATAR)}
      className={`${sizeClasses[size]} rounded-full object-cover app-surface-muted shrink-0`}
    />
  );
}
