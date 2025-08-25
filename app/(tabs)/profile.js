import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AnimatedBackground from '../../components/AnimatedBackground';
import { ProfileDisplay } from '../../components/ProfileDisplay';
import SettingsModal from '../../components/SettingsModal';
import { getFriendRequests, getFriends, getUserAchievements, getUserStats, sendFriendRequest, sendPushNotification, supabase, uploadAvatarAndUpdateProfile } from '../../services/supabaseClient';
import { useProfileRefresh } from '../context/ProfileRefreshContext';
import { useUserProfile } from '../context/UserProfileContext';

const SPORTS = [
  { key: 'padel', label: 'Padel', emoji: '\ud83c\udfbe' },
  { key: 'fudbal', label: 'Fudbal', emoji: '\u26bd' },
  { key: 'kosarka', label: 'Kosarka', emoji: '\ud83c\udfc0' },
  { key: 'tenis', label: 'Tenis', emoji: '\ud83c\udfbe' },
];

const MOCK_ACHIEVEMENTS = [
  { id: 1, title: 'Prva pobeda', desc: 'Osvojili ste svoj prvi mec!' },
  { id: 2, title: '10 meceva', desc: 'Igrali ste 10 meceva.' },
  { id: 3, title: 'Novi igrac', desc: 'Pridruzili ste se aplikaciji.' },
];

const MOCK_STATS = [
  { label: 'Meceva odigrano', value: 12 },
  { label: 'Pobeda', value: 7 },
  { label: 'Procenat pobeda', value: '58%' },
  { label: 'Najbolji sport', value: 'Padel' },
];

// Language translations for profile page
const getProfileTranslations = (language) => {
  const translations = {
    serbian: {
      profile: 'Profil',
      editProfile: 'Izmeni profil',
      cancel: 'Otkaži',
      save: 'Sačuvaj',
      statistics: 'Statistics',
      achievements: 'Dostignuća',
      selectSport: 'Choose sport',
      padel: 'Padel',
      football: 'Fudbal',
      basketball: 'Košarka',
      tennis: 'Tenis',
      matchesPlayed: 'Meceva odigrano',
      wins: 'Pobeda',
      winPercentage: 'Procenat pobeda',
      bestSport: 'Najbolji sport',
      firstWin: 'Prva pobeda',
      firstWinDesc: 'Osvojili ste svoj prvi mec!',
      tenMatches: '10 meceva',
      tenMatchesDesc: 'Igrali ste 10 meceva.',
      newPlayer: 'Novi igrac',
      newPlayerDesc: 'Pridruzili ste se aplikaciji.',
    },
    english: {
      profile: 'Profile',
      editProfile: 'Edit Profile',
      cancel: 'Cancel',
      save: 'Save',
      statistics: 'Statistics',
      achievements: 'Achievements',
      selectSport: 'Select sport',
      padel: 'Padel',
      football: 'Football',
      basketball: 'Basketball',
      tennis: 'Tennis',
      matchesPlayed: 'Matches played',
      wins: 'Wins',
      winPercentage: 'Win percentage',
      bestSport: 'Best sport',
      firstWin: 'First win',
      firstWinDesc: 'You won your first match!',
      tenMatches: '10 matches',
      tenMatchesDesc: 'You played 10 matches.',
      newPlayer: 'New player',
      newPlayerDesc: 'You joined the app.',
    }
  };
  return translations[language] || translations.serbian;
};

const SERBIAN_CITIES = [
  'Beograd', 'Novi Sad', 'Nis', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pncevo', 'Cak', 'Kraljevo', 'Smederevo',
  'Leskovac', 'Uzice', 'Valjevo', 'Vranje', 'Sabac', 'Sombor', 'Poarevac', 'Pirot', 'Zajecar', 'Kikinda', 'Sremska Mitrovica',
  'Jagodina', 'Vrac', 'Prokuplje', 'Loznica', 'Paracin', 'Apatin', 'Vrbas', 'Baka Palanka', 'Bor', 'Arandelovac',
  'Ruma', 'Senta', 'Svilajnac', 'Sremski Karlovci', 'Negotin', 'Aleksinac', 'Bela Crkva', 'Bajina Basta', 'Bela Palanka', 'Blace',
  'Bogatic', 'Bojnik', 'Boljevac', 'Bosilegrad', 'Brus', 'Bujanovac', 'Crna Trava', 'Despotovac', 'Dimitrovgrad', 'Doljevac',
  'Gadzin Han', 'Golubac', 'Gornji Milanovac', 'Ivanica', 'Indija', 'Iriga', 'Kanjiza', 'Kladovo', 'Knjazevac', 'Koseric',
  'Kovacica', 'Kovin', 'Krupanj', 'Krusevac', 'Kucevo', 'Lajkovac', 'Lapovo', 'Lebane',
  'Lucani', 'Majdanpek', 'Mali Zvornik', 'Medvda', 'Meroina', 'Mionica', 'Nova Varos', 'Novi Becej', 'Novi Knezevac',
  'Obrenovac', 'Odzaci', 'Opovo', 'Oscina', 'Petrovac na Mlavi', 'Plandiste', 'Presevo', 'Priboj', 'Prijepolje', 'Rca',
  'Rska', 'Rekovac', 'Sjenica', 'Sokobanja', 'Sopot', 'Srbobran', 'Stara Pazova', 'Surdulica', 'Svrljig',
  'Temerin', 'Titel', 'Topola', 'Trgoviste', 'Tutin', 'Ub', 'Urosevac', 'Varvarin', 'Velika Plana', 'Veliko Gradiste',
  'Vlasotince', 'Vrnjacka Banja', 'Zlatibor', 'Zabalj', 'Zagubica', 'Zitiste', 'Zitorad', 'Zupanja'
];

