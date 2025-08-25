import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { scale, verticalScale } from '../constants/Responsive';
import AnimatedBackground from './AnimatedBackground';

const PlaceholderModal = ({ visible, onClose, title, data, onItemPress, language = 'serbian', isDarkMode = true }) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  // Translations
  const translations = {
    serbian: {
      noPlayersToRate: 'Nema igraca za oceniti',
      ratePlayers: 'Oceni igrace'
    },
    english: {
      noPlayersToRate: 'No players to rate',
      ratePlayers: 'Rate players'
    }
  };

  const t = translations[language] || translations.serbian;

  useEffect(() => {
    if (visible && data) {
      setLoading(true);
      // Simulate loading
      setTimeout(() => {
        setItems(data);
        setLoading(false);
      }, 500);
    } else if (visible) {
      setLoading(false);
      setItems([]);
    }
  }, [visible, data]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: isDarkMode ? '#2a3441' : '#fff', borderRadius: scale(18), padding: scale(24), width: '90%', maxWidth: 500, height: '70%' }}>
          {/* Header with centered title and close button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(24) }}>
            <View style={{ flex: 1 }} />
            <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 20, textAlign: 'center', letterSpacing: 0.8, flex: 2 }}>{t.ratePlayers}</Text>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, alignItems: 'flex-end' }}>
              <Ionicons name="close" size={28} color="#FFFF00" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#FFFF00" style={{ marginTop: 32 }} />
          ) : items.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(20) }}>
              <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 18, textAlign: 'center', lineHeight: 24 }}>{t.noPlayersToRate}</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.id || index}
                  onPress={() => onItemPress && onItemPress(item)}
                  style={{
                    backgroundColor: isDarkMode ? '#232b3b' : '#f5f5f5',
                    borderRadius: scale(12),
                    padding: scale(16),
                    marginBottom: scale(12),
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 15, letterSpacing: 0.5 }}>{item.name} {item.surname}</Text>
                    {item.username && (
                      <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: 15, marginTop: 2, fontWeight: '300' }}>@{item.username}</Text>
                    )}
                    {item.rating && (
                      <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 15, marginTop: 2, fontWeight: '300' }}>Ocena: {item.rating}</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#FFFF00" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PlaceholderModal; 