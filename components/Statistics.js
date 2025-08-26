import React from 'react';
import { Text, View } from 'react-native';
import { cappedFontSize, CONTENT_WIDTH, scale, verticalScale } from '../constants/Responsive';

const Statistics = ({ stats, onlineFriendsCount, isDarkMode = true, t }) => {
  return (
    <>
      <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: cappedFontSize(18, 19), alignSelf: 'flex-start', marginLeft: 0, marginTop: verticalScale(8), marginBottom: verticalScale(8), letterSpacing: 0.8 }}>{t.statistics}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: CONTENT_WIDTH, marginBottom: 0 }}>
        <View style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(18), width: scale(165), height: verticalScale(90), marginBottom: verticalScale(16), padding: scale(16), justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: cappedFontSize(24, 20), letterSpacing: 0.5 }}>{onlineFriendsCount}</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '300', fontSize: cappedFontSize(14, 15), marginLeft: 8 }} numberOfLines={1} ellipsizeMode="tail">{t.onlineFriends}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(18), width: scale(165), height: verticalScale(90), marginBottom: verticalScale(16), padding: scale(16), justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
            <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: cappedFontSize(24, 20), letterSpacing: 0.5 }}>{stats.active}</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '300', fontSize: cappedFontSize(14, 15), marginLeft: 8 }} numberOfLines={1} ellipsizeMode="tail">{t.activePlayers}</Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default Statistics; 