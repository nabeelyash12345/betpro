// src/services/withdrawalService.js
//
// Handles WITHDRAWAL orders only. Stored under: withdrawals/{userId}/{orderId}
// Kept separate from deposits so admin reads/listens on one type
// never pull the other type's data — smaller trees, faster fetches.

import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue
} from 'firebase/database';
import { database } from '../../firebase';

const WITHDRAWALS_ROOT = 'withdrawals';

// Create a new withdrawal order
// IMPORTANT: orderData.screenshot must be a Firebase Storage URL (string),
// NOT a base64 data URL. Upload the image first with uploadScreenshot()
// (see Withdraw.js for the pattern) and pass the resulting URL in here.
export const createWithdrawal = async (userId, orderData) => {
  try {
    const withdrawalsRef = ref(database, `${WITHDRAWALS_ROOT}/${userId}`);
    const newOrderRef = push(withdrawalsRef);

    const order = {
      id: newOrderRef.key,
      userId: userId,
      orderNumber: `WD-${newOrderRef.key}`,
      type: orderData.type || 'BANK',
      amount: orderData.amount || 0,
      accountNumber: orderData.accountNumber,
      paymentMethod: orderData.paymentMethod,
      screenshot: orderData.screenshot || null, // Firebase Storage URL, NOT base64
      status: 'pending', // pending, approved, rejected, completed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: orderData.notes || '',
      isDeposit: false,
      bpId: orderData.bpId,
      bpPassword: orderData.bpPassword,
      userName: orderData?.userName ?? '',
      userEmail: orderData?.userEmail ?? '',
      screenshotAdmin: '',
      bankName: orderData?.bankName ?? '',
      isBankTransfer: orderData?.isBankTransfer || false
    };

    await set(newOrderRef, order);
    console.log('Withdrawal created:', order.id);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return { success: false, error: error.message };
  }
};

// Get withdrawals for a single user (most recent N only)
export const getUserWithdrawals = async (userId, pageSize = 50) => {
  try {
    const withdrawalsRef = ref(database, `${WITHDRAWALS_ROOT}/${userId}`);
    const withdrawalsQuery = query(withdrawalsRef, limitToLast(pageSize));
    const snapshot = await get(withdrawalsQuery);

    if (snapshot.exists()) {
      const withdrawals = [];
      snapshot.forEach((childSnapshot) => {
        withdrawals.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      withdrawals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: withdrawals };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting withdrawals:', error);
    return { success: false, error: error.message };
  }
};

// Realtime listener for a single user's withdrawals (capped)
export const listenToUserWithdrawals = (userId, callback, pageSize = 50) => {
  const withdrawalsRef = ref(database, `${WITHDRAWALS_ROOT}/${userId}`);
  const withdrawalsQuery = query(withdrawalsRef, limitToLast(pageSize));

  return onValue(
    withdrawalsQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        const withdrawals = [];
        snapshot.forEach((childSnapshot) => {
          withdrawals.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        withdrawals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        callback({ success: true, orders: withdrawals });
      } else {
        callback({ success: true, orders: [] });
      }
    },
    (error) => {
      console.error('Error listening to withdrawals:', error);
      callback({ success: false, error: error.message });
    }
  );
};

// Update withdrawal status (admin only)
export const updateWithdrawalStatus = async (userId, orderId, status, adminId, adminNotes = '') => {
  try {
    const orderRef = ref(database, `${WITHDRAWALS_ROOT}/${userId}/${orderId}`);
    await update(orderRef, {
      status: status,
      updatedAt: new Date().toISOString(),
      adminNotes: adminNotes,
      processedBy: adminId || 'unknown'
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return { success: false, error: error.message };
  }
};

// Filter a user's withdrawals by status using the indexed field (server-side, fast)
export const getUserWithdrawalsByStatus = async (userId, status, pageSize = 50) => {
  try {
    const withdrawalsRef = ref(database, `${WITHDRAWALS_ROOT}/${userId}`);
    const withdrawalsQuery = query(
      withdrawalsRef,
      orderByChild('status'),
      equalTo(status),
      limitToLast(pageSize)
    );
    const snapshot = await get(withdrawalsQuery);

    if (snapshot.exists()) {
      const withdrawals = [];
      snapshot.forEach((childSnapshot) => {
        withdrawals.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      withdrawals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: withdrawals };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting withdrawals by status:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// ADMIN-WIDE: across ALL users' withdrawals
// Same notes as depositService.js — see that file for the flat-node
// migration recommendation for large scale.
// ---------------------------------------------------------------------------

export const getAllWithdrawals = async (maxUsers = 100) => {
  try {
    const withdrawalsRef = ref(database, WITHDRAWALS_ROOT);
    const withdrawalsQuery = query(withdrawalsRef, limitToLast(maxUsers));
    const snapshot = await get(withdrawalsQuery);

    if (snapshot.exists()) {
      const all = [];
      snapshot.forEach((userWithdrawals) => {
        const userId = userWithdrawals.key;
        userWithdrawals.forEach((orderSnapshot) => {
          all.push({ id: orderSnapshot.key, userId, ...orderSnapshot.val() });
        });
      });
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: all };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting all withdrawals:', error);
    return { success: false, error: error.message };
  }
};

export const listenToAllWithdrawals = (callback, maxUsers = 100) => {
  const withdrawalsRef = ref(database, WITHDRAWALS_ROOT);
  const withdrawalsQuery = query(withdrawalsRef, limitToLast(maxUsers));

  return onValue(
    withdrawalsQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        const all = [];
        snapshot.forEach((userWithdrawals) => {
          const userId = userWithdrawals.key;
          userWithdrawals.forEach((orderSnapshot) => {
            all.push({ id: orderSnapshot.key, userId, ...orderSnapshot.val() });
          });
        });
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        callback({ success: true, orders: all });
      } else {
        callback({ success: true, orders: [] });
      }
    },
    (error) => {
      console.error('Error listening to all withdrawals:', error);
      callback({ success: false, error: error.message });
    }
  );
};

export const deleteWithdrawal = async (userId, orderId) => {
  try {
    const orderRef = ref(database, `${WITHDRAWALS_ROOT}/${userId}/${orderId}`);
    await remove(orderRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting withdrawal:', error);
    return { success: false, error: error.message };
  }
};