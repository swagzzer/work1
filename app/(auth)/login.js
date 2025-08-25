import React from 'react';
import { Text, View } from 'react-native';
import AnimatedBackground from '../../components/AnimatedBackground';
import { responsiveFontSize } from '../../constants/Responsive';

export default function LoginScreen() {
  return (
    <AnimatedBackground>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: responsiveFontSize(20) }} numberOfLines={1} ellipsizeMode="tail">Login screen</Text>
      </View>
    </AnimatedBackground>
  );
} 