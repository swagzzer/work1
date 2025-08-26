import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Keyboard, Modal, PanResponder, Animated as RNAnimated, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '../services/supabaseClient';

function DraggableSearchFAB({ setSearchVisible, onUserSelect }) {
  const [searchInput, setSearchInput] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // FAB position state
  const fabSize = 60;
  const margin = 30;
  const [screen, setScreen] = useState(Dimensions.get('window'));
  // Set initial position to bottom right within bounds
  const initialX = screen.width - fabSize - margin;
  const initialY = screen.height - fabSize - margin - 60;
  const pan = useRef(new RNAnimated.ValueXY({ x: initialX, y: initialY })).current;
  const pressHandled = useRef(false);

  useEffect(() => {
    const onChange = ({ window }) => setScreen(window);
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  // Clamp helpers
  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));
  const getClamped = (x, y) => {
    const minX = 0;
    const minY = 110;
    const maxX = screen.width - fabSize - margin;
    const maxY = screen.height - fabSize - margin;
    return {
      x: clamp(x, minX, maxX),
      y: clamp(y, minY, maxY),
    };
  };

  // PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only set if the movement is significant to be considered a drag
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pressHandled.current = false;
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: RNAnimated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        if (
          Math.abs(gestureState.dx) < 5 &&
          Math.abs(gestureState.dy) < 5 &&
          !pressHandled.current
        ) {
          pressHandled.current = true;
          console.log('FAB pressed');
          setSearchVisible(true);
        } else {
          const { x, y } = getClamped(pan.x._value, pan.y._value);
          RNAnimated.spring(pan, {
            toValue: { x, y },
            useNativeDriver: false,
            bounciness: 10,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData?.id);
      const { data, error } = await supabase.from('profiles').select('id, username, name, surname, avatar_url');
      if (!error && data) {
        setAllUsers(data);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!searchInput) {
      setFilteredUsers([]);
      return;
    }
    const lower = searchInput.toLowerCase();
    setFilteredUsers(
      allUsers.filter(
        u =>
          u.id !== currentUserId &&
          (
            (u.username && u.username.toLowerCase().includes(lower)) ||
            (u.name && u.name.toLowerCase().includes(lower)) ||
            (u.surname && u.surname.toLowerCase().includes(lower))
          )
      )
    );
  }, [searchInput, allUsers, currentUserId]);

  return (
    <>
      <RNAnimated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            backgroundColor: 'rgba(35, 43, 59, 0.7)',
            borderRadius: 30,
            width: 60,
            height: 60,
            alignItems: 'center',
            justifyContent: 'center',

            zIndex: 99999,
          },
          pan.getLayout(),
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          pointerEvents="auto"
          onPress={() => {
            console.log('FAB pressed');
            setSearchVisible(true);
          }}
          style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={28} color="#fff" />
        </TouchableOpacity>
      </RNAnimated.View>
    </>
  );
}

function SearchModal({ visible, onClose, allUsers, onUserSelect, currentUserId, isDarkMode = false, language = 'serbian', currentUserFriends = [] }) {
  const [searchInput, setSearchInput] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    if (!searchInput) {
      setFilteredUsers([]);
      return;
    }
    const lower = searchInput.toLowerCase();
    
    const filtered = allUsers.filter(
      u =>
        u.id !== currentUserId &&
        (
          (u.username && u.username.toLowerCase().includes(lower)) ||
          (u.name && u.name.toLowerCase().includes(lower)) ||
          (u.surname && u.surname.toLowerCase().includes(lower))
        )
    );
    
    setFilteredUsers(filtered);
  }, [searchInput, allUsers, currentUserId]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-start', alignItems: 'stretch' }}>
          <View style={{ borderRadius: 0, width: '100%', height: '100%', padding: 0, alignItems: 'stretch', justifyContent: 'flex-start', overflow: 'hidden', backgroundColor: isDarkMode ? '#2a3441' : '#fff' }}>
            <View style={{ flex: 1, padding: 28, paddingTop: 60 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: 22, letterSpacing: 0.8 }}>Pretrazi</Text>
                <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color={isDarkMode ? "#fff" : "#000"} /></TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, marginBottom: 24 }}>
                <Ionicons name="search" size={22} color={isDarkMode ? "#b0b8c1" : "#666"} style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, color: isDarkMode ? '#fff' : '#000', fontSize: 18, paddingVertical: 14 }}
                  placeholder="Pretrazi..."
                  placeholderTextColor={isDarkMode ? "#b0b8c1" : "#666"}
                  value={searchInput}
                  onChangeText={setSearchInput}
                />
              </View>
              <Text style={{ color: '#FFFF00', fontSize: 15, marginBottom: 16 }}>Unesite tekst za pretrazivanje prijatelja</Text>
              <View style={{ flex: 1, maxHeight: '100%' }}>
                {filteredUsers.length === 0 && searchInput ? (
                  <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: 17, textAlign: 'center', marginTop: 20 }}>Nema rezultata.</Text>
                ) : (
                  filteredUsers.map(user => {
                    // Check if profile is private AND user is not a friend
                    const isPrivate = user.privacy_settings?.profileVisibility === 'private' && 
                      !currentUserFriends.some(friend => 
                        (friend.from_user === currentUserId && friend.to_user === user.id) ||
                        (friend.to_user === currentUserId && friend.from_user === user.id)
                      );
                    return (
                      <TouchableOpacity 
                        key={user.id} 
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          paddingVertical: 12,
                          opacity: isPrivate ? 0.6 : 1
                        }} 
                        onPress={() => !isPrivate && onUserSelect(user)}
                        disabled={isPrivate}
                      >
                        <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                          {user.avatar_url ? (
                            <Image
                              source={{ uri: user.avatar_url }}
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                resizeMode: 'cover',
                              }}
                            />
                          ) : (
                            <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: 16, letterSpacing: 0.5 }}>{user.username?.[0]?.toUpperCase() || '?'}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: 15, letterSpacing: 0.5 }}>{user.name} {user.surname}</Text>
                          <Text style={{ color: '#FFFF00', fontSize: 15 }}>@{user.username}</Text>
                        </View>
                        {isPrivate && (
                          <View style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                            paddingHorizontal: 12, 
                            paddingVertical: 6, 
                            borderRadius: 12 
                          }}>
                            <Text style={{ color: '#FFFF00', fontSize: 12, fontWeight: '500' }}>
                              {language === 'english' ? 'Private' : 'Privatno'}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  modalView: {
    borderRadius: 20,
    padding: 20,
    width: '95%',
    marginTop: 60,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#E2E8F0',
    fontWeight: 'bold',
    fontSize: 22,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 16,
    padding: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A5568',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultName: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultUsername: {
    color: '#A0AEC0',
    fontSize: 14,
  },
});

export default DraggableSearchFAB;
export { SearchModal };

