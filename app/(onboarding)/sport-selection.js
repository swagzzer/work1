import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { responsiveFontSize, scale } from '../../constants/Responsive';

const SPORTS = [
  { key: 'Padel', icon: 'tennisball', desc: 'Brza, zabavna igra' },
  { key: 'Fudbal', icon: 'football', desc: 'Tim, energija, golovi' },
  { key: 'Kosarka', icon: 'basketball', desc: 'Skokovi, sutovi, tim' },
  { key: 'Tenis', icon: 'tennisball-outline', desc: 'Preciznost, brzina, solo' },
];

const SportSelectionScreen = () => {
  const [selected, setSelected] = useState(null);
  const [language, setLanguage] = useState('serbian');
  const router = useRouter();

  // Load language preference
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage !== null) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const handleContinue = () => {
    if (selected) {
      router.push({ pathname: '/(onboarding)/questionnaire', params: { sport: selected } });
    }
  };

  return (
    <View style={styles.container}>
              <Text style={[styles.title, { fontWeight: '400', fontSize: 20, letterSpacing: 0.8 }]}>{language === 'english' ? 'Choose sport' : 'Izaberi sport'}</Text>
      <FlatList
        data={SPORTS}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.sportBtn, selected === item.key && styles.selected]}
            onPress={() => setSelected(item.key)}
          >
            <Ionicons name={item.icon} size={32} color={selected === item.key ? '#fff' : '#333'} />
            <Text style={[styles.sportText, selected === item.key && { color: '#fff' }]} numberOfLines={1} ellipsizeMode="tail">{item.key}</Text>
            <Text style={[styles.sportDesc, selected === item.key && { color: '#fff' }]} numberOfLines={1} ellipsizeMode="tail">{item.desc}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.key}
        style={{ width: '100%' }}
        contentContainerStyle={{ alignItems: 'center' }}
      />
      <TouchableOpacity
        style={[styles.continueBtn, !selected && { backgroundColor: '#ccc' }]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.continueText}>Nastavi</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(20),
    backgroundColor: '#181818',
  },
  title: {
    fontSize: responsiveFontSize(26),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scale(20),
  },
  sportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scale(12),
    padding: scale(16),
    marginVertical: scale(8),
    width: scale(300),
    justifyContent: 'space-between',
  },
  selected: {
    backgroundColor: '#00b894',
  },
  sportText: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: '#333',
  },
  sportDesc: {
    fontSize: responsiveFontSize(14),
    color: '#666',
    marginLeft: scale(10),
  },
  continueBtn: {
    marginTop: scale(30),
    backgroundColor: '#00b894',
    paddingVertical: scale(12),
    paddingHorizontal: scale(40),
    borderRadius: scale(8),
  },
  continueText: {
    color: '#fff',
    fontSize: responsiveFontSize(18),
    fontWeight: 'bold',
  },
});

export default SportSelectionScreen; 