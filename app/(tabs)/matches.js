import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useProfileRefresh } from '../../app/context/ProfileRefreshContext';
import AnimatedBackground from '../../components/AnimatedBackground';
import PaymentScreen from '../../components/PaymentScreen';
import { createChat, createPayment, sendPushNotification, supabase } from '../../services/supabaseClient';

const SPORTS = [
  { key: 'padel', label: 'Padel' },
  { key: 'fudbal', label: 'Fudbal' },
      { key: 'kosarka', label: 'Kosarka' },
  { key: 'tenis', label: 'Tenis' },
];

// Get sport label based on language
const getSportLabel = (sportKey, language) => {
  const sportLabels = {
    serbian: {
      padel: 'Padel',
      fudbal: 'Fudbal',
      kosarka: 'Kosarka',
      tenis: 'Tenis',
    },
    english: {
      padel: 'Padel',
      fudbal: 'Football',
      kosarka: 'Basketball',
      tenis: 'Tennis',
    }
  };
  return sportLabels[language]?.[sportKey] || sportLabels.serbian[sportKey];
};

// Language translations for matches page
const getMatchesTranslations = (language) => {
  const translations = {
    serbian: {
      newMatch: 'Novi mec (V2)',
      sport: 'Sport',
      name: 'Naziv',
      location: 'Lokacija',
      price: 'Cena',
      slots: 'Broj mesta',
      time: 'Vreme',
      level: 'Nivo',
      advanced: 'Napredni',
      intermediate: 'Srednji',
      beginner: 'Pocetnik',
      fillAllFields: 'Popunite sva polja!',
      timeFormatError: 'Vreme mora biti u formatu HH:mm!',
      error: 'Greska: ',
      create: 'Kreiraj',
      cancel: 'Otkazi',
      matches: 'Mecevi',
      noMatches: 'Nema meceva',
      join: 'Pridruzi se',
      cancelJoin: 'Otkazi prijavu',
      full: 'Popunjeno',
      sendResult: 'Posalji rezultat',
      resultSent: 'Rezultat poslat',
      send: 'Posalji',
      cancel: 'Otkazi',
      save: 'Sacuvaj',
      selectTeam: 'Izaberi tim',
      joinTeam: 'Pridruzi se timu',
      team1: 'Tim 1',
      team2: 'Tim 2',
      confirmResult: 'Potvrdi rezultat',
      winner: 'Pobednik',
      loser: 'Gubitnik',
      details: 'Detalji',
      close: 'Zatvori',
      padel: 'Padel',
      football: 'Fudbal',
      basketball: 'Kosarka',
      tennis: 'Tenis',
    },
    english: {
      newMatch: 'New Match (V2)',
      sport: 'Sport',
      name: 'Name',
      location: 'Location',
      price: 'Price',
      slots: 'Number of slots',
      time: 'Time',
      level: 'Level',
      advanced: 'Advanced',
      intermediate: 'Intermediate',
      beginner: 'Beginner',
      fillAllFields: 'Fill all fields!',
      timeFormatError: 'Time must be in HH:mm format!',
      error: 'Error: ',
      create: 'Create',
      cancel: 'Cancel',
      matches: 'Matches',
      noMatches: 'No matches',
      join: 'Join',
      cancelJoin: 'Cancel registration',
      full: 'Full',
      sendResult: 'Send result',
      resultSent: 'Result sent',
      send: 'Send',
      cancel: 'Cancel',
      save: 'Save',
      selectTeam: 'Select team',
      joinTeam: 'Join team',
      team1: 'Team 1',
      team2: 'Team 2',
      confirmResult: 'Confirm result',
      winner: 'Winner',
      loser: 'Loser',
      details: 'Details',
      close: 'Close',
      padel: 'Padel',
      football: 'Football',
      basketball: 'Basketball',
      tennis: 'Tennis',
    }
  };
  return translations[language] || translations.serbian;
};

const ADMIN_UUID = '4359e435-4481-400f-87d7-e14a00f0a177';

// Global image cache that persists across the entire app
if (!global.HERO_IMAGE_CACHE) {
  global.HERO_IMAGE_CACHE = {
    padel: require('../../assets/images/hero-padel.jpg'),
    fudbal: require('../../assets/images/hero-football.jpg'),
    kosarka: require('../../assets/images/hero-basketball.jpg'),
    tenis: require('../../assets/images/hero-tennis.jpg')
  };
  
  // Force preload all images to ensure they're cached
  Object.values(global.HERO_IMAGE_CACHE).forEach(img => {
    if (img && typeof img === 'object') {
      // Force React Native to load and cache the image
      img.toString();
    }
  });
  
  console.log('Global HERO_IMAGE_CACHE initialized');
}

const HERO_IMAGE_CACHE = global.HERO_IMAGE_CACHE;

// Individual sport image components that never re-render
const PadelImage = React.memo(() => {
  console.log('PadelImage component rendered');
  return (
    <Image
      source={HERO_IMAGE_CACHE.padel}
      style={styles.sportImage}
      resizeMode="cover"
      fadeDuration={0}
      cachePolicy="memory"
      loadingIndicatorSource={null}
      progressiveRenderingEnabled={false}
      onLoadStart={() => console.log('Padel image load start')}
      onLoad={() => console.log('Padel image loaded')}
      onError={(error) => console.log('Padel image error:', error)}
    />
  );
});

const FootballImage = React.memo(() => {
  console.log('FootballImage component rendered');
  return (
    <Image
      source={HERO_IMAGE_CACHE.fudbal}
      style={styles.sportImage}
      resizeMode="cover"
      fadeDuration={0}
      cachePolicy="memory"
      loadingIndicatorSource={null}
      progressiveRenderingEnabled={false}
      onLoadStart={() => console.log('Football image load start')}
      onLoad={() => console.log('Football image loaded')}
      onError={(error) => console.log('Football image error:', error)}
    />
  );
});

const BasketballImage = React.memo(() => {
  console.log('BasketballImage component rendered');
  return (
    <Image
      source={HERO_IMAGE_CACHE.kosarka}
      style={styles.sportImage}
      resizeMode="cover"
      fadeDuration={0}
      cachePolicy="memory"
      loadingIndicatorSource={null}
      progressiveRenderingEnabled={false}
      onLoadStart={() => console.log('Basketball image load start')}
      onLoad={() => console.log('Basketball image loaded')}
      onError={(error) => console.log('Basketball image error:', error)}
    />
  );
});

const TennisImage = React.memo(() => {
  console.log('TennisImage component rendered');
  return (
    <Image
      source={HERO_IMAGE_CACHE.tenis}
      style={styles.sportImage}
      resizeMode="cover"
      fadeDuration={0}
      cachePolicy="memory"
      loadingIndicatorSource={null}
      progressiveRenderingEnabled={false}
      onLoadStart={() => console.log('Tennis image load start')}
      onLoad={() => console.log('Tennis image loaded')}
      onError={(error) => console.log('Tennis image error:', error)}
    />
  );
});

