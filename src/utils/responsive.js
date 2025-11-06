import { useWindowDimensions } from 'react-native';

// Figma design base dimensions
const DESIGN_WIDTH = 393;  // iPhone 14 Pro
const DESIGN_HEIGHT = 852;

/**
 * Hook for responsive layout based on Figma design dimensions
 * Scales down for smaller screens, keeps design size for larger screens
 */
export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();

  // Calculate scale factor (1.0 max, scales down for smaller screens)
  const scaleX = Math.min(width / DESIGN_WIDTH, 1);
  const scaleY = Math.min(height / DESIGN_HEIGHT, 1);
  const scale = Math.min(scaleX, scaleY);

  return {
    screenWidth: width,
    screenHeight: height,
    scale,
    /**
     * Scale a size value for responsive design
     * @param {number} size - Original size from Figma design
     * @returns {number} - Scaled size (rounded)
     */
    scaleSize: (size) => Math.round(size * scale),
    /**
     * Calculate responsive width percentage
     * @param {number} percent - Width percentage (0-100)
     * @returns {number} - Calculated width
     */
    widthPercent: (percent) => Math.round((width * percent) / 100),
    /**
     * Calculate responsive height percentage
     * @param {number} percent - Height percentage (0-100)
     * @returns {number} - Calculated height
     */
    heightPercent: (percent) => Math.round((height * percent) / 100),
  };
};

/**
 * Direct size scaling without dimension hook
 * Use when hook is not available
 */
export const scaleFigmaSize = (size, screenWidth = 393) => {
  const scale = Math.min(screenWidth / DESIGN_WIDTH, 1);
  return Math.round(size * scale);
};
