import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import 'react-native-url-polyfill/auto';

// Fallback values if environment variables are not loaded
const SUPABASE_URL_FALLBACK = 'https://hmdeubqcibrarpyisckq.supabase.co';
const SUPABASE_ANON_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZGV1YnFjaWJyYXJweWlzY2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1OTg3NTksImV4cCI6MjA2NjE3NDc1OX0.ybOSAvMyOmx2DEo8Dk84WXRduiHy414-W044Aov8DeA';

// Use environment variables if available, otherwise use fallback values
const url = SUPABASE_URL || SUPABASE_URL_FALLBACK;
const key = SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_FALLBACK;

export const supabase = createClient(url, key);

// Friend management helpers
export async function sendFriendRequest(fromUserId, toUserId) {
  if (fromUserId === toUserId) {
    return { error: { message: 'Ne mozete dodati sebe za prijatelja.' } };
  }
  // Check for existing request
  const { data: existing, error: checkError } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('from_user', fromUserId)
    .eq('to_user', toUserId)
    .maybeSingle();
  if (existing) {
    return { error: { message: 'Zahtev vec postoji.' } };
  }
  return supabase.from('friend_requests').insert({ from_user: fromUserId, to_user: toUserId });
}

export async function getFriendRequests(userId) {
  // Get all pending requests sent to userId
  return supabase.from('friend_requests').select('*').eq('to_user', userId);
}

export async function acceptFriendRequest(requestId) {
  const { data: request, error } = await supabase.from('friend_requests').select('*').eq('id', requestId).single();
  if (error || !request) {
    return { error };
  }

  const { error: friendError } = await supabase.from('friends').insert({ from_user: request.from_user, to_user: request.to_user });
  if (friendError) {
    return { error: friendError };
  }

  const { error: deleteError } = await supabase.from('friend_requests').delete().eq('id', requestId);
  if (deleteError) {
    return { error: deleteError };
  }
  return { error: null };
}

export async function getFriends(userId) {
  // Get all friends for userId
  const result = await supabase.from('friends').select('*').or(`from_user.eq.${userId},to_user.eq.${userId}`);
  return result;
}

export async function removeFriend(userId1, userId2) {
  // Remove both directions
  return supabase.from('friends').delete().or(`and(from_user.eq.${userId1},to_user.eq.${userId2}),and(from_user.eq.${userId2},to_user.eq.${userId1})`);
}

export async function getFriendshipStatus(userId1, userId2) {
  // Check for any friend relationship between userId1 and userId2
  const { data: friends, error: friendsError } = await supabase
    .from('friends')
    .select('*')
    .or(
      `and(from_user.eq.${userId1},to_user.eq.${userId2}),and(from_user.eq.${userId2},to_user.eq.${userId1})`
    );
  if (friendsError) {
    return null;
  }
  if (friends && friends.length > 0) {
    return 'friends';
  }
  // Check for pending request
  const { data: requests, error: reqError } = await supabase
    .from('friend_requests')
    .select('*')
    .or(
      `and(from_user.eq.${userId1},to_user.eq.${userId2}),and(from_user.eq.${userId2},to_user.eq.${userId1})`
    );
  if (reqError) {
    return null;
  }
  for (const row of requests || []) {
    if (row.from_user === userId1) return 'request_sent';
    if (row.from_user === userId2) return 'request_received';
  }
  return null;
}

// Chat helpers
export async function sendMessage(chatId, senderId, content) {
  return supabase.from('messages').insert({ chat_id: chatId, sender: senderId, content });
}

export async function getMessages(chatId) {
  return supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
}

export async function getChats(userId) {
  // Get all chats where user is a participant
  return supabase.from('chats').select('*').contains('participants', [userId]);
}

// Achievement helpers
export async function getAchievements() {
  return supabase.from('achievements').select('*');
}

export async function addAchievement(userId, achievementId) {
  return supabase.from('user_achievements').insert({ user_id: userId, achievement_id: achievementId });
}

export async function getUserAchievements(userId) {
  return supabase.from('user_achievements').select('*, achievement:achievement_id(*)').eq('user_id', userId);
}

// Payment helpers
export async function createPayment(userId, matchId, amount, status) {
  return supabase.from('payments').insert({ user_id: userId, match_id: matchId, amount, status });
}

export async function getPaymentsForUser(userId) {
  return supabase.from('payments').select('*').eq('user_id', userId);
}

// Push notification helper
export async function sendPushNotification(expoPushToken, title, body) {
  return fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: expoPushToken,
      sound: 'default',
      title,
      body,
    }),
  });
}

// User stats helpers
export async function getUserMatches(userId) {
  // Get matches the user joined (via payments)
  const { data: payments } = await supabase.from('payments').select('match_id').eq('user_id', userId);
  const matchIds = payments?.map(p => p.match_id) || [];
  if (matchIds.length === 0) return [];
  const { data: matches } = await supabase.from('matches').select('*').in('id', matchIds);
  return matches || [];
}

export async function getUserWins(userId) {
  // Get matches where the user is the winner
  const { data: matches } = await supabase.from('matches').select('*').eq('winner', userId);
  return matches || [];
}

