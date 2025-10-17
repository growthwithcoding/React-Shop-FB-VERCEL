// placeholder.js
// ------------------------------------------------------------
// WHAT THIS DOES:
// Utility function for generating placeholder API URLs
// ------------------------------------------------------------

/**
 * Generate placeholder URL using placeholder.co API
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Text to display in placeholder
 * @param {string} bgColor - Background color (hex without #)
 * @param {string} textColor - Text color (hex without #)
 * @returns {string} Placeholder URL
 */
export const getPlaceholderUrl = (width = 400, height = 300, text = 'No Image', bgColor = 'cccccc', textColor = '666666') => {
  // Use placehold.co API - it's reliable and doesn't require authentication
  // Format: https://placehold.co/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=TEXT
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodedText}`;
};
