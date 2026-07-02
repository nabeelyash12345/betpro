// src/services/depositService.js
//
// Handles DEPOSIT orders only. Stored under: deposits/{userId}/{orderId}
// Kept separate from withdrawals so admin reads/listens on one type
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

const DEPOSITS_ROOT = 'deposits';

// Create a new deposit order
export const createDeposit = async (userId, orderData) => {
  try {
    const depositsRef = ref(database, `${DEPOSITS_ROOT}/${userId}`);
    const newOrderRef = push(depositsRef);

    const order = {
      id: newOrderRef.key,
      userId: userId,
      orderNumber: `DEP-${newOrderRef.key}`,
      type: orderData.type || 'BANK',
      amount: orderData.amount || 0,
      accountNumber: orderData.accountNumber,
      paymentMethod: orderData.paymentMethod,
      screenshot: orderData.screenshot || null, // Firebase Storage URL, NOT base64
      status: 'pending', // pending, approved, rejected, completed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: orderData.notes || '',
      isDeposit: true,
      bpId: orderData.bpId,
      bpPassword: orderData.bpPassword,
      userName: orderData?.userName ?? '',
      userEmail: orderData?.userEmail ?? '',
      screenshotAdmin: '',
      bankName: orderData?.bankName ?? '',
      isBankTransfer: orderData?.isBankTransfer || false
    };

    await set(newOrderRef, order);
    console.log('Deposit created:', order.id);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating deposit:', error);
    return { success: false, error: error.message };
  }
};

// Get deposits for a single user (most recent N only)
export const getUserDeposits = async (userId, pageSize = 50) => {
  try {
    const depositsRef = ref(database, `${DEPOSITS_ROOT}/${userId}`);
    const depositsQuery = query(depositsRef, limitToLast(pageSize));
    const snapshot = await get(depositsQuery);

    if (snapshot.exists()) {
      const deposits = [];
      snapshot.forEach((childSnapshot) => {
        deposits.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      deposits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: deposits };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting deposits:', error);
    return { success: false, error: error.message };
  }
};

// Realtime listener for a single user's deposits (capped)
export const listenToUserDeposits = (userId, callback, pageSize = 50) => {
  const depositsRef = ref(database, `${DEPOSITS_ROOT}/${userId}`);
  const depositsQuery = query(depositsRef, limitToLast(pageSize));

  return onValue(
    depositsQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        const deposits = [];
        snapshot.forEach((childSnapshot) => {
          deposits.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        deposits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        callback({ success: true, orders: deposits });
      } else {
        callback({ success: true, orders: [] });
      }
    },
    (error) => {
      console.error('Error listening to deposits:', error);
      callback({ success: false, error: error.message });
    }
  );
};

// Update deposit status (admin only)
export const updateDepositStatus = async (userId, orderId, status, adminId, adminNotes = '') => {
  try {
    const orderRef = ref(database, `${DEPOSITS_ROOT}/${userId}/${orderId}`);
    await update(orderRef, {
      status: status,
      updatedAt: new Date().toISOString(),
      adminNotes: adminNotes,
      processedBy: adminId || 'unknown'
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating deposit:', error);
    return { success: false, error: error.message };
  }
};

// Filter a user's deposits by status using the indexed field (server-side, fast)
export const getUserDepositsByStatus = async (userId, status, pageSize = 50) => {
  try {
    const depositsRef = ref(database, `${DEPOSITS_ROOT}/${userId}`);
    const depositsQuery = query(
      depositsRef,
      orderByChild('status'),
      equalTo(status),
      limitToLast(pageSize)
    );
    const snapshot = await get(depositsQuery);

    if (snapshot.exists()) {
      const deposits = [];
      snapshot.forEach((childSnapshot) => {
        deposits.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      deposits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: deposits };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting deposits by status:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// ADMIN-WIDE: across ALL users' deposits
//
// Same nested-tree limitation as before applies here, but the tree is now
// HALF the size (deposits only, no withdrawals mixed in) — and once
// screenshots are Storage URLs instead of base64 blobs, each record is a
// few hundred bytes instead of 1-3MB. That difference alone should remove
// almost all of the bandwidth cost.
//
// For true scale (thousands of users), migrate to a flat `depositsFlat/{id}`
// node written alongside `deposits/{userId}/{id}` on create, so admin can
// query it directly without descending into every user's subtree.
// ---------------------------------------------------------------------------

export const getAllDeposits = async (maxUsers = 100) => {
  try {
    const depositsRef = ref(database, DEPOSITS_ROOT);
    const depositsQuery = query(depositsRef, limitToLast(maxUsers));
    const snapshot = await get(depositsQuery);

    if (snapshot.exists()) {
      const all = [];
      snapshot.forEach((userDeposits) => {
        const userId = userDeposits.key;
        userDeposits.forEach((orderSnapshot) => {
          all.push({ id: orderSnapshot.key, userId, ...orderSnapshot.val() });
        });
      });
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: all };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting all deposits:', error);
    return { success: false, error: error.message };
  }
};

export const listenToAllDeposits = (callback, maxUsers = 100) => {
  const depositsRef = ref(database, DEPOSITS_ROOT);
  const depositsQuery = query(depositsRef, limitToLast(maxUsers));

  return onValue(
    depositsQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        const all = [];
        snapshot.forEach((userDeposits) => {
          const userId = userDeposits.key;
          userDeposits.forEach((orderSnapshot) => {
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
      console.error('Error listening to all deposits:', error);
      callback({ success: false, error: error.message });
    }
  );
};

export const deleteDeposit = async (userId, orderId) => {
  try {
    const orderRef = ref(database, `${DEPOSITS_ROOT}/${userId}/${orderId}`);
    await remove(orderRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting deposit:', error);
    return { success: false, error: error.message };
  }
};