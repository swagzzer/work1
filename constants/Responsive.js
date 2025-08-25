import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~375x812 device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const scale = size => (width / guidelineBaseWidth) * size;
export const verticalScale = size => (height / guidelineBaseHeight) * size;
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;
export const responsiveFontSize = size => Math.round(PixelRatio.roundToNearestPixel((size * width) / guidelineBaseWidth));

// New: cappedFontSize utility
export const cappedFontSize = (size, max = 22) => Math.min(responsiveFontSize(size), max);

export const CONTENT_WIDTH = scale(340); 