'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
  showLoadingState?: boolean;
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:2' | 'auto';
  containerClassName?: string;
}

const aspectRatioClasses = {
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '16:9': 'aspect-video',
  '3:2': 'aspect-[3/2]',
  'auto': '',
};

/**
 * Optimized Image component with:
 * - Automatic lazy loading
 * - Blur placeholder support
 * - Error fallback
 * - Loading state
 * - Responsive sizing
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  showLoadingState = true,
  aspectRatio = 'auto',
  className,
  containerClassName,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {showLoadingState && isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? undefined : 'lazy'}
        priority={priority}
        {...props}
      />
    </div>
  );
}

/**
 * Avatar image with circular crop and fallback
 */
interface AvatarImageProps extends Omit<OptimizedImageProps, 'aspectRatio'> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackInitials?: string;
}

const avatarSizes = {
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-base' },
  xl: { container: 'w-16 h-16', text: 'text-lg' },
};

export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallbackInitials,
  className,
  ...props
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);
  const sizeConfig = avatarSizes[size];

  if (!src || hasError) {
    const initials = fallbackInitials || alt?.charAt(0).toUpperCase() || '?';
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium',
          sizeConfig.container,
          sizeConfig.text,
          className
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeConfig.container)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${parseInt(sizeConfig.container.split('-')[1]) * 4}px`}
        className={cn('object-cover', className)}
        onError={() => setHasError(true)}
        {...props}
      />
    </div>
  );
}

/**
 * Background image component for hero sections
 */
interface BackgroundImageProps {
  src: string;
  alt: string;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  priority?: boolean;
}

export function BackgroundImage({
  src,
  alt,
  children,
  className,
  overlayClassName,
  priority = false,
}: BackgroundImageProps) {
  return (
    <div className={cn('relative', className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="100vw"
      />
      <div className={cn('absolute inset-0 bg-black/50', overlayClassName)} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default OptimizedImage;
