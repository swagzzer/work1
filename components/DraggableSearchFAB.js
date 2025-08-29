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
          styles.fabContainer,
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
          style={styles.fabButton}
          activeOpacity={0.8}
        >
          <View style={styles.fabIconContainer}>
            <Ionicons name="search" size={28} color="#fff" />
          </View>
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
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <View style={styles.titleIcon}>
                <Ionicons name="search" size={24} color="#00D4AA" />
              </View>
              <Text style={styles.modalTitle}>Pretraži</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color="#00D4AA" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={22} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pretraži prijatelje..."
              placeholderTextColor="#999"
              value={searchInput}
              onChangeText={setSearchInput}
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Unesite tekst za pretraživanje prijatelja
          </Text>
        </View>

        {/* Results */}
        <View style={styles.resultsContainer}>
          {filteredUsers.length === 0 && searchInput ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={64} color="#00D4AA" />
              </View>
              <Text style={styles.emptyTitle}>Nema rezultata</Text>
              <Text style={styles.emptySubtitle}>Pokušajte sa drugim ključnim rečima</Text>
            </View>
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
                  style={[styles.userCard, isPrivate && styles.privateUserCard]} 
                  onPress={() => !isPrivate && onUserSelect(user)}
                  disabled={isPrivate}
                >
                  <View style={styles.userAvatar}>
                    {user.avatar_url ? (
                      <Image
                        source={{ uri: user.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {user.username?.[0]?.toUpperCase() || '?'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name} {user.surname}</Text>
                    <Text style={styles.userUsername}>@{user.username}</Text>
                  </View>
                  {isPrivate && (
                    <View style={styles.privateBadge}>
                      <Text style={styles.privateText}>
                        {language === 'english' ? 'Private' : 'Privatno'}
                      </Text>
                    </View>
                  )}
                  {!isPrivate && (
                    <View style={styles.selectButton}>
                      <Ionicons name="chevron-forward" size={20} color="#00D4AA" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // FAB Styles
  fabContainer: {
    position: 'absolute',
    zIndex: 99999,
  },
  fabButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 60,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#00D4AA',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.8,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Search Input Styles
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#000',
    fontSize: 16,
    paddingVertical: 16,
    fontWeight: '500',
  },

  // Instructions Styles
  instructionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  instructionsText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Results Styles
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },

  // User Card Styles
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  privateUserCard: {
    opacity: 0.6,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  userUsername: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  privateBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  privateText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default DraggableSearchFAB;
export { SearchModal };

