import React, { createContext, useContext, useState, useEffect } from 'react';
import FirebaseService from '../services/firebaseService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const data = await FirebaseService.getCurrentUserData();
          setUserData(data);
        } catch (error) {
          console.error('Error loading user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password, employeeId, companyId) => {
    try {
      const result = await FirebaseService.signInUser({
        email,
        password,
        employeeId,
        companyId,
      });
      
      // User data will be loaded by the auth state listener
      return result;
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email, password, employeeId, companyId, homeLocation, officeLocation, distance) => {
    try {
      const result = await FirebaseService.createUserAccount({
        email,
        password,
        employeeId,
        companyId,
        homeLocation,
        officeLocation,
        distance,
      });
      
      // User data will be loaded by the auth state listener
      return result;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email, employeeId, companyId) => {
    try {
      await FirebaseService.resetPassword({
        email,
        employeeId,
        companyId,
      });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await FirebaseService.signOut();
      setCurrentUser(null);
      setUserData(null);
    } catch (error) {
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        console.log('Refreshing user data for user:', currentUser.uid);
        const data = await FirebaseService.getCurrentUserData();
        console.log('Refreshed user data:', data);
        setUserData(data);
        return data;
      } catch (error) {
        console.error('Error refreshing user data:', error);
        throw error;
      }
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    signIn,
    signUp,
    resetPassword,
    logout,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 