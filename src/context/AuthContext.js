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
import { ref, set, update, onValue } from 'firebase/database';
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
  const [profileNotFound, setProfileNotFound] = useState(false); // ✅ new

  useEffect(() => {
    let unsubscribeDb = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setProfileNotFound(false);
        const userRef = ref(database, `users/${firebaseUser.uid}`);

        unsubscribeDb = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            // ✅ Profile found
            setUserProfile(snapshot.val());
            setProfileNotFound(false);
          } else {
            // ✅ User in Auth but NOT in database (deleted account)
            setUserProfile(null);
            setProfileNotFound(true);
          }
          setLoading(false); // ✅ always stop loading
        }, (error) => {
          // ✅ Database read error — stop loading too
          console.error('Database read error:', error);
          setUserProfile(null);
          setProfileNotFound(true);
          setLoading(false);
        });

      } else {
        // No user logged in
        if (unsubscribeDb) unsubscribeDb();
        setUserProfile(null);
        setProfileNotFound(false);
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribeDb) unsubscribeDb();
      unsubscribeAuth();
    };
  }, []);

  // Register
  const register = async (name, email, password, phoneNumber) => {
    try {
      setError(null);
      if (!auth) throw new Error('Auth not initialized');

      console.log('Creating user with email:', email);

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        console.log('User created:', userCredential.user.uid);

        await updateProfile(userCredential.user, { displayName: name });

        const userRef = ref(database, `users/${userCredential.user.uid}`);
        await set(userRef, {
          email,
          displayName: name,
          bpUsername: '',
          bpPassword: '',
          isAccepted: false,
          isAdmin: false,
          phoneNumber: phoneNumber || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        console.log('Realtime Database profile created');

        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        console.log('Signed out after registration');
      }

      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      if (!auth) throw new Error('Auth not initialized');

      console.log('Logging in with email:', email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.uid);

      return { success: true, user: userCredential.user };
    } catch (err) {
      console.error('Login error:', err);

      let errorMessage = err.message;
      if (err.code === 'auth/user-not-found') errorMessage = 'No account found with this email';
      else if (err.code === 'auth/wrong-password') errorMessage = 'Incorrect password';
      else if (err.code === 'auth/invalid-email') errorMessage = 'Invalid email format';
      else if (err.code === 'auth/user-disabled') errorMessage = 'This account has been disabled';

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      if (!auth) throw new Error('Auth not initialized');

      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setProfileNotFound(false);
      console.log('Logout successful');
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Update user profile
  const updateUserProfile = async (userId, updateData) => {
    try {
      const userRef = ref(database, `users/${userId}`);
      const updates = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      await update(userRef, updates);
      if (user && user.uid === userId) {
        setUserProfile(prev => ({ ...prev, ...updates }));
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Refresh user profile
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
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      error,
      profileNotFound, // ✅ exposed so StackNavigation can use it
      register,
      login,
      logout,
      updateUserProfile,
      refreshUserProfile,
      isAuthenticated: !!user,
      isAdmin: userProfile?.isAdmin || false
    }}>
      {children}
    </AuthContext.Provider>
  );
};