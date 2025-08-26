import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native'; // Added import for LottieView
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AnimatedBackground from '../components/AnimatedBackground'; // Added import for AnimatedBackground
import { responsiveFontSize, scale, verticalScale } from '../constants/Responsive';
import { getSportLeaderboard, getUserAchievements, getUserAverageRating, getUserStats, supabase } from '../services/supabaseClient';
import { styles } from './ProfileStyles'; // We will create this file next

export const SPORTS = [
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

export const ProfileDisplay = ({
  profileData,
  statsData,
  achievementsData,
  isOwnProfile,
  onEditPress,
  onLogoutPress,
  onBackPress,
  selectedSport,
  setSelectedSport,
  savingSport,
  setSavingSport,
  onAddFriend,
  friendStatus,
  onSendMessage,
  sportRanks = [],
  onAvatarPress, // new prop
  onSettingsPress, // new prop for settings
  language = 'serbian', // Add language prop
  isDarkMode = true, // Add dark mode prop

}) => {
  const [sportOpen, setSportOpen] = useState(false);
  const [achievementsModalVisible, setAchievementsModalVisible] = useState(false);
  const [achievementsSport, setAchievementsSport] = useState('tenis');
  // Add state for all sports' data for the achievements modal
  const [allAchievementsData, setAllAchievementsData] = useState({});
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementsError, setAchievementsError] = useState(null);

  // Dropdown state for achievements filter
  const [achievementsDropdownOpen, setAchievementsDropdownOpen] = React.useState(false);
  const [achievementsFilter, setAchievementsFilter] = React.useState('Sve');
  
  // Define filter options based on language
  const ACHIEVEMENTS_FILTER_OPTIONS = [
    { key: 'Sve', label: language === 'english' ? 'All' : 'Sve' },
    { key: 'Odigrani mecevi', label: language === 'english' ? 'Played matches' : 'Odigrani mecevi' },
    { key: 'Pobedjeni mecevi', label: language === 'english' ? 'Won matches' : 'Pobedjeni mecevi' },
    { key: 'Rang lista', label: language === 'english' ? 'Rank list' : 'Rang lista' },
    { key: 'Uzastopne pobede', label: language === 'english' ? 'Consecutive wins' : 'Uzastopne pobede' },
  ];
  // Map filter to section index
  const FILTER_TO_SECTION = {
    'Sve': [0,1,2,3],
    'Odigrani mecevi': [0],
    'Pobedjeni mecevi': [1],
    'Rang lista': [2],
    'Uzastopne pobede': [3],
  };

  // Find the rank for the selected sport
  const selectedSportRank = sportRanks.find(
    r => r.sport && selectedSport && r.sport.trim().toLowerCase() === selectedSport.trim().toLowerCase()
  )?.rank;

  // Add state for average rating
  const [avgRating, setAvgRating] = useState(0);

  // Fetch average rating when profileData.id changes
  useEffect(() => {
    if (!profileData?.id) return;
    getUserAverageRating(profileData.id).then(rating => setAvgRating(rating || 0));
  }, [profileData?.id]);

  // When the achievements modal opens, fetch all sports' data in parallel
  useEffect(() => {
    if (!achievementsModalVisible || !profileData?.id) return;
    setAchievementsLoading(true);
    setAchievementsError(null);
    const fetchAll = async () => {
      try {
        const result = {};
        await Promise.all(SPORTS.map(async (sport) => {
          const [stats, achievements, leaderboard, matchHistory] = await Promise.all([
            getUserStats(profileData.id, sport.key),
            getUserAchievements(profileData.id, sport.key),
            getSportLeaderboard(sport.key),
            supabase
              .from('match_history')
              .select('*')
              .eq('user_id', profileData.id)
              .eq('sport', sport.key)
              .order('created_at', { ascending: true })
              .then(({ data }) => data || [])
          ]);
          // Find user position in leaderboard
          const userPosition = leaderboard.findIndex(u => u.user_id === profileData.id);
          result[sport.key] = {
            stats: stats || { matchesPlayed: 0, wins: 0, winrate: 0 },
            achievements: (achievements.data || []).map(a => a.key || a.title),
            leaderboard,
            userPosition: userPosition >= 0 ? userPosition + 1 : null,
            matchHistory,
          };
        }));
        setAllAchievementsData(result);
      } catch (err) {
        setAchievementsError('Greška pri ucitavanju dostignuca.');
      } finally {
        setAchievementsLoading(false);
      }
    };
    fetchAll();
  }, [achievementsModalVisible, profileData?.id]);

  // When the achievements modal opens, always set the selected sport to 'padel'
  useEffect(() => {
    if (achievementsModalVisible) {
      setAchievementsSport('padel');
    }
  }, [achievementsModalVisible]);

  // Helper to get current modal data for the selected sport
  const modalData = allAchievementsData[achievementsSport] || {};
  const modalStats = modalData.stats || { matchesPlayed: 0, wins: 0, winrate: 0 };
  const unlockedAchievements = modalData.achievements || [];
  const leaderboard = modalData.leaderboard || [];
  const userPosition = modalData.userPosition;
  const matchHistory = modalData.matchHistory || [];
  const winStreak = getLongestWinStreak(matchHistory);

  // Fetch stats for the selected sport when modal opens or tab changes
  useEffect(() => {
    if (!achievementsModalVisible) return;
    if (!profileData?.id) return;
    // setStatsLoading(true); // Removed
    // getUserStats(profileData.id, achievementsSport).then(stats => { // Removed
    //   console.log('Modal stats:', stats); // Debug log // Removed
    //   setModalStats(stats || { matchesPlayed: 0, wins: 0, winrate: 0 }); // Removed
    //   setStatsLoading(false); // Removed
    // }); // Removed
  }, [achievementsModalVisible, achievementsSport, profileData?.id]);

  // Fetch unlocked achievements for the selected sport when modal opens or tab changes
  useEffect(() => {
    if (!achievementsModalVisible) return;
    if (!profileData?.id) return;
    // setAchievementsLoading(true); // Removed
    // getUserAchievements(profileData.id, achievementsSport).then(res => { // Removed
    //   console.log('Supabase unlocked achievements:', res.data); // Debug log // Removed
    //   // Assume res.data is an array of unlocked achievement keys or titles // Removed
    //   // You may need to adjust this depending on your Supabase schema // Removed
    //   setUnlockedAchievements((res.data || []).map(a => a.key || a.title)); // Removed
    //   setAchievementsLoading(false); // Removed
    // }); // Removed
  }, [achievementsModalVisible, achievementsSport, profileData?.id]);

  // Remove old per-sport modal states and effects (now replaced by allAchievementsData)
  // const [leaderboard, setLeaderboard] = useState([]);
  // const [userPosition, setUserPosition] = useState(null);
  // const [avgRating, setAvgRating] = useState(0);

  // Fetch leaderboard for the selected sport when modal opens or sport changes
  useEffect(() => {
    if (!achievementsModalVisible) return;
    if (!profileData?.id) return;
    // getSportLeaderboard(achievementsSport).then(lb => { // Removed
    //   setLeaderboard(lb); // Removed
    //   const pos = lb.findIndex(u => u.user_id === profileData.id); // Removed
    //   setUserPosition(pos >= 0 ? pos + 1 : null); // 1-based position // Removed
    // }); // Removed
  }, [achievementsModalVisible, achievementsSport, profileData?.id]);

  useEffect(() => {
    if (!profileData?.id) return;
    // getUserAverageRating(profileData.id).then(rating => setAvgRating(rating || 0)); // Removed
  }, [profileData?.id]);

  // Remove old per-sport modal states and effects (now replaced by allAchievementsData)
  // const [matchHistory, setMatchHistory] = useState([]);
  // const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch match history for the selected sport when modal opens or sport changes
  useEffect(() => {
    if (!achievementsModalVisible) return;
    if (!profileData?.id) return;
    // setHistoryLoading(true); // Removed
    // supabase // Removed
    //   .from('match_history') // Removed
    //   .select('*') // Removed
    //   .eq('user_id', profileData.id) // Removed
    //   .eq('sport', achievementsSport) // Removed
    //   .order('created_at', { ascending: true }) // Use created_at for correct order // Removed
    //   .then(({ data }) => { // Removed
    //     console.log('Fetched match history:', data); // Debug log // Removed
    //     setMatchHistory(data || []); // Removed
    //     setHistoryLoading(false); // Removed
    //   }); // Removed
  }, [achievementsModalVisible, achievementsSport, profileData?.id]);

  // Helper to calculate longest win streak
  function getLongestWinStreak(history) {
    let maxStreak = 0;
    let currentStreak = 0;
    for (const match of history) {
      if (match.result === 'win') {
        currentStreak += 1;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }



  // Calculate win streak for Uzastopne pobede
  // const winStreak = getLongestWinStreak(matchHistory); // This line is removed



  if (!profileData) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Get achievement sections based on language
  const getAchievementSections = (language) => {
    if (language === 'english') {
      return [
        {
          title: 'Played Matches',
          icon: 'trophy',
          data: [
            { title: 'First Match', desc: 'Play 1 match' },
            { title: 'Warming Up', desc: 'Play 5 matches' },
            { title: 'Beginner in Action', desc: 'Play 10 matches' },
            { title: 'Player in Form', desc: 'Play 25 matches' },
            { title: 'Experienced Player', desc: 'Play 50 matches' },
            { title: 'Hundred!', desc: 'Play 100 matches' },
            { title: 'Game Lover', desc: 'Play 250 matches' },
            { title: 'Half Thousand', desc: 'Play 500 matches' },
            { title: 'Field Legend', desc: 'Play 1000 matches' },
          ],
        },
        {
          title: 'Won Matches',
          icon: 'star',
          data: [
            { title: 'First Victory', desc: 'Win 1 match' },
            { title: 'Getting Serious', desc: 'Win 5 matches' },
            { title: 'Double Digit Wins', desc: 'Win 10 matches' },
            { title: 'Serious Competitor', desc: 'Win 25 matches' },
            { title: 'Champion Mentality', desc: 'Win 50 matches' },
            { title: 'Unstoppable Winner', desc: 'Win 100 matches' },
            { title: 'Trophy Hunter', desc: 'Win 200 matches' },
            { title: 'Comeback of the Year', desc: 'Win a match you were losing at halftime' },
            { title: 'Perfect Victory', desc: 'Win without losing a point (if rules allow)' },
          ],
        },
        {
          title: 'Rank List',
          icon: 'medal',
          data: [
            { title: 'Rank Progress', desc: 'Reach advanced rank' },
            { title: 'Halfway There', desc: 'Reach middle rank' },
            { title: 'Middle League', desc: 'Reach high rank' },
            { title: 'Elite Player', desc: 'Reach elite rank' },
            { title: 'Professional League', desc: 'Reach professional rank' },
            { title: 'Top 10%', desc: 'Enter top 10%' },
            { title: 'Podium', desc: 'Be in top 3 on rank list' },
          ],
        },
        {
          title: 'Consecutive Wins',
          icon: 'flame',
          data: [
            { title: 'On Fire', desc: 'Win 3 matches in a row' },
            { title: 'Unstoppable', desc: 'Win 5 matches in a row' },
            { title: 'Victory Machine', desc: 'Win 10 matches in a row' },
          ],
        },
      ];
    } else {
      return [
        {
          title: 'Odigrani mecevi',
          icon: 'trophy',
          data: [
            { title: 'Prva utakmica', desc: 'Odigraj 1 mec' },
            { title: 'Zagrevanje', desc: 'Odigraj 5 meceva' },
            { title: 'Pocetnik u pogonu', desc: 'Odigraj 10 meceva' },
            { title: 'Igrac u naletu', desc: 'Odigraj 25 meceva' },
            { title: 'Iskusni igrac', desc: 'Odigraj 50 meceva' },
            { title: 'Stotka!', desc: 'Odigraj 100 meceva' },
            { title: 'Zaljubljenik u igru', desc: 'Odigraj 250 meceva' },
            { title: 'Pola hiljade', desc: 'Odigraj 500 meceva' },
            { title: 'Legenda terena', desc: 'Odigraj 1000 meceva' },
          ],
        },
        {
          title: 'Pobedjeni mecevi',
          icon: 'star',
          data: [
            { title: 'Prva pobeda', desc: 'Pobedi u 1 mecu' },
            { title: 'Postajes ozbiljan', desc: 'Pobedi u 5 meceva' },
            { title: 'Dvocifren broj pobeda', desc: 'Pobedi u 10 meceva' },
            { title: 'Ozbiljan takmicar', desc: 'Pobedi u 25 meceva' },
            { title: 'Sampionski mentalitet', desc: 'Pobedi u 50 meceva' },
            { title: 'Pobednik bez prestanka', desc: 'Pobedi u 100 meceva' },
            { title: 'Lovac na trofeje', desc: 'Pobedi u 200 meceva' },
            { title: 'Povratak godine', desc: 'Pobedi mec u kom si gubio na polovini' },
            { title: 'Savrsena pobeda', desc: 'Pobedi bez izgubljenog poena (ako pravila dozvoljavaju) meceva' },
          ],
        },
        {
          title: 'Rang lista',
          icon: 'medal',
          data: [
            { title: 'Rang napreduje', desc: 'Dostigni napredni rang' },
            { title: 'Na pola puta', desc: 'Dostigni srednji rang' },
            { title: 'Srednja liga', desc: 'Dostigni visok rang' },
            { title: 'Elitni igrac', desc: 'Dostigni elitni rang' },
            { title: 'Profesionalna liga', desc: 'Dostigni profesionalni rang' },
            { title: 'Top 10%', desc: 'Udji medju 10% najboljih' },
            { title: 'Podijum', desc: 'Budi u top 3 na rang listi' },
          ],
        },
        {
          title: 'Uzastopne pobede',
          icon: 'flame',
          data: [
            { title: 'U naletu', desc: 'Pobedi 3 meca zaredom' },
            { title: 'Nezaustavljiv', desc: 'Pobedi 5 meceva zaredom' },
            { title: 'Masina za pobede', desc: 'Pobedi 10 meceva zaredom' },
          ],
        },
      ];
    }
  };

  const ACHIEVEMENT_SECTIONS = getAchievementSections(language);

  // Helper to get achievement key for unlocking logic
  const getAchievementKey = (title, language) => {
    const achievementMap = {
      // Played Matches
      'First Match': 'Prva utakmica',
      'Warming Up': 'Zagrevanje',
      'Beginner in Action': 'Pocetnik u pogonu',
      'Player in Form': 'Igrac u naletu',
      'Experienced Player': 'Iskusni igrac',
      'Hundred!': 'Stotka!',
      'Game Lover': 'Zaljubljenik u igru',
      'Half Thousand': 'Pola hiljade',
      'Field Legend': 'Legenda terena',
      // Won Matches
      'First Victory': 'Prva pobeda',
      'Getting Serious': 'Postajes ozbiljan',
      'Double Digit Wins': 'Dvocifren broj pobeda',
      'Serious Competitor': 'Ozbiljan takmicar',
      'Champion Mentality': 'Sampionski mentalitet',
      'Unstoppable Winner': 'Pobednik bez prestanka',
      'Trophy Hunter': 'Lovac na trofeje',
      'Comeback of the Year': 'Povratak godine',
      'Perfect Victory': 'Savrsena pobeda',
      // Rank List
      'Rank Progress': 'Rang napreduje',
      'Halfway There': 'Na pola puta',
      'Middle League': 'Srednja liga',
      'Elite Player': 'Elitni igrac',
      'Professional League': 'Profesionalna liga',
      'Top 10%': 'Top 10%',
      'Podium': 'Podijum',
      // Consecutive Wins
      'On Fire': 'U naletu',
      'Unstoppable': 'Nezaustavljiv',
      'Victory Machine': 'Masina za pobede',
    };
    
    if (language === 'english') {
      return achievementMap[title] || title;
    }
    return title;
  };

  // Helper to get section key for unlocking logic
  const getSectionKey = (title, language) => {
    const sectionMap = {
      'Played Matches': 'Odigrani mecevi',
      'Won Matches': 'Pobedjeni mecevi',
      'Rank List': 'Rang lista',
      'Consecutive Wins': 'Uzastopne pobede',
    };
    
    if (language === 'english') {
      return sectionMap[title] || title;
    }
    return title;
  };

  // Helper to capitalize first letter
  function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Ref for achievements modal ScrollView
  const achievementsScrollRef = React.useRef(null);





  // Update ANIMATION_PREVIEWS to use direct Lottie JSON URLs
  const ANIMATION_PREVIEWS = {
    avatar_border: 'https://assets2.lottiefiles.com/packages/lf20_4kx2q32n.json', // Gold/Fire border
    hero_card_bg: 'https://assets2.lottiefiles.com/packages/lf20_puls.json', // Local galaxy animation as imported object
    o_meni_letters: 'https://assets2.lottiefiles.com/packages/lf20_8wREpI.json', // Neon text
    username: 'https://assets2.lottiefiles.com/packages/lf20_2ksk7z.json', // Rainbow/line animation
  };

  // Static mapping for local animation files
  const animationMap = {
    'duh.json': require('../assets/animations/duh.json'),
    'Smiley.json': require('../assets/animations/Smiley.json'),
    'smiley.json': require('../assets/animations/Smiley.json'),
    'Krivudave oci.json': require('../assets/animations/Krivudave oci.json'),
    'krivudave oci.json': require('../assets/animations/Krivudave oci.json'),
    'Ruka.json': require('../assets/animations/Ruka.json'),
    'ruka.json': require('../assets/animations/Ruka.json'),
    'Puls.json': require('../assets/animations/Puls.json'),
    'puls.json': require('../assets/animations/Puls.json'),
    'Kapljica.json': require('../assets/animations/Kapljica.json'),
    'kapljica.json': require('../assets/animations/Kapljica.json'),
    'Crtez.json': require('../assets/animations/Crtez.json'),
    'crtez.json': require('../assets/animations/Crtez.json'),
    'Letece cestice.json': require('../assets/animations/Letece cestice.json'),
    'letece cestice.json': require('../assets/animations/Letece cestice.json'),
    'Ucitavanje.json': require('../assets/animations/Ucitavanje.json'),
    'ucitavanje.json': require('../assets/animations/Ucitavanje.json'),
  };
  const getLocalAnimation = (filename) => animationMap[filename] || null;







  // 1. Add state for preview modal
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);



  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 400;

  return (
    <>
      {/* Header */}
      <View style={styles.headerRow}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity style={styles.headerIcon} onPress={onSettingsPress}>
              <MaterialIcons name="settings" size={24} color="#b0b0b0" />
            </TouchableOpacity>
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity style={styles.headerIcon} onPress={onLogoutPress}>
                    <MaterialIcons name="logout" size={22} color="#b0b0b0" />
                </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={onBackPress} style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(6), paddingVertical: scale(8) }}>
                    <Ionicons name="arrow-back" size={22} color="#FFFF00" style={{ marginRight: 6 }} />
        <Text style={{ color: '#FFFF00', fontSize: responsiveFontSize(16) }}>Nazad</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5' }]}>
        {/* Centered avatar */}
        <View style={{ zIndex: 2, alignItems: 'center', justifyContent: 'center', width: 84, height: 84, marginBottom: 12, position: 'relative' }}>
          {profileData.avatar_url ? (
            <View style={{ position: 'relative', width: 84, height: 84 }}>
              <Image
                source={{ uri: profileData.avatar_url }}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 999,
                  resizeMode: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 3,
                }}
                onLoadStart={() => {
                  // Loading started
                }}
                onLoadEnd={() => {
                  // Loading finished
                }}
                fadeDuration={0}
              />
            </View>
          ) : (
            <View style={[styles.avatarBig, { backgroundColor: 'rgba(255, 214, 0, 0.7)', position: 'absolute', top: 0, left: 0, width: 84, height: 84, zIndex: 1 }]}>
              <Text style={[styles.avatarBigText, { color: '#181818' }]}>{profileData.username?.[0]?.toUpperCase() || '?'}</Text>
              {isOwnProfile && (
                <TouchableOpacity
                  style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFFF00', borderRadius: 16, padding: 4, zIndex: 4 }}
                  onPress={onAvatarPress}
                >
                  <MaterialIcons name="photo-camera" size={18} color="#181818" />
                </TouchableOpacity>
              )}
            </View>
          )}
          {isOwnProfile && profileData.avatar_url && (
            <TouchableOpacity
              style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFFF00', borderRadius: 16, padding: 4, zIndex: 4 }}
              onPress={onAvatarPress}
            >
              <MaterialIcons name="photo-camera" size={18} color="#181818" />
            </TouchableOpacity>
          )}
        </View>
        {/* Centered profile info, no marginTop needed */}
        <View style={{ zIndex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Text style={[styles.profileName, { textAlign: 'center', textShadowColor: isDarkMode ? '#fff' : '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>@{profileData.username || '-'}</Text>
          <Text style={[styles.profileFullName, { textAlign: 'center', textShadowColor: isDarkMode ? '#fff' : '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>{profileData.name} {profileData.surname}</Text>
                          <Text style={[styles.profileRole, { color: isDarkMode ? '#b0bec5' : '#666' }]}>{capitalizeFirst(profileData.location) || 'Beograd'} - {language === 'english' ? 'Athlete' : 'Sportista'}</Text>
          <View style={styles.profileStatsRow}>
            <View style={styles.profileStat}><MaterialIcons name="star" size={16} color="#FFFF00" /><Text style={[styles.profileStatText, { color: isDarkMode ? '#fff' : '#000' }]}>{avgRating?.toFixed(1) || '0.0'}</Text></View>
            <View style={styles.profileStat}><MaterialIcons name="location-on" size={16} color={isDarkMode ? '#fff' : '#000'} /><Text style={[styles.profileStatText, { color: isDarkMode ? '#fff' : '#000' }]}>{capitalizeFirst(profileData.location) || 'Beograd'}</Text></View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {!isOwnProfile && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginHorizontal: scale(16) }}>
          {/* First Button */}
          <TouchableOpacity
            onPress={() => {
              if (friendStatus === 'request_received') {
                onAddFriend('accept');
              } else if (friendStatus === 'friends') {
                onAddFriend('delete');
              } else {
                onAddFriend();
              }
            }}
            style={[
              styles.friendButton,
              {
                flex: 1,
                height: 64,
                marginRight: 8,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                flexDirection: 'column',
                paddingTop: 8,
                paddingLeft: 12,
                ...(friendStatus === 'request_sent' && {
                  backgroundColor: '#2a3441',
                  borderWidth: 2,
                  borderColor: '#FFFF00',
                }),
              },
            ]}
          >
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={22}
              color={friendStatus === 'request_sent' ? '#FFFF00' : '#181818'}
              style={{ alignSelf: 'flex-start', marginBottom: 2 }}
            />
            <Text
              style={[
                styles.friendButtonText,
                { fontSize: 15, textAlign: 'left', alignSelf: 'flex-start' },
                friendStatus === 'request_sent' && { color: '#FFFF00' },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {friendStatus === 'friends' ? 'Obrisi prijatelja' :
                friendStatus === 'request_sent' ? 'Otkazi zahtev' :
                friendStatus === 'request_received' ? 'Prihvati Zahtev' : 'Dodaj Prijatelja'}
            </Text>
          </TouchableOpacity>
          {/* Second Button */}
          <TouchableOpacity
            onPress={() => {
              if (friendStatus === 'request_received') {
                onAddFriend('cancel');
              } else if (friendStatus === 'friends') {
                onSendMessage && onSendMessage();
              } else if (friendStatus === 'request_sent') {
                onAddFriend();
              } else {
                onSendMessage && onSendMessage();
              }
            }}
            style={[
              styles.friendButton,
              {
                flex: 1,
                height: 64,
                marginLeft: 8,
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                flexDirection: 'column',
                paddingTop: 8,
                paddingLeft: 12,
                ...(friendStatus === 'request_received' && {
                  backgroundColor: '#2a3441',
                  borderWidth: 2,
                  borderColor: '#FFFF00',
                }),
              },
            ]}
          >
            <MaterialCommunityIcons
              name={friendStatus === 'request_received' ? 'close-circle-outline' : 'message-text-outline'}
              size={22}
              color={friendStatus === 'request_received' ? '#FFFF00' : '#181818'}
              style={{ alignSelf: 'flex-start', marginBottom: 2 }}
            />
            <Text
              style={[
                styles.friendButtonText,
                { fontSize: 15, textAlign: 'left', alignSelf: 'flex-start' },
                friendStatus === 'request_received' && { color: '#FFFF00' },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {friendStatus === 'request_received' ? 'Otkazi zahtev' : 'Poruka'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* About */}
                      <Text style={[styles.sectionTitle, { marginHorizontal: scale(16), marginTop: scale(16) }]}>{language === 'english' ? 'About me' : 'O meni'}</Text>
              <Text style={[styles.aboutText, { marginHorizontal: scale(16) }]}>{profileData.about || (language === 'english' ? 'No description.' : 'Nema opisa.')}</Text>

      {/* Sport Selection */}
      <View style={{ marginTop: scale(12), marginBottom: verticalScale(8), position: 'relative' }}>
                        <Text style={[styles.sectionTitle, { marginHorizontal: scale(16) }]}>{language === 'english' ? 'Choose sport' : 'Izaberi sport'}</Text>
        <View style={{ marginHorizontal: scale(24), position: 'relative' }}>
          <TouchableOpacity
            style={[styles.sportSelector, { backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5' }]}
            onPress={() => setSportOpen(o => !o)}
            activeOpacity={0.8}
          >
            <Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: '400', fontSize: responsiveFontSize(14), flex: 1, letterSpacing: 0.5 }}>
              {SPORTS.find(s => s.key === selectedSport)?.label || 'Tenis'}
            </Text>
            <MaterialIcons name={sportOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={scale(22)} color={isDarkMode ? '#b0b0b0' : '#666'} />
          </TouchableOpacity>
          {sportOpen && (
            <View style={[styles.sportDropdown, { backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5' }]}>
              {SPORTS.map(sport => (
                <TouchableOpacity
                  key={sport.key}
                  style={[styles.sportItem, selectedSport === sport.key && styles.sportItemSelected]}
                  onPress={async () => {
                    setSportOpen(false);
                    if (selectedSport !== sport.key) {
                      setSelectedSport(sport.key);
                      if (isOwnProfile) {
                        setSavingSport(true);
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                          await supabase.from('profiles').update({ sport: sport.key }).eq('id', user.id);
                        }
                        setSavingSport(false);
                      }
                    }
                  }}
                >
                  <Text style={[styles.sportItemText, { color: isDarkMode ? '#fff' : '#000' }]}>{getSportLabel(sport.key, language)}</Text>
                  {selectedSport === sport.key && <MaterialIcons name="check" size={scale(20)} color="#4CAF50" />}
                </TouchableOpacity>
              ))}
            </View>
          )}
          {savingSport && <ActivityIndicator size="small" color="#fff" style={styles.sportSavingIndicator} />}
        </View>
      </View>

      {/* Stats */}
                      <Text style={[styles.sectionTitle, { marginHorizontal: scale(16) }]}>{language === 'english' ? 'Statistics' : 'Statistike'} - {getSportLabel(selectedSport, language) || 'Tenis'}</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5' }]}>
          <MaterialIcons name="calendar-today" size={scale(24)} color={isDarkMode ? '#fff' : '#000'} />
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>{statsData?.matchesPlayed || 0}</Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#b0bec5' : '#666' }]} numberOfLines={1} ellipsizeMode="tail">{language === 'english' ? 'Played matches' : 'Odigrani mecevi'}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5' }]}>
          <MaterialIcons name="star" size={scale(24)} color={isDarkMode ? '#fff' : '#000'} />
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>{statsData?.rank !== undefined && statsData?.rank !== null ? statsData.rank : '-'}</Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#b0bec5' : '#666' }]} numberOfLines={1} ellipsizeMode="tail">Rank</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5' }]}>
          <MaterialCommunityIcons name="trophy-outline" size={scale(24)} color={isDarkMode ? '#fff' : '#000'} />
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>{statsData?.wins || 0}</Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#b0bec5' : '#666' }]} numberOfLines={1} ellipsizeMode="tail">{language === 'english' ? 'Wins' : 'Pobede'}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5' }]}>
          <MaterialCommunityIcons name="target" size={scale(24)} color={isDarkMode ? '#fff' : '#000'} />
          <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#000' }]}>{statsData?.winrate || 0}%</Text>
          <Text style={[styles.statLabel, { color: isDarkMode ? '#b0bec5' : '#666' }]} numberOfLines={1} ellipsizeMode="tail">{language === 'english' ? 'Win percentage' : 'Procenat pobeda'}</Text>
        </View>
      </View>

      {/* Achievements */}
      {/* Remove the old achievements section and add a button to open the achievements modal */}
      {isOwnProfile && (
        <TouchableOpacity
          style={{
            backgroundColor: isDarkMode ? '#2a3441' : '#F5F5F5',
            borderRadius: 10,
            paddingVertical: 12,
            width: '92%',
            alignSelf: 'center',
            marginTop: scale(2),
            marginBottom: scale(8),
            marginHorizontal: 16,

            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
          onPress={() => setAchievementsModalVisible(true)}
        >
          <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: responsiveFontSize(16), textAlign: 'center', letterSpacing: 0.8 }}>{language === 'english' ? 'Achievements' : 'Dostignuca'}</Text>
        </TouchableOpacity>
      )}



      {/* Achievements Modal */}
      <Modal
        visible={achievementsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAchievementsModalVisible(false)}
      >
        <AnimatedBackground isDarkMode={isDarkMode}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 36, paddingHorizontal: 24, marginBottom: 4 }}>
              <Text style={{ color: '#FFFF00', fontWeight: '400', fontSize: responsiveFontSize(18), textAlign: 'left', letterSpacing: 0.8 }}>{language === 'english' ? 'Achievements' : 'Dostignuca'}</Text>
              <TouchableOpacity onPress={() => setAchievementsModalVisible(false)}>
                                  <MaterialIcons name="close" size={28} color="#FFFF00" />
              </TouchableOpacity>
            </View>

            {/* Show spinner while loading, otherwise show modal content */}
            {achievementsLoading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFFF00" />
              </View>
            ) : achievementsError ? (
              <Text style={{ color: '#e74c3c', textAlign: 'center', marginTop: 32 }}>{achievementsError}</Text>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%', paddingHorizontal: 16, marginBottom: 8, marginTop: 2 }} contentContainerStyle={{ alignItems: 'center' }}>
                  {SPORTS.map(sport => (
                    <TouchableOpacity
                      key={sport.key}
                      onPress={() => {
                        setAchievementsSport(sport.key);
                        setTimeout(() => {
                          achievementsScrollRef.current?.scrollTo({ y: 0, animated: true });
                        }, 0);
                      }}
                      style={{
                        paddingTop: 2,
                        paddingBottom: 2,
                        paddingHorizontal: 18,
                        borderRadius: 20,
                        backgroundColor: 'transparent',
                        marginRight: 8,
                        borderTopWidth: 4,
                        borderTopColor: achievementsSport === sport.key ? '#FFD600' : 'transparent',
                      }}
                    >
                      <Text style={{
                        color: achievementsSport === sport.key ? '#FFD600' : (isDarkMode ? '#fff' : '#000'),
                        fontWeight: 'bold',
                        fontSize: 15,
                      }}>{getSportLabel(sport.key, language)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView
                  ref={achievementsScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 36 }}>
                  {ACHIEVEMENT_SECTIONS.map((section, sectionIdx) => {
                    // Calculate win streak for Uzastopne pobede
                    let winStreakSection = section.title === 'Uzastopne pobede' ? winStreak : 0;
                    return (
                      <View key={section.title} style={{ marginBottom: 28 }}>
                        {/* Only show section title if 'Sve' is selected (multiple sections) */}
                        {achievementsFilter === 'Sve' && (
                          <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: responsiveFontSize(16), marginBottom: 10, marginLeft: 8, letterSpacing: 0.8 }}>{section.title}</Text>
                        )}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                          {section.data.map((ach, i) => {
                            // Stat-based unlock logic
                            let unlocked = false;
                            const sectionKey = getSectionKey(section.title, language);
                            const achievementKey = getAchievementKey(ach.title, language);
                            
                            if (sectionKey === 'Odigrani mecevi') {
                              if (achievementKey === 'Prva utakmica' && modalStats.matchesPlayed >= 1) unlocked = true;
                              if (achievementKey === 'Zagrevanje' && modalStats.matchesPlayed >= 5) unlocked = true;
                              if (achievementKey === 'Pocetnik u pogonu' && modalStats.matchesPlayed >= 10) unlocked = true;
                              if (achievementKey === 'Igrac u naletu' && modalStats.matchesPlayed >= 25) unlocked = true;
                              if (achievementKey === 'Iskusni igrac' && modalStats.matchesPlayed >= 50) unlocked = true;
                              if (achievementKey === 'Stotka!' && modalStats.matchesPlayed >= 100) unlocked = true;
                              if (achievementKey === 'Zaljubljenik u igru' && modalStats.matchesPlayed >= 250) unlocked = true;
                              if (achievementKey === 'Pola hiljade' && modalStats.matchesPlayed >= 500) unlocked = true;
                              if (achievementKey === 'Legenda terena' && modalStats.matchesPlayed >= 1000) unlocked = true;
                            } else if (sectionKey === 'Pobedjeni mecevi') {
                              if (achievementKey === 'Prva pobeda' && modalStats.wins >= 1) unlocked = true;
                              if (achievementKey === 'Postajes ozbiljan' && modalStats.wins >= 5) unlocked = true;
                              if (achievementKey === 'Dvocifren broj pobeda' && modalStats.wins >= 10) unlocked = true;
                              if (achievementKey === 'Ozbiljan takmicar' && modalStats.wins >= 25) unlocked = true;
                              if (achievementKey === 'Sampionski mentalitet' && modalStats.wins >= 50) unlocked = true;
                              if (achievementKey === 'Pobednik bez prestanka' && modalStats.wins >= 100) unlocked = true;
                              if (achievementKey === 'Lovac na trofeje' && modalStats.wins >= 200) unlocked = true;
                            } else if (sectionKey === 'Rang lista') {
                              if (achievementKey === 'Rang napreduje' && modalStats.rank >= 510) unlocked = true;
                              if (achievementKey === 'Na pola puta' && modalStats.rank >= 650) unlocked = true;
                              if (achievementKey === 'Srednja liga' && modalStats.rank >= 800) unlocked = true;
                              if (achievementKey === 'Elitni igrac' && modalStats.rank >= 1000) unlocked = true;
                              if (achievementKey === 'Profesionalna liga' && modalStats.rank >= 1300) unlocked = true;
                              if (achievementKey === 'Top 10%' && userPosition && leaderboard.length > 0 && userPosition <= Math.ceil(leaderboard.length * 0.1)) unlocked = true;
                              if (achievementKey === 'Podijum' && userPosition && userPosition <= 3) unlocked = true;
                            }
                            let iconName = section.icon;
                            if (section.icon === 'trophy') iconName = 'trophy-outline';
                            if (section.icon === 'star') iconName = 'star-outline';
                            if (section.icon === 'medal') iconName = 'medal-outline';
                            if (section.icon === 'flame') iconName = 'flame-outline';
                            if (sectionKey === 'Uzastopne pobede') {
                              if (achievementKey === 'U naletu' && winStreakSection >= 3) unlocked = true;
                              if (achievementKey === 'Nezaustavljiv' && winStreakSection >= 5) unlocked = true;
                              if (achievementKey === 'Masina za pobede' && winStreakSection >= 10) unlocked = true;
                            }
                            return (
                              <View key={ach.title} style={{
                                width: '47%',
                                margin: '1.5%',
                                backgroundColor: unlocked ? (isDarkMode ? '#2a3441' : '#F5F5F5') : (isDarkMode ? '#2a3441' : '#FFFFFF'),
                                borderRadius: 12,
                                padding: 14,
                                alignItems: 'center',

                                borderWidth: unlocked ? 2 : 1,
                                borderColor: unlocked ? '#FFD600' : (isDarkMode ? '#444' : '#DDD'),
                              }}>
                                                            {/* Use flame emoji for Uzastopne pobede, otherwise icon */}
                                {sectionKey === 'Uzastopne pobede' ? (
                                  <MaterialCommunityIcons name="fire" size={32} color={unlocked ? '#FFD600' : (isDarkMode ? '#444' : '#DDD')} style={{ marginBottom: 6 }} />
                                ) : (
                                  <MaterialCommunityIcons name={iconName} size={32} color={unlocked ? '#FFD600' : (isDarkMode ? '#444' : '#DDD')} style={{ marginBottom: 6 }} />
                                )}
                                <Text style={{ color: unlocked ? '#FFD600' : (isDarkMode ? '#888' : '#666'), fontWeight: '400', fontSize: responsiveFontSize(13), textAlign: 'center', letterSpacing: 0.5 }}>{ach.title}</Text>
                                <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: responsiveFontSize(12), textAlign: 'center', marginTop: 2 }}>{ach.desc}</Text>

                                <Text style={{ fontSize: 18, marginTop: 6 }}>{unlocked ? '✅' : '🔒'}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </AnimatedBackground>
      </Modal>



      {/* 2. Add preview modal at the end of the component */}
      {previewItem && (
        <Modal
          visible={previewModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPreviewModalVisible(false)}
        >
                  <AnimatedBackground isDarkMode={isDarkMode}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <TouchableOpacity
                onPress={() => setPreviewModalVisible(false)}
                style={{ position: 'absolute', top: 36, right: 24, zIndex: 10 }}
              >
                <MaterialIcons name="close" size={32} color="#FFD600" />
              </TouchableOpacity>
              {/* Preview content by type */}
              {previewItem.section === 'avatar_border' && (
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: responsiveFontSize(16), marginBottom: 12, letterSpacing: 0.8 }}>Pregled okvira avatara</Text>
                  <View style={{ width: 120, height: 120, justifyContent: 'center', alignItems: 'center' }}>
                    <LottieView
                      source={previewItem.animation_url ? { uri: previewItem.animation_url } : ANIMATION_PREVIEWS.avatar_border}
                      autoPlay
                      loop
                      style={{ position: 'absolute', width: 120, height: 120 }}
                    />
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                      <Text style={{ fontSize: 28, color: '#2a3441', fontWeight: '400', letterSpacing: 0.5 }}>A</Text>
                    </View>
                  </View>
                </View>
              )}
              {previewItem.section === 'hero_card_bg' && (
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: responsiveFontSize(16), marginBottom: 12, letterSpacing: 0.8 }}>Pregled hero kartice</Text>
                  <View style={{ width: 260, height: 120, borderRadius: 18, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }}>
                    <LottieView
                      source={getLocalAnimation(previewItem.animation_url)}
                      autoPlay
                      loop
                      style={{ position: 'absolute', width: 260, height: 120 }}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 2 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Text style={{ fontSize: 16, color: '#2a3441', fontWeight: '400', letterSpacing: 0.5 }}>A</Text>
                      </View>
                      <View>
                        <Text style={{ color: '#fff', fontWeight: '400', fontSize: 16, letterSpacing: 0.5 }}>Ime Prezime</Text>
                        <Text style={{ color: '#FFD600', fontSize: 13 }}>@username</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
              {previewItem.section === 'o_meni_letters' && (
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: responsiveFontSize(16), marginBottom: 12, letterSpacing: 0.8 }}>Pregled animiranih slova</Text>
                  <View style={{ width: 180, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a3441', borderRadius: 8, overflow: 'hidden' }}>
                    <LottieView
                      source={previewItem.animation_url ? { uri: previewItem.animation_url } : ANIMATION_PREVIEWS.o_meni_letters}
                      autoPlay
                      loop
                      style={{ position: 'absolute', width: 180, height: 40 }}
                    />
                    <Text style={{ color: '#fff', fontWeight: '400', fontSize: 18, zIndex: 2, letterSpacing: 0.8 }}>{language === 'english' ? 'About me text' : 'O meni tekst'}</Text>
                  </View>
                </View>
              )}
              {previewItem.section === 'username' && (
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: responsiveFontSize(16), marginBottom: 12, letterSpacing: 0.8 }}>Pregled korisnickog imena</Text>
                  <View style={{ width: 180, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a3441', borderRadius: 8, overflow: 'hidden' }}>
                    <LottieView
                      source={previewItem.animation_url ? { uri: previewItem.animation_url } : ANIMATION_PREVIEWS.username}
                      autoPlay
                      loop
                      style={{ position: 'absolute', width: 180, height: 40 }}
                    />
                    <Text style={{ color: '#FFD600', fontWeight: '400', fontSize: 18, zIndex: 2, letterSpacing: 0.8 }}>@username</Text>
                  </View>
                </View>
              )}
            </View>
          </AnimatedBackground>
        </Modal>
      )}
    </>
  );
}; 