import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getChats, getFriends, sendMessage, sendPushNotification, supabase } from '../../services/supabaseClient';

function isFriendOnline(profile) {
  if (!profile || !profile.last_active) return false;
  let lastActive;
  if (typeof profile.last_active === 'string') {
    let ts = profile.last_active;
    if (!ts.endsWith('Z')) ts += 'Z';
    lastActive = Date.parse(ts);
  } else if (typeof profile.last_active === 'number') {
    lastActive = profile.last_active < 1e12 ? profile.last_active * 1000 : profile.last_active;
  } else {
    return false;
  }
  const now = Date.now();
  return (now - lastActive) < 2 * 60 * 1000;
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Language translations for messages page
const getMessagesTranslations = (language) => {
  const translations = {
    serbian: {
      messages: 'Poruke',
      friends: 'Prijatelji',
      matches: 'Mecevi',
      requests: 'Zahtevi',
      back: 'Nazad',
      send: 'Posalji',
      typeMessage: 'Upisite poruku...',
      noMessages: 'Nema poruka',
      noChats: 'Nema razgovora',
      online: 'Online',
      offline: 'Offline',
      newMessage: 'Nova poruka',
      search: 'Pretrazi',
      noResults: 'Nema rezultata',
    },
    english: {
      messages: 'Messages',
      friends: 'Friends',
      matches: 'Matches',
      requests: 'Requests',
      back: 'Back',
      send: 'Send',
      typeMessage: 'Type a message...',
      noMessages: 'No messages',
      noChats: 'No conversations',
      online: 'Online',
      offline: 'Offline',
      newMessage: 'New message',
      search: 'Search',
      noResults: 'No results',
    }
  };
  return translations[language] || translations.serbian;
};

const MessagesScreen = () => {
  const [language, setLanguage] = useState('serbian');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [userId, setUserId] = useState(null);
  const [selectedTab, setSelectedTab] = useState('friends');
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [allFriends, setAllFriends] = useState([]);
  const [chatModalVisible, setChatModalVisible] = useState(false);

  const params = useLocalSearchParams();
  const lastChatIdRef = useRef();
  const [lastRead, setLastRead] = useState(Date.now());
  const flatListRef = useRef(null);
  const lastMessageIndex = messages.length > 0 ? messages.length - 1 : 0;
  const getItemLayout = (data, index) => ({
    length: 60,
    offset: 60 * index,
    index,
  });

  const t = getMessagesTranslations(language);

  // Load language and dark mode preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        const savedMode = await AsyncStorage.getItem('isDarkMode');
        if (savedLanguage !== null) {
          setLanguage(savedLanguage);
        }
        if (savedMode !== null) {
          setIsDarkMode(JSON.parse(savedMode));
        }
      } catch (error) {
        console.log('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Listen for preference changes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        const savedMode = await AsyncStorage.getItem('isDarkMode');
        if (savedLanguage !== null && savedLanguage !== language) {
          setLanguage(savedLanguage);
        }
        if (savedMode !== null) {
          const newMode = JSON.parse(savedMode);
          if (newMode !== isDarkMode) {
            setIsDarkMode(newMode);
          }
        }
      } catch (error) {
        console.log('Error checking preferences:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isDarkMode, language]);

  // Track the last non-undefined chatId param
  useEffect(() => {
    if (params.chatId !== undefined) {
      lastChatIdRef.current = params.chatId;
    }
  }, [params.chatId]);

  // Mark all unread messages as read when opening a chat
  useEffect(() => {
    if (!selectedChat || !userId) return;
    (async () => {
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, sender, read_by')
        .eq('chat_id', selectedChat.id);
      const unreadMsgs = (allMessages || []).filter(
        m => m.sender !== userId && (!m.read_by || !m.read_by.includes(userId))
      );
                   if (unreadMsgs.length > 0) {
        // Instead of using the problematic RPC function, update messages directly
        for (const msg of unreadMsgs) {
          const currentReadBy = msg.read_by || [];
          if (!currentReadBy.includes(userId)) {
            const updatedReadBy = [...currentReadBy, userId];
            const { error } = await supabase
              .from('messages')
              .update({ read_by: updatedReadBy })
              .eq('id', msg.id);
            if (error) {
              console.error('Error updating message read status:', error);
            }
          }
        }
      }
      const { data: refreshedMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });
      setMessages(refreshedMessages || []);
      setLastRead(Date.now());
    })();
  }, [selectedChat, userId]);

  // Compute unread counts for each chat
  const [unreadCounts, setUnreadCounts] = useState({});
  useEffect(() => {
    if (!userId || chats.length === 0) return;
    const fetchUnreadCounts = async () => {
      const counts = {};
      for (const chat of chats) {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, sender, read_by')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (messages && messages.length > 0) {
          const lastMsg = messages[0];
          if (lastMsg.sender !== userId && (!lastMsg.read_by || !lastMsg.read_by.includes(userId))) {
            counts[chat.id] = (counts[chat.id] || 0) + 1;
          }
        }
      }
      setUnreadCounts(counts);
    };
    fetchUnreadCounts();
  }, [chats, userId, lastRead]);

  // Fetch chats and friends
  useEffect(() => {
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      setUserId(user.id);
      
      const chatsRes = await getChats(user.id);
      let chatsData = chatsRes.data || [];
      
      const chatsWithDetails = await Promise.all(chatsData.map(async chat => {
        const { data: allMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true });
        const lastMessage = allMessages && allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
        const otherUserId = chat.participants.find(pid => pid !== user.id);
        let otherUser = null;
        if (otherUserId) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, username, name, surname, avatar_url')
            .eq('id', otherUserId)
            .single();
          otherUser = userProfile;
        }
        return {
          ...chat,
          lastMessage,
          otherUser,
        };
      }));
      
      const filteredChats = chatsWithDetails.filter(chat =>
        (chat.lastMessage && chat.otherUser) ||
        (params.chatId && String(chat.id) === String(params.chatId) && chat.otherUser) ||
        (typeof window !== 'undefined' && window.openChatId && String(chat.id) === String(window.openChatId) && chat.otherUser)
      );
      setChats(filteredChats);
      
      const friendsRes = await getFriends(user.id);
      const friendsList = friendsRes.data || [];
      const friendIds = friendsList.map(f => f.from_user === user.id ? f.to_user : f.from_user);
      let profiles = [];
      if (friendIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, name, surname, last_active, avatar_url')
          .in('id', friendIds);
        profiles = profileData || [];
      }
      
      const allFriendsWithProfiles = friendsList.map(f => {
        const fid = f.from_user === user.id ? f.to_user : f.from_user;
        return { ...f, profile: profiles.find(p => p.id === fid) };
      });
      
      setAllFriends(allFriendsWithProfiles);
      const online = allFriendsWithProfiles.filter(f => isFriendOnline(f.profile));
      setOnlineFriends(online);
    })();
  }, []);

  // Open chat pop-up when chatId and chats are available
  useEffect(() => {
    const chatId = lastChatIdRef.current;
    if (chatId && chats.length > 0) {
      let chatToOpen = chats.find(chat => String(chat.id) === String(chatId));
      if (!chatToOpen) return;
      setSelectedChat(chatToOpen);
      setChatModalVisible(true);
    }
  }, [chats]);

  // Reset selectedChat and chatModalVisible when modal is closed
  useEffect(() => {
    if (!chatModalVisible) {
      setSelectedChat(null);
    }
  }, [chatModalVisible]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!selectedChat || !userId) return;
    
    const channel = supabase
      .channel('messages-' + selectedChat.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat, userId]);

  // Polling for messages (fallback)
  useEffect(() => {
    if (!selectedChat || !userId) return;
    
    const interval = setInterval(async () => {
      const { data: refreshedMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });
      setMessages(refreshedMessages || []);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedChat, userId]);

  const handleOpenChat = (chat) => {
    setSelectedChat(chat);
    setChatModalVisible(true);
  };

  const handleCloseChat = () => {
    setChatModalVisible(false);
    setSelectedChat(null);
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedChat || !userId) return;
    
    const { error } = await sendMessage(selectedChat.id, userId, messageInput.trim());
    if (error) {
      console.error('Error sending message:', error);
      return;
    }
    
    setMessageInput('');
    
    // Send push notification to other participants
    const otherParticipants = selectedChat.participants.filter(pid => pid !== userId);
    for (const participantId of otherParticipants) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', participantId)
        .single();
      if (profile?.expo_push_token) {
        await sendPushNotification(profile.expo_push_token, 'Nova poruka', messageInput.trim());
      }
    }
  };

  const getFilteredChats = () => {
    if (selectedTab === 'friends') {
      // Show chats from friends only
      return chats.filter(chat => {
        const otherUserId = chat.participants.find(pid => pid !== userId);
        return allFriends.some(friend => 
          (friend.from_user === userId && friend.to_user === otherUserId) ||
          (friend.to_user === userId && friend.from_user === otherUserId)
        );
      });
    } else if (selectedTab === 'matches') {
      return chats.filter(chat => chat.type === 'match');
    } else if (selectedTab === 'requests') {
      // Show chats from non-friends (people who aren't your friends yet)
      return chats.filter(chat => {
        const otherUserId = chat.participants.find(pid => pid !== userId);
        return !allFriends.some(friend => 
          (friend.from_user === userId && friend.to_user === otherUserId) ||
          (friend.to_user === userId && friend.from_user === otherUserId)
        );
      });
    }
    return chats;
  };

  const getFriendsChats = () => chats.filter(chat => {
    const otherUserId = chat.participants.find(pid => pid !== userId);
    return allFriends.some(friend => 
      (friend.from_user === userId && friend.to_user === otherUserId) ||
      (friend.to_user === userId && friend.from_user === otherUserId)
    );
  });
  const getMatchesChats = () => chats.filter(chat => chat.type === 'match');
  const getRequestsChats = () => chats.filter(chat => {
    const otherUserId = chat.participants.find(pid => pid !== userId);
    return !allFriends.some(friend => 
      (friend.from_user === userId && friend.to_user === otherUserId) ||
      (friend.to_user === userId && friend.from_user === otherUserId)
    );
  });

  const matchesCount = getMatchesChats().length;
  const requestsCount = getRequestsChats().length;

  const TABS = [
    { key: 'friends', label: t.friends, badge: getFriendsChats().length },
    { key: 'matches', label: t.matches, badge: matchesCount },
    { key: 'requests', label: t.requests, badge: requestsCount },
  ];

  // Main render function
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {!selectedChat ? (
        // Chat list view
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.title}>{t.messages}</Text>
          
          {/* Tabs */}
          <View style={styles.tabsRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, selectedTab === tab.key && styles.tabBtnActive]}
                onPress={() => setSelectedTab(tab.key)}
              >
                <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                <View style={[styles.tabBadge, selectedTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, selectedTab === tab.key && styles.tabBadgeTextActive]}>{tab.badge}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Chat List */}
          <FlatList
            data={getFilteredChats()}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => {
              let lastMsg = item.lastMessage;
              const isFriendChat = selectedTab === 'friends';
              const isRequestChat = selectedTab === 'requests';
              const isMatchChat = selectedTab === 'matches';
              
              return (
                <TouchableOpacity 
                  style={[
                    styles.chatCard, 
                    isRequestChat && styles.requestChatCard,
                    isMatchChat && styles.matchChatCard
                  ]} 
                  onPress={() => handleOpenChat(item)}
                >
                                     <View style={{ position: 'relative', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                     {item.otherUser?.avatar_url ? (
                       <Image
                         source={{ uri: item.otherUser.avatar_url }}
                         style={{
                           width: 36,
                           height: 36,
                           borderRadius: 18,
                           opacity: 0.85,
                         }}
                         resizeMode="cover"
                         loading="eager"
                         fadeDuration={0}
                         cachePolicy="memory-disk"
                       />
                     ) : (
                       <View style={[
                         styles.avatar,
                         isRequestChat && styles.requestAvatar,
                       ]}>
                         <Text style={[styles.avatarText, { opacity: 0.85 }]}>
                           {isMatchChat ? 'M' : 
                            item.otherUser ? (item.otherUser.username?.[0]?.toUpperCase() || item.otherUser.name?.[0]?.toUpperCase() || '?') : '?'}
                         </Text>
                       </View>
                     )}
                   </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chatName}>
                      {isMatchChat ? item.name || 'Match Chat' : 
                       item.otherUser ? `${item.otherUser.name || ''} ${item.otherUser.surname || ''}`.trim() : ''}
                      {!isMatchChat && item.otherUser && item.otherUser.username ? ` (@${item.otherUser.username})` : ''}
                    </Text>
                    <Text style={styles.chatLastMsg}>
                      {lastMsg ? lastMsg.content : ''}
                    </Text>
                    {isMatchChat && (
                      <Text style={styles.matchLabel}>Match Chat</Text>
                    )}
                  </View>
                  {unreadCounts[item.id] > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unreadCounts[item.id]}</Text>
                    </View>
                  )}
                  <Text style={styles.chatTime}>{lastMsg ? formatTime(lastMsg.created_at) : ''}</Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {selectedTab === 'friends' ? (language === 'english' ? 'No active chats.' : 'Nema razgovora sa prijateljima.') :
                 selectedTab === 'requests' ? (language === 'english' ? 'No chat requests.' : 'Nema zahteva za poruke.') :
                 selectedTab === 'matches' ? (language === 'english' ? 'No active matches.' : 'Nema aktivnih meceva.') :
                 (language === 'english' ? 'No active chats.' : 'Nema aktivnih razgovora.')}
              </Text>
            }
            style={{ width: '100%' }}
            contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
          />
          
          {/* Online Bar */}
          <View style={styles.onlineBar}>
            <Text style={styles.onlineText}>{onlineFriends.length} prijatelja online</Text>
            <View style={[styles.onlineDot, { backgroundColor: onlineFriends.length > 0 ? '#00D4AA' : '#b0b0b0' }]} />
          </View>
        </View>
      ) : (
        // Chat view when a chat is selected
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setSelectedChat(null)}>
              <Text style={styles.backButton}>‹ {t.back}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.chatProfile}>
            <View style={styles.chatAvatar}>
              {selectedChat?.otherUser?.avatar_url ? (
                <Image
                  source={{ uri: selectedChat.otherUser.avatar_url }}
                  style={styles.chatAvatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.chatAvatarText}>
                  {selectedChat?.otherUser ? (selectedChat?.otherUser.username?.[0]?.toUpperCase() || selectedChat?.otherUser.name?.[0]?.toUpperCase() || '?') : '?'}
                </Text>
              )}
            </View>
            <Text style={styles.chatProfileName}>
              {selectedChat?.otherUser ? `${selectedChat.otherUser.name || ''} ${selectedChat.otherUser.surname || ''}`.trim() : 'Chat'}
            </Text>
            {selectedChat?.otherUser && selectedChat.otherUser.username && (
              <Text style={styles.chatProfileUsername}>
                @{selectedChat.otherUser.username}
              </Text>
            )}
          </View>
          
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => (
              <View style={[styles.msgRow, item.sender === userId ? styles.msgSelf : styles.msgOther]}>
                <Text style={[styles.msgText, item.sender === userId ? styles.msgTextSelf : styles.msgTextOther]}>
                  {item.content}
                </Text>
              </View>
            )}
            style={{ width: '100%' }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingTop: 140 }}
            initialScrollIndex={lastMessageIndex}
            getItemLayout={getItemLayout}
          />
          
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t.typeMessage}
              placeholderTextColor="#666"
              value={messageInput}
              onChangeText={setMessageInput}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <MaterialIcons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
    alignSelf: 'center',
    letterSpacing: 0.8,
  },
  tabsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 20,
    justifyContent: 'center',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabBtnActive: {
    backgroundColor: '#00D4AA',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#666',
    borderRadius: 10,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 18,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: '#fff',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabBadgeTextActive: {
    color: '#00D4AA',
    fontWeight: '700',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    width: '92%',
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  chatName: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  chatLastMsg: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  matchLabel: {
    color: '#00D4AA',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chatTime: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  onlineBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  onlineText: {
    color: '#666',
    fontSize: 13,
    marginRight: 8,
    fontWeight: '500',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chatHeader: {
    height: 60,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    color: '#00D4AA',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chatProfile: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chatAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#00D4AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chatAvatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  chatAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 24,
    letterSpacing: 0.5,
  },
  chatProfileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  chatProfileUsername: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  msgRow: {
    marginHorizontal: 16,
    marginVertical: 4,
    maxWidth: '80%',
  },
  msgSelf: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgText: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 16,
    lineHeight: 20,
  },
  msgTextSelf: {
    backgroundColor: '#00D4AA',
    color: '#fff',
    fontWeight: '500',
  },
  msgTextOther: {
    backgroundColor: '#F3F4F6',
    color: '#000',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sendBtn: {
    backgroundColor: '#00D4AA',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default MessagesScreen;
