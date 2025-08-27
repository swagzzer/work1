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
      <View style={{ width: CONTENT_WIDTH, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: verticalScale(6) }}>
        <Text style={{ 
          color: '#FFFF00', 
          fontWeight: '600', 
          fontSize: cappedFontSize(17, 18), 
          alignSelf: 'flex-start', 
          marginLeft: 0, 
          marginTop: verticalScale(8), 
          marginBottom: verticalScale(8), 
          letterSpacing: 0.8,
          // Enhanced styling for eye-catching appearance
          textShadowColor: 'rgba(0,0,0,0.8)',
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 4,
          // Alternative: Add a subtle glow effect
          // textShadowColor: '#FFFF00',
          // textShadowOffset: { width: 0, height: 0 },
          // textShadowRadius: 8,
        }}>{t.todayMatches}</Text>
        <TouchableOpacity 
          onPress={handleSeeAll}
          style={{
            // Option 1: Match "Igraj sada" button style (currently active)
            backgroundColor: '#2a3441',
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderWidth: 0.5,
            borderColor: '#FFFF00',
            elevation: 2,
            
            // Option 2: Rounded pill style (uncomment to use)
            // backgroundColor: '#2a3441',
            // borderRadius: 20,
            // paddingVertical: 8,
            // paddingHorizontal: 16,
            // borderWidth: 1,
            // borderColor: '#FFFF00',
            
            // Option 3: Minimal outline style (uncomment to use)
            // backgroundColor: 'transparent',
            // borderRadius: 6,
            // paddingVertical: 6,
            // paddingHorizontal: 12,
            // borderWidth: 1.5,
            // borderColor: '#FFFF00',
            
            // Option 4: Filled button style (uncomment to use)
            // backgroundColor: '#FFFF00',
            // borderRadius: 8,
            // paddingVertical: 8,
            // paddingHorizontal: 16,
            // borderWidth: 0,
            
            // Option 5: Card-like style (uncomment to use)
            // backgroundColor: '#2a3441',
            // borderRadius: 12,
            // paddingVertical: 8,
            // paddingHorizontal: 16,
            // borderWidth: 0,
            // shadowColor: '#000',
            // shadowOffset: { width: 0, height: 2 },
            // shadowOpacity: 0.1,
            // shadowRadius: 4,
            // elevation: 3,
          }}
        >
          <Text style={{ 
            color: '#FFFF00', 
            fontSize: cappedFontSize(16, 17),
            fontWeight: '500',
            textAlign: 'center',
            
            // For Option 4 (filled button), change to:
            // color: '#2a3441',
          }}>{t.seeAll}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: CONTENT_WIDTH, marginBottom: verticalScale(6) }}>
        {matches.length === 0 ? (
          <View style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(18), padding: scale(28), alignItems: 'center', justifyContent: 'center', width: CONTENT_WIDTH }}>
            <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: cappedFontSize(16, 17), marginBottom: scale(4), letterSpacing: 0.8 }}>{t.noMatches}</Text>
            <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '300', fontSize: cappedFontSize(15, 16), textAlign: 'center' }}>{t.findOrCreate}</Text>
          </View>
        ) : (
          matches.map(match => (
            <TouchableOpacity
              key={match.id}
              onPress={() => router.push('/matches')}
              style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(18), flexDirection: 'row', alignItems: 'center', padding: scale(20), marginBottom: scale(12) }}
            >
              <View style={{ marginRight: scale(18), alignItems: 'center' }}>
                <Ionicons name="time-outline" size={cappedFontSize(26, 27)} color="#FFFF00" />
                <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: cappedFontSize(16, 17), marginTop: scale(2), letterSpacing: 0.5 }}>{new Date(match.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: cappedFontSize(15, 16), marginBottom: 2, letterSpacing: 0.5 }}>{match.name}</Text>
                <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: cappedFontSize(15, 16), marginBottom: 2 }}>{match.location}</Text>
                <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: cappedFontSize(15, 16) }}>
                  {Array.isArray(match.match_participants) ? match.match_participants.length : 0}/{match.slots}
                </Text>
                {match.level && (
                  <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: cappedFontSize(14, 15), marginTop: 2 }}>{match.level}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={cappedFontSize(26, 27)} color="#FFFF00" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </>
  );
}

export default TodaysMatches; 