export async function getUserStats(userId, sport) {
  // Fetch all match history entries for this user
  let query = supabase
    .from('match_history')
    .select('*')
    .eq('user_id', userId);
  if (sport) {
    query = query.eq('sport', sport);
  }
  const { data: matchHistory, error } = await query;
  if (error) {
    return { matchesPlayed: 0, wins: 0, winrate: 0, bestSport: '-', rank: 0 };
  }
  const matchesPlayed = matchHistory.length;
  const winsCount = matchHistory.filter(m => m.result === 'win').length;
  const winrate = matchesPlayed > 0 ? Math.round((winsCount / matchesPlayed) * 100) : 0;

  // Fetch rank from user_sport_ranks
  let rank = 0;
  const { data: rankData } = await supabase
    .from('user_sport_ranks')
    .select('rank')
    .eq('user_id', userId)
    .eq('sport', sport)
    .single();
  if (rankData && rankData.rank) {
    rank = rankData.rank;
  }

  // Best sport: the sport with most wins (not relevant if filtering by sport, but keep for compatibility)
  const sportWins = {};
  for (const match of matchHistory) {
    if (match.result === 'win' && match.sport) {
      sportWins[match.sport] = (sportWins[match.sport] || 0) + 1;
    }
  }
  let bestSport = '-';
  let maxWins = 0;
  for (const s in sportWins) {
    if (sportWins[s] > maxWins) {
      bestSport = s;
      maxWins = sportWins[s];
    }
  }
  return { matchesPlayed, wins: winsCount, winrate, bestSport, rank };
}

export async function updateLastActive() {
  const user = (await supabase.auth.getUser()).data.user;
  if (user) {
    await supabase.from('profiles').update({ last_active: new Date().toISOString() }).eq('id', user.id);
  }
}

export async function createChat(participants, type = 'friend') {
  // Check if chat already exists
  const { data: existing, error: findError } = await supabase
    .from('chats')
    .select('*')
    .contains('participants', participants)
    .eq('type', type);
  if (findError) throw findError;
  if (existing && existing.length > 0) return { data: existing[0] };
  // Create new chat
  const { data, error } = await supabase
    .from('chats')
    .insert([{ participants, type }])
    .select()
    .single();
  if (error) throw error;
  return { data };
}

export async function declineFriendRequest(requestId) {
  return supabase.from('friend_requests').delete().eq('id', requestId);
}

export async function cancelFriendRequest(fromUserId, toUserId) {
  let request, fetchError;
  try {
    const res = await supabase
      .from('friend_requests')
      .select('*')
      .filter('from_user', 'eq', fromUserId)
      .filter('to_user', 'eq', toUserId)
      .maybeSingle();
    request = res.data;
    fetchError = res.error;
  } catch (e) {
    fetchError = e;
    request = null;
  }
  if (fetchError) {
    return { error: fetchError };
  }
  if (!request) {
    // As a last resort, fetch all and filter in JS
    const allRes = await supabase.from('friend_requests').select('*');
    const found = (allRes.data || []).find(r => r.from_user === fromUserId && r.to_user === toUserId);
    if (!found) {
      return { error: 'No request found' };
    }
    // Delete by id
    return supabase.from('friend_requests').delete().eq('id', found.id);
  }
  // Delete by id
  return supabase.from('friend_requests').delete().eq('id', request.id);
}

export async function getSportLeaderboard(sport) {
  const { data, error } = await supabase
    .from('user_sport_ranks')
    .select('user_id, rank')
    .eq('sport', sport)
    .order('rank', { ascending: false });
  if (error) {
    return [];
  }
  return data || [];
}

export async function getUserAverageRating(userId) {
  // Returns the average rating for a user
  const { data, error } = await supabase
    .from('user_ratings')
    .select('rating')
    .eq('rated_user_id', userId);
  if (error || !data) return 0;
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, r) => acc + (r.rating || 0), 0);
  return sum / data.length;
}

export async function awardAchievementPoints(userId, sport, achievementKey, points) {
  // Try to insert, ignore if already exists
  const { error } = await supabase.from('user_achievement_points').insert({
    user_id: userId,
    sport,
    achievement_key: achievementKey,
    points,
  }, { upsert: false });
  // If unique violation, ignore
  if (error && !error.message.includes('duplicate key')) {
  }
}

export async function getTotalAchievementPoints(userId, sport) {
  let query = supabase
    .from('user_achievement_points')
    .select('points')
    .eq('user_id', userId);
  if (sport) {
    query = query.eq('sport', sport);
  }
  const { data, error } = await query;
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (row.points || 0), 0);
}

export async function uploadAvatarAndUpdateProfile(userId, imageUri) {
  try {
    const ext = imageUri.split('.').pop();
    const fileName = `avatar.${ext}`;
    const filePath = `${userId}/${fileName}`; // user-specific folder
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
    const fileBuffer = decode(base64);
    const { data, error: uploadError } = await supabase.storage.from('avatars').upload(filePath, fileBuffer, {
      contentType: `image/${ext}`,
      upsert: true,
    });
    if (uploadError) return { error: uploadError };
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const url = urlData?.publicUrl;
    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
    if (updateError) return { error: updateError };
    return { url };
  } catch (e) {
    return { error: e };
  }
}

 