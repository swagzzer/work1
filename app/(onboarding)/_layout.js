import { Stack } from 'expo-router';
import React from 'react';

// This is the layout for the onboarding flow (sport selection, questionnaire).
const OnboardingLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sport-selection" />
      <Stack.Screen name="questionnaire" />
    </Stack>
  );
};

export default OnboardingLayout; 