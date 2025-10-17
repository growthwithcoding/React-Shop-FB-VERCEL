// ImageWithFallback.jsx
// ------------------------------------------------------------
// WHAT THIS DOES:
// A reusable image component with automatic fallback to placeholder API
// when images fail to load. Provides consistent error handling across the app.
// ------------------------------------------------------------

import { useState } from 'react';
import PropTypes from 'prop-types';
import { getPlaceholderUrl } from '../utils/placeholder';

/**
 * ImageWithFallback Component
 * Automatically falls back to placeholder API when images fail to load
 */
export default function ImageWithFallback({
  src,
  alt = 'Image',
  width = 400,
  height = 300,
  fallbackText = 'Image Unavailable',
  bgColor = 'f5f5f5',
  textColor = '999999',
  className = '',
  style = {},
  loading = 'lazy',
  onError,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasErrored, setHasErrored] = useState(false);

  /**
   * Handle image load error
   * Falls back to placeholder API
   */
  const handleError = (e) => {
    // Prevent infinite loop if placeholder also fails
    if (!hasErrored) {
      setHasErrored(true);
      const placeholderUrl = getPlaceholderUrl(width, height, fallbackText, bgColor, textColor);
      setImgSrc(placeholderUrl);
      
      // Call custom onError handler if provided
      if (onError) {
        onError(e);
      }
    }
  };

  /**
   * Handle successful image load
   * Reset error state if image loads successfully after a retry
   */
  const handleLoad = () => {
    setHasErrored(false);
  };

  // If no src provided, use placeholder immediately
  const finalSrc = !src || src.trim() === '' 
    ? getPlaceholderUrl(width, height, fallbackText, bgColor, textColor)
    : imgSrc;

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      style={{
        backgroundColor: `#${bgColor}`,
        width: width,
        height: height,
        maxWidth: width,
        maxHeight: height,
        ...style
      }}
      loading={loading}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
}

ImageWithFallback.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  fallbackText: PropTypes.string,
  bgColor: PropTypes.string,
  textColor: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  loading: PropTypes.string,
  onError: PropTypes.func,
};
