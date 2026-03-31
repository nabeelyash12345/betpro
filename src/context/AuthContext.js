// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, database } from '../../firebase';
import { ref, set, get, update, onValue } from 'firebase/database';
import { getUserProfile } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  let unsubscribeDb = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    setUser(user);

    if (user) {
      const userRef = ref(database, `users/${user.uid}`);

      unsubscribeDb = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.val());
        }
        setLoading(false);
      });
    } else {
      setUserProfile(null);
      setLoading(false);
    }
  });

  return () => {
    if (unsubscribeDb) unsubscribeDb();
    unsubscribeAuth();
  };
}, []);
 

  // Register function - creates account and Realtime Database profile
  const register = async (name, email, password,phoneNumber) => {
    try {
      setError(null);
      if (!auth) {
        throw new Error('Auth not initialized');
      }
      
      console.log('Creating user with email:', email);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password,);
      
      if (userCredential.user) {
        console.log('User created:', userCredential.user.uid);
        
        // Update profile with name in Auth
        await updateProfile(userCredential.user, {
          displayName: name
        });
        
        // Create Realtime Database user profile with default values
        const userRef = ref(database, `users/${userCredential.user.uid}`);
        const userProfileData = {
          email: email,
          displayName: name,
          bpUsername: '', // Empty string initially
          bpPassword: '', // Empty string initially
          isAccepted: false, // Boolean false initially
          isAdmin: false, // Boolean false initially - only you can manually set this in DB
          phoneNumber: phoneNumber || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await set(userRef, userProfileData);
        console.log('Realtime Database profile created');
        
        // Sign out to prevent auto-login
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        console.log('Signed out after registration');
      }
      
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Login function - manually logs in the user
  const login = async (email, password) => {
    try {
      setError(null);
      if (!auth) {
        throw new Error('Auth not initialized');
      }
      
      console.log('Logging in with email:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.uid);
      
      return { success: true, user: userCredential.user };
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // Provide user-friendly error messages
      let errorMessage = err.message;
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setError(null);
      if (!auth) {
        throw new Error('Auth not initialized');
      }
      
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      console.log('Logout successful');
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Optional: Update user profile function
  const updateUserProfile = async (userId, updateData) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      const updates = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      await update(userRef, updates);
      // Update local state
      if (user && user.uid === userId) {
        setUserProfile(prev => ({ ...prev, ...updates }));
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

// Add this refresh function
  const refreshUserProfile = async () => {
    if (!user) {
      console.log('No user logged in');
      return { success: false, error: 'No user logged in' };
    }
    
    const result = await getUserProfile(user.uid);
    if (result.success) {
      setUserProfile(result.data);
      return { success: true, data: result.data };
    } else {
      console.error('Failed to refresh profile:', result.error);
      return { success: false, error: result.error };
    }
  }
  

  const value = {
    user,
    userProfile,
    loading,
    error,
    register,
    login,
    logout,
    updateUserProfile, // Add this if needed
    refreshUserProfile,
    isAuthenticated: !!user,
    isAdmin: userProfile?.isAdmin || false // Helper to check if user is admin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};