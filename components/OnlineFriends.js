import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { cappedFontSize, scale, verticalScale } from '../constants/Responsive';


const STATUS_SIZE = scale(12);

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

const OnlineFriends = ({ friends, allFriends, isDarkMode = false, t }) => {
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
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(12), borderBottomWidth: idx !== arr.length - 1 ? 1 : 0, borderBottomColor: '#E0E0E0', paddingBottom: verticalScale(8) }}
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
                width: scale(28),
                height: scale(28),
                borderRadius: scale(14),
                resizeMode: 'cover',
              }}
            />
          ) : (
            <View style={{
              width: scale(28),
              height: scale(28),
              borderRadius: scale(14),
              backgroundColor: '#00D4AA',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: scale(18) }}>
                {f.profile?.name?.[0]?.toUpperCase() || f.profile?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* Online status indicator */}
          <View style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: STATUS_SIZE,
            height: STATUS_SIZE,
            borderRadius: STATUS_SIZE / 2,
            backgroundColor: online ? '#4caf50' : '#888',
            borderWidth: 2,
            borderColor: '#fff',
          }} />
        </View>
        <View>
          <Text style={{ color: '#000', fontWeight: '400', fontSize: cappedFontSize(14, 15), letterSpacing: 0.5 }}>{f.profile?.name} {f.profile?.surname}</Text>
          <Text style={{ color: '#666', fontSize: cappedFontSize(14, 15) }}>@{f.profile?.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFriendInModal = (f, idx, arr) => {
    const online = isFriendOnline(f.profile);
    return (
      <TouchableOpacity
        key={f.profile?.id || idx}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(12), borderBottomWidth: idx !== arr.length - 1 ? 1 : 0, borderBottomColor: '#E0E0E0', paddingBottom: verticalScale(8) }}
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
                width: scale(28),
                height: scale(28),
                borderRadius: scale(14),
                resizeMode: 'cover',
              }}
            />
          ) : (
            <View style={{
              width: scale(28),
              height: scale(28),
              borderRadius: scale(14),
              backgroundColor: '#00D4AA',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: scale(18) }}>
                {f.profile?.name?.[0]?.toUpperCase() || f.profile?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* Online status indicator */}
          <View style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: STATUS_SIZE,
            height: STATUS_SIZE,
            borderRadius: STATUS_SIZE / 2,
            backgroundColor: online ? '#4caf50' : '#888',
            borderWidth: 2,
            borderColor: '#fff',
          }} />
        </View>
        <View>
          <Text style={{ color: '#000', fontWeight: '400', fontSize: cappedFontSize(14, 15), letterSpacing: 0.5 }}>{f.profile?.name} {f.profile?.surname}</Text>
          <Text style={{ color: '#666', fontSize: scale(14, 15) }}>@{f.profile?.username}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(8) }}>
        <Text style={{ 
          color: '#000', 
          fontWeight: '700', 
          fontSize: cappedFontSize(20, 22), 
          alignSelf: 'flex-start', 
          marginLeft: 0, 
          marginTop: verticalScale(8), 
          marginBottom: verticalScale(8), 
          letterSpacing: 0.5,
        }}>{t.friends}</Text>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          style={{
            backgroundColor: 'transparent',
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 12,
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
            color: '#00D4AA', 
            fontSize: cappedFontSize(15, 15),
            fontWeight: '600',
            textAlign: 'center',
          }}>{t.seeAll}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ width: scale(340), marginBottom: verticalScale(18) }}>
        {preview.length > 0 ? (
          <View style={{ backgroundColor: '#fff', borderRadius: scale(18), padding: scale(18), elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            {preview.map((f, idx) => renderFriend(f, idx, preview))}
          </View>
        ) : (
          <View style={{ backgroundColor: '#fff', borderRadius: scale(18), padding: scale(28), alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
            <Ionicons name="people" size={scale(44)} color="#00D4AA" style={{ marginBottom: verticalScale(10) }} />
            <Text style={{ color: '#000', fontWeight: '600', fontSize: cappedFontSize(16, 17), marginBottom: verticalScale(4), letterSpacing: 0.5 }}>{t.noFriends}</Text>
            <Text style={{ color: '#666', fontWeight: '400', fontSize: cappedFontSize(15, 15), textAlign: 'center' }}>{t.inviteFriends}</Text>
          </View>
        )}
      </View>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: modalWidth, height: modalHeight, borderRadius: scale(16), overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', backgroundColor: '#fff' }}>
            <View style={{ width: '100%', height: '100%', padding: scale(24) }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: verticalScale(18) }}>
                <Text style={{ color: '#000', fontWeight: '600', fontSize: cappedFontSize(22, 22), letterSpacing: 0.5 }}>{t.friends}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={scale(28)} color="#000" /></TouchableOpacity>
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