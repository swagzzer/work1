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

  const [language, setLanguage] = useState('serbian');

  // Load language preferences from storage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage !== null) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Listen for language preference changes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage !== null && savedLanguage !== language) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Error checking preferences:', error);
      }
    }, 500); // Check every 500ms for faster response

    return () => clearInterval(interval);
  }, [language]);





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

          return <Ionicons name={iconName} size={size} color={focused ? '#FFFF00' : '#fff'} />;
        },
        headerShown: false,
        tabBarActiveTintColor: '#FFFF00',
        tabBarInactiveTintColor: '#fff',
        tabBarLabelStyle: { fontWeight: '300', fontSize: responsiveFontSize(12), letterSpacing: 0.5 },
        tabBarStyle: {
          borderTopWidth: 2,
          borderTopColor: '#FFFF00',
        },
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: '#2a3441' }} />
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