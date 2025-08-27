import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CONTENT_WIDTH, cappedFontSize } from '../constants/Responsive';

const buttonWidth = (CONTENT_WIDTH / 2) - 12;
const buttonFontSize = cappedFontSize(13, 15);

const QuickActions = ({
  onInviteFriends,
  onRatePlayers,
  onTestPayment,
  onShowRankList,
  onShowMatchHistory,
  isDarkMode = true,
  t,
}) => (
  <>
    <View style={{ width: CONTENT_WIDTH, alignSelf: 'center' }}>
      <Text style={{ 
        color: '#FFFF00', 
        fontWeight: '600', 
        fontSize: cappedFontSize(17, 18), 
        alignSelf: 'flex-start', 
        marginLeft: 0, 
        marginTop: 8, 
        marginBottom: 8, 
        letterSpacing: 0.8,
        // Enhanced styling for eye-catching appearance
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        // Alternative: Add a subtle glow effect
        // textShadowColor: '#FFFF00',
        // textShadowOffset: { width: 0, height: 0 },
        // textShadowRadius: 8,
      }}>{t.quickActions}</Text>
    </View>
    <View style={{ width: CONTENT_WIDTH, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: -56 }}>
      <TouchableOpacity style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 18, width: buttonWidth, height: 90, marginBottom: 16, padding: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 }} onPress={onInviteFriends}>
        <Ionicons name="person-add" size={32} color="#FFFF00" style={{ marginBottom: 8 }} />
        <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: buttonFontSize, flexShrink: 1, textAlign: 'center', letterSpacing: 0.5 }} numberOfLines={1} ellipsizeMode="tail">{t.inviteFriendsAction}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 18, width: buttonWidth, height: 90, marginBottom: 16, padding: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 }} onPress={onRatePlayers}>
        <Ionicons name="star" size={32} color="#FFFF00" style={{ marginBottom: 8 }} />
        <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: buttonFontSize, flexShrink: 1, textAlign: 'center', letterSpacing: 0.5 }} numberOfLines={1} ellipsizeMode="tail">{t.ratePlayers}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 18, width: buttonWidth, height: 90, marginBottom: 16, padding: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 }} onPress={onShowRankList}>
        <Ionicons name="trophy" size={32} color="#FFFF00" style={{ marginBottom: 8 }} />
        <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: buttonFontSize, flexShrink: 1, textAlign: 'center', letterSpacing: 0.5 }} numberOfLines={1} ellipsizeMode="tail">{t.rankList}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 18, width: buttonWidth, height: 90, marginBottom: 16, padding: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 }} onPress={onShowMatchHistory}>
        <Ionicons name="time" size={32} color="#FFFF00" style={{ marginBottom: 8 }} />
        <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: buttonFontSize, flexShrink: 1, textAlign: 'center', letterSpacing: 0.5 }} numberOfLines={1} ellipsizeMode="tail">{t.matchHistory}</Text>
      </TouchableOpacity>
    </View>
  </>
);

export default QuickActions; 