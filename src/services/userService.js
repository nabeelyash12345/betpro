// src/services/userService.js
import { database } from '../config/firebase';
import { ref, update, get } from 'firebase/database';

// Update bpUsername and bpPassword
export const updateBPCredentials = async (userId, bpUsername, bpPassword) => {
  try {
    console.log('Updating BP credentials for user:', userId);
    const userRef = ref(database, `users/${userId}`);
    
    const updates = {
      bpUsername: bpUsername || '',
      bpPassword: bpPassword || '',
      updatedAt: new Date().toISOString()
    };
    
    await update(userRef, updates);
    console.log('BP credentials updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating BP credentials:', error);
    return { success: false, error: error.message };
  }
};

// Update isAccepted status
export const updateAcceptanceStatus = async (userId, isAccepted) => {
  try {
    console.log('Updating acceptance status for user:', userId);
    const userRef = ref(database, `users/${userId}`);
    
    const updates = {
      isAccepted: isAccepted,
      updatedAt: new Date().toISOString()
    };
    
    await update(userRef, updates);
    console.log('Acceptance status updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating acceptance status:', error);
    return { success: false, error: error.message };
  }
};

// Update phone number
export const updatePhoneNumber = async (userId, phoneNumber) => {
  try {
    console.log('Updating phone number for user:', userId);
    const userRef = ref(database, `users/${userId}`);
    
    const updates = {
      phoneNumber: phoneNumber || '',
      updatedAt: new Date().toISOString()
    };
    
    await update(userRef, updates);
    console.log('Phone number updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating phone number:', error);
    return { success: false, error: error.message };
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};