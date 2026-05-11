import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isGuest: boolean;
  loading: boolean;
  setAsGuest: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  isAdmin: false, 
  isGuest: false,
  loading: true,
  setAsGuest: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        setIsAdmin(user.email === "udaywelapure@gmail.com");
        setIsGuest(false); // Real login clears guest status
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setAsGuest = (val: boolean) => {
    setIsGuest(val);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isGuest, loading, setAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};
