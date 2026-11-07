import React, { useState } from 'react';

export interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded-square';
  className?: string;
  border?: boolean;
  statusBadge?: 'active' | 'pending' | 'suspended' | 'left' | 'rejected' | null;
}

export const DEFAULT_AVATAR_PATH = '/assets/default-avatar.png';

/**
 * Resolves avatar URL.
 * Preserves genuine user uploads (data URIs, custom uploads, etc.)
 * Filters out legacy AI-generated realistic Unsplash face photos in favor of the illustrated avatar.
 */
export function resolveAvatarSrc(src?: string | null): string {
  if (!src || !src.trim()) {
    return DEFAULT_AVATAR_PATH;
  }
  // Filter out legacy AI realistic human stock photos from Unsplash
  if (
    src.includes('images.unsplash.com/photo-') &&
    !src.includes('photo-1618005182384') && // keep non-face graphics if any
    !src.includes('photo-1576091160399') &&
    !src.includes('photo-1518770660439')
  ) {
    return DEFAULT_AVATAR_PATH;
  }
  return src;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = 'User profile',
  size = 'md',
  shape = 'rounded-square',
  className = '',
  border = true,
  statusBadge,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };

  const shapeClasses =
    shape === 'circle'
      ? 'rounded-full'
      : 'rounded-2xl';

  const borderClasses = border
    ? 'border-2 border-purple-200 shadow-xs'
    : '';

  const finalSrc = imgError ? DEFAULT_AVATAR_PATH : resolveAvatarSrc(src);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={finalSrc}
        alt={alt}
        onError={() => setImgError(true)}
        className={`${sizeClasses[size]} ${shapeClasses} ${borderClasses} object-cover object-center bg-purple-50/50`}
      />
      {statusBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
            statusBadge === 'active'
              ? 'bg-emerald-500'
              : statusBadge === 'pending'
              ? 'bg-amber-500'
              : statusBadge === 'left'
              ? 'bg-slate-400'
              : 'bg-red-500'
          }`}
        />
      )}
    </div>
  );
};

export default UserAvatar;
