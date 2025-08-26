import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import AnimatedBackground from '../../components/AnimatedBackground';
import { scale } from '../../constants/Responsive';
import { getChats, getFriends, getMessages, sendMessage, sendPushNotification, supabase } from '../../services/supabaseClient';

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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [userId, setUserId] = useState(null);
  const [selectedTab, setSelectedTab] = useState(() => {
    if (typeof window !== 'undefined' && window.openChatTab) {
      const tab = window.openChatTab;
      window.openChatTab = undefined;
      return tab;
    }
    return 'friends';
  });
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [allFriends, setAllFriends] = useState([]);
  const [chatModalVisible, setChatModalVisible] = useState(false);

  const params = useLocalSearchParams();
  const lastChatIdRef = useRef();
  const [lastRead, setLastRead] = useState(Date.now());
  const flatListRef = useRef(null);
  const lastMessageIndex = messages.length > 0 ? messages.length - 1 : 0;
  const getItemLayout = (data, index) => ({
    length: 60, // approximate row height, adjust if needed
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
    }, 500); // Check every 500ms for faster response

    return () => clearInterval(interval);
  }, [isDarkMode, language]);



  // Track the last non-undefined chatId param
  useEffect(() => {
    if (params.chatId !== undefined) {
      lastChatIdRef.current = params.chatId;
    }
  }, [params.chatId]);







  // Mark all unread messages as read when opening a chat, then re-fetch messages from the database
  useEffect(() => {
    if (!selectedChat || !userId) return;
    (async () => {
      // Fetch all messages for this chat
      const { data: allMessages } = await supabase
        .from('messages')
        .select('id, sender, read_by')
        .eq('chat_id', selectedChat.id);
      // Find all messages sent by the other user that are not read by this user
      const unreadMsgs = (allMessages || []).filter(
        m => m.sender !== userId && (!m.read_by || !m.read_by.includes(userId))
      );
      if (unreadMsgs.length > 0) {
        const ids = unreadMsgs.map(m => m.id);
        const { error } = await supabase.rpc('mark_messages_read', {
          message_ids: ids,
          user_id: userId,
        });
        if (error) console.error('Error marking messages as read:', error);
      }
      // Always re-fetch all messages for this chat from the database
      const { data: refreshedMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', selectedChat.id)
        .order('created_at', { ascending: true });
      setMessages(refreshedMessages || []);
      setLastRead(Date.now()); // trigger unread count effect
      console.log('Fetched messages after marking as read:', refreshedMessages, 'userId:', userId);
    })();
  }, [selectedChat, userId]);

  // Compute unread counts for each chat by fetching the latest messages from the database
  const [unreadCounts, setUnreadCounts] = useState({}); // { [chatId]: number }
  useEffect(() => {
    if (!userId || chats.length === 0) return;
    (async () => {
      const counts = {};
      for (const chat of chats) {
        const { data: msgs } = await supabase
          .from('messages')
          .select('id, sender, read_by')
          .eq('chat_id', chat.id);
        const unread = (msgs || []).filter(
          m => m.sender !== userId && (!m.read_by || !m.read_by.includes(userId))
        );
        counts[chat.id] = unread.length;
      }
      setUnreadCounts(counts);
    })();
  }, [userId, chats, messages, lastRead]);

  const chatsWithUnread = chats.map(chat => ({ ...chat, unreadCount: unreadCounts[chat.id] || 0 }));

  // Get the appropriate chat list based on selected tab
  const getFilteredChats = () => {
    switch (selectedTab) {
      case 'friends':
        const friendsChats = chatsWithUnread.filter(chat => {
          if (chat.type === 'friend' && chat.otherUser) {
            // Check if the other user is a friend
            const otherUserId = chat.participants.find(pid => pid !== userId);
            const isFriend = allFriends.some(friend => 
              (friend.from_user === userId && friend.to_user === otherUserId) ||
              (friend.to_user === userId && friend.from_user === otherUserId)
            );
            return isFriend;
          }
          return false;
        });
        return friendsChats;
      case 'matches':
        return chatsWithUnread.filter(chat => chat.type === 'match');
      case 'requests':
        const requestsChats = chatsWithUnread.filter(chat => {
          if (chat.type === 'friend' && chat.otherUser) {
            // Check if the other user is NOT a friend (request)
            const otherUserId = chat.participants.find(pid => pid !== userId);
            const isNotFriend = !allFriends.some(friend => 
              (friend.from_user === userId && friend.to_user === otherUserId) ||
              (friend.to_user === userId && friend.from_user === otherUserId)
            );
            return isNotFriend;
          }
          return false;
        });
        return requestsChats;
      default:
        return chatsWithUnread;
    }
  };

  // Calculate badge counts for each tab
  const getFriendsChats = () => {
    return chatsWithUnread.filter(chat => {
      if (chat.type === 'friend' && chat.otherUser) {
        const otherUserId = chat.participants.find(pid => pid !== userId);
        return allFriends.some(friend => 
          (friend.from_user === userId && friend.to_user === otherUserId) ||
          (friend.to_user === userId && friend.from_user === otherUserId)
        );
      }
      return false;
    });
  };

  const getMatchesChats = () => {
    return chatsWithUnread.filter(chat => chat.type === 'match');
  };

  const getRequestsChats = () => {
    return chatsWithUnread.filter(chat => {
      if (chat.type === 'friend' && chat.otherUser) {
        const otherUserId = chat.participants.find(pid => pid !== userId);
        return !allFriends.some(friend => 
          (friend.from_user === userId && friend.to_user === otherUserId) ||
          (friend.to_user === userId && friend.from_user === otherUserId)
        );
      }
      return false;
    });
  };

  const friendsUnreadCount = getFriendsChats().reduce((sum, chat) => sum + chat.unreadCount, 0);
  const matchesCount = getMatchesChats().length;
  const requestsCount = getRequestsChats().length;

  // Update the badge for the 'Prijatelji' tab
  const TABS = [
    { key: 'friends', label: t.friends, badge: getFriendsChats().length },
    { key: 'matches', label: t.matches, badge: matchesCount },
    { key: 'requests', label: t.requests, badge: requestsCount },
  ];

  useEffect(() => {
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      setUserId(user.id);
      // Fetch chats
      const chatsRes = await getChats(user.id);
      let chatsData = chatsRes.data || [];
      // For each chat, fetch all messages and determine the latest one
      const chatsWithDetails = await Promise.all(chatsData.map(async chat => {
        // Fetch all messages for this chat
        const { data: allMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true });
        const lastMessage = allMessages && allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
        // Find the other user
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
      // Only show chats with at least one message, or the chat matching the chatId param, or the chat matching window.openChatId
      const filteredChats = chatsWithDetails.filter(chat =>
        (chat.lastMessage && chat.otherUser) ||
        (params.chatId && String(chat.id) === String(params.chatId) && chat.otherUser) ||
        (typeof window !== 'undefined' && window.openChatId && String(chat.id) === String(window.openChatId) && chat.otherUser)
      );
      setChats(filteredChats);
      // Fetch friends and their profiles (for online indicator)
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
      // Attach profile to each friend
      const allFriendsWithProfiles = friendsList.map(f => {
        const fid = f.from_user === user.id ? f.to_user : f.from_user;
        return { ...f, profile: profiles.find(p => p.id === fid) };
      });
      // Store all friends
      setAllFriends(allFriendsWithProfiles);
      // Online friends
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

  // --- HYBRID APPROACH ---
  const chatMessageChannelRef = useRef(null);
  const chatPollingIntervalRef = useRef(null);

  // Real-time subscription for messages in the selected chat
  useEffect(() => {
    if (!selectedChat || !userId) return;

    // Subscribe to real-time messages for this chat
    const channel = supabase
      .channel(`chat-messages-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        async (payload) => {
          // Only update if this is the current chat
          if (payload.new && payload.new.chat_id === selectedChat.id) {
            // Fetch all messages for this chat
            const { data: refreshedMessages } = await supabase
              .from('messages')
              .select('*')
              .eq('chat_id', selectedChat.id)
              .order('created_at', { ascending: true });
            setMessages(refreshedMessages || []);
          }
        }
      )
      .subscribe();
    chatMessageChannelRef.current = channel;

    // No polling for messages while chat is open
    if (chatPollingIntervalRef.current) {
      clearInterval(chatPollingIntervalRef.current);
      chatPollingIntervalRef.current = null;
    }

    return () => {
      if (chatMessageChannelRef.current) {
        supabase.removeChannel(chatMessageChannelRef.current);
        chatMessageChannelRef.current = null;
      }
    };
  }, [selectedChat, userId]);

  // Poll for chat list and friends every 30 seconds when no chat is open
  useEffect(() => {
    if (selectedChat || !userId) return;

    // Initial fetch
    refreshMessages();
    refreshFriendsList();

    chatPollingIntervalRef.current = setInterval(() => {
      refreshMessages();
      refreshFriendsList();
    }, 30000); // 30 seconds

    return () => {
      if (chatPollingIntervalRef.current) {
        clearInterval(chatPollingIntervalRef.current);
        chatPollingIntervalRef.current = null;
      }
    };
  }, [selectedChat, userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    console.log('Sending message:', messageInput, 'to chat:', selectedChat?.id, 'user:', userId);
    await sendMessage(selectedChat.id, userId, messageInput.trim());
    setMessageInput('');
    // Refresh messages
    const msgsRes = await getMessages(selectedChat.id);
    setMessages(msgsRes.data || []);
    // Notify other participants
    const otherParticipants = selectedChat.participants?.filter(id => id !== userId) || [];
    if (otherParticipants.length > 0) {
      const { data: users } = await supabase.from('profiles').select('expo_push_token').in('id', otherParticipants);
      // Check if users is an array before iterating
      if (users && Array.isArray(users)) {
        for (const user of users) {
          if (user && user.expo_push_token) {
            await sendPushNotification(user.expo_push_token, 'Nova poruka', 'Imate novu poruku u razgovoru.');
          }
        }
      }
    }
  };

  // Open modal when selecting a chat from the list
  const handleOpenChat = (chat) => {
    console.log('Opening chat:', chat);
    console.log('Chat otherUser:', chat.otherUser);
    setSelectedChat(chat);
    setChatModalVisible(true);
  };

  // Close modal handler
  const handleCloseChat = () => {
    setChatModalVisible(false);
    setSelectedChat(null);
    setMessages([]);
  };

  // Real-time subscription for new chats
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('new-chats-' + userId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `participants.cs.{${userId}}`,
        },
        async (payload) => {
          const newChat = payload.new;
          
          setChats(prevChats => {
            // Check if this chat is already in our list
            const existingChat = prevChats.find(chat => chat.id === newChat.id);
            if (existingChat) return prevChats;
            
            // Add the new chat to the list (we'll fetch the other user and last message separately)
            return [...prevChats, {
              ...newChat,
              lastMessage: null,
              otherUser: null,
            }];
          });
          
          // Fetch the other user profile and last message
          const otherUserId = newChat.participants.find(pid => pid !== userId);
          if (otherUserId) {
            const [userProfileRes, messagesRes] = await Promise.all([
              supabase
                .from('profiles')
                .select('id, username, name, surname')
                .eq('id', otherUserId)
                .single(),
              supabase
                .from('messages')
                .select('*')
                .eq('chat_id', newChat.id)
                .order('created_at', { ascending: false })
                .limit(1)
            ]);
            
            const otherUser = userProfileRes.data;
            const lastMessage = messagesRes.data?.[0] || null;
            
            setChats(prevChats => prevChats.map(chat => 
              chat.id === newChat.id 
                ? { ...chat, lastMessage, otherUser }
                : chat
            ));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Function to refresh friends list
  const refreshFriendsList = async () => {
    if (!userId) return;
    
    try {
      // Re-fetch friends list when friendship status changes
      const friendsRes = await getFriends(userId);
      const friendsList = friendsRes.data || [];
      
      const friendIds = friendsList.map(f => f.from_user === userId ? f.to_user : f.from_user);
      
      let profiles = [];
      if (friendIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, name, surname, last_active, avatar_url')
          .in('id', friendIds);
        profiles = profileData || [];
      }
      
      // Attach profile to each friend
      const allFriendsWithProfiles = friendsList.map(f => {
        const fid = f.from_user === userId ? f.to_user : f.from_user;
        return { ...f, profile: profiles.find(p => p.id === fid) };
      });
      
      setAllFriends(allFriendsWithProfiles);
      
      // Update online friends
      const online = allFriendsWithProfiles.filter(f => isFriendOnline(f.profile));
      setOnlineFriends(online);
    } catch (error) {
      console.error('Error refreshing friends list:', error);
    }
  };

  // Function to refresh messages and chats
  const refreshMessages = async () => {
    if (!userId) return;
    
    try {
      // Re-fetch chats with latest messages
      const chatsRes = await getChats(userId);
      let chatsData = chatsRes.data || [];
      
      const chatsWithDetails = await Promise.all(chatsData.map(async chat => {
        // Fetch all messages for this chat
        const { data: allMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: true });
        const lastMessage = allMessages && allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
        
        // Find the other user
        const otherUserId = chat.participants.find(pid => pid !== userId);
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
      
      // Only show chats with at least one message, or the chat matching the chatId param, or the chat matching window.openChatId
      const filteredChats = chatsWithDetails.filter(chat =>
        (chat.lastMessage && chat.otherUser) ||
        (params.chatId && String(chat.id) === String(params.chatId) && chat.otherUser) ||
        (typeof window !== 'undefined' && window.openChatId && String(chat.id) === String(window.openChatId) && chat.otherUser)
      );
      
      setChats(filteredChats);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  useEffect(() => {
    if (window.openChatId && chats.length > 0) {
      const chatToOpen = chats.find(chat => String(chat.id) === String(window.openChatId));
      if (chatToOpen) {
        setSelectedChat(chatToOpen);
        setChatModalVisible(true);
      }
      window.openChatId = null;
    }
  }, [chats]);

  useEffect(() => {
    // Check if a tab should be opened via global flag
    if (typeof window !== 'undefined' && window.openChatTab) {
      setSelectedTab(window.openChatTab);
      window.openChatTab = undefined;
    }
  }, []);

  if (!selectedChat) {
    return (
      <AnimatedBackground isDarkMode={isDarkMode}>
        <View style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={{ flex: 1 }}>
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
                        <View style={{ position: 'relative', width: 50, height: 50, alignItems: 'center', justifyContent: 'center' }}>
                          {/* Avatar border animation (if equipped) */}

                                                      {item.otherUser?.avatar_url ? (
                              <Image
                                source={{ uri: item.otherUser.avatar_url }}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  opacity: 0.70,
                                  zIndex: 2,
                                  position: 'absolute',
                                  top: 5,
                                  left: 5,
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
                              { zIndex: 2, position: 'absolute', top: 5, left: 5 }
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
                        {item.unreadCount > 0 && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff5252', marginRight: 8 }} />}
                        <Text style={styles.chatTime}>{lastMsg ? formatTime(lastMsg.created_at) : ''}</Text>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={<Text style={[styles.info, { color: isDarkMode ? '#fff' : '#000', fontWeight: '300' }]}>
                    {selectedTab === 'friends' ? (language === 'english' ? 'No active chats.' : 'Nema razgovora sa prijateljima.') :
                     selectedTab === 'requests' ? (language === 'english' ? 'No chat requests.' : 'Nema zahteva za poruke.') :
                     selectedTab === 'matches' ? (language === 'english' ? 'No active matches.' : 'Nema aktivnih meceva.') :
                     (language === 'english' ? 'No active chats.' : 'Nema aktivnih razgovora.')}
                  </Text>}
                  style={{ width: '100%' }}
                  contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
                />
                {/* Online Bar */}
                <View style={styles.onlineBar}>
                  <Text style={styles.onlineText}>{onlineFriends.length} prijatelja online</Text>
                  <View style={[styles.onlineDot, { backgroundColor: onlineFriends.length > 0 ? '#FFFF00' : '#b0b0b0' }]} />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
          {/* Chat Pop-up Modal (always rendered) */}
          {selectedChat && (
            <Modal
              visible={chatModalVisible}
              animationType="slide"
              transparent
              onRequestClose={handleCloseChat}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ position: 'absolute', top: '10%', left: '5%', width: '90%', maxWidth: 400, height: 400, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                  <AnimatedBackground>
                    <View style={{ borderRadius: 18, width: '100%', height: '100%', padding: 18, alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: 'transparent' }}>
                      <View style={{ alignItems: 'center', marginTop: 0, marginBottom: 10 }}>
                        <TouchableOpacity onPress={() => setSelectedChat(null)} style={{ position: 'absolute', left: scale(20), top: 0, zIndex: 1 }}>
                          <Text style={{ color: '#FFFF00', fontSize: 16, fontWeight: '400', letterSpacing: 0.5 }}>‹ Nazad</Text>
                        </TouchableOpacity>
                        <View style={{ position: 'relative', width: 70, height: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 0 }}>
                          {/* Avatar border animation (if equipped) */}
                          {otherUserAvatarBorderSource && (
                            <LottieView
                              source={otherUserAvatarBorderSource}
                              autoPlay
                              loop
                              style={{ position: 'absolute', top: 0, left: 0, width: 70, height: 70, zIndex: 1 }}
                            />
                          )}
                          <View style={[styles.avatar, isRequestChatModal && styles.requestAvatar, { zIndex: 2, position: 'absolute', top: 15, left: 15 }]}>
                            {selectedChat?.otherUser?.avatar_url ? (
                              <Image
                                source={{ uri: selectedChat.otherUser.avatar_url }}
                                style={{
                                  width: 50,
                                  height: 50,
                                  borderRadius: 25,
                                  backgroundColor: '#FFFF00',
                                }}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text style={[styles.avatarText, { textAlign: 'center' }]}>
                                {selectedChat?.otherUser ? (selectedChat.otherUser.username?.[0]?.toUpperCase() || selectedChat.otherUser.name?.[0]?.toUpperCase() || '?') : '?'}
                              </Text>
                            )}
                          </View>
                        </View>
                        <Text style={{ paddingLeft: 0, fontSize: 16, textAlign: 'center', marginBottom: 0, color: '#FFFF00', fontWeight: '400', letterSpacing: 0.8 }}> 
                          {selectedChat?.otherUser ? `${selectedChat.otherUser.name || ''} ${selectedChat.otherUser.surname || ''}`.trim() : 'Chat'}
                        </Text>
                        {selectedChat?.otherUser && selectedChat.otherUser.username && (
                          <Text style={{ color: '#FFFF00', fontSize: 14, textAlign: 'center', marginTop: 0 }}>
                            @{selectedChat.otherUser.username}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <FlatList
                          ref={flatListRef}
                          data={messages}
                          keyExtractor={item => item.id?.toString()}
                          renderItem={({ item }) => (
                            <View style={[styles.msgRow, item.sender === userId ? styles.msgSelf : styles.msgOther]}>
                              <Text style={[styles.msgText, item.sender === userId ? styles.msgTextSelf : styles.msgTextOther]}>{item.content}</Text>
                            </View>
                          )}
                          style={{ flex: 1, width: '100%' }}
                          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingTop: 20 }}
                          initialScrollIndex={lastMessageIndex}
                          getItemLayout={getItemLayout}
                        />
                      </View>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={styles.input}
                          placeholder={t.typeMessage}
                          placeholderTextColor="#FFFF00"
                          value={messageInput}
                          onChangeText={setMessageInput}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                          <MaterialIcons name="send" size={24} color="#181818" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </AnimatedBackground>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
        </View>
      </AnimatedBackground>
    );
  }

  // In the Modal rendering, add logic to detect if the open chat is a request chat
  const isRequestChatModal = selectedTab === 'requests' || (selectedChat && selectedChat.type === 'friend' && allFriends.every(friend => ![friend.from_user, friend.to_user].includes(selectedChat.participants.find(pid => pid !== userId))));



  return (
    <AnimatedBackground isDarkMode={isDarkMode}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ height: 21, width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 0 }}>
            <TouchableOpacity onPress={() => setSelectedChat(null)}>
              <Text style={{ color: '#FFFF00', fontSize: 16, fontWeight: '400', letterSpacing: 0.5 }}>‹ {t.back}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: 'center', marginTop: 0, marginBottom: 0 }}>
            <View style={{ position: 'relative', width: 70, height: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 0 }}>
              <View style={[styles.avatar, isRequestChatModal && styles.requestAvatar, { zIndex: 2, position: 'absolute', top: 15, left: 15 }]}>
                                  {selectedChat?.otherUser?.avatar_url ? (
                    <Image
                      source={{ uri: selectedChat.otherUser.avatar_url }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: '#FFFF00',
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={[styles.avatarText, { textAlign: 'center' }]}>
                      {selectedChat?.otherUser ? (selectedChat.otherUser.username?.[0]?.toUpperCase() || selectedChat.otherUser.name?.[0]?.toUpperCase() || '?') : '?'}
                    </Text>
                  )}
              </View>
            </View>
            <Text style={{ paddingLeft: 0, fontSize: 16, textAlign: 'center', marginBottom: 0, color: '#FFFF00', fontWeight: '400', letterSpacing: 0.8 }}> 
              {selectedChat?.otherUser ? `${selectedChat.otherUser.name || ''} ${selectedChat.otherUser.surname || ''}`.trim() : 'Chat'}
            </Text>
            {selectedChat?.otherUser && selectedChat.otherUser.username && (
              <Text style={{ color: '#FFFF00', fontSize: 14, textAlign: 'center', marginTop: 0 }}>
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
                <Text style={[styles.msgText, item.sender === userId ? styles.msgTextSelf : styles.msgTextOther]}>{item.content}</Text>
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
              placeholder="Poruka..."
              placeholderTextColor="#FFFF00"
              value={messageInput}
              onChangeText={setMessageInput}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
              <MaterialIcons name="send" size={24} color="#181818" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 40,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '400',
    color: '#FFFF00',
    marginBottom: 10,
    alignSelf: 'flex-start',
    paddingLeft: 24,
    letterSpacing: 0.8,
  },
  tabsRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginRight: 8,
    borderTopWidth: 4,
    borderTopColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'transparent',
    borderTopColor: '#FFFF00',
  },
  tabText: {
    color: '#FFFF00',
    fontWeight: '400',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: '#FFFF00',
  },
  tabBadge: {
    backgroundColor: '#232c3b',
    borderRadius: 10,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: '#FFFF00',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  tabBadgeTextActive: {
    color: '#181818',
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 14,
    marginBottom: 10,
    alignSelf: 'flex-start',
    paddingLeft: 24,
    letterSpacing: 0.8,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    width: '92%',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFFF00',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFF00',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#181818',
  },
  avatarText: {
    color: '#181818',
    fontWeight: '400',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  chatName: {
    color: '#FFFF00',
    fontWeight: '400',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  chatLastMsg: {
    color: '#fff',
    fontSize: 14,
  },
  chatTime: {
    color: '#FFFF00',
    fontSize: 13,
    marginLeft: 8,
  },
  info: {
    color: '#000000',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  onlineBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 32,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 2,
    borderTopColor: '#FFFF00',
  },
  onlineText: {
    color: '#FFFF00',
    fontSize: 13,
    marginRight: 8,
    fontWeight: '300',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFF00',
  },
  msgRow: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  msgSelf: {
    backgroundColor: '#FFFF00',
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  msgOther: {
    backgroundColor: '#111111',
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  msgText: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  msgTextSelf: {
    color: '#181818',
  },
  msgTextOther: {
    color: '#FFFF00',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#FFFF00',
    borderRadius: 8,
    padding: 10,
    backgroundColor: 'transparent',
    color: '#FFFF00',
    marginRight: 8,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  sendBtn: {
    backgroundColor: '#FFFF00',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestChatCard: {
    backgroundColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: '#ff5252',
  },
  requestAvatar: {
    backgroundColor: '#ff5252',
    borderColor: '#ff5252',
  },
  requestLabel: {
    color: '#ff5252',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  matchChatCard: {
    backgroundColor: 'transparent',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  matchAvatar: {
    backgroundColor: '#4CAF50',
  },
  matchLabel: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  requestName: {
    color: '#ff5252',
  },
});

export default MessagesScreen; 