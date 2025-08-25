import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { responsiveFontSize } from '../../constants/Responsive';

// Language translations for navigation
const getTabTitles = (language) => {
  const translations = {
    serbian: {
      home: 'Pocetna',
      matches: 'Mecevi',
      messages: 'Poruke',
      profile: 'Profil',
    },
    english: {
      home: 'Home',
      matches: 'Matches',
      messages: 'Messages',
      profile: 'Profile',
    }
  };
  return translations[language] || translations.serbian;
};

const TabsLayout = () => {
  const [unread, setUnread] = React.useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState('serbian');

  // Load dark mode and language preferences from storage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('isDarkMode');
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedMode !== null) {
          setIsDarkMode(JSON.parse(savedMode));
        }
        if (savedLanguage !== null) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Listen for preference changes with a longer interval
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const savedMode = await AsyncStorage.getItem('isDarkMode');
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedMode !== null) {
          const newMode = JSON.parse(savedMode);
          if (newMode !== isDarkMode) {
            setIsDarkMode(newMode);
          }
        }
        if (savedLanguage !== null && savedLanguage !== language) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Error checking preferences:', error);
      }
    }, 500); // Check every 500ms for faster response

    return () => clearInterval(interval);
  }, [isDarkMode, language]);

  // Save dark mode preference to storage
  const saveDarkMode = async (mode) => {
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(mode));
    } catch (error) {
      console.log('Error saving dark mode preference:', error);
    }
  };



  const tabTitles = getTabTitles(language);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'index') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'matches') {
            iconName = focused ? 'tennisball' : 'tennisball-outline';
          } else if (route.name === 'messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={focused ? '#FFFF00' : (isDarkMode ? '#fff' : '#000')} />;
        },
        headerShown: false,
        tabBarActiveTintColor: '#FFFF00',
        tabBarInactiveTintColor: isDarkMode ? '#fff' : '#000',
        tabBarLabelStyle: { fontWeight: '300', fontSize: responsiveFontSize(12), letterSpacing: 0.5 },
        tabBarStyle: {
          borderTopWidth: 2,
          borderTopColor: '#FFFF00',
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: isDarkMode ? '#2a3441' : '#FFFFFF' }} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: tabTitles.home }} />
      <Tabs.Screen name="matches" options={{ title: tabTitles.matches }} />
      <Tabs.Screen name="messages" options={{ title: tabTitles.messages }} />
      <Tabs.Screen name="profile" options={{ title: tabTitles.profile }} />
    </Tabs>
  );
};

export default TabsLayout; 