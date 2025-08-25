import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [allSportData, setAllSportData] = useState({});
  const [friends, setFriends] = useState([]);
  const [allRanks, setAllRanks] = useState([]);

  const [loading, setLoading] = useState(true);

  // Allow preloading all profile data at once
  const setPreloadedProfile = ({ profile, allSportData, friends, allRanks }) => {
    setUserProfile(profile || null);
    setAllSportData(allSportData || {});
    setFriends(friends || []);
    setAllRanks(allRanks || []);
    setLoading(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setUserProfile(null);
        setAllSportData({});
        setFriends([]);
        setAllRanks([]);

        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profile || null);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  return (
    <UserProfileContext.Provider value={{ userProfile, setUserProfile, allSportData, setAllSportData, friends, setFriends, allRanks, setAllRanks, loading, setPreloadedProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
} 