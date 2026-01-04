import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserPreferences {
  theme?: "light" | "dark" | "auto";
  language?: string;
  notifications?: boolean;
  emailNotifications?: boolean;
  timezone?: string;
  dateFormat?: string;
  defaultView?: string;
}

interface ProfileContextType {
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  language: "en",
  notifications: true,
  emailNotifications: true,
  timezone: "America/Denver",
  dateFormat: "MM/DD/YYYY",
  defaultView: "dashboard",
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("user_preferences");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load user preferences");
      }
    }
  }, []);

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...prefs };
    setPreferences(updated);
    localStorage.setItem("user_preferences", JSON.stringify(updated));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem("user_preferences");
  };

  return (
    <ProfileContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
