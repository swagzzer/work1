import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import AnimatedBackground from '../components/AnimatedBackground';
import { supabase } from '../services/supabaseClient';

const LoggingOutScreen = () => {
  useEffect(() => {
    const performLogout = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        // Set last_active to 1 second in the past
        await supabase.from('profiles').update({ last_active: new Date(Date.now() - 1000).toISOString() }).eq('id', user.id);
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Even if there's an error, try to redirect to login
        router.replace('/');
      } else {
        router.replace('/');
      }
    };

    // Give a brief moment for the screen to render before starting logout
    // This ensures a smoother visual transition
    setTimeout(performLogout, 50); 
  }, []);

  return (
    <AnimatedBackground />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoggingOutScreen;
