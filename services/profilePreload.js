import { getFriends, getUserAchievements, getUserStats, supabase } from './supabaseClient';

const SPORTS = [
  { key: 'padel', label: 'Padel' },
  { key: 'fudbal', label: 'Fudbal' },
  { key: 'kosarka', label: 'Kosarka' },
  { key: 'tenis', label: 'Tenis' },
];



export async function preloadUserProfile() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return null;
  // Fetch main profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  // Fetch all ranks
  const { data: allRanks } = await supabase.from('user_sport_ranks').select('sport, rank').eq('user_id', user.id);
  // Fetch all sports data in parallel
  const allSportData = {};
  await Promise.all(SPORTS.map(async (sport) => {
    const [achRes, statsRes] = await Promise.all([
      getUserAchievements(user.id, sport.key),
      getUserStats(user.id, sport.key)
    ]);
    const foundRank = allRanks?.find(r => r.sport === sport.key)?.rank || null;
    allSportData[sport.key] = {
      achievements: achRes.data || [],
      stats: { ...statsRes, rank: foundRank } || { rank: foundRank }
    };
  }));
  // Fetch friends
  const friendsRes = await getFriends(user.id);
  return {
    profile,
    allSportData,
    friends: friendsRes.data || [],
    allRanks: allRanks || [],
  };
} 