// Custom CachedImage component that prevents reloading
const CachedImage = React.memo(({ sport, style, ...props }) => {
  const imageSource = HERO_IMAGE_CACHE[sport] || HERO_IMAGE_CACHE.padel;
  
  // Add console log to see when images are being rendered
  console.log(`Rendering CachedImage for sport: ${sport}`);
  
  return (
    <Image
      source={imageSource}
      style={style}
      resizeMode="cover"
      fadeDuration={0}
      cachePolicy="memory"
      loadingIndicatorSource={null}
      progressiveRenderingEnabled={false}
      onLoadStart={() => console.log(`Image load start for ${sport}`)}
      onLoad={() => console.log(`Image loaded for ${sport}`)}
      onError={(error) => console.log(`Image error for ${sport}:`, error)}
      {...props}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function - only re-render if sport actually changes
  return prevProps.sport === nextProps.sport;
});

// New CreateMatchModalV2 component
const CreateMatchModalV2 = ({ visible, onClose, selectedDate, modalSport, refreshMatches, t, language, isDarkMode }) => {
  const [form, setForm] = useState({ name: '', location: '', price: '', slots: '', time: '', level: 'Napredni', sport: modalSport || 'tenis' });
  const [message, setMessage] = useState(null);

  // Handler for Vreme input with auto-colon formatting
  const handleTimeInput = (v) => {
    // Remove all non-digit characters
    let digits = v.replace(/\D/g, '');
    if (digits.length > 4) digits = digits.slice(0, 4);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = digits.slice(0, 2) + ':' + digits.slice(2);
    }
    setForm(f => ({ ...f, time: formatted }));
  };

  const handleCreate = async () => {
    setMessage(null);
    if (!form.name || !form.location || !form.price || !form.slots || !form.time) {
      setMessage(t.fillAllFields);
      return;
    }
    // Validate time format HH:mm
    const timeMatch = form.time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!timeMatch) {
      setMessage(t.timeFormatError);
      return;
    }
    // Combine selectedDate and form.time into a full ISO string
    const [hours, minutes] = form.time.split(':');
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const isoTime = combinedDate.toISOString();
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('matches').insert({
      ...form,
      price: parseFloat(form.price),
      slots: parseInt(form.slots),
      creator: user.id,
      time: isoTime,
      sport: form.sport,
      level: form.level,
    });
    if (error) setMessage('Greska: ' + error.message);
    else {
      onClose();
      setForm({ name: '', location: '', price: '', slots: '', time: '', level: 'Napredni', sport: modalSport || 'tenis' });
      refreshMatches();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center', flex: 1 }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ backgroundColor: isDarkMode ? '#232c3b' : '#FFFFFF', borderRadius: 16, padding: 24, width: 340 }}>
                <Text style={{ color: '#FFFF00', fontSize: 17, fontWeight: '400', marginBottom: 12, letterSpacing: 0.8 }}>{t.newMatch}</Text>
                {/* Sport selection dropdown */}
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#FFFF00', marginBottom: 4 }}>{t.sport}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {SPORTS.map(sport => (
                      <TouchableOpacity
                        key={sport.key}
                        onPress={() => setForm(f => ({ ...f, sport: sport.key }))}
                        style={{
                          backgroundColor: form.sport === sport.key ? '#FFFF00' : (isDarkMode ? '#2a3441' : '#F5F5F5'),
                          borderRadius: 8,
                          paddingVertical: 6,
                          paddingHorizontal: 14,
                          marginRight: 8,
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ color: form.sport === sport.key ? '#232c3b' : '#FFFF00', fontWeight: '400', letterSpacing: 0.5 }}>{getSportLabel(sport.key, language)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {/* Level selection */}
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ color: '#FFFF00', marginBottom: 4 }}>{t.level}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {[t.advanced, t.beginner].map(level => (
                      <TouchableOpacity
                        key={level}
                        onPress={() => setForm(f => ({ ...f, level }))}
                        style={{
                          backgroundColor: form.level === level ? '#FFFF00' : (isDarkMode ? '#2a3441' : '#F5F5F5'),
                          borderRadius: 8,
                          paddingVertical: 6,
                          paddingHorizontal: 18,
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ color: form.level === level ? '#232c3b' : '#FFFF00', fontWeight: '400', letterSpacing: 0.5 }}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TextInput placeholder={t.name} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} style={{ color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 8, marginBottom: 8, padding: 8 }} placeholderTextColor={isDarkMode ? '#b0b0b0' : '#666'} />
                                  <TextInput placeholder={t.location} value={form.location} onChangeText={v => setForm(f => ({ ...f, location: v }))} style={{ color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 8, marginBottom: 8, padding: 8 }} placeholderTextColor={isDarkMode ? '#b0b0b0' : '#666'} />
                                  <TextInput placeholder={t.price} value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} keyboardType="numeric" style={{ color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 8, marginBottom: 8, padding: 8 }} placeholderTextColor={isDarkMode ? '#b0b0b0' : '#666'} />
                                  <TextInput placeholder={t.slots} value={form.slots} onChangeText={v => setForm(f => ({ ...f, slots: v }))} keyboardType="numeric" style={{ color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 8, marginBottom: 8, padding: 8 }} placeholderTextColor={isDarkMode ? '#b0b0b0' : '#666'} />
                                  <TextInput placeholder={t.time + ' (HH:mm)'} value={form.time} onChangeText={handleTimeInput} keyboardType="numeric" maxLength={5} style={{ color: isDarkMode ? '#fff' : '#000', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5', borderRadius: 8, marginBottom: 8, padding: 8 }} placeholderTextColor={isDarkMode ? '#b0b0b0' : '#666'} />
                {message && <Text style={{ color: '#e74c3c', marginBottom: 8 }}>{message}</Text>}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                          <TouchableOpacity onPress={onClose} style={{ marginRight: 16 }}><Text style={{ color: '#FFFF00' }}>{t.cancel}</Text></TouchableOpacity>
        <TouchableOpacity onPress={handleCreate}><Text style={{ color: '#FFFF00', fontWeight: '400', letterSpacing: 0.5 }}>{t.create}</Text></TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const MatchesScreen = () => {
  const [language, setLanguage] = useState('serbian');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('padel');
  const [userId, setUserId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [scoreModalMatch, setScoreModalMatch] = useState(null);
  const [scoreInputs, setScoreInputs] = useState({});
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreError, setScoreError] = useState(null);
  const [participantsMap, setParticipantsMap] = useState({}); // matchId -> [userId]
  const [adminConfirmMy, setAdminConfirmMy] = useState('');
  const [adminConfirmOpp, setAdminConfirmOpp] = useState('');
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  // Add state for userMap and confirm modal
  const [userMap, setUserMap] = useState({});
  const [confirmModal, setConfirmModal] = useState({ visible: false, match: null, my: '', opp: '' });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalMatch, setConfirmModalMatch] = useState(null); // store minimal match object or match id
  // Add state for team selection modal
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [pendingJoinMatch, setPendingJoinMatch] = useState(null);
  // Add state for participants in the pending match
  const [pendingMatchParticipants, setPendingMatchParticipants] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const { setRefreshKey } = useProfileRefresh();
  const [showNewModal, setShowNewModal] = useState(false);
  const [message, setMessage] = useState(null);
  
  const t = getMatchesTranslations(language);

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
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      setUserId(user?.id || null);
      setUserEmail(user?.email || null);
      fetchMatches();
    })();
  }, []);

  useEffect(() => {
    // Subscribe to new matches
    const channel = supabase
      .channel('public:matches')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'matches' },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Poll refresh_trigger table every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase.from('refresh_trigger').select('last_refresh').eq('id', 1).single();
      if (data && data.last_refresh !== lastRefresh) {
        setLastRefresh(data.last_refresh);
        fetchMatches();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMatches();
    }, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);



  const fetchParticipants = async (matchIds) => {
    if (!matchIds.length) return;
    const { data } = await supabase
      .from('match_participants')
      .select('match_id, user_id');
    const map = {};
    for (const row of data || []) {
      if (!map[row.match_id]) map[row.match_id] = [];
      map[row.match_id].push(row.user_id);
    }
    setParticipantsMap(map);
  };

  const fetchMatches = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*, match_participants(user_id)')
      .not('status', 'eq', 'completed')
      .order('time', { ascending: true });
    if (data) {
      setMatches(data);
      await fetchParticipants(data.map(m => m.id));
    }
    setLoading(false);
  };





  const handlePayAndJoin = async (match) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setMessage('Morate biti prijavljeni.');
      return;
    }
    const paymentRes = await createPayment(user.id, match.id, match.price, 'success');
    if (paymentRes.error) {
      setMessage('Greška pri placanju: ' + paymentRes.error.message);
      return;
    }
    const { data: creator } = await supabase.from('profiles').select('expo_push_token, username').eq('id', match.creator).single();
    if (creator?.expo_push_token) {
      await sendPushNotification(creator.expo_push_token, 'Novi igrac', `Korisnik ${user.email} se prijavio na vas mec: ${match.name}`);
    }
    setMessage('Uspešno ste se prijavili i platili!');
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      setDeleting(true);
      
      // First, delete related match_participants
      const { error: participantsError } = await supabase
        .from('match_participants')
        .delete()
        .eq('match_id', matchId);
      
      if (participantsError) {
        // Silently handle participant deletion errors
      }
      
      // Then delete the match
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);
      
      if (matchError) {
        setMessage('Greška pri brisanju meča: ' + matchError.message);
        // Clear error message after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMatches(prev => prev.filter(m => m.id !== matchId));
        setDeleteModalVisible(false);
      }
    } catch (error) {
      setMessage('Greška pri brisanju meča: ' + error.message);
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  // Join match
  const handleJoinClick = (match) => {
    setPendingJoinMatch(match);
    setTeamModalVisible(true);
  };

  // Cancel join
  const handleCancelJoin = async (match) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    await supabase.from('match_participants').delete().eq('match_id', match.id).eq('user_id', user.id);
    setMessage('Prijava otkazana.');
    fetchMatches();
  };

  // New function to join match with team
  const joinMatchWithTeam = async (match, team) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    // Check if already joined
    const { data: existing } = await supabase
      .from('match_participants')
      .select('id')
      .eq('match_id', match.id)
      .eq('user_id', user.id);
    if (existing && existing.length > 0) return;
    // Fetch user profile for name, surname, username
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, surname, username')
      .eq('id', user.id)
      .single();
    await supabase.from('match_participants').insert({
      match_id: match.id,
      user_id: user.id,
      team: team,
      name: profile?.name || '',
      surname: profile?.surname || '',
      username: profile?.username || ''
    });
    setTeamModalVisible(false);
    setSelectedTeam(null);
    setPendingJoinMatch(null);
    fetchMatches();
  };

  const onPaymentSuccess = async () => {
    setPaymentVisible(false);
    if (!selectedMatch) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    // 1. Add user as participant (update match row)
    const { data: matchData, error: matchError } = await supabase.from('matches').select('participants').eq('id', selectedMatch.id).single();
    let participants = matchData?.participants || [];
    if (!participants.includes(user.id)) {
      participants.push(user.id);
      await supabase.from('matches').update({ participants }).eq('id', selectedMatch.id);
    }
    // 2. Create chat if first participant, else add to existing chat
    let chat;
    if (participants.length === 1) {
      // First participant, create chat
      const { data: chatData } = await createChat([user.id], 'match');
      chat = chatData;
      await supabase.from('chats').update({ name: selectedMatch.name }).eq('id', chat.id);
      // Optionally, link chat to match (if schema allows)
    } else {
      // Find existing chat for this match
      const { data: chats } = await supabase.from('chats').select('*').eq('type', 'match').eq('name', selectedMatch.name);
      chat = chats && chats[0];
      if (chat && !chat.participants.includes(user.id)) {
        const newParticipants = [...chat.participants, user.id];
        await supabase.from('chats').update({ participants: newParticipants }).eq('id', chat.id);
      }
    }
    // Optionally, show a message or redirect to chat
  };

  // Filtering logic
  const now = new Date();
  const isUpcoming = m => new Date(m.time) > now;
  const isPlayed = m => new Date(m.time) <= now;
  const isUserParticipant = m => Array.isArray(m.participants) && userId && m.participants.includes(userId);

  // Instead of filtering out matches, we'll render all but hide non-matching ones
  // This keeps Image components mounted and cached
  const allMatches = matches;
  
  // Debug logging to see what's happening
  console.log('Selected sport:', selectedSport);
  console.log('Total matches:', allMatches.length);
  console.log('All matches sports:', allMatches.map(m => m.sport));

  // Badge counts
  const terminiCount = matches.filter(isUpcoming).length;
  const odigraniCount = matches.filter(m => isPlayed(m) && isUserParticipant(m)).length;
  const mojiCount = matches.filter(m => isUpcoming(m) && isUserParticipant(m)).length;

  const ListHeader = () => (
    <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: '#FFFF00' }]} numberOfLines={1} ellipsizeMode="tail">{t.matches}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {(userEmail === 'veljko.milovic001@gmail.com') && (
          <>
            <TouchableOpacity style={[styles.joinBtn, { backgroundColor: '#FFFF00', marginRight: 8, height: 40, minWidth: 40, justifyContent: 'center', alignItems: 'center' }]} onPress={() => setAdminModalVisible(true)}>
              <MaterialIcons name="admin-panel-settings" size={24} color="#181818" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.joinBtn, { backgroundColor: '#FFFF00', marginRight: 8, height: 40, minWidth: 40, justifyContent: 'center', alignItems: 'center' }]} onPress={() => setShowNewModal(true)}>
              <MaterialIcons name="add" size={24} color="#181818" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.joinBtn, { backgroundColor: '#FFFF00', height: 40, minWidth: 40, justifyContent: 'center', alignItems: 'center' }]} onPress={() => setDeleteModalVisible(true)}>
              <MaterialIcons name="remove" size={24} color="#181818" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  // Helper to prefill admin score inputs from a submission
  const prefillAdminScoreInputs = (submission, sport) => {
    if (sport === 'tenis' || sport === 'padel') {
      return {
        set1: submission?.sets?.[0] || ['', ''],
        set2: submission?.sets?.[1] || ['', ''],
        set3: submission?.sets?.[2] || ['', ''],
      };
    } else {
      return {
        my: submission?.my || '',
        opp: submission?.opp || '',
      };
    }
  };

  // Fetch usernames for all user_ids in score_submissions
  const fetchUserMap = async (matches) => {
    const userIds = Array.from(new Set(
      matches.flatMap(m => (m.score_submissions || []).map(s => s.user_id))
    ));
    if (userIds.length === 0) return setUserMap({});
    const { data } = await supabase.from('profiles').select('id, username').in('id', userIds);
    const map = {};
    for (const u of data || []) map[u.id] = u.username;
    setUserMap(map);
  };

  // When opening admin modal, fetch usernames
  useEffect(() => {
    if (adminModalVisible) fetchUserMap(matches);
  }, [adminModalVisible, matches]);

  // Helper: Calculate points for singles/teams
  function getPointsChange(higherRank, lowerRank, winner, team1Ids, team2Ids) {
    const diff = Math.abs(higherRank - lowerRank);
    let higherWin, higherLose, lowerWin, lowerLose;
    if (diff < 100) {
      higherWin = 15; higherLose = -20;
      lowerWin = 20; lowerLose = -15;
    } else if (diff < 250) {
      higherWin = 10; higherLose = -25;
      lowerWin = 25; lowerLose = -10;
    } else {
      higherWin = 10; higherLose = -25;
      lowerWin = 25; lowerLose = -10;
    }
    // Determine which team is higher/lower
    let result = {};
    if (winner === 'team1') {
      if (higherRank >= lowerRank) {
        team1Ids.forEach(id => result[id] = higherWin);
        team2Ids.forEach(id => result[id] = lowerLose);
      } else {
        team1Ids.forEach(id => result[id] = lowerWin);
        team2Ids.forEach(id => result[id] = higherLose);
      }
    } else {
      if (higherRank >= lowerRank) {
        team2Ids.forEach(id => result[id] = lowerWin);
        team1Ids.forEach(id => result[id] = higherLose);
      } else {
        team2Ids.forEach(id => result[id] = higherWin);
        team1Ids.forEach(id => result[id] = lowerLose);
      }
    }
    return result;
  }

  // Fetch participants for the pending match when the modal opens
  useEffect(() => {
    if (teamModalVisible && pendingJoinMatch) {
      (async () => {
        const { data } = await supabase
          .from('match_participants')
          .select('user_id, team, profiles(name, surname, username)')
          .eq('match_id', pendingJoinMatch.id);
        setPendingMatchParticipants(data || []);
      })();
    } else {
      setPendingMatchParticipants([]);
    }
  }, [teamModalVisible, pendingJoinMatch]);

  // Handler for new modal creation
  const handleCreateV2 = async (form, setMessage, resetForm) => {
    setMessage(null);
    if (!form.name || !form.location || !form.price || !form.slots || !form.time) {
      setMessage('Popunite sva polja!');
      return;
    }
    // Validate time format HH:mm
    const timeMatch = form.time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!timeMatch) {
      setMessage('Vreme mora biti u formatu HH:mm!');
      return;
    }
    // Combine selectedDate and form.time into a full ISO string
    const [hours, minutes] = form.time.split(':');
    const combinedDate = new Date(selectedDate); // Use today's date for simplicity
    combinedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const isoTime = combinedDate.toISOString();
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from('matches').insert({
      ...form,
      price: parseFloat(form.price),
      slots: parseInt(form.slots),
      creator: user.id,
      time: isoTime,
      sport: form.sport,
      level: form.level,
    });
    if (error) setMessage('Greska: ' + error.message);
    else {
      setShowNewModal(false);
      resetForm();
      fetchMatches();
    }
  };

  return (
    <>
      <AnimatedBackground isDarkMode={isDarkMode}>
        <View style={styles.container}>
          <FlatList
            data={allMatches}
            keyExtractor={item => `${item.id}-${item.sport}`}
            ListHeaderComponent={
              <>
                <ListHeader />
                {/* Message Display */}
                {message && (
                  <View style={[styles.message, { 
                    color: message.includes('Greška') || message.includes('Error') ? '#e74c3c' : '#00b894',
                    marginHorizontal: 16,
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: 8,
                    textAlign: 'center'
                  }]}>
                    <Text style={{ color: 'inherit', textAlign: 'center' }}>{message}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, width: '100%', paddingHorizontal: 16 }}>
                  {SPORTS.map(s => (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => setSelectedSport(s.key)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 18,
                        borderRadius: 20,
                        backgroundColor: 'transparent',
                        marginRight: 8,
                        borderTopWidth: 4,
                        borderTopColor: selectedSport === s.key ? '#FFFF00' : 'transparent',
                      }}
                    >
                      <Text style={{
                        color: selectedSport === s.key ? '#FFFF00' : '#FFFF00',
                        fontWeight: '400',
                        fontSize: 13,
                        letterSpacing: 0.5,
                      }}>{getSportLabel(s.key, language)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            }
            renderItem={({ item }) => {
                const matchDate = new Date(item.time);
                // Change: Only 5 seconds need to pass for testing
                const matchStarted = Date.now() - matchDate.getTime() > 5 * 1000;
                const participants = participantsMap[item.id] || [];
                const isParticipant = userId && participants.includes(userId);
                const slotsFull = participants.length >= item.slots;
                let userSubmission = [];
                try {
                  userSubmission = (item.score_submissions || []).filter(s => s.user_id === userId);
                } catch {}
                const hasSubmitted = userSubmission.length > 0;
                
                // Only show matches for the selected sport, but keep them mounted
                const shouldShow = item.sport === selectedSport;
                
                return (
                  <View style={[styles.matchCard, { display: shouldShow ? 'flex' : 'none' }]}>
                    {/* Sport Image with Text Overlay */}
                    <View style={styles.sportImageContainer}>
                      {item.sport === 'padel' && <PadelImage />}
                      {item.sport === 'fudbal' && <FootballImage />}
                      {item.sport === 'kosarka' && <BasketballImage />}
                      {item.sport === 'tenis' && <TennisImage />}
                      {!['padel', 'fudbal', 'kosarka', 'tenis'].includes(item.sport) && <PadelImage />}
                      {/* Text Overlay */}
                      <View style={styles.textOverlay}>
                        {/* Name */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={[styles.matchName, { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }]} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                          <View style={{ marginLeft: 8, backgroundColor: '#2a3441', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 2, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#FFFF00' }}>
                            <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: 12, letterSpacing: 0.5 }}>{item.level || 'Napredni'}</Text>
                          </View>
                        </View>
                        {/* Location */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <MaterialIcons name="location-on" size={16} color="#fff" style={{ marginRight: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }} />
                          <Text style={[styles.matchLocation, { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]} numberOfLines={1} ellipsizeMode="tail">{item.location}</Text>
                        </View>
                        {/* Date */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <MaterialIcons name="event" size={16} color="#fff" style={{ marginRight: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }} />
                          <Text style={[styles.matchDate, { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]} numberOfLines={1} ellipsizeMode="tail">
                            {matchDate.toLocaleDateString([], { day: '2-digit', month: 'short' })}
                          </Text>
                        </View>
                        {/* Time */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                          <MaterialIcons name="access-time" size={16} color="#fff" style={{ marginRight: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }} />
                          <Text style={[styles.matchTime, { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]} numberOfLines={1} ellipsizeMode="tail">
                            {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        {/* Slots and Level only */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <MaterialIcons name="people" size={16} color="#fff" style={{ marginRight: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }} />
                          <Text style={[styles.matchSlots, { color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]} numberOfLines={1} ellipsizeMode="tail">{item.match_participants.length}/{item.slots}</Text>
                        </View>
                      </View>
                      
                      {/* Price positioned higher up */}
                      <View style={styles.priceContainer}>
                        <Text style={[styles.matchPrice, { color: '#FFFF00', fontWeight: '400', fontSize: 12, letterSpacing: 0.5 }]} numberOfLines={1} ellipsizeMode="tail">{item.price} RSD</Text>
                      </View>
                      
                      {/* Join button positioned at bottom-right */}
                      {!isParticipant && !slotsFull && !matchStarted && (
                        <View style={styles.joinButtonContainer}>
                          <TouchableOpacity style={[styles.joinBtn, { backgroundColor: 'transparent' }]} onPress={() => handleJoinClick(item)}>
                            <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: 12, letterSpacing: 0.5 }} numberOfLines={1} ellipsizeMode="tail">{t.join}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {isParticipant && !matchStarted && (
                        <View style={styles.joinButtonContainer}>
                          <TouchableOpacity style={[styles.joinBtn, { backgroundColor: 'transparent' }]} onPress={() => handleCancelJoin(item)}>
                            <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: 12, letterSpacing: 0.5 }}>{t.cancelJoin}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                      {slotsFull && !isParticipant && !matchStarted && (
                        <View style={[styles.joinButtonContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}> 
                          <Text style={{ color: '#888', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Popunjeno</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Other buttons below image */}
                    <View style={styles.buttonsContainer}>
                      {/* Submit Score Button (only if not submitted and match started) */}
                      {matchStarted && isParticipant && !hasSubmitted && (
                        <TouchableOpacity
                          style={[styles.joinBtn, { backgroundColor: '#FFFF00' }]}
                          onPress={() => {
                            setScoreModalMatch(item);
                            if (item.sport === 'tenis' || item.sport === 'padel') {
                              setScoreInputs({ set1: ['', ''], set2: ['', ''], set3: ['', ''] });
                            } else {
                              setScoreInputs({ my: '', opp: '' });
                            }
                            setScoreError(null);
                            setScoreModalVisible(true);
                          }}
                        >
                          <Text style={{ color: '#181818', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Posalji rezultat</Text>
                        </TouchableOpacity>
                      )}
                      {/* After submission, show a message */}
                      {matchStarted && isParticipant && hasSubmitted && (
                        <Text style={{ color: '#FFFF00', fontWeight: '400', letterSpacing: 0.5 }}>Rezultat poslat</Text>
                      )}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '300', paddingLeft: 24 }}>{language === 'english' ? 'No matches.' : 'Nema meceva.'}</Text>}
              style={{ width: '100%' }}
            />
          </View>
        </AnimatedBackground>
        {/* Delete Matches Modal */}
        <Modal visible={deleteModalVisible} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { maxHeight: 400 }]}> 
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Obrisi mec</Text>
              <FlatList
                data={matches}
                keyExtractor={item => item.id?.toString()}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: '#232c3b', fontWeight: '400', flex: 1, letterSpacing: 0.5 }} numberOfLines={1} ellipsizeMode="tail">{item.name} ({new Date(item.time).toLocaleDateString()} {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</Text>
                    <TouchableOpacity disabled={deleting} onPress={async () => { await handleDeleteMatch(item.id); }} style={{ marginLeft: 10, backgroundColor: '#e74c3c', borderRadius: 8, padding: 6 }}>
                      <MaterialIcons name="delete" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ color: '#b0b8c1', fontWeight: '300' }}>{language === 'english' ? 'No matches.' : 'Nema meceva.'}</Text>}
                style={{ width: '100%' }}
              />
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ccc', marginTop: 10 }]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={[styles.modalBtnText, { color: '#333' }]} numberOfLines={1} ellipsizeMode="tail">Zatvori</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Payment Modal */}
        <Modal visible={paymentVisible} animationType="slide" transparent>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
            <AnimatedBackground>
              <View style={{ width: 400, height: 600, borderRadius: 18, overflow: 'hidden', alignItems: 'center', borderWidth: 2, borderColor: '#FFFF00', paddingVertical: 0 }}>
                <TouchableOpacity onPress={() => setPaymentVisible(false)} style={{ alignSelf: 'flex-end', margin: 8, padding: 8, position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
                  <MaterialIcons name="close" size={28} color="#FFFF00" />
                </TouchableOpacity>
                <View style={{ flex: 1, width: '100%', height: '100%' }}>
                  {selectedMatch && (
                    <PaymentScreen
                      match={selectedMatch}
                      amount={selectedMatch.price?.toString() || '10.00'}
                      onSuccess={onPaymentSuccess}
                    />
                  )}
                </View>
              </View>
            </AnimatedBackground>
          </View>
        </Modal>
        {/* Score Submission Modal */}
        <Modal visible={scoreModalVisible} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
              >
                <View style={[styles.modalContent, { overflow: 'hidden', position: 'relative' }]}> 
                  <AnimatedBackground style={StyleSheet.absoluteFill} />
                  <Text style={[styles.title, { color: '#FFD600' }]}>Posalji rezultat</Text>
                  {scoreModalMatch && (scoreModalMatch.sport === 'tenis' || scoreModalMatch.sport === 'padel') ? (
                    <>
                      {[1,2,3].map(i => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: '#FFD600', width: 50 }}>Set {i}:</Text>
                          <TextInput
                            style={[styles.input, { width: 40, marginRight: 6 }]}
                            keyboardType="numeric"
                            placeholder="Vi"
                            placeholderTextColor="#181818"
                            value={scoreInputs[`set${i}`]?.[0] || ''}
                            onChangeText={v => setScoreInputs(inputs => ({ ...inputs, [`set${i}`]: [v, inputs[`set${i}`]?.[1] || ''] }))}
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                          />
                          <Text style={{ color: '#FFD600', marginHorizontal: 2, position: 'relative', top: -6, left: -4, fontSize: 20 }}>-</Text>
                          <TextInput
                            style={[styles.input, { width: 40 }]}
                            keyboardType="numeric"
                            placeholder="Protivnik"
                            value={scoreInputs[`set${i}`]?.[1] || ''}
                            onChangeText={v => setScoreInputs(inputs => ({ ...inputs, [`set${i}`]: [inputs[`set${i}`]?.[0] || '', v] }))}
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                          />
                        </View>
                      ))}
                    </>
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ color: '#FFD600', width: 90 }}>Vaš tim:</Text>
                        <TextInput
                          style={[styles.input, { width: 60, marginRight: 6 }]}
                          keyboardType="numeric"
                          placeholder="Vi"
                          value={scoreInputs.my}
                          onChangeText={v => setScoreInputs(inputs => ({ ...inputs, my: v }))}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ color: '#FFD600', width: 90 }}>Protivnik:</Text>
                        <TextInput
                          style={[styles.input, { width: 60 }]}
                          keyboardType="numeric"
                          placeholder="Protivnik"
                          value={scoreInputs.opp}
                          onChangeText={v => setScoreInputs(inputs => ({ ...inputs, opp: v }))}
                          returnKeyType="done"
                          onSubmitEditing={Keyboard.dismiss}
                        />
                      </View>
                    </>
                  )}
                  {scoreError && <Text style={{ color: 'red', marginBottom: 8 }}>{scoreError}</Text>}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: '#FFD600' }]}
                      disabled={scoreSubmitting}
                      onPress={async () => {
                        setScoreSubmitting(true);
                        setScoreError(null);
                        // Validate input
                        let valid = false;
                        let submission = {};
                        if (scoreModalMatch.sport === 'tenis' || scoreModalMatch.sport === 'padel') {
                          // Only include sets that are actually filled
                          const sets = [scoreInputs.set1, scoreInputs.set2, scoreInputs.set3]
                            .filter(set => set && set[0] && set[1]);
                          valid = sets.length > 0;
                          submission = { user_id: userId, sport: scoreModalMatch.sport, sets };
                        } else {
                          valid = scoreInputs.my !== '' && scoreInputs.opp !== '';
                          submission = { user_id: userId, sport: scoreModalMatch.sport, my: scoreInputs.my, opp: scoreInputs.opp };
                        }
                        if (!valid) {
                          setScoreError('Popunite rezultat.');
                          setScoreSubmitting(false);
                          return;
                        }
                        // Update match score_submissions
                        const { data: matchData, error } = await supabase
                          .from('matches')
                          .select('score_submissions')
                          .eq('id', scoreModalMatch.id)
                          .single();
                        let submissions = [];
                        try { submissions = matchData.score_submissions || []; } catch {}
                        // Remove previous submission by this user if exists
                        submissions = submissions.filter(s => s.user_id !== userId);
                        submissions.push(submission);
                        const { error: updateError } = await supabase
                          .from('matches')
                          .update({ score_submissions: submissions })
                          .eq('id', scoreModalMatch.id);
                        if (updateError) {
                          setScoreError('Greška pri slanju rezultata.');
                          setScoreSubmitting(false);
                          return;
                        }
                        setScoreModalVisible(false);
                        setScoreModalMatch(null);
                        setScoreSubmitting(false);
                        setScoreInputs({});
                        fetchMatches();
                      }}
                    >
                      <Text style={{ color: '#181818', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Posalji</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, { backgroundColor: '#181818' }]}
                      onPress={() => {
                        setScoreModalVisible(false);
                        setScoreModalMatch(null);
                        setScoreInputs({});
                        setScoreError(null);
                      }}
                    >
                      <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Otkazi</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </Modal>
        {/* Admin Modal */}
        <Modal visible={adminModalVisible} animationType="slide" transparent>
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { width: 380, minHeight: 320, maxHeight: 600 }]}> 
              <Text style={styles.title}>Svi poslati rezultati</Text>
              <TouchableOpacity style={{ position: 'absolute', top: 8, right: 8 }} onPress={() => setAdminModalVisible(false)}>
                <MaterialIcons name="close" size={28} color="#FFD600" />
              </TouchableOpacity>
              <FlatList
                data={matches.filter(m => Array.isArray(m.score_submissions) && m.score_submissions.length > 0)}
                keyExtractor={item => item.id?.toString()}
                renderItem={({ item }) => (
                  <View style={{ marginBottom: 18, backgroundColor: '#232c3b', borderRadius: 10, padding: 10 }}>
                    <Text style={{ color: '#FFD600', fontWeight: '400', letterSpacing: 0.5 }}>{item.name} ({item.location})</Text>
                    <Text style={{ color: '#fff' }}>Vreme: {new Date(item.time).toLocaleString()}</Text>
                    <Text style={{ color: '#fff' }}>Sport: {item.sport}</Text>
                    <Text style={{ color: '#FFD600', marginTop: 4 }}>Prijavljeni rezultati:</Text>
                    {(item.score_submissions || []).map((s) => {
                      let resultText = '';
                      if (s.sport === 'tenis' || s.sport === 'padel') {
                        resultText = (s.sets || []).map((set, i) => set && (set[0] || set[1]) ? `Set${i+1}: ${set[0] || 0}-${set[1] || 0}` : null).filter(Boolean).join(', ');
                      } else {
                        resultText = `${s.my} - ${s.opp}`;
                      }
                      return (
                        <Text key={s.user_id} style={{ color: '#fff', fontSize: 13, marginLeft: 8 }}>
                          @{userMap[s.user_id] || s.user_id}: {resultText}
                        </Text>
                      );
                    })}
                    <TouchableOpacity
                      style={{ marginTop: 8, backgroundColor: '#FFD600', borderRadius: 8, padding: 8 }}
                      onPress={() => {
                        setConfirmModalMatch(item);
                        setAdminModalVisible(false);
                        setTimeout(() => setConfirmModalVisible(true), 300); // Wait for admin modal to close
                      }}
                    >
                      <Text style={{ color: '#181818', fontWeight: '400', letterSpacing: 0.5 }}>Potvrdi rezultat</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ color: '#b0b8c1' }}>Nema poslatih rezultata.</Text>}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
        {/* Confirm Score Modal */}
        <Modal
          visible={confirmModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setConfirmModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, minWidth: 300 }}>
                {confirmModalMatch && (
                  <>
                    <Text style={{ fontWeight: '400', fontSize: 16, marginBottom: 10, letterSpacing: 0.8 }}>Potvrdi rezultat</Text>
                    <Text>Match: {confirmModalMatch.name || confirmModalMatch.id}</Text>
                    {/* User/team labels above inputs */}
                    {(() => {
                      const subs = confirmModalMatch.score_submissions || [];
                      if (confirmModalMatch.sport === 'tenis' || confirmModalMatch.sport === 'padel') {
                        if (confirmModalMatch.slots === 2) {
                          const user1 = subs[0]?.user_id;
                          const user2 = subs[1]?.user_id;
                          return (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ color: '#FFD600', width: 90, textAlign: 'left' }}>@{userMap[user1] || user1}</Text>
                              <Text style={{ color: '#FFD600', width: 90, textAlign: 'right' }}>@{userMap[user2] || user2}</Text>
                            </View>
                          );
                        } else if (confirmModalMatch.slots === 4) {
                          const team1 = subs.slice(0,2).map(s => userMap[s.user_id] || s.user_id).join(', ');
                          const team2 = subs.slice(2,4).map(s => userMap[s.user_id] || s.user_id).join(', ');
                          return (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ color: '#FFD600', width: 90, textAlign: 'left' }}>Tim 1: {team1}</Text>
                              <Text style={{ color: '#FFD600', width: 90, textAlign: 'right' }}>Tim 2: {team2}</Text>
                            </View>
                          );
                        }
                      } else if (confirmModalMatch.sport === 'kosarka' && confirmModalMatch.slots === 6) {
                        const team1 = subs.slice(0,3).map(s => userMap[s.user_id] || s.user_id).join(', ');
                        const team2 = subs.slice(3,6).map(s => userMap[s.user_id] || s.user_id).join(', ');
                        return (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ color: '#FFD600', width: 90, textAlign: 'left' }}>Tim 1: {team1}</Text>
                            <Text style={{ color: '#FFD600', width: 90, textAlign: 'right' }}>Tim 2: {team2}</Text>
                          </View>
                        );
                      } else if (confirmModalMatch.sport === 'fudbal' && confirmModalMatch.slots === 22) {
                        const team1 = subs.slice(0,11).map(s => userMap[s.user_id] || s.user_id).join(', ');
                        const team2 = subs.slice(11,22).map(s => userMap[s.user_id] || s.user_id).join(', ');
                        return (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ color: '#FFD600', width: 90, textAlign: 'left' }}>Tim 1: {team1}</Text>
                            <Text style={{ color: '#FFD600', width: 90, textAlign: 'right' }}>Tim 2: {team2}</Text>
                          </View>
                        );
                      }
                      return null;
                    })()}
                    {/* Score input fields */}
                    {confirmModalMatch.sport === 'tenis' || confirmModalMatch.sport === 'padel' ? (
                      <>
                        {[1,2,3].map(i => (
                          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={{ color: '#FFD600', width: 50 }}>Set {i}:</Text>
                            <TextInput
                              style={[styles.input, { width: 40, marginRight: 6 }]}
                              keyboardType="numeric"
                              placeholder="Vi"
                              value={confirmModal[`set${i}`]?.[0] || ''}
                              onChangeText={v => setConfirmModal(c => ({ ...c, [`set${i}`]: [v, c[`set${i}`]?.[1] || ''] }))}
                              returnKeyType="done"
                              onSubmitEditing={Keyboard.dismiss}
                            />
                            <Text style={{ color: '#FFD600', marginHorizontal: 2, position: 'relative', top: -6, left: -4, fontSize: 20 }}>-</Text>
                            <TextInput
                              style={[styles.input, { width: 40 }]}
                              keyboardType="numeric"
                              placeholder="Protivnik"
                              value={confirmModal[`set${i}`]?.[1] || ''}
                              onChangeText={v => setConfirmModal(c => ({ ...c, [`set${i}`]: [c[`set${i}`]?.[0] || '', v] }))}
                              returnKeyType="done"
                              onSubmitEditing={Keyboard.dismiss}
                            />
                          </View>
                        ))}
                      </>
                    ) : (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: '#FFD600', width: 90 }}>Vaš tim:</Text>
                          <TextInput
                            style={[styles.input, { width: 60, marginRight: 6 }]}
                            keyboardType="numeric"
                            placeholder="Vi"
                            value={confirmModal.my}
                            onChangeText={v => setConfirmModal(c => ({ ...c, my: v }))}
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                          />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ color: '#FFD600', width: 90 }}>Protivnik:</Text>
                          <TextInput
                            style={[styles.input, { width: 60 }]}
                            keyboardType="numeric"
                            placeholder="Protivnik"
                            value={confirmModal.opp}
                            onChangeText={v => setConfirmModal(c => ({ ...c, opp: v }))}
                            returnKeyType="done"
                            onSubmitEditing={Keyboard.dismiss}
                          />
                        </View>
                      </>
                    )}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                      <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                        <Text style={{ color: '#333', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Otkaži</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          const match = confirmModalMatch;
                          let finalScore;
                          if (match.sport === 'tenis' || match.sport === 'padel') {
                            const sets = [confirmModal.set1, confirmModal.set2, confirmModal.set3]
                              .filter(set => set && set[0] && set[1]);
                            finalScore = { sets };
                          } else {
                            finalScore = { my: confirmModal.my, opp: confirmModal.opp };
                          }
                          // In the admin confirmation modal's save logic, after confirming the result:
                          await supabase.from('matches').update({
                            final_score: finalScore,
                            admin_confirmed: true,
                            status: 'completed' // Mark match as completed
                          }).eq('id', match.id);
                          // 2. Determine teams/participants
                          const { data: participants } = await supabase
                            .from('match_participants')
                            .select('user_id, team, name, surname, username')
                            .eq('match_id', match.id);
                          const team1 = participants.filter(p => p.team === 1);
                          const team2 = participants.filter(p => p.team === 2);
                          const team1Ids = team1.map(p => p.user_id);
                          const team2Ids = team2.map(p => p.user_id);
                          // 3. Fetch all ranks
                          const { data: ranks1 } = await supabase.from('user_sport_ranks').select('user_id, rank').in('user_id', team1Ids).eq('sport', match.sport);
                          const { data: ranks2 } = await supabase.from('user_sport_ranks').select('user_id, rank').in('user_id', team2Ids).eq('sport', match.sport);
                          const avg1 = ranks1 && ranks1.length ? ranks1.reduce((a, b) => a + (b.rank || 1000), 0) / ranks1.length : 1000;
                          const avg2 = ranks2 && ranks2.length ? ranks2.reduce((a, b) => a + (b.rank || 1000), 0) / ranks2.length : 1000;
                          // 4. Determine winner
                          let winner;
                          if (match.sport === 'tenis' || match.sport === 'padel') {
                            // Count sets won
                            let team1Sets = 0, team2Sets = 0;
                            for (const set of finalScore.sets) {
                              if (parseInt(set[0]) > parseInt(set[1])) team1Sets++;
                              else if (parseInt(set[1]) > parseInt(set[0])) team2Sets++;
                            }
                            winner = team1Sets > team2Sets ? 'team1' : 'team2';
                          } else {
                            winner = parseInt(finalScore.my) > parseInt(finalScore.opp) ? 'team1' : 'team2';
                          }
                          // 5. Calculate points
                          const pointsChange = getPointsChange(avg1, avg2, winner, team1Ids, team2Ids);
                          // 6. Insert into match_history and update ranks
                          const allParticipants = [...team1, ...team2];
                          let allRankUpdatesSucceeded = true;
                          const user = (await supabase.auth.getUser()).data.user;
                          if (allParticipants.length === 0) {
                            // No participants, do nothing
                          } else if (team1.length === 0 || team2.length === 0) {
                            // Only one team has participants
                            const presentTeam = team1.length > 0 ? team1 : team2;
                            const presentIsWinner = (winner === (team1.length > 0 ? 'team1' : 'team2'));
                            for (const p of presentTeam) {
                              const id = p.user_id;
                              const oldRank = 1000;
                              const newRank = oldRank + (pointsChange[id] || 0);
                              console.log('Inserting match_history:', { match_id: match.id, user_id: id, oldRank, newRank, pointsChange: pointsChange[id], team: p.team });
                              await supabase.from('match_history').insert({
                                match_id: match.id,
                                user_id: id,
                                opponent_id: null,
                                sport: match.sport,
                                result: presentIsWinner ? 'win' : 'loss',
                                points_before: oldRank,
                                points_after: newRank,
                                points_change: pointsChange[id] || 0,
                                team: p.team,
                                name: p.name,
                                surname: p.surname,
                                username: p.username
                              });
                              // Trigger profile refresh for this participant if they are the current user
                              if (user && user.id === id) {
                                setRefreshKey(prev => prev + 1);
                              }
                              console.log('Upserting user_sport_ranks:', { user_id: id, sport: match.sport, rank: newRank });
                              const { error: rankError } = await supabase.from('user_sport_ranks').upsert(
                                { user_id: id, sport: match.sport, rank: newRank },
                                { onConflict: ['user_id', 'sport'] }
                              );
                              if (rankError) {
                                console.error('Rank upsert error:', rankError);
                                alert('Greška pri ažuriranju bodova/ranga: ' + rankError.message);
                                allRankUpdatesSucceeded = false;
                              }
                            }
                          } else {
                            // Both teams have participants (original logic)
                            for (const p of allParticipants) {
                              const id = p.user_id;
                              const oldRank = [...(ranks1||[]), ...(ranks2||[])].find(r => r.user_id === id)?.rank || 1000;
                              const newRank = oldRank + (pointsChange[id] || 0);
                              const isWinner = (winner === 'team1' ? team1Ids : team2Ids).includes(id);
                              const opponents = (team1Ids.includes(id) ? team2Ids : team1Ids);
                              if (opponents.length === 0) {
                                console.log('Inserting match_history:', { match_id: match.id, user_id: id, oldRank, newRank, pointsChange: pointsChange[id], team: p.team });
                                await supabase.from('match_history').insert({
                                  match_id: match.id,
                                  user_id: id,
                                  opponent_id: null,
                                  sport: match.sport,
                                  result: isWinner ? 'win' : 'loss',
                                  points_before: oldRank,
                                  points_after: newRank,
                                  points_change: pointsChange[id] || 0,
                                  team: p.team,
                                  name: p.name,
                                  surname: p.surname,
                                  username: p.username
                                });
                                if (user && user.id === id) {
                                  setRefreshKey(prev => prev + 1);
                                }
                              } else {
                                for (const oppId of opponents) {
                                  console.log('Inserting match_history:', { match_id: match.id, user_id: id, opponent_id: oppId, oldRank, newRank, pointsChange: pointsChange[id], team: p.team });
                                  await supabase.from('match_history').insert({
                                    match_id: match.id,
                                    user_id: id,
                                    opponent_id: oppId,
                                    sport: match.sport,
                                    result: isWinner ? 'win' : 'loss',
                                    points_before: oldRank,
                                    points_after: newRank,
                                    points_change: pointsChange[id] || 0,
                                    team: p.team,
                                    name: p.name,
                                    surname: p.surname,
                                    username: p.username
                                  });
                                  if (user && user.id === id) {
                                    setRefreshKey(prev => prev + 1);
                                  }
                                }
                              }
                              console.log('Upserting user_sport_ranks:', { user_id: id, sport: match.sport, rank: newRank });
                              const { error: rankError } = await supabase.from('user_sport_ranks').upsert(
                                { user_id: id, sport: match.sport, rank: newRank },
                                { onConflict: ['user_id', 'sport'] }
                              );
                              if (rankError) {
                                console.error('Rank upsert error:', rankError);
                                alert('Greška pri ažuriranju bodova/ranga: ' + rankError.message);
                                allRankUpdatesSucceeded = false;
                              }
                            }
                          }
                          // Only proceed to delete after all rank updates succeed
                          if (allRankUpdatesSucceeded) {
                            const deleteTime = new Date(Date.now() + 60 * 1000).toISOString();
                            await supabase.from('match_participants').update({ delete_after: deleteTime }).eq('match_id', match.id);
                            await supabase.from('matches').update({ status: 'completed' }).eq('id', match.id);
                            // Clean up related chats and messages
                            const { data: chatsToDelete } = await supabase.from('chats').select('id').eq('type', 'match').eq('name', match.name);
                            if (chatsToDelete && chatsToDelete.length > 0) {
                              for (const chat of chatsToDelete) {
                                await supabase.from('messages').delete().eq('chat_id', chat.id);
                                await supabase.from('chats').delete().eq('id', chat.id);
                              }
                            }
                            setConfirmModalVisible(false);
                            fetchMatches();
                          } else {
                            alert('Došlo je do greške pri ažuriranju bodova/ranga. Pokušajte ponovo.');
                          }
                        }}
                      >
                        <Text style={{ color: '#181818', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Sacuvaj</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>
        {/* Team Selection Modal */}
        <Modal visible={teamModalVisible} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ borderRadius: 18, width: '100%', height: '100%', padding: 0, alignItems: 'stretch', justifyContent: 'flex-start', overflow: 'hidden' }}>
              <AnimatedBackground>
                <View style={{ flex: 1, padding: 28 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: 22, marginTop: 10, letterSpacing: 0.8 }}>Izaberi tim</Text>
                    <TouchableOpacity onPress={() => { setTeamModalVisible(false); setSelectedTeam(null); setPendingJoinMatch(null); }}>
                      <Ionicons name="close" size={28} color="#FFD600" />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', marginBottom: 24, justifyContent: 'center' }}>
                    <View style={{ alignItems: 'center', marginRight: 48, marginLeft: -32 }}>
                      <TouchableOpacity
                        style={{ backgroundColor: selectedTeam === 1 ? '#FFD600' : '#181818', borderRadius: 8, padding: 16, minWidth: 100, alignItems: 'center' }}
                        onPress={() => setSelectedTeam(1)}
                      >
                        <Text style={{ color: selectedTeam === 1 ? '#232c3b' : '#FFD600', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Tim 1</Text>
                      </TouchableOpacity>
                      {/* Signed up users for Tim 1 */}
                      {pendingMatchParticipants.filter(p => p.team === 1).map((p, idx) => (
                        <Text key={idx} style={{ color: '#fff', fontSize: 15, marginTop: 4 }}>
                          {p.profiles?.name} {p.profiles?.surname} @{p.profiles?.username}
                        </Text>
                      ))}
                    </View>
                    <View style={{ alignItems: 'center', marginLeft: 48, marginRight: -32 }}>
                      <TouchableOpacity
                        style={{ backgroundColor: selectedTeam === 2 ? '#FFD600' : '#181818', borderRadius: 8, padding: 16, minWidth: 100, alignItems: 'center' }}
                        onPress={() => setSelectedTeam(2)}
                      >
                        <Text style={{ color: selectedTeam === 2 ? '#232c3b' : '#FFD600', fontWeight: '400', fontSize: 14, letterSpacing: 0.5 }}>Tim 2</Text>
                      </TouchableOpacity>
                      {/* Signed up users for Tim 2 */}
                      {pendingMatchParticipants.filter(p => p.team === 2).map((p, idx) => (
                        <Text key={idx} style={{ color: '#fff', fontSize: 15, marginTop: 4 }}>
                          {p.profiles?.name} {p.profiles?.surname} @{p.profiles?.username}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity
                    style={{ backgroundColor: '#FFD600', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, marginTop: 24, alignSelf: 'center' }}
                    disabled={!selectedTeam}
                    onPress={async () => {
                      if (pendingJoinMatch && selectedTeam) {
                        await joinMatchWithTeam(pendingJoinMatch, selectedTeam);
                      }
                    }}
                  >
                    <Text style={{ color: '#181818', fontWeight: '400', fontSize: 16, letterSpacing: 0.5 }}>Pridruzi se timu</Text>
                  </TouchableOpacity>
                </View>
              </AnimatedBackground>
            </View>
          </View>
        </Modal>
                             <CreateMatchModalV2 visible={showNewModal} onClose={() => setShowNewModal(false)} selectedDate={selectedDate} modalSport={selectedSport} refreshMatches={fetchMatches} t={t} language={language} isDarkMode={isDarkMode} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 40,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 0.8,
  },
  headerIconBtn: {
    marginLeft: 12,
    backgroundColor: '#232c3b',
    borderRadius: 8,
    padding: 6,
  },
  sportTabs: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sportTab: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginRight: 8,
  },
  sportTabActive: {
    backgroundColor: '#181818',
  },
  sportTabText: {
    color: '#b0b0b0',
    fontWeight: '400',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  sportTabTextActive: {
    color: '#FFD600',
  },
  statusTabs: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statusTab: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTabActive: {
    backgroundColor: '#181818',
  },
  statusTabText: {
    color: '#b0b0b0',
    fontWeight: '400',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  statusTabTextActive: {
    color: '#FFD600',
  },
  statusBadge: {
    backgroundColor: '#232c3b',
    borderRadius: 10,
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  matchCard: {
    backgroundColor: 'transparent',
    padding: 18,
    marginVertical: 10,
    width: 380,
    alignSelf: 'center',

  },
  matchDate: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 14,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  matchTime: {
    color: '#b0b0b0',
    fontSize: 14,
    marginBottom: 2,
  },
  statusConfirmed: {
    backgroundColor: '#1de9b6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusConfirmedText: {
    color: '#232c3b',
    fontWeight: '400',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  matchName: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 18,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  matchLocation: {
    color: '#b0b0b0',
    fontSize: 15,
    marginBottom: 2,
  },
  matchSlots: {
    color: '#fff',
    fontSize: 15,
    marginRight: 8,
  },
  matchLevel: {
    backgroundColor: '#7c4dff',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  matchLevelText: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  matchPrice: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 14,
    marginLeft: 'auto',
    letterSpacing: 0.5,
  },
  joinBtn: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  joinBtnText: {
    color: '#232c3b',
    fontWeight: '400',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    color: '#232c3b',
    marginBottom: 20,
    letterSpacing: 0.8,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#181818',
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  modalBtn: {
    backgroundColor: '#00b894',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
    marginHorizontal: 5,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  message: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  sportImageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  sportImage: {
    width: '100%',
    height: '100%',
  },
  textOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  buttonsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  priceContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#2a3441',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: '#FFFF00',
  },
  joinButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#2a3441',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: '#FFFF00',
  },
});

export default MatchesScreen; 