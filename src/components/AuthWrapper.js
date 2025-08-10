import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

const AuthWrapper = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Initializing..." />;
  }

  return currentUser ? <HomeScreen /> : <LoginScreen />;
};

export default AuthWrapper; 