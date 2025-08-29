import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { CONTENT_WIDTH, cappedFontSize, scale } from '../constants/Responsive';

const buttonWidth = (CONTENT_WIDTH / 2) - 12;
const buttonHeight = 120;

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
        color: '#000', 
        fontWeight: '700', 
        fontSize: cappedFontSize(20, 22), 
        alignSelf: 'flex-start', 
        marginLeft: 0, 
        marginTop: 16, 
        marginBottom: 16, 
        letterSpacing: 0.5,
      }}>Quick Actions</Text>
    </View>
    <View style={{ 
      width: CONTENT_WIDTH, 
      alignSelf: 'center', 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      justifyContent: 'space-between', 
      marginBottom: 20 
    }}>
      {/* Invite Friends - Green */}
      <TouchableOpacity 
        style={{ 
          width: buttonWidth, 
          height: buttonHeight, 
          borderRadius: 20, 
          marginBottom: 16, 
          padding: 16, 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#10B981',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }} 
        onPress={onInviteFriends}
      >
        <View style={{ 
          position: 'relative', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 8
        }}>
          <View style={{ 
            width: scale(40), 
            height: scale(40), 
            borderRadius: scale(20), 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: 8
          }}>
            <Ionicons name="person-add" size={scale(24)} color="#fff" />
          </View>
          <View style={{ 
            position: 'absolute', 
            top: -8, 
            right: -8, 
            backgroundColor: '#34D399', 
            borderRadius: 12, 
            paddingVertical: 4, 
            paddingHorizontal: 8
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Share</Text>
          </View>
        </View>
        <Text style={{ 
          color: '#fff', 
          fontWeight: '700', 
          fontSize: cappedFontSize(16, 17), 
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {t?.inviteFriendsTitle || 'Invite Friends'}
        </Text>
        <Text style={{ 
          color: 'rgba(255,255,255,0.8)', 
          fontWeight: '400', 
          fontSize: cappedFontSize(12, 13), 
          textAlign: 'center',
        }}>
          {t?.shareAppLink || 'Share app link'}
        </Text>
      </TouchableOpacity>

      {/* Rate Players - Blue */}
      <TouchableOpacity 
        style={{ 
          width: buttonWidth, 
          height: buttonHeight, 
          borderRadius: 20, 
          marginBottom: 16, 
          padding: 16, 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#3B82F6',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }} 
        onPress={onRatePlayers}
      >
        <View style={{ 
          position: 'relative', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 8
        }}>
          <View style={{ 
            width: scale(40), 
            height: scale(40), 
            borderRadius: scale(20), 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: 8
          }}>
            <Ionicons name="star" size={scale(24)} color="#fff" />
          </View>
          <View style={{ 
            position: 'absolute', 
            top: -8, 
            right: -8, 
            backgroundColor: '#60A5FA', 
            borderRadius: 12, 
            paddingVertical: 4, 
            paddingHorizontal: 8
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Rate</Text>
          </View>
        </View>
        <Text style={{ 
          color: '#fff', 
          fontWeight: '700', 
          fontSize: cappedFontSize(16, 17), 
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {t?.ratePlayersTitle || 'Rate Players'}
        </Text>
        <Text style={{ 
          color: 'rgba(255,255,255,0.8)', 
          fontWeight: '400', 
          fontSize: cappedFontSize(12, 13), 
          textAlign: 'center',
        }}>
          {t?.rateWhoYouPlayed || 'Rate who you played'}
        </Text>
      </TouchableOpacity>

      {/* Leaderboard - Orange */}
      <TouchableOpacity 
        style={{ 
          width: buttonWidth, 
          height: buttonHeight, 
          borderRadius: 20, 
          marginBottom: 16, 
          padding: 16, 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#F59E0B',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }} 
        onPress={onShowRankList}
      >
        <View style={{ 
          position: 'relative', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 8
        }}>
          <View style={{ 
            width: scale(40), 
            height: scale(40), 
            borderRadius: scale(20), 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: 8
          }}>
            <Ionicons name="trophy" size={scale(24)} color="#fff" />
          </View>
          <View style={{ 
            position: 'absolute', 
            top: -8, 
            right: -8, 
            backgroundColor: '#FBBF24', 
            borderRadius: 12, 
            paddingVertical: 4, 
            paddingHorizontal: 8
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Top</Text>
          </View>
        </View>
        <Text style={{ 
          color: '#fff', 
          fontWeight: '700', 
          fontSize: cappedFontSize(16, 17), 
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {t?.leaderboard || 'Leaderboard'}
        </Text>
        <Text style={{ 
          color: 'rgba(255,255,255,0.8)', 
          fontWeight: '400', 
          fontSize: cappedFontSize(12, 13), 
          textAlign: 'center',
        }}>
          {t?.seeSportRankings || 'See sport rankings'}
        </Text>
      </TouchableOpacity>

      {/* Match History - Purple */}
      <TouchableOpacity 
        style={{ 
          width: buttonWidth, 
          height: buttonHeight, 
          borderRadius: 20, 
          marginBottom: 16, 
          padding: 16, 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#8B5CF6',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }} 
        onPress={onShowMatchHistory}
      >
        <View style={{ 
          position: 'relative', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 8
        }}>
          <View style={{ 
            width: scale(40), 
            height: scale(40), 
            borderRadius: scale(20), 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: 8
          }}>
            <Ionicons name="time" size={scale(24)} color="#fff" />
          </View>
          <View style={{ 
            position: 'absolute', 
            top: -8, 
            right: -8, 
            backgroundColor: '#A78BFA', 
            borderRadius: 12, 
            paddingVertical: 4, 
            paddingHorizontal: 8
          }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>History</Text>
          </View>
        </View>
        <Text style={{ 
          color: '#fff', 
          fontWeight: '700', 
          fontSize: cappedFontSize(16, 17), 
          textAlign: 'center',
          marginBottom: 4,
        }}>
          {t?.matchHistoryTitle || 'Match History'}
        </Text>
        <Text style={{ 
          color: 'rgba(255,255,255,0.8)', 
          fontWeight: '400', 
          fontSize: cappedFontSize(12, 13), 
          textAlign: 'center',
        }}>
          Your past matches
        </Text>
      </TouchableOpacity>
    </View>
  </>
);

export default QuickActions; 