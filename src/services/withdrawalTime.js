// src/services/bankService.js
import { database } from '../../firebase';
import { ref, onValue } from 'firebase/database';

// Listen to withdrawal times in real-time
export const listenToWithdrawalTime = (callback) => {
  const banksRef = ref(database, 'withdrawalTimes');

  const unsubscribe = onValue(banksRef, (snapshot) => {
    if (snapshot.exists()) {
      const banks = Object.values(snapshot.val());
      callback({ success: true, data: banks });
    } else {
      callback({ success: true, data: [] });
    }
  }, (error) => {
    console.error('Error listening withdrawal times:', error);
    callback({ success: false, error: error.message });
  });

  return unsubscribe; // important for cleanup
};