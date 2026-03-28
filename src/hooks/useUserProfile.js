// src/hooks/useUserProfile.js
import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase';
import { useAuth } from '../context/AuthContext';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userRef = ref(database, `users/${user.uid}`);
    
    // Set up real-time listener
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.val());
        setError(null);
      } else {
        setProfile(null);
        setError('User profile not found');
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to profile updates:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { profile, loading, error };
};