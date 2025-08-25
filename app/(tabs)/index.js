import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Button, FlatList, Image, Modal, FlatList as RNFlatList, Modal as RNModal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import QuestionnaireScreen from '../(onboarding)/questionnaire';
import AnimatedBackground from '../../components/AnimatedBackground';
import InviteFriendsPopup from '../../components/InviteFriendsPopup';
import OnlineFriends from '../../components/OnlineFriends';
import PaymentScreen from '../../components/PaymentScreen';
import PlaceholderModal from '../../components/PlaceholderModal';
import QuickActions from '../../components/QuickActions';
import Statistics from '../../components/Statistics';
import TodaysMatches from '../../components/TodaysMatches';
import { responsiveFontSize, scale, verticalScale } from '../../constants/Responsive';
import { acceptFriendRequest, declineFriendRequest, getFriendRequests, getFriends, supabase, updateLastActive } from '../../services/supabaseClient';
import { ThemeContext } from '../_layout';
import { useProfileRefresh } from '../context/ProfileRefreshContext';

// Language context
const LanguageContext = React.createContext();

// Language provider component
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('serbian'); // 'serbian' or 'english'
  
  const translations = {
    serbian: {
      welcome: 'Dobrodosli u',
      sastav: 'Sastav!',
      findSport: 'NADJI SPORT.\nBILO KAD.\nBILO GDE.',
      findPlayers: 'Pronadji igrace, rezervisi teren i organizuj najbolje meceve u gradu',
      playNow: 'Igraj sada',
      notifications: 'Notifikacije',
      todayMatches: 'Današnji mečevi',
      noMatchesToday: 'Nema mečeva danas.',
      close: 'Zatvori',
      friendRequest: 'Zahtev za prijateljstvo',
      accept: 'Prihvati',
      decline: 'Odbij',
      rankList: 'Rank lista',
      yourRank: 'Vaš rang: #',
      matchHistory: 'Istorija meceva',
      matchDetails: 'Detalji meca',
      winner: 'Pobednik',
      loser: 'Gubitnik',
      team1: 'Tim 1',
      team2: 'Tim 2',
      details: 'Detalji',
      padel: 'Padel',
      football: 'Fudbal',
      basketball: 'Košarka',
      tennis: 'Tenis',
    },
    english: {
      welcome: 'Welcome to',
      sastav: 'Sastav!',
      findSport: 'FIND SPORT.\nANYTIME.\nANYWHERE.',
      findPlayers: 'Find players, book courts and organize the best matches in the city',
      playNow: 'Play now',
      notifications: 'Notifications',
      todayMatches: 'Today\'s matches',
      noMatchesToday: 'No matches today.',
      close: 'Close',
      friendRequest: 'Friend request',
      accept: 'Accept',
      decline: 'Decline',
      rankList: 'Rank List',
      yourRank: 'Your rank: #',
      matchHistory: 'Match history',
      matchDetails: 'Match details',
      winner: 'Winner',
      loser: 'Loser',
      team1: 'Team 1',
      team2: 'Team 2',
      details: 'Details',
      padel: 'Padel',
      football: 'Football',
      basketball: 'Basketball',
      tennis: 'Tennis',
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const heroImages = [
  require('../../assets/images/hero-basketball.jpg'),
  require('../../assets/images/hero-football.jpg'),
  require('../../assets/images/hero-tennis.jpg'),
  require('../../assets/images/hero-padel.jpg'),
];

// Modal dimensions (same as profile page)
const modalWidth = 370;
const modalHeight = 540;

// Helper to robustly check if a friend is online (same as in OnlineFriends.js)
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

function SportSelectionGrid({ sports, onSelect }) {
  // Use the same styles and layout as the first-time login modal
  const sportImages = {
    tenis: require('../../assets/images/hero-tennis.jpg'),
    padel: require('../../assets/images/hero-padel.jpg'),
    fudbal: require('../../assets/images/hero-football.jpg'),
    kosarka: require('../../assets/images/hero-basketball.jpg'),
  };
  const sportBoxStyle = {
    width: 140,
    alignItems: 'center',
    margin: 14,
    backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#FFD600',
  };
  const sportImageStyle = {
    width: 110,
    height: 110,
    borderRadius: 14,
  };
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        {sports.slice(0, 2).map(item => (
          <TouchableOpacity
            key={item.key}
            style={sportBoxStyle}
            onPress={() => onSelect(item.key)}
          >
            <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: 16, marginBottom: 12, letterSpacing: 0.8 }} numberOfLines={1} ellipsizeMode="tail">{item.label}</Text>
            <Image source={sportImages[item.key]} style={sportImageStyle} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        {sports.slice(2, 4).map(item => (
          <TouchableOpacity
            key={item.key}
            style={sportBoxStyle}
            onPress={() => onSelect(item.key)}
          >
            <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: 16, marginBottom: 12, letterSpacing: 0.8 }} numberOfLines={1} ellipsizeMode="tail">{item.label}</Text>
            <Image source={sportImages[item.key]} style={sportImageStyle} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const StartScreen = () => {
  const [stats, setStats] = useState({ matches: 0, friends: 0, locations: 0, active: 0 });
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [heroIndex, setHeroIndex] = useState(() => Math.floor(Math.random() * heroImages.length));
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [questionnaireVisible, setQuestionnaireVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [matchesToday, setMatchesToday] = useState([]);
  const [inviteFriendsVisible, setInviteFriendsVisible] = useState(false);
  const [ratePlayersVisible, setRatePlayersVisible] = useState(false);
  const [allMatchesVisible, setAllMatchesVisible] = useState(false);
  const [friendsPreview, setFriendsPreview] = useState({ preview: [], all: [] });
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [requestSenders, setRequestSenders] = useState({});
  const [paymentVisible, setPaymentVisible] = useState(false);
  const router = useRouter();
  // Animated opacity for subtle effect
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showSportSelectionModal, setShowSportSelectionModal] = useState(false); // for + button
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false); // for + button
  const [selectedSport, setSelectedSport] = useState(null); // for + button
  const [showFirstTimeSportModal, setShowFirstTimeSportModal] = useState(false); // for first-time login
  const [showFirstTimeQuestionnaireModal, setShowFirstTimeQuestionnaireModal] = useState(false); // for first-time login
  const [firstTimeSelectedSport, setFirstTimeSelectedSport] = useState(null);
  const [userSports, setUserSports] = useState([]);
  const { refreshKey, setRefreshKey } = useProfileRefresh();
  const [showRankList, setShowRankList] = useState(false);
  const [showMatchHistory, setShowMatchHistory] = useState(false);
  const [rankSport, setRankSport] = useState('padel');
  const [rankListBySport, setRankListBySport] = useState({}); // { padel: [], fudbal: [], kosarka: [], tenis: [] }
  const [rankLoading, setRankLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Dark mode and language state
  const isDarkMode = theme === 'dark';
  const [language, setLanguage] = useState('serbian');
  
  // Load language preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.log('Error loading preferences:', error);
      }
    };
    loadPreferences();
  }, []);
  
  // Save language preference
  const saveLanguage = async (lang) => {
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.log('Error saving language preference:', error);
    }
  };
  
  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    toggleTheme();
  };
  
  // Handle language toggle
  const handleLanguageToggle = () => {
    const newLanguage = language === 'serbian' ? 'english' : 'serbian';
    setLanguage(newLanguage);
    saveLanguage(newLanguage);
  };
  
  // Language translations
  const translations = {
    serbian: {
      welcome: 'Dobrodosli u',
      sastav: 'Sastav!',
      findSport: 'NADJI SPORT.\nBILO KAD.\nBILO GDE.',
      findPlayers: 'Pronadji igrace, rezervisi teren i organizuj najbolje meceve u gradu',
      playNow: 'Igraj sada',
      statistics: 'Statistike',
      friends: 'Prijatelji',
      seeAll: 'Vidi sve',
      noFriends: 'Nema prijatelja',
      inviteFriends: 'Pozovite prijatelje da se pridruze ili pronadjite nove!',
      todayMatches: 'Danasnji mecevi',
      noMatchesToday: 'Nema meceva danas',
      noMatches: 'Nema meceva',
      findOrCreate: 'Pronadjite ili kreirajte svoj prvi mec!',
      quickActions: 'Brze akcije',
      inviteFriendsAction: 'Pozovi prijatelje',
      ratePlayers: 'Oceni igrace',
      noPlayersToRate: 'Nema igraca za ocenjivanje',
      rankList: 'Rank lista',
      matchHistory: 'Istorija meceva',
      notifications: 'Notifikacije',
      noNotifications: 'Nema notifikacija.',
      friendRequest: 'Zahtev za prijateljstvo',
      accept: 'Prihvati',
      decline: 'Odbij',
      close: 'Zatvori',
      onlineFriends: 'Aktivni prijatelji',
      activePlayers: 'Aktivni igraci',
      searchUsers: 'Pretraga korisnika',
      username: 'Korisnicko ime...',
      search: 'Pretraži',
      noResults: 'Nema rezultata.',
      todayMatchesTitle: 'Današnji mečevi',
      noMatchesTodayText: 'Nema mečeva danas.',
    },
    english: {
      welcome: 'Welcome to',
      sastav: 'Sastav!',
      findSport: 'FIND SPORT.\nANYTIME.\nANYWHERE.',
      findPlayers: 'Find players, book courts and organize the best matches in the city',
      playNow: 'Play now',
      statistics: 'Statistics',
      friends: 'Friends',
      seeAll: 'See all',
      noFriends: 'No friends',
      inviteFriends: 'Invite friends to join or find new ones!',
      todayMatches: 'Today\'s matches',
      noMatchesToday: 'No matches today',
      noMatches: 'No matches',
      findOrCreate: 'Find or create your first match!',
      quickActions: 'Quick Actions',
      inviteFriendsAction: 'Invite friends',
      ratePlayers: 'Rate players',
      noPlayersToRate: 'No players to rate',
      rankList: 'Rank List',
      matchHistory: 'Match history',
      notifications: 'Notifications',
      noNotifications: 'No notifications.',
      friendRequest: 'Friend request',
      accept: 'Accept',
      decline: 'Decline',
      close: 'Close',
      onlineFriends: 'Active friends',
      activePlayers: 'Active players',
      searchUsers: 'Search users',
      username: 'Username...',
      search: 'Search',
      noResults: 'No results.',
      todayMatchesTitle: 'Today\'s matches',
      noMatchesTodayText: 'No matches today.',
    }
  };
  
  const t = translations[language];
  const ALL_SPORTS = [
    { key: 'padel', label: 'Padel' },
    { key: 'fudbal', label: 'Fudbal' },
    { key: 'kosarka', label: 'Košarka' },
    { key: 'tenis', label: 'Tenis' },
  ];
  // Add state for match history
  const [matchHistoryBySport, setMatchHistoryBySport] = useState({}); // { padel: [], fudbal: [], kosarka: [], tenis: [] }
  const [matchHistoryLoading, setMatchHistoryLoading] = useState(false);
  const [selectedHistorySport, setSelectedHistorySport] = useState('padel');
  // Add state for selected match and modal visibility
  const [selectedDetailMatch, setSelectedDetailMatch] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailWinners, setDetailWinners] = useState([]);
  const [detailLosers, setDetailLosers] = useState([]);

  // Function to fetch winners and losers for a match
  async function fetchWinnersAndLosers(matchId) {
    // Fetch all participants for this match from match_history (team, name, surname, username now stored there)
    const { data } = await supabase
      .from('match_history')
      .select('user_id, result, team, name, surname, username')
      .eq('match_id', matchId);
    if (!data) return;
    // Group by team
    const team1 = [];
    const team2 = [];
    data.forEach(p => {
      if (p.team === 1) team1.push(p);
      else if (p.team === 2) team2.push(p);
    });
    setDetailWinners(team1);
    setDetailLosers(team2);
  }

  // Fetch completed sports from user_sport_ranks table
  const refetchUserSports = useCallback(async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const { data: completedRanks } = await supabase
      .from('user_sport_ranks')
      .select('sport')
      .eq('user_id', user.id);
    let sports = completedRanks ? completedRanks.map(q => q.sport) : [];
    setUserSports(sports);
  }, []);

  useEffect(() => {
    refetchUserSports();
  }, []);

  useEffect(() => {
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      // Check if user has any sport ranks
      const { data: ranks } = await supabase
        .from('user_sport_ranks')
        .select('id')
        .eq('user_id', user.id);
      if (!ranks || ranks.length === 0) {
        setShowFirstTimeSportModal(true);
      }
    })();
  }, []);

  const availableSports = ALL_SPORTS.filter(s => !userSports.includes(s.key));

  const fetchMatches = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayMatchesData } = await supabase
      .from('matches')
      .select('*, match_participants(user_id)')
      .gte('time', today.toISOString())
      .eq('status', 'scheduled') // Only show scheduled matches
      .order('time', { ascending: true });
    setMatchesToday(todayMatchesData ? todayMatchesData.slice(0, 2) : []);
  }

  // Fetch request senders info
  const fetchRequestSenders = useCallback(async (requests) => {
    if (!requests || requests.length === 0) return;
    
    const senderIds = requests.map(req => req.from_user);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, name, surname')
      .in('id', senderIds);
    
    const senderMap = {};
    for (const p of profiles || []) {
      senderMap[p.id] = p;
    }
    setRequestSenders(senderMap);
  }, []);

  // Open notifications modal and fetch sender info
  const openNotifications = useCallback(() => {
    setNotificationsVisible(true);
    // Always re-fetch friend requests when opening notifications
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      const reqRes = await getFriendRequests(user.id);
      setFriendRequests(reqRes.data || []);
      fetchRequestSenders(reqRes.data || []);
    })();
  }, [fetchRequestSenders]);

  // After accepting, re-fetch requests and friends
  const handleAcceptRequest = async (requestId) => {
    await acceptFriendRequest(requestId);
    // Re-fetch friend requests and friends
    const user = (await supabase.auth.getUser()).data.user;
    const reqRes = await getFriendRequests(user.id);
    setFriendRequests(reqRes.data || []);
    const friendsRes = await getFriends(user.id);
    setFriends(friendsRes.data || []);
    setNotificationsVisible(false);
  };

  const handleDeclineRequest = async (requestId) => {
    console.log('Declining request:', requestId);
    const { error } = await declineFriendRequest(requestId);
    if (error) {
      console.error('Error declining request:', error);
      Alert.alert('Greška', 'Ne možete odbiti zahtev: ' + error.message);
    }
    // Re-fetch friend requests
    const user = (await supabase.auth.getUser()).data.user;
    const reqRes = await getFriendRequests(user.id);
    setFriendRequests(reqRes.data || []);
  };

  useEffect(() => {
    updateLastActive();
    const interval = setInterval(updateLastActive, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Real-time subscription for friend requests
  useEffect(() => {
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Subscribe to INSERT and DELETE events on friend_requests where to_user or from_user = current user
      const channel = supabase
        .channel('friend-requests-' + user.id)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'friend_requests',
            filter: `to_user=eq.${user.id}`,
          },
          (payload) => {
            // Re-fetch friend requests
            getFriendRequests(user.id).then(res => setFriendRequests(res.data || []));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'friend_requests',
            filter: `to_user=eq.${user.id}`,
          },
          (payload) => {
            // Re-fetch friend requests
            getFriendRequests(user.id).then(res => setFriendRequests(res.data || []));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, []);

  useEffect(() => {
    fetchRequestSenders(friendRequests);
  }, [friendRequests, fetchRequestSenders]);

  useEffect(() => {
    const fetchStats = async () => {
      // Remove matches count and locations logic
      // Fetch friends for current user
      const user = (await supabase.auth.getUser()).data.user;
      let friendsCount = 0;
      let allFriendsWithProfiles = [];
      let onlineFriendsList = [];
      if (user) {
        const friendsRes = await getFriends(user.id);
        const friendsList = friendsRes.data || [];
        setFriends(friendsList);
        friendsCount = friendsList.length;
        // Get friend user IDs
        const friendIds = friendsList.map(f => f.from_user === user.id ? f.to_user : f.from_user);
        let profiles = [];
        if (friendIds.length > 0) {
          // Fetch all profiles for friends
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, name, surname, last_active, avatar_url')
            .in('id', friendIds);
          profiles = profileData || [];
        }
        // Attach profile to each friend
        allFriendsWithProfiles = friendsList.map(f => {
          const fid = f.from_user === user.id ? f.to_user : f.from_user;
          return { ...f, profile: profiles.find(p => p.id === fid) };
        });
        // Online friends (for statistics)
        onlineFriendsList = allFriendsWithProfiles.filter(f => isFriendOnline(f.profile));
        setOnlineFriends(onlineFriendsList);
      }
      // Fetch all users active in the last 2 minutes
      const { count: activeCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('last_active', new Date(Date.now() - 2 * 60 * 1000).toISOString());
      setActiveUsersCount(activeCount || 0);
      setStats({
        friends: friendsCount,
        active: activeCount || 0, // use all active users count
      });
      // Pass both preview and all friends to OnlineFriends
      setFriendsPreview({ preview: allFriendsWithProfiles, all: allFriendsWithProfiles });
    };
    fetchStats();
    const statsInterval = setInterval(fetchStats, 5000); // fetch stats every 5 seconds
    return () => clearInterval(statsInterval);
  }, []);

  useEffect(() => {
    fetchMatches(); // Initial fetch
    const interval = setInterval(() => {
      fetchMatches();
    }, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacityAnim]);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    const { data } = await supabase.from('profiles').select('id, username').ilike('username', `%${searchInput.trim()}%`);
    setSearchResults(data || []);
  };

  const sections = [
    { type: 'header', key: 'header' },
    { type: 'hero', key: 'hero' },
    { type: 'stats', key: 'stats' },
    { type: 'friends', key: 'friends' },
    { type: 'matches', key: 'matches' },
    { type: 'actions', key: 'actions' },
  ];

  const renderSection = ({ item }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: scale(38), marginBottom: verticalScale(18), paddingHorizontal: scale(16) }}>
            <View style={{ marginLeft: scale(12) }}>
              <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '300', fontSize: responsiveFontSize(14), marginBottom: scale(2) }}>{t.welcome}</Text>
              <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: responsiveFontSize(22), letterSpacing: 0.8 }}>{t.sastav}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Dark Mode Toggle */}
              <TouchableOpacity 
                style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(8), padding: scale(8), marginRight: scale(8), minWidth: scale(38), minHeight: scale(38), justifyContent: 'center', alignItems: 'center' }}
                onPress={handleDarkModeToggle}
              >
                <Ionicons 
                  name={isDarkMode ? "sunny" : "moon"} 
                  size={scale(22)} 
                  color="#FFFF00" 
                />
              </TouchableOpacity>
              
              {/* Language Toggle */}
              <TouchableOpacity 
                style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(8), padding: scale(8), marginRight: scale(8), minWidth: scale(38), minHeight: scale(38), justifyContent: 'center', alignItems: 'center' }}
                onPress={handleLanguageToggle}
              >
                <Text style={{ color: '#FFFF00', fontSize: responsiveFontSize(14), fontWeight: '300', letterSpacing: 0.5 }}>
                  {language === 'serbian' ? 'EN' : 'SR'}
                </Text>
              </TouchableOpacity>
              
              {/* Notifications */}
              <TouchableOpacity 
                style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(8), padding: scale(8), position: 'relative', marginRight: scale(8), minWidth: scale(38), minHeight: scale(38), justifyContent: 'center', alignItems: 'center' }}
                onPress={openNotifications}
              >
                <Ionicons name="notifications-outline" size={scale(22)} color="#FFFF00" />
                {friendRequests.length > 0 && (
                  <View style={{ 
                    position: 'absolute', 
                    top: -2, 
                    right: -2, 
                    backgroundColor: '#FFD600', 
                    borderRadius: scale(10), 
                    minWidth: scale(20), 
                    height: scale(20), 
                    justifyContent: 'center', 
                    alignItems: 'center' 
                  }}>
                    <Text style={{ color: '#111', fontSize: responsiveFontSize(9), fontWeight: '400', letterSpacing: 0.5 }}>
                      {friendRequests.length > 9 ? '9+' : friendRequests.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Add Button */}
              <TouchableOpacity
                style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(8), padding: scale(8), minWidth: scale(38), minHeight: scale(38), justifyContent: 'center', alignItems: 'center' }}
                onPress={() => { setShowSportSelectionModal(true); setSelectedSport(null); }}
              >
                <Ionicons name="add" size={scale(22)} color="#FFFF00" />
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'hero':
        return (
          <View style={{ width: '100%', alignItems: 'center', marginTop: scale(0), marginBottom: scale(8) }}>
            <View style={{ flexDirection: 'row', width: scale(340), borderRadius: scale(18), overflow: 'hidden', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', marginBottom: scale(0), alignItems: 'center', padding: scale(0) }}>
              <View style={{ flex: 1, paddingVertical: scale(14), paddingHorizontal: scale(18), justifyContent: 'flex-start' }}>
                <Text
                  style={{
                    color: '#FFFF00',
                    fontWeight: '300',
                    fontSize: 16,
                    marginBottom: 4,
                    lineHeight: 20,
                    textAlign: 'left',
                    letterSpacing: 1.0,
                  }}
                >
                  {t.findSport}
                </Text>
                <Text
                  style={{
                    color: isDarkMode ? '#fff' : '#000',
                    fontSize: 13,
                    marginBottom: 8,
                    lineHeight: 16,
                    fontWeight: '300',
                    letterSpacing: 0.5,
                  }}
                >
                  {t.findPlayers}
                </Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(8), paddingVertical: scale(7), paddingHorizontal: scale(16), alignSelf: 'flex-start', elevation: 2 }}
                  onPress={() => router.push('/matches')}
                >
                  <Ionicons name="play" size={scale(15)} color="#FFFF00" style={{ marginRight: scale(6) }} />
                  <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: 13, letterSpacing: 0.8 }}>{t.playNow}</Text>
                </TouchableOpacity>
              </View>
              <Animated.View style={{ marginRight: scale(18), alignItems: 'center', justifyContent: 'center' }}>
                <Image source={heroImages[heroIndex]} style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: '#FFFF00' }} resizeMode="cover" />
              </Animated.View>
            </View>
          </View>
        );
      case 'stats':
        return <Statistics stats={{ active: activeUsersCount }} onlineFriendsCount={onlineFriends.length} isDarkMode={isDarkMode} t={t} />;
      case 'friends':
        return <OnlineFriends key={refreshKey} friends={friendsPreview.preview} allFriends={friendsPreview.all} isDarkMode={isDarkMode} t={t} />;
      case 'matches':
        return <TodaysMatches matches={matchesToday} onSeeAll={() => setAllMatchesVisible(true)} isDarkMode={isDarkMode} t={t} />;
      case 'actions':
        return (
          <QuickActions
            onInviteFriends={() => setInviteFriendsVisible(true)}
            onRatePlayers={() => setRatePlayersVisible(true)}
            onShowRankList={() => setShowRankList(true)}
            onShowMatchHistory={() => setShowMatchHistory(true)}
            isDarkMode={isDarkMode}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  // Deduplicate matchHistory by match_id
  const currentHistory = matchHistoryBySport[selectedHistorySport] || [];
  const uniqueMatchHistory = [];
  const seenMatchIds = new Set();
  for (const item of currentHistory) {
    if (!seenMatchIds.has(item.match_id)) {
      uniqueMatchHistory.push(item);
      seenMatchIds.add(item.match_id);
    }
  }

  // Polling: Refetch friend requests every 2 seconds for both received and deleted requests
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const fetchRequests = async () => {
        const res = await getFriendRequests(user.id);
        if (isMounted) setFriendRequests(res.data || []);
      };

      fetchRequests(); // Fetch immediately
      const interval = setInterval(fetchRequests, 2000); // Fetch every 2 seconds

      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    })();
  }, []);

  // Map sport keys to images
  const sportImages = {
    tenis: require('../../assets/images/hero-tennis.jpg'),
    padel: require('../../assets/images/hero-padel.jpg'),
    fudbal: require('../../assets/images/hero-football.jpg'),
    kosarka: require('../../assets/images/hero-basketball.jpg'),
  };

  // Updated sizes for bigger sport boxes and images
  const sportBoxStyle = {
    width: 140,
    alignItems: 'center',
    margin: 14,
    backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#FFD600',
  };
  const sportImageStyle = {
    width: 110,
    height: 110,
    borderRadius: 14,
  };

  const handleSelectSport = (sportKey) => {
    setShowFirstTimeQuestionnaire(false);
    setTimeout(() => {
      setFirstTimeSport(sportKey);
      setShowFirstTimeQuestionnaire(true);
    }, 100);
  };

  // Fetch rank list for selected sport
  useEffect(() => {
    if (!showRankList) return;
    let isMounted = true;
    (async () => {
      setRankLoading(true);
      const sports = ['padel', 'fudbal', 'kosarka', 'tenis'];
      const fetchRanks = async (sport) => {
        const { data: ranks } = await supabase
          .from('user_sport_ranks')
          .select('user_id, rank, sport')
          .eq('sport', sport);
        if (!ranks) return [];
        const userIds = ranks.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, name, surname')
          .in('id', userIds);
        const merged = ranks.map(r => ({
          ...r,
          profile: profiles.find(p => p.id === r.user_id) || {},
        }));
        merged.sort((a, b) => b.rank - a.rank);
        return merged;
      };
      const results = await Promise.all(sports.map(fetchRanks));
      const newRankLists = {
        padel: results[0],
        fudbal: results[1],
        kosarka: results[2],
        tenis: results[3],
      };
      if (isMounted) {
        setRankListBySport(newRankLists);
        // Set user rank and profile for the selected sport
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const merged = newRankLists[rankSport] || [];
          const idx = merged.findIndex(r => r.user_id === user.id);
          setUserRank(idx >= 0 ? idx + 1 : null);
          setUserProfile(merged.find(r => r.user_id === user.id)?.profile || null);
        } else {
          setUserRank(null);
          setUserProfile(null);
        }
        setRankLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [showRankList]);

  // Update fetch match history logic to use the new RPC for padel doubles
  useEffect(() => {
    if (!showMatchHistory) return;
    let isMounted = true;
    (async () => {
      setMatchHistoryLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setMatchHistoryBySport({});
        setMatchHistoryLoading(false);
        return;
      }
      const fetchPadel = supabase.rpc('get_padel_doubles_history', { user_id_param: user.id });
      const fetchOther = (sport) => supabase.rpc('get_match_history_with_opponents', { user_id_param: user.id, sport_param: sport });
      const sports = ['padel', 'fudbal', 'kosarka', 'tenis'];
      const promises = [
        fetchPadel,
        fetchOther('fudbal'),
        fetchOther('kosarka'),
        fetchOther('tenis'),
      ];
      const results = await Promise.all(promises);
      const newHistory = {
        padel: results[0].data || [],
        fudbal: results[1].data || [],
        kosarka: results[2].data || [],
        tenis: results[3].data || [],
      };
      if (isMounted) {
        setMatchHistoryBySport(newHistory);
        setMatchHistoryLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [showMatchHistory]);

  const isTeam1Winner = detailWinners.length > 0 && detailWinners[0].result === 'win';

  return (
    <AnimatedBackground isDarkMode={isDarkMode}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={item => item.key}
          contentContainerStyle={{ alignItems: 'center', paddingBottom: scale(60) }}
          showsVerticalScrollIndicator={false}
        />

        <Modal visible={searchVisible} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#232b3b' : '#FFFFFF' }]}>
              <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#000' }]}>{t.searchUsers}</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5',
                  color: isDarkMode ? '#fff' : '#000',
                  borderColor: isDarkMode ? '#444' : '#ddd'
                }]}
                placeholder={t.username}
                placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
                value={searchInput}
                onChangeText={setSearchInput}
              />
              <Button title={t.search} onPress={handleSearch} />
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.searchResult} onPress={() => router.push(`/user/${item.id}`)}>
                    <Text style={[styles.searchResultText, { color: '#FFFF00' }]}>
                      {item.name} {item.surname} @{item.username}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={[styles.friendEmpty, { color: isDarkMode ? '#fff' : '#000' }]}>{t.noResults}</Text>}
                style={{ width: '100%' }}
              />
              <Button title="Zatvori" onPress={() => setSearchVisible(false)} />
            </View>
          </View>
        </Modal>

        {/* All Matches Modal */}
        <RNModal visible={allMatchesVisible} transparent animationType="slide" onRequestClose={() => setAllMatchesVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: isDarkMode ? '#232b3b' : '#FFFFFF', borderRadius: scale(16), padding: scale(28), width: scale(340), alignItems: 'center', maxHeight: scale(500) }}>
              <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: responsiveFontSize(17), marginBottom: scale(16), letterSpacing: 0.8 }}>{t.todayMatchesTitle}</Text>
              {matchesToday.length === 0 ? (
                <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: responsiveFontSize(15), marginBottom: scale(24) }}>{t.noMatchesTodayText}</Text>
              ) : (
                <FlatList
                  data={matchesToday}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: scale(12), padding: scale(14), marginBottom: scale(10) }}>
                      <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: responsiveFontSize(14), letterSpacing: 0.5 }}>{item.location}</Text>
                      <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: responsiveFontSize(13) }}>{item.name}</Text>
                      <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: responsiveFontSize(13) }}>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  )}
                />
              )}
              <TouchableOpacity onPress={() => setAllMatchesVisible(false)} style={{ backgroundColor: '#00b894', borderRadius: scale(8), paddingVertical: scale(10), paddingHorizontal: scale(24), marginTop: scale(10) }}>
                <Text style={{ color: '#fff', fontWeight: '400', fontSize: responsiveFontSize(14), letterSpacing: 0.5 }}>{t.close}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNModal>
        {/* Invite Friends Modal */}
        <InviteFriendsPopup
          visible={inviteFriendsVisible}
          onClose={() => setInviteFriendsVisible(false)}
          isDarkMode={isDarkMode}
        />
        {/* Rate Players Modal */}
        <PlaceholderModal
          visible={ratePlayersVisible}
          onClose={() => setRatePlayersVisible(false)}
          title="Oceni igrače"
          text="Ovde će biti ocenjivanje igrača."
          language={language}
          isDarkMode={isDarkMode}
        />

        {/* Notifications Modal */}
        <Modal
          visible={notificationsVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setNotificationsVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ flex: 1, borderRadius: 0, overflow: 'hidden', paddingTop: 48, alignItems: 'center', elevation: 8 }}>
              <AnimatedBackground isDarkMode={isDarkMode} />
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16, marginTop: 48 }}>
                  <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: 18, textAlign: 'left', letterSpacing: 0.8 }}>{t.notifications}</Text>
                  <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                    <Ionicons name="close" size={28} color="#FFFF00" />
                  </TouchableOpacity>
                </View>
                <View style={{ width: '100%', flex: 1, paddingHorizontal: 24, paddingBottom: 24 }}>
                  {friendRequests.length === 0 ? (
                    <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: 17, textAlign: 'center', marginTop: 20 }}>{t.noNotifications}</Text>
                  ) : (
                    <FlatList
                      data={friendRequests}
                      keyExtractor={item => item.id}
                      renderItem={({ item }) => {
                        const sender = requestSenders[item.from_user];
                        return (
                          <View key={item.id} style={{ marginBottom: 18 }}>
                            <Text style={{ color: '#FFFF00', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginBottom: 6 }}>{t.friendRequest}</Text>
                            <View style={{ backgroundColor: isDarkMode ? 'rgba(35,43,59,0.7)' : 'rgba(245,245,245,0.9)', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <View>
                                <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 17 }}>
                                  {sender ? `${sender.name || ''} ${sender.surname || ''}`.trim() : item.from_user}
                                </Text>
                                {sender && (
                                  <Text style={{ color: isDarkMode ? '#b0b8c1' : '#666', fontSize: 15 }}>@{sender.username}</Text>
                                )}
                              </View>
                              <View style={{ flexDirection: 'row' }}>
                                                                  <TouchableOpacity style={{ backgroundColor: '#FFFF00', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, marginRight: 6 }} onPress={() => handleAcceptRequest(item.id)}>
                                    <Text style={{ color: '#181818', fontWeight: 'bold', fontSize: 14 }}>{t.accept}</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity style={{ backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: '#FFFF00' }} onPress={() => handleDeclineRequest(item.id)}>
                                    <Text style={{ color: '#FFFF00', fontWeight: 'bold', fontSize: 14 }}>{t.decline}</Text>
                                  </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      }}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={paymentVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '95%', height: '85%', backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', alignItems: 'center', elevation: 8, paddingVertical: 16 }}>
              <TouchableOpacity onPress={() => setPaymentVisible(false)} style={{ alignSelf: 'flex-end', margin: 8, padding: 8, position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
                <Ionicons name="close" size={28} color="#232b3b" />
              </TouchableOpacity>
              <View style={{ flex: 1, width: '100%', justifyContent: 'center' }}>
                <PaymentScreen />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showSportSelectionModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowSportSelectionModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ width: 370, height: 600, borderRadius: 18, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: 'transparent', position: 'relative' }}>
              <AnimatedBackground />
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: 24, borderRadius: 18 }}>
                <TouchableOpacity onPress={() => setShowSportSelectionModal(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: 0 }}>
                  <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: 20, textAlign: 'left', letterSpacing: 0.8 }}>Izaberi sport</Text>
                </View>
                <SportSelectionGrid
                  sports={availableSports}
                  onSelect={sport => {
                    setShowSportSelectionModal(false);
                    setTimeout(() => {
                      setSelectedSport(sport);
                      setShowQuestionnaireModal(true);
                    }, 200);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showQuestionnaireModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowQuestionnaireModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ width: '85%', height: '85%', borderRadius: 18, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: 'transparent', position: 'relative' }}>
              <AnimatedBackground />
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: 24, borderRadius: 18 }}>
                <TouchableOpacity onPress={() => setShowQuestionnaireModal(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
                <QuestionnaireScreen
                  key={selectedSport}
                  initialSport={selectedSport}
                  onFinish={async () => {
                    setShowQuestionnaireModal(false);
                    setSelectedSport(null);
                    await refetchUserSports();
                    setRefreshKey(k => k + 1);
                    router.replace('/(tabs)/profile');
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* First-time questionnaire modal */}
        <Modal
          visible={showFirstTimeSportModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowFirstTimeSportModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ width: 370, height: 600, borderRadius: 18, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: 'transparent', position: 'relative' }}>
              <AnimatedBackground />
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: 24, borderRadius: 18 }}>
                <View style={{ width: '100%', alignItems: 'flex-start', marginBottom: -18 }}>
                  <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: 20, textAlign: 'left', letterSpacing: 0.8 }}>Izaberi sport</Text>
                </View>
                <SportSelectionGrid
                  sports={ALL_SPORTS}
                  onSelect={sport => {
                    setShowFirstTimeSportModal(false);
                    setTimeout(() => {
                      setFirstTimeSelectedSport(sport);
                      setShowFirstTimeQuestionnaireModal(true);
                    }, 200);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* First-time questionnaire modal */}
        <Modal
          visible={showFirstTimeQuestionnaireModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowFirstTimeQuestionnaireModal(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ width: '85%', height: '85%', borderRadius: 18, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: 'transparent', position: 'relative' }}>
              <AnimatedBackground />
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: 24, borderRadius: 18 }}>
                <QuestionnaireScreen
                  key={firstTimeSelectedSport}
                  initialSport={firstTimeSelectedSport}
                  onFinish={async () => {
                    setShowFirstTimeQuestionnaireModal(false);
                    setFirstTimeSelectedSport(null);
                    await refetchUserSports();
                    setRefreshKey(k => k + 1);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Rank List Modal */}
        <Modal
          visible={showRankList}
          animationType="fade"
          transparent
          onRequestClose={() => setShowRankList(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ width: 370, height: 600, borderRadius: 18, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: isDarkMode ? '#2a3441' : '#fff', position: 'relative' }}>
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: 24, borderRadius: 18 }}>
                <TouchableOpacity onPress={() => setShowRankList(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                  <Ionicons name="close" size={28} color="#FFFF00" />
                </TouchableOpacity>
                <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 24, marginBottom: 10 }}>Rang lista</Text>
               {/* Sport selection tabs */}
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 0, width: '100%', overflow: 'hidden' }}>
                 {/* Match Mecevi/Poruka style: transparent bg, yellow top border for active, bold yellow text for active, white for inactive, rounded corners */}
                  {ALL_SPORTS.map(s => (
                   <TouchableOpacity
                     key={s.key}
                     onPress={() => setRankSport(s.key)}
                     style={{
                       paddingVertical: 6,
                       paddingHorizontal: 8,
                       borderRadius: 16,
                       backgroundColor: 'transparent',
                       marginRight: 2,
                       borderTopWidth: 4,
                       borderTopColor: rankSport === s.key ? '#FFD600' : 'transparent',
                     }}
                   >
                     <Text style={{
                       color: rankSport === s.key ? '#FFFF00' : (isDarkMode ? '#fff' : '#000'),
                       fontWeight: '300',
                       fontSize: 15,
                     }}>
                       {s.label}
                     </Text>
                   </TouchableOpacity>
                  ))}
                </View>
               {/* Rank list content */}
               {rankLoading ? (
                 <ActivityIndicator color="#FFD600" style={{ marginTop: 24 }} />
               ) : (
                 <RNFlatList
                   data={(rankListBySport[rankSport] || []).slice(0, 25)}
                   keyExtractor={item => item.user_id}
                   style={{ flexGrow: 0, marginBottom: 10 }}
                   renderItem={({ item, index }) => (
                     <View style={{
                       flexDirection: 'row',
                       alignItems: 'center',
                       backgroundColor: 'transparent',
                       borderRadius: 10,
                       paddingVertical: 6,
                       paddingHorizontal: 10,
                       marginBottom: 2,
                     }}>
                       <Text style={{ width: 28, color: '#FFFF00', fontWeight: '300', fontSize: 16 }}>{index + 1}.</Text>
                       <View style={{ flex: 1 }}>
                         <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '300', fontSize: 15 }} numberOfLines={1} ellipsizeMode="tail">
                           {item.profile?.name || '-'} {item.profile?.surname || ''}
                         </Text>
                         <Text style={{ color: '#FFFF00', fontSize: 13, fontWeight: '300' }} numberOfLines={1} ellipsizeMode="tail">
                           @{item.profile?.username || '-'}
                         </Text>
                       </View>
                       {/* Badge for top 3 */}
                       {index === 0 && <Text style={{ fontSize: 18, marginRight: 4 }}>🥇</Text>}
                       {index === 1 && <Text style={{ fontSize: 18, marginRight: 4 }}>🥈</Text>}
                       {index === 2 && <Text style={{ fontSize: 18, marginRight: 4 }}>🥉</Text>}
                       <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 16, marginLeft: 4 }}>{item.rank}</Text>
                     </View>
                   )}
                   ListEmptyComponent={<Text style={{ color: isDarkMode ? '#fff' : '#000', textAlign: 'center', marginTop: 24, fontWeight: '300' }}>Nema podataka za ovaj sport.</Text>}
                 />
               )}
               {/* User's own rank at the bottom */}
               {userRank && userProfile && (
                 <View style={{ marginTop: 10, alignItems: 'center' }}>
                   <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 16 }}>Vaš rang: #{userRank}</Text>
                   <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 15, fontWeight: '300' }}>{userProfile.name || '-'} {userProfile.surname || ''} <Text style={{ color: '#FFFF00', fontSize: 13, fontWeight: '300' }}>@{userProfile.username || '-'}</Text></Text>
                 </View>
               )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Match History Modal */}
        <Modal
          visible={showMatchHistory}
          animationType="fade"
          transparent
          onRequestClose={() => setShowMatchHistory(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View style={{ width: 370, height: 600, borderRadius: 18, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: isDarkMode ? '#2a3441' : '#fff', position: 'relative' }}>
              <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: 24, borderRadius: 18 }}>
                <TouchableOpacity onPress={() => setShowMatchHistory(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                  <Ionicons name="close" size={28} color="#FFFF00" />
                </TouchableOpacity>
                <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 24, marginBottom: 18, textAlign: 'center' }}>Istorija meceva</Text>
                {/* Sport selection tabs for match history */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '100%' }}>
                  {ALL_SPORTS.map(s => (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => setSelectedHistorySport(s.key)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 8,
                        borderRadius: 16,
                        backgroundColor: 'transparent',
                        marginRight: 2,
                        borderTopWidth: 4,
                        borderTopColor: selectedHistorySport === s.key ? '#FFFF00' : 'transparent',
                      }}
                    >
                      <Text style={{
                        color: selectedHistorySport === s.key ? '#FFFF00' : (isDarkMode ? '#fff' : '#000'),
                        fontWeight: '300',
                        fontSize: 15,
                      }}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {matchHistoryLoading ? (
                  <ActivityIndicator color="#FFFF00" style={{ marginTop: 20 }} />
                ) : uniqueMatchHistory.length === 0 ? (
                  <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 18, textAlign: 'center', marginTop: 8 }}>Nemate odigranih meceva.</Text>
                ) : (
                  <FlatList
                    data={uniqueMatchHistory}
                    keyExtractor={item => item.match_id?.toString()}
                    renderItem={({ item }) => (
                      selectedHistorySport === 'padel' && item.opponents ? (
                        (() => {
                          // Deduplicate opponents by id
                          const uniqueOpponents = [];
                          const seen = new Set();
                          item.opponents.forEach(u => {
                            if (u && u.id && !seen.has(u.id)) {
                              uniqueOpponents.push(u);
                              seen.add(u.id);
                            }
                          });
                          return (
                            <View key={item.id} style={{ backgroundColor: '#232c3b', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                              <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 16 }}>Padel</Text>
                              <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 15, marginBottom: 2, fontWeight: '300' }}>
                                Protiv: {uniqueOpponents.map(u => `${u.name} ${u.surname} @${u.username}`).join(' & ')}
                              </Text>
                              <Text style={{ color: item.result === 'win' ? '#00e676' : '#ff5252', fontWeight: '300' }}>
                                {item.result === 'win' ? 'Pobeda' : 'Poraz'}
                              </Text>
                              <Text style={{ color: '#FFFF00', fontSize: 14, fontWeight: '300' }}>
                                Poeni: {item.points_before} → {item.points_after} ({item.points_change > 0 ? '+' : ''}{item.points_change})
                              </Text>
                              <Text style={{ color: '#b0b8c1', fontSize: 13, marginTop: 2 }}>
                                {new Date(item.created_at).toLocaleString()}
                              </Text>
                            </View>
                          );
                        })()
                      ) : (selectedHistorySport === 'fudbal' || selectedHistorySport === 'kosarka') ? (
                        <View key={item.id} style={{ backgroundColor: '#232c3b', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 16 }}>{item.sport?.charAt(0).toUpperCase() + item.sport?.slice(1)}</Text>
                            <Text style={{ color: item.result === 'win' ? '#00e676' : '#ff5252', fontWeight: '300' }}>
                              {item.result === 'win' ? 'Pobeda' : 'Poraz'}
                            </Text>
                            <Text style={{ color: '#FFFF00', fontSize: 14, fontWeight: '300' }}>
                              Poeni: {item.points_before} → {item.points_after} ({item.points_change > 0 ? '+' : ''}{item.points_change})
                            </Text>
                            <Text style={{ color: '#b0b8c1', fontSize: 13, marginTop: 2, fontWeight: '300' }}>
                              {new Date(item.created_at).toLocaleString()}
                            </Text>
                          </View>
                          <TouchableOpacity onPress={async () => {
                            setShowMatchHistory(false);
                            setTimeout(async () => {
                              setSelectedDetailMatch(item);
                              setShowDetailModal(true);
                              await fetchWinnersAndLosers(item.match_id);
                            }, 300);
                          }} style={{ alignSelf: 'center', marginLeft: 12 }}>
                            <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 15, textDecorationLine: 'underline', textAlign: 'right' }}>Detalji</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View key={item.id} style={{ backgroundColor: '#232c3b', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                                                     <Text style={{ color: '#FFFF00', fontWeight: '300', fontSize: 16 }}>{item.sport?.charAt(0).toUpperCase() + item.sport?.slice(1)}</Text>
                          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 15, marginBottom: 2, fontWeight: '300' }}>
                            Protiv: {item.opponent_name || ''} {item.opponent_surname || ''} @{item.opponent_username || ''}
                          </Text>
                          <Text style={{ color: item.result === 'win' ? '#00e676' : '#ff5252', fontWeight: '300' }}>
                            {item.result === 'win' ? 'Pobeda' : 'Poraz'}
                          </Text>
                          <Text style={{ color: '#FFFF00', fontSize: 14, fontWeight: '300' }}>
                            Poeni: {item.points_before} → {item.points_after} ({item.points_change > 0 ? '+' : ''}{item.points_change})
                          </Text>
                          <Text style={{ color: '#b0b8c1', fontSize: 13, marginTop: 2, fontWeight: '300' }}>
                            {new Date(item.created_at).toLocaleString()}
                          </Text>
                        </View>
                      )
                    )}
                    style={{ width: '100%' }}
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Detail Match Modal */}
        {(showDetailModal && (selectedHistorySport === 'fudbal' || selectedHistorySport === 'kosarka')) && (
          <Modal
            visible={showDetailModal}
            animationType="slide"
            transparent
            onRequestClose={() => {
              setShowDetailModal(false);
              setTimeout(() => setShowMatchHistory(true), 300); // Reopen history after closing detail
            }}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
              <View style={{ width: '85%', height: '85%', borderRadius: 18, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start', backgroundColor: 'transparent', position: 'relative' }}>
                <AnimatedBackground />
                <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: 24, borderRadius: 18 }}>
                  <TouchableOpacity onPress={() => {
                    setShowDetailModal(false);
                    setTimeout(() => setShowMatchHistory(true), 300); // Reopen history after closing detail
                  }} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
                    <Ionicons name="close" size={28} color="#FFD600" />
                  </TouchableOpacity>
                  <Text style={{ color: '#FFD600', fontWeight: 'bold', fontSize: 22, marginBottom: 18, textAlign: 'center', alignSelf: 'center' }}>Detalji meca</Text>
                  {/* Before rendering Team 1 and Team 2 columns, determine which team is the winner */}
                  <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
                    {/* Team 1 */}
                    <View style={{ flex: 1, alignItems: 'flex-start', marginRight: 16 }}>
                      <View style={{ alignItems: 'flex-start', marginBottom: 2 }}>
                        {isTeam1Winner ? (
                          <Text style={{ color: '#FFD600', fontWeight: 'bold', fontSize: 15, textAlign: 'left' }}>Pobednik</Text>
                        ) : (
                          <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 15, textAlign: 'left' }}>Gubitnik</Text>
                        )}
                      </View>
                      <Text style={{ color: '#FFD600', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Tim 1</Text>
                      {detailWinners.map((p, idx) => (
                        <View key={p.user_id || idx} style={{ marginBottom: 4 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{`${p.name} ${p.surname}`}</Text>
                          <Text style={{ color: '#FFD600', fontSize: 13 }}>@{p.username}</Text>
                        </View>
                      ))}
                    </View>
                    {/* Team 2 */}
                    <View style={{ flex: 1, alignItems: 'flex-end', marginLeft: 16 }}>
                      <View style={{ alignItems: 'flex-end', marginBottom: 2 }}>
                        {!isTeam1Winner ? (
                          <Text style={{ color: '#FFD600', fontWeight: 'bold', fontSize: 15, textAlign: 'right' }}>Pobednik</Text>
                        ) : (
                          <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 15, textAlign: 'right' }}>Gubitnik</Text>
                        )}
                      </View>
                      <Text style={{ color: '#FFD600', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Tim 2</Text>
                      {detailLosers.map((p, idx) => (
                        <View key={p.user_id || idx} style={{ marginBottom: 4 }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{`${p.name} ${p.surname}`}</Text>
                          <Text style={{ color: '#FFD600', fontSize: 13 }}>@{p.username}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: scale(20),
    alignItems: 'center',
  },
  title: {
    fontSize: responsiveFontSize(28),
    fontWeight: 'bold',
    marginBottom: scale(20),
    marginTop: scale(20),
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: scale(16),
    padding: scale(24),
    width: scale(320),
    alignItems: 'center',
  },
  searchResult: {
    padding: scale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  searchResultText: {
    color: '#333',
    fontSize: responsiveFontSize(16),
  },
  friendEmpty: {
    color: '#fff',
    fontSize: responsiveFontSize(16),
    marginTop: scale(20),
  },
  input: {
    width: '100%',
    height: scale(40),
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: scale(10),
    padding: scale(10),
  },
  themeToggle: {
    position: 'absolute',
    top: scale(30),
    right: scale(30),
    zIndex: 20,
    backgroundColor: 'transparent',
  },
});

export default StartScreen; 