import React, { createContext, useContext, useState, useEffect } from "react";

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "sales" | "appraiser" | "estimator" | "marketing" | "repair_tech" | "system_admin";
  openId: string;
}

interface DemoContextType {
  isDemoMode: boolean;
  demoUser: DemoUser | null;
  setDemoMode: (enabled: boolean, user?: DemoUser) => void;
  toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_ADMIN: DemoUser = {
  id: "demo-admin-001",
  name: "Admin Demo",
  email: "admin@hail-solutions.com",
  role: "admin",
  openId: "demo-admin-openid",
};

const DEMO_SALES: DemoUser = {
  id: "demo-sales-001",
  name: "Sales Agent",
  email: "sales@hail-solutions.com",
  role: "sales",
  openId: "demo-sales-openid",
};

const DEMO_APPRAISER: DemoUser = {
  id: "demo-appraiser-001",
  name: "Appraiser",
  email: "appraiser@hail-solutions.com",
  role: "appraiser",
  openId: "demo-appraiser-openid",
};

export const DEMO_USERS = {
  admin: DEMO_ADMIN,
  sales: DEMO_SALES,
  appraiser: DEMO_APPRAISER,
};

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  // Check localStorage for demo mode on mount
  useEffect(() => {
    const savedDemoMode = localStorage.getItem("demo_mode");
    const savedDemoUser = localStorage.getItem("demo_user");
    
    if (savedDemoMode === "true" && savedDemoUser) {
      try {
        const user = JSON.parse(savedDemoUser);
        setIsDemoMode(true);
        setDemoUser(user);
      } catch (e) {
        console.error("Failed to load demo user from localStorage");
      }
    }
  }, []);

  const handleSetDemoMode = (enabled: boolean, user?: DemoUser) => {
    if (enabled) {
      const demoUserToUse = user || DEMO_ADMIN;
      setIsDemoMode(true);
      setDemoUser(demoUserToUse);
      localStorage.setItem("demo_mode", "true");
      localStorage.setItem("demo_user", JSON.stringify(demoUserToUse));
      
      // Set a fake auth cookie so the app thinks we're logged in
      document.cookie = `demo_auth=${demoUserToUse.openId}; path=/; max-age=86400`;
    } else {
      setIsDemoMode(false);
      setDemoUser(null);
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("demo_user");
      document.cookie = "demo_auth=; path=/; max-age=0";
    }
  };

  const toggleDemoMode = () => {
    if (isDemoMode) {
      handleSetDemoMode(false);
    } else {
      handleSetDemoMode(true, DEMO_ADMIN);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoUser,
        setDemoMode: handleSetDemoMode,
        toggleDemoMode,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within DemoProvider");
  }
  return context;
}
