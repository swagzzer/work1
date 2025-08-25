import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const AnimatedBackground = ({ children, isDarkMode = true }) => {
  if (isDarkMode) {
    return (
      <>
        {/* Main dark blue background - matching settings modal */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#232b3b' }]} />
        
        {/* Minimalistic yellow design details */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(255, 255, 0, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Subtle yellow accent lines */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: 'rgba(255, 255, 0, 0.1)',
        }} />
        
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255, 255, 0, 0.05)',
        }} />
        
        <>{children}</>
      </>
    );
  } else {
    return (
      <>
        {/* Main white background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }]} />
        
        {/* Minimalistic yellow design details */}
        <LinearGradient
          colors={['transparent', 'transparent', 'rgba(255, 255, 0, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Subtle yellow accent lines */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: 'rgba(255, 255, 0, 0.15)',
        }} />
        
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: 'rgba(255, 255, 0, 0.08)',
        }} />
        
        <>{children}</>
      </>
    );
  }
};

export default AnimatedBackground; 