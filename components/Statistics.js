import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { cappedFontSize, CONTENT_WIDTH, scale } from '../constants/Responsive';

const Statistics = ({ stats, onlineFriendsCount, isDarkMode = true, t }) => {
  return (
    <View style={{ 
      width: CONTENT_WIDTH, 
      backgroundColor: '#fff', 
      borderRadius: scale(20), 
      padding: scale(20), 
      marginTop: scale(-20),
      marginBottom: scale(20),
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        width: '100%'
      }}>
        {/* Active Players */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ 
            width: scale(40), 
            height: scale(40), 
            borderRadius: scale(20), 
            backgroundColor: '#00D4AA', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: scale(8)
          }}>
            <Ionicons name="people" size={scale(20)} color="#fff" />
          </View>
          <Text style={{ 
            color: '#000', 
            fontWeight: '700', 
            fontSize: cappedFontSize(24, 20), 
            marginBottom: scale(4)
          }}>
            {stats.active || 0}
          </Text>
          <Text style={{ 
            color: '#666', 
            fontWeight: '400', 
            fontSize: cappedFontSize(12, 13), 
            textAlign: 'center'
          }}>
            {t?.activePlayers || 'Active Players'}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ 
          width: 1, 
          height: scale(50), 
          backgroundColor: '#E5E5E5' 
        }} />

        {/* Matches Today */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ 
            width: scale(40), 
            height: scale(40), 
            borderRadius: scale(20), 
            backgroundColor: '#8B5CF6', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: scale(8)
          }}>
            <Ionicons name="calendar" size={scale(20)} color="#fff" />
          </View>
          <Text style={{ 
            color: '#000', 
            fontWeight: '700', 
            fontSize: cappedFontSize(24, 20), 
            marginBottom: scale(4)
          }}>
            {stats.matches || 0}
          </Text>
          <Text style={{ 
            color: '#666', 
            fontWeight: '400', 
            fontSize: cappedFontSize(12, 13), 
            textAlign: 'center'
          }}>
            {t?.todayMatches || 'Matches Today'}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ 
          width: 1, 
          height: scale(50), 
          backgroundColor: '#E5E5E5' 
        }} />

        {/* Active Friends */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ 
            width: scale(40), 
            height: scale(40), 
            borderRadius: scale(20), 
            backgroundColor: '#F59E0B', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: scale(8)
          }}>
            <Ionicons name="people" size={scale(20)} color="#fff" />
          </View>
          <Text style={{ 
            color: '#000', 
            fontWeight: '700', 
            fontSize: cappedFontSize(24, 20), 
            marginBottom: scale(4)
          }}>
            {onlineFriendsCount || 0}
          </Text>
          <Text style={{ 
            color: '#666', 
            fontWeight: '400', 
            fontSize: cappedFontSize(12, 13), 
            textAlign: 'center'
          }}>
            {t?.activeFriends || 'Active Friends'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default Statistics; 