import React, { createContext, useContext, useState } from 'react';

const ProfileRefreshContext = createContext();

export function ProfileRefreshProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <ProfileRefreshContext.Provider value={{ refreshKey, setRefreshKey }}>
      {children}
    </ProfileRefreshContext.Provider>
  );
}

export function useProfileRefresh() {
  return useContext(ProfileRefreshContext);
} 