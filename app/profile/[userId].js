import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import AnimatedBackground from '../../components/AnimatedBackground';
import { ProfileDisplay } from '../../components/ProfileDisplay';
import {
    acceptFriendRequest,
    cancelFriendRequest,
    createChat,
    getFriendshipStatus,
    getUserAchievements,
    getUserStats,
    removeFriend,
    sendFriendRequest,
    supabase
} from '../../services/supabaseClient';

const UserProfileScreen = () => {
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('padel');
  const [stats, setStats] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null); // 'friends', 'request_sent', 'request_received', null
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sportRanks, setSportRanks] = useState([]);
  const [allSportData, setAllSportData] = useState({});
  const [language, setLanguage] = useState('serbian');
  const [isDarkMode, setIsDarkMode] = useState(true);

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



  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    setSelectedSport('padel');
  }, [userId]);

  useEffect(() => {
    if (!userId || !currentUserId) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data: profileData, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profileData) {
        // Check if profile is private, user is not the owner, and they are not friends
        if (profileData.privacy_settings?.profileVisibility === 'private' && 
            profileData.id !== currentUserId) {
          
          // Check if they are friends
          const { data: friendshipData } = await supabase
            .from('friends')
            .select('*')
            .or(`and(from_user.eq.${currentUserId},to_user.eq.${profileData.id}),and(from_user.eq.${profileData.id},to_user.eq.${currentUserId})`);
          
          const areFriends = friendshipData && friendshipData.length > 0;
          
          if (!areFriends) {
            Alert.alert(
              language === 'english' ? 'Private Profile' : 'Privatan profil',
              language === 'english' ? 'This profile is private and cannot be accessed.' : 'Ovaj profil je privatan i ne može se pristupiti.',
              [
                {
                  text: language === 'english' ? 'OK' : 'U redu',
                  onPress: () => router.back()
                }
              ]
            );
            return;
          }
        }
        setProfile(profileData);
      } else {
        console.error('Error fetching profile:', error);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId, currentUserId]);

  // Prefetch all sports data for the viewed user
  useEffect(() => {
    if (!profile) return;
    const fetchAll = async () => {
      const SPORTS = [
        { key: 'padel' },
        { key: 'fudbal' },
        { key: 'kosarka' },
        { key: 'tenis' },
      ];
      // Fetch all ranks in one query
      const { data: allRanks } = await supabase.from('user_sport_ranks').select('sport, rank').eq('user_id', profile.id);
      const result = {};
      await Promise.all(SPORTS.map(async (sport) => {
        const [achRes, statsRes] = await Promise.all([
          getUserAchievements(profile.id, sport.key),
          getUserStats(profile.id, sport.key)
        ]);
        const foundRank = allRanks?.find(r => r.sport === sport.key)?.rank || null;
        result[sport.key] = {
          achievements: achRes.data || [],
          stats: { ...statsRes, rank: foundRank } || { rank: foundRank }
        };
      }));
      setAllSportData(result);
    };
    fetchAll();
  }, [profile]);

  // When switching sports, update stats/achievements from allSportData
  useEffect(() => {
    if (!selectedSport || !allSportData[selectedSport]) return;
    setAchievements(allSportData[selectedSport].achievements);
    setStats(allSportData[selectedSport].stats);
  }, [selectedSport, allSportData]);

  // Refetch stats/achievements when profile, currentUserId, or selectedSport changes
  useEffect(() => {
    if (!profile || !currentUserId) return;
    let cancelled = false;
    const fetchSportSpecificData = async () => {
      const statsRes = await getUserStats(profile.id, selectedSport);
      if (!cancelled) setStats(prev => JSON.stringify(prev) !== JSON.stringify(statsRes) ? statsRes : prev);
      const achRes = await getUserAchievements(profile.id, selectedSport);
      if (!cancelled) setAchievements(prev => JSON.stringify(prev) !== JSON.stringify(achRes.data || []) ? (achRes.data || []) : prev);
    };
    const checkFriendship = async () => {
      if (currentUserId === userId) return;
      const status = await getFriendshipStatus(currentUserId, userId);
      if (!cancelled) setFriendStatus(status);
    };
    fetchSportSpecificData();
    checkFriendship();
    return () => { cancelled = true; };
  }, [profile, currentUserId, selectedSport, userId]);

  // Fetch sport ranks when profile changes
  useEffect(() => {
    if (!profile) return;
    const fetchRanks = async () => {
      const { data, error } = await supabase
        .from('user_sport_ranks')
        .select('sport, rank')
        .eq('user_id', profile.id);
      if (!error) setSportRanks(data || []);
    };
    fetchRanks();
  }, [profile]);

  // Handler for sport change
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
  };

  const handleFriendAction = async (mode) => {
    if (!currentUserId || !userId) return;
    try {
      if (mode === 'delete' || friendStatus === 'friends') {
        Alert.alert("Ukloni prijatelja", "Da li ste sigurni?", [
          { text: "Otkazi", style: "cancel" },
          { text: "Ukloni", style: "destructive", onPress: async () => {
            await removeFriend(currentUserId, userId);
            setFriendStatus(null);
          }}
        ]);
      } else if (mode === 'cancel') {
        // Cancel friend request regardless of direction
        if (friendStatus === 'request_sent') {
          await cancelFriendRequest(currentUserId, userId);
        } else if (friendStatus === 'request_received') {
          await cancelFriendRequest(userId, currentUserId);
        }
        setFriendStatus(null);
      } else if (mode === 'accept' || friendStatus === 'request_received') {
        // Fetch the friend request between userId and currentUserId
        const { data: requests, error } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`and(from_user.eq.${userId},to_user.eq.${currentUserId})`);
        if (error || !requests || requests.length === 0) {
          Alert.alert('Greška', 'Nije pronadjen zahtev za prijateljstvo.');
          return;
        }
        const requestId = requests[0].id;
        await acceptFriendRequest(requestId);
        setFriendStatus('friends');
      } else if (friendStatus === 'request_sent') {
        await cancelFriendRequest(currentUserId, userId);
        setFriendStatus(null);
      } else {
        await sendFriendRequest(currentUserId, userId);
        setFriendStatus('request_sent');
      }
    } catch (error) {
      Alert.alert("Greška", "Došlo je do greške prilikom izvrsavanja akcije.");
      console.error("Friend action error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUserId || !userId) return;
    try {
      const participants = [currentUserId, userId].sort();
      const { data: chat } = await createChat(participants, 'friend');
      let openTab = 'friends';
      if (friendStatus !== 'friends') {
        openTab = 'requests';
      }
      router.replace('/(tabs)/messages');
      setTimeout(() => {
        window.openChatId = chat.id;
        window.openChatTab = openTab;
      }, 100);
    } catch (error) {
      Alert.alert('Greška', 'Ne moze se otvoriti chat: ' + error.message);
    }
  };

  if (loading) {
    return (
      <AnimatedBackground isDarkMode={isDarkMode}>
        <ActivityIndicator size="large" color="#fff" style={styles.container} />
      </AnimatedBackground>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AnimatedBackground isDarkMode={isDarkMode}>
        <ScrollView style={{ flex: 1 }}>
          <ProfileDisplay
            profileData={profile}
            statsData={stats}
            achievementsData={achievements}
            isOwnProfile={currentUserId === userId}
            onBackPress={() => router.back()}
            selectedSport={selectedSport}
            setSelectedSport={handleSportChange}
            savingSport={false}
            setSavingSport={() => {}}
            onAddFriend={handleFriendAction}
            friendStatus={friendStatus}
            onSendMessage={currentUserId === userId ? undefined : handleSendMessage}
            language={language}
            isDarkMode={isDarkMode}
          />
        </ScrollView>
      </AnimatedBackground>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserProfileScreen; 