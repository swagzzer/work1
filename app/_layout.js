import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableSearchFAB, { SearchModal } from '../components/DraggableSearchFAB';
import { preloadUserProfile } from '../services/profilePreload';
import { supabase } from '../services/supabaseClient';
import { ProfileRefreshProvider } from './context/ProfileRefreshContext';
import { UserProfileProvider, useUserProfile } from './context/UserProfileContext';

export const ThemeContext = createContext();

SplashScreen.preventAutoHideAsync();

function PreloadProfileOnLogin({ isAuthenticated }) {
  const { setPreloadedProfile } = useUserProfile();
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      const preloaded = await preloadUserProfile();
      if (!cancelled && preloaded) {
        setPreloadedProfile(preloaded);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, setPreloadedProfile]);
  return null;
}

export default function RootLayout() {
  // The custom fonts are not in the project, so I've temporarily disabled loading them to prevent a crash.
  // const [loaded, error] = useFonts({
  //   'mon': require('../assets/fonts/Montserrat-Regular.ttf'),
  //   'mon-sb': require('../assets/fonts/Montserrat-SemiBold.ttf'),
  //   'mon-b': require('../assets/fonts/Montserrat-Bold.ttf'),
  // });

  const [theme, setTheme] = useState('dark');
  
  // Load theme from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('isDarkMode');
        if (savedMode !== null) {
          const isDark = JSON.parse(savedMode);
          setTheme(isDark ? 'dark' : 'light');
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);
  
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newTheme === 'dark'));
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const [searchVisible, setSearchVisible] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Hiding the splash screen, since font loading is disabled.
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      } else {
        setCurrentUserId(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const { data, error } = await supabase.from('profiles').select('id, username, name, surname');
      if (!error && data) setAllUsers(data);
    })();
  }, [isAuthenticated]);

  return (
    <ProfileRefreshProvider>
      <UserProfileProvider>
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
          <PreloadProfileOnLogin isAuthenticated={isAuthenticated} />
          <View style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
              <Stack.Screen name="(onboarding)/sport-selection" options={{ headerShown: false }} />
              <Stack.Screen name="logging-out" options={{ headerShown: false }} />
              <Stack.Screen name="profile/[userId]" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            {isAuthenticated && (
              <>
                <DraggableSearchFAB setSearchVisible={setSearchVisible} />
                {searchVisible && (
                  <SearchModal
                    visible={searchVisible}
                    onClose={() => setSearchVisible(false)}
                    allUsers={allUsers}
                    currentUserId={currentUserId}
                    isDarkMode={theme === 'dark'}
                    onUserSelect={(user) => {
                      setSearchVisible(false);
                      router.push(`/profile/${user.id}`);
                    }}
                  />
                )}
              </>
            )}
          </View>
        </ThemeContext.Provider>
      </UserProfileProvider>
    </ProfileRefreshProvider>
  );
}

// Keep the rest of your file if there's more to it... 