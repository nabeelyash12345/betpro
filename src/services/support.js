// src/services/bankService.js
import { database } from '../../firebase';
import { ref, get } from 'firebase/database';

// Get all banks
export const getSupportNumber = async () => {
  try {
    const banksRef = ref(database, 'support');
    const snapshot = await get(banksRef);
    
    if (snapshot.exists()) {
      const banks = Object.values(snapshot.val());
      return { success: true, data: banks };
    } else {
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error('Error getting banks:', error);
    return { success: false, error: error.message };
  }
};
