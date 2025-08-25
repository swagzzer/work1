import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { cappedFontSize, scale, verticalScale } from '../constants/Responsive';
import AnimatedBackground from './AnimatedBackground';

const STATUS_SIZE = scale(6);

function isFriendOnline(profile) {
  if (!profile || !profile.last_active) return false;
  let lastActive;
  if (typeof profile.last_active === 'string') {
    let ts = profile.last_active;
    if (!ts.endsWith('Z')) ts += 'Z';
    lastActive = Date.parse(ts);
  } else if (typeof profile.last_active === 'number') {
    // If it's in seconds, convert to ms
    lastActive = profile.last_active < 1e12 ? profile.last_active * 1000 : profile.last_active;
  } else {
    return false;
  }
  const now = Date.now();
  return (now - lastActive) < 2 * 60 * 1000;
}

const OnlineFriends = ({ friends, allFriends, isDarkMode = true, t }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { width, height } = Dimensions.get('window');
  const modalWidth = width * 0.85;
  const modalHeight = height * 0.85;
  const router = useRouter();

  // Memoize online/offline separation for performance
  const { online, offline, preview } = useMemo(() => {
    const online = (allFriends || []).filter(f => isFriendOnline(f.profile));
    const offline = (allFriends || []).filter(f => !isFriendOnline(f.profile));
    const preview = [...online, ...offline].slice(0, 3);
    return { online, offline, preview };
  }, [allFriends]);

  // Force re-render when friends data changes (e.g., when avatars are updated)
  useEffect(() => {
    // This will trigger a re-render when allFriends changes
  }, [allFriends]);

  const renderFriend = (f, idx, arr) => {
    const online = isFriendOnline(f.profile);
    
    return (
      <TouchableOpacity
        key={f.profile?.id || idx}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(12), borderBottomWidth: idx !== arr.length - 1 ? 1 : 0, borderBottomColor: isDarkMode ? '#3a3a6a' : '#E0E0E0', paddingBottom: verticalScale(8) }}
        onPress={() => {
          if (f.profile?.id) router.push(`/profile/${f.profile.id}`);
        }}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={{ marginRight: scale(10), position: 'relative' }}>
          {f.profile?.avatar_url ? (
            <Image
              key={f.profile.avatar_url}
              source={{ uri: f.profile.avatar_url }}
              style={{
                width: scale(14),
                height: scale(14),
                borderRadius: scale(7),
                resizeMode: 'cover',
              }}
            />
          ) : (
            <View style={{
              width: scale(14),
              height: scale(14),
              borderRadius: scale(7),
              backgroundColor: '#FFFF00',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#181818', fontWeight: '600', fontSize: scale(9) }}>
                {f.profile?.name?.[0]?.toUpperCase() || f.profile?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* Online status indicator */}
          <View style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: STATUS_SIZE,
            height: STATUS_SIZE,
            borderRadius: STATUS_SIZE / 2,
            backgroundColor: online ? '#4caf50' : '#888',
            borderWidth: 1,
            borderColor: isDarkMode ? '#2a3441' : '#fff',
          }} />
        </View>
        <View>
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: cappedFontSize(14, 15), letterSpacing: 0.5 }}>{f.profile?.name} {f.profile?.surname}</Text>
          <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: cappedFontSize(14, 15) }}>@{f.profile?.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFriendInModal = (f, idx, arr) => {
    const online = isFriendOnline(f.profile);
    return (
      <TouchableOpacity
        key={f.profile?.id || idx}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(12), borderBottomWidth: idx !== arr.length - 1 ? 1 : 0, borderBottomColor: isDarkMode ? '#3a3a6a' : '#E0E0E0', paddingBottom: verticalScale(8) }}
        onPress={() => {
          if (f.profile?.id) {
            setModalVisible(false);
            router.push(`/profile/${f.profile.id}`);
          }
        }}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={{ marginRight: scale(10), position: 'relative' }}>
          {f.profile?.avatar_url ? (
            <Image
              key={f.profile.avatar_url}
              source={{ uri: f.profile.avatar_url }}
              style={{
                width: scale(14),
                height: scale(14),
                borderRadius: scale(7),
                resizeMode: 'cover',
              }}
            />
          ) : (
            <View style={{
              width: scale(14),
              height: scale(14),
              borderRadius: scale(7),
              backgroundColor: '#FFFF00',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#181818', fontWeight: '600', fontSize: scale(9) }}>
                {f.profile?.name?.[0]?.toUpperCase() || f.profile?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* Online status indicator */}
          <View style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: STATUS_SIZE,
            height: STATUS_SIZE,
            borderRadius: STATUS_SIZE / 2,
            backgroundColor: online ? '#4caf50' : '#888',
            borderWidth: 1,
            borderColor: isDarkMode ? '#2a3441' : '#fff',
          }} />
        </View>
        <View>
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: cappedFontSize(14, 15), letterSpacing: 0.5 }}>{f.profile?.name} {f.profile?.surname}</Text>
          <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: cappedFontSize(14, 15) }}>@{f.profile?.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(8) }}>
        <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: cappedFontSize(17, 18), letterSpacing: 0.8 }}>{t.friends}</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={{ color: '#FFFF00', fontSize: cappedFontSize(15, 15) }}>{t.seeAll}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: scale(340), marginBottom: verticalScale(18) }}>
        {preview.length > 0 ? (
          <View style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(18), padding: scale(18) }}>
            {preview.map((f, idx) => renderFriend(f, idx, preview))}
          </View>
        ) : (
          <View style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(18), padding: scale(28), alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="wifi" size={scale(44)} color="#FFFF00" style={{ marginBottom: verticalScale(10) }} />
            <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: cappedFontSize(16, 17), marginBottom: verticalScale(4), letterSpacing: 0.8 }}>{t.noFriends}</Text>
            <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '300', fontSize: cappedFontSize(15, 15), textAlign: 'center' }}>{t.inviteFriends}</Text>
          </View>
        )}
      </View>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: modalWidth, height: modalHeight, borderRadius: scale(16), overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', backgroundColor: 'transparent' }}>
            <AnimatedBackground />
            <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: scale(24) }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: verticalScale(18) }}>
                <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: cappedFontSize(22, 22), letterSpacing: 0.8 }}>{t.friends}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={scale(28)} color={isDarkMode ? "#fff" : "#000"} /></TouchableOpacity>
              </View>
              <ScrollView style={{ width: '100%' }}>
                {[...online, ...offline].map((f, idx, arr) => renderFriendInModal(f, idx, arr))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default OnlineFriends; 