// Helper to convert Serbian city names to simple Latin
function toLatinSimple(str) {
  return str
    .replace(/c|c/g, 'c')
    .replace(/C|C/g, 'C')
    .replace(/s/g, 's')
    .replace(/S/g, 'S')
    .replace(/dj/g, 'dj')
    .replace(/Dj/g, 'Dj')
    .replace(/z/g, 'z')
    .replace(/Z/g, 'Z');
}

// Define sportItems as a constant
const sportItems = [
  { label: 'Tenis', value: 'tenis' },
  { label: 'Padel', value: 'padel' },
  { label: 'Fudbal', value: 'fudbal' },
  { label: 'Kosarka', value: 'kosarka' },
];

function getValidSport(value) {
  const valid = ['tenis', 'padel', 'fudbal', 'kosarka'];
  return valid.includes(value) ? value : 'tenis';
}

const ProfileScreen = (props) => {
  const [language, setLanguage] = useState('serbian');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { viewedUserId } = useLocalSearchParams();
  const {
    userProfile: contextProfile,
    allSportData: contextAllSportData,
    friends: contextFriends,
    allRanks: contextAllRanks,

    loading: contextLoading,
    setUserProfile,
  } = useUserProfile();
  const lastViewedUserId = useRef();
  // Use preloaded data if available
  const [profile, setProfile] = useState(contextProfile);
  const [allSportData, setAllSportData] = useState(contextAllSportData);
  const [friends, setFriends] = useState(contextFriends);
  const [sportRanks, setSportRanks] = useState(contextAllRanks);
  const [loading, setLoading] = useState(contextLoading);
  const [edit, setEdit] = useState(false);
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [friendMessage, setFriendMessage] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [recent, setRecent] = useState([]);
  
  const t = getProfileTranslations(language);
  const [selectedSport, setSelectedSport] = useState('padel');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editAbout, setEditAbout] = useState('');
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewedStats, setViewedStats] = useState(null);
  const [viewedAchievements, setViewedAchievements] = useState([]);
  const [viewedFriends, setViewedFriends] = useState([]);
  const [viewedLoading, setViewedLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);


  const { refreshKey, setRefreshKey } = useProfileRefresh();

  // Modal dimensions
  const { width, height } = Dimensions.get('window');
  const modalWidth = width * 0.85;
  const modalHeight = height * 0.85;

  // Fetch ranks for the current user or viewed user
  const fetchRanks = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('user_sport_ranks')
      .select('sport, rank')
      .eq('user_id', userId);
    if (!error) setSportRanks(data || []);
  }, []);

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



  // Always set selectedSport to 'padel' when the component mounts or user/profile changes
  useEffect(() => {
    setSelectedSport('padel');
  }, [/* add dependencies if needed, e.g., userId or profile */]);

  useEffect(() => {
    // If preloaded data is available, update local state
    if (contextProfile && Object.keys(contextAllSportData || {}).length > 0) {
      setProfile(contextProfile);
      setAllSportData(contextAllSportData);
      setFriends(contextFriends);
      setSportRanks(contextAllRanks);

      setLoading(false);
    }
  }, [contextProfile, contextAllSportData, contextFriends, contextAllRanks]);

  // When switching sports, update stats/achievements from allSportData
  useEffect(() => {
    if (!selectedSport || !allSportData[selectedSport]) return;
    setAchievements(allSportData[selectedSport].achievements);
    setStats(allSportData[selectedSport].stats);
  }, [selectedSport, allSportData]);

  useEffect(() => {
    if (!viewedUserId) {
      setViewedProfile(null);
      setViewedStats(null);
      setViewedAchievements([]);
      setViewedFriends([]);
      setViewedLoading(false);
      setSportRanks([]);
      lastViewedUserId.current = undefined;
      return;
    }
    setViewedLoading(true);
    (async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', viewedUserId).single();
      setViewedProfile(profile);
      // No setSelectedSport here!
      const statsRes = await getUserStats(viewedUserId, selectedSport);
      setViewedStats(statsRes);
      const achRes = await getUserAchievements(viewedUserId, selectedSport);
      setViewedAchievements(achRes.data || []);
      const friendsRes = await getFriends(viewedUserId);
      setViewedFriends(friendsRes.data || []);
      await fetchRanks(viewedUserId);
      setViewedLoading(false);
    })();
  }, [viewedUserId, refreshKey, selectedSport]);

  // Add a handler for immediate sport change and fetch
  const handleSportChange = async (sport) => {
    setSelectedSport(sport);
    let userId = viewedUserId ? viewedUserId : profile?.id;
    if (!userId || !sport) return;
    const statsRes = await getUserStats(userId, sport);
    setStats(statsRes);
    const achRes = await getUserAchievements(userId, sport);
    setAchievements(achRes.data || []);
    await fetchRanks(userId);
  };

  // Remove selectedSport from the dependency array of the useEffect for currentStats/currentAchievements
  useEffect(() => {
    let userId = viewedUserId ? viewedUserId : profile?.id;
    if (!userId || !selectedSport) return;
    (async () => {
      const statsRes = await getUserStats(userId, selectedSport);
      setStats(statsRes);
      const achRes = await getUserAchievements(userId, selectedSport);
      setAchievements(achRes.data || []);
      await fetchRanks(userId);
    })();
  }, [viewedUserId, profile, refreshKey]);

  // Polling: refresh stats every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const user = profile?.id;
    if (!user) return;

    const channel = supabase
      .channel('friend-requests-' + user)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
        },
        (payload) => {
          const isRelevant =
            (payload.eventType === 'INSERT' && payload.new && payload.new.to_user === user) ||
            (payload.eventType === 'DELETE' && payload.old && payload.old.to_user === user);

          if (isRelevant) {
            console.log('Realtime event (handled):', payload);
            getFriendRequests(user).then(res => setFriendRequests(res.data || []));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Greška', 'Došlo je do greške prilikom odjavljivanja.');
      console.error('Sign out error:', error);
    } else {
      router.replace('/logging-out');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      location: editLocation,
      about: editAbout,
      sport: selectedSport,
    });
    if (error) setMessage('Greška: ' + error.message);
    else setMessage('Uspešno sačuvano!');
    setEdit(false);
    setLoading(false);
  };

  const handleAddFriend = async () => {
    setFriendMessage(null);
    if (!friendUsername) return;
    // Find user by username
    const { data: users } = await supabase.from('profiles').select('id, expo_push_token').eq('username', friendUsername);
    if (!users || users.length === 0) {
      setFriendMessage('Korisnik nije pronađen.');
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    if (users[0].id === user.id) {
      setFriendMessage('Ne možete dodati sebe.');
      return;
    }
    const res = await sendFriendRequest(user.id, users[0].id);
    if (res.error) setFriendMessage('Greška: ' + res.error.message);
    else {
      setFriendMessage('Zahtev poslat!');
      // Send push notification to recipient
      if (users[0].expo_push_token) {
        await sendPushNotification(users[0].expo_push_token, 'Novi zahtev za prijateljstvo', `Korisnik ${profile?.username || user.id} vam je poslao zahtev za prijateljstvo.`);
      }
    }
    setFriendUsername('');
  };

  const handleAvatarPress = async () => {
    setAvatarError(null);
    try {
      console.log('Requesting permission...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setAvatarError('Dozvola za pristup galeriji nije odobrena.');
        return;
      }
      console.log('Launching image picker...');
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (pickerResult.cancelled) {
        console.log('Picker cancelled');
        return;
      }
      const asset = pickerResult.assets && pickerResult.assets[0];
      if (!asset || !asset.uri) {
        setAvatarError('Nije pronađena putanja do slike (uri).');
        setAvatarUploading(false);
        console.log('No image URI found in picker result:', pickerResult);
        return;
      }
      console.log('Image picked:', asset.uri);
      setAvatarUploading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setAvatarError('Niste prijavljeni. Prijavite se ponovo.');
        setAvatarUploading(false);
        return;
      }
      console.log('Uploading avatar...');
      const { error, url } = await uploadAvatarAndUpdateProfile(user.id, asset.uri);
      if (error) {
        setAvatarError('Greška pri otpremanju slike: ' + (error.message || JSON.stringify(error)));
        setAvatarUploading(false);
        console.log('Upload error:', error);
        return;
      }
      console.log('Avatar uploaded, refreshing profile...');
      const { data: updatedProfile, error: fetchError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (fetchError) {
        setAvatarError('Greška pri osvežavanju profila: ' + (fetchError.message || JSON.stringify(fetchError)));
        setAvatarUploading(false);
        console.log('Profile fetch error:', fetchError);
        return;
      }
      if (updatedProfile && updatedProfile.avatar_url) {
        updatedProfile.avatar_url = updatedProfile.avatar_url + '?t=' + Date.now();
      }
      setProfile(updatedProfile);
      setUserProfile(updatedProfile); // <-- update context as well
      setMessage('Avatar uspešno ažuriran!');
      console.log('Avatar update complete!');
    } catch (e) {
      setAvatarError('Greška: ' + e.message);
      console.log('Exception:', e);
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <AnimatedBackground isDarkMode={isDarkMode}>
        <ActivityIndicator size="large" color="#fff" />
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground isDarkMode={isDarkMode}>
      <ScrollView>
        <ProfileDisplay
          profileData={profile}
          statsData={stats}
          achievementsData={achievements}
          isOwnProfile={true}
          onEditPress={() => setEdit(true)}
          onLogoutPress={handleLogout}
          selectedSport={selectedSport}
          setSelectedSport={handleSportChange}
          savingSport={false} // Removed savingSport state
          setSavingSport={() => {}} // Removed setSavingSport state
          onAddFriend={() => {}}
          friendStatus={null}
          onSendMessage={() => {}}
          onAvatarPress={handleAvatarPress}
          onSettingsPress={() => setSettingsVisible(true)}
          language={language}
          isDarkMode={isDarkMode}
        />
        {avatarUploading && <ActivityIndicator size="small" color="#FFD600" style={{ marginBottom: 8 }} />}
        {avatarError && <Text style={{ color: '#e74c3c', textAlign: 'center', marginBottom: 8 }}>{avatarError}</Text>}
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        profile={profile}
        onProfileUpdate={setProfile}
        language={language}
        isDarkMode={isDarkMode}
      />
      
      {/* Edit Profile Modal */}
      <Modal
        visible={edit}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEdit(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: modalWidth, borderRadius: 18, overflow: 'hidden', alignItems: 'stretch', justifyContent: 'flex-start' }}>
            <AnimatedBackground isDarkMode={isDarkMode}>
              <View style={{ padding: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: 22, letterSpacing: 0.8 }}>{t.editProfile}</Text>
                  <TouchableOpacity onPress={() => setEdit(false)}>
                    <Ionicons name="close" size={28} color={isDarkMode ? '#fff' : '#000'} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 16, marginBottom: 8 }}>{language === 'english' ? 'Location' : 'Lokacija'}</Text>
                  <TextInput
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderRadius: 8,
                      padding: 12,
                      color: isDarkMode ? '#fff' : '#000',
                      marginBottom: 16,
                      fontSize: 16
                    }}
                                          placeholder={language === 'english' ? 'Location' : 'Lokacija'}
                    placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
                    value={editLocation}
                    onChangeText={setEditLocation}
                  />
                  <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 16, marginBottom: 8 }}>{language === 'english' ? 'About me' : 'O meni'}</Text>
                  <TextInput
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                      borderRadius: 8,
                      padding: 12,
                      color: isDarkMode ? '#fff' : '#000',
                      marginBottom: 16,
                      fontSize: 16,
                      height: 80,
                      textAlignVertical: 'top'
                    }}
                                          placeholder={language === 'english' ? 'About me' : 'O meni'}
                    placeholderTextColor={isDarkMode ? '#b0b8c1' : '#666'}
                    value={editAbout}
                    onChangeText={setEditAbout}
                    multiline
                  />
                  {message && (
                    <Text style={{ color: message.includes('Greška') ? '#e74c3c' : '#4CAF50', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
                      {message}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: isDarkMode ? '#181818' : '#F5F5F5', // black/grey
                        borderRadius: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        flex: 1,
                        marginRight: 8
                      }}
                      onPress={() => setEdit(false)}
                    >
                      <Text style={{ color: '#FFD600', fontWeight: '400', textAlign: 'center', letterSpacing: 0.5 }}>{t.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#FFD600', // yellow
                        borderRadius: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        flex: 1,
                        marginLeft: 8
                      }}
                      onPress={handleSave}
                    >
                      <Text style={{ color: '#181818', fontWeight: '400', textAlign: 'center', letterSpacing: 0.5 }}>{t.save}</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </AnimatedBackground>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen; 