import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { cappedFontSize, CONTENT_WIDTH, scale, verticalScale } from '../constants/Responsive';

const TodaysMatches = ({ matches, onSeeAll, isDarkMode = true, t }) => {
  const router = useRouter();

  const handleSeeAll = () => {
    // Navigate to the 'matches' tab
    router.push('/(tabs)/matches');
  };

  return (
    <>
      <View style={{ width: CONTENT_WIDTH, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: verticalScale(16) }}>
        <Text style={{ 
          color: '#000', 
          fontWeight: '700', 
          fontSize: cappedFontSize(20, 22), 
          alignSelf: 'flex-start', 
          marginLeft: 0, 
          marginTop: verticalScale(8), 
          marginBottom: verticalScale(8), 
          letterSpacing: 0.5,
        }}>{t?.todayMatchesTitle || 'Featured Matches'}</Text>
        <TouchableOpacity 
          onPress={handleSeeAll}
          style={{
            backgroundColor: 'transparent',
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ 
            color: '#00D4AA', 
            fontSize: cappedFontSize(16, 17),
            fontWeight: '600',
            textAlign: 'center',
          }}>{t?.seeAll || 'See All'} &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: CONTENT_WIDTH, marginBottom: verticalScale(16) }}>
        <View style={{ 
          backgroundColor: '#fff', 
          borderRadius: scale(20), 
          padding: scale(28), 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: CONTENT_WIDTH,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <View style={{ 
            width: scale(60), 
            height: scale(60), 
            borderRadius: scale(30), 
            backgroundColor: '#F5F5F5', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: scale(16)
          }}>
            <Ionicons name="calendar" size={scale(30)} color="#666" />
          </View>
          <Text style={{ 
            color: '#000', 
            fontWeight: '700', 
            fontSize: cappedFontSize(18, 19), 
            marginBottom: scale(8), 
            textAlign: 'center',
            letterSpacing: 0.5,
          }}>{t?.noFeaturedMatches || 'No featured matches yet'}</Text>
          <Text style={{ 
            color: '#666', 
            fontWeight: '400', 
            fontSize: cappedFontSize(14, 15), 
            textAlign: 'center',
            lineHeight: 20,
          }}>Create a match to get started!</Text>
        </View>
      </View>
    </>
  );
}

export default TodaysMatches; 