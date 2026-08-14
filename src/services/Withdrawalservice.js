// src/services/withdrawalService.js
//
// Handles WITHDRAWAL orders only.
//   withdrawals/{userId}/{orderId}   -> primary record (per-user reads)
//   withdrawalsFlat/{orderId}        -> lightweight index for admin-wide
//                                       reads, written alongside the
//                                       primary record
//
// WHY THE FLAT INDEX EXISTS (billing):
// getAllWithdrawals/listenToAllWithdrawals used limitToLast(maxUsers) on the
// top-level withdrawals/ node — that limits USERS, not orders, so every
// matched user's FULL subtree (every withdrawal, every field including
// bpPassword/screenshot) still gets downloaded. withdrawalsFlat lets
// Firebase filter/order/limit ORDERS server-side on one small indexed node.
//
// withdrawalsFlat entries are trimmed — just enough for an admin list/table.
// Fetch the full record from withdrawals/{userId}/{orderId} only when an
// admin opens one order.

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
  endBefore,
  onValue
} from 'firebase/database';
import { database } from '../../firebase';

const WITHDRAWALS_ROOT = 'withdrawals';
const WITHDRAWALS_FLAT_ROOT = 'withdrawalsFlat';

// Fields kept in the flat index — enough for an admin list view.
const toFlatRecord = (order) => ({
  id: order.id,
  userId: order.userId,
  orderNumber: order.orderNumber,
  type: order.type,
  amount: order.amount,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  userName: order.userName,
  paymentMethod: order.paymentMethod
});

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

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

    // Write full record + trimmed flat-index record in one atomic update.
    const updates = {};
    updates[`${WITHDRAWALS_ROOT}/${userId}/${newOrderRef.key}`] = order;
    updates[`${WITHDRAWALS_FLAT_ROOT}/${newOrderRef.key}`] = toFlatRecord(order);

    await update(ref(database), updates);

    console.log('Withdrawal created:', order.id);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// Per-user reads (unchanged — already cheap: one small subtree)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Status update — keep flat index in sync too
// ---------------------------------------------------------------------------

export const updateWithdrawalStatus = async (userId, orderId, status, adminId, adminNotes = '') => {
  try {
    const updatedAt = new Date().toISOString();
    const updates = {};
    updates[`${WITHDRAWALS_ROOT}/${userId}/${orderId}/status`] = status;
    updates[`${WITHDRAWALS_ROOT}/${userId}/${orderId}/updatedAt`] = updatedAt;
    updates[`${WITHDRAWALS_ROOT}/${userId}/${orderId}/adminNotes`] = adminNotes;
    updates[`${WITHDRAWALS_ROOT}/${userId}/${orderId}/processedBy`] = adminId || 'unknown';

    updates[`${WITHDRAWALS_FLAT_ROOT}/${orderId}/status`] = status;
    updates[`${WITHDRAWALS_FLAT_ROOT}/${orderId}/updatedAt`] = updatedAt;

    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating withdrawal:', error);
    return { success: false, error: error.message };
  }
};

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
// ADMIN-WIDE reads — now hit withdrawalsFlat directly (server-side sort +
// limit, small records only) instead of walking every matched user's full
// subtree.
// ---------------------------------------------------------------------------

// Paginated, ordered by createdAt (requires `.indexOn: ["createdAt"]` in
// rules — see note at bottom). Pass the previous page's `nextCursor` as
// `beforeCreatedAt` to fetch the next page.
export const getAllWithdrawals = async (pageSize = 50, beforeCreatedAt = null) => {
  try {
    const flatRef = ref(database, WITHDRAWALS_FLAT_ROOT);
    const constraints = [orderByChild('createdAt')];
    if (beforeCreatedAt) constraints.push(endBefore(beforeCreatedAt));
    constraints.push(limitToLast(pageSize));

    const withdrawalsQuery = query(flatRef, ...constraints);
    const snapshot = await get(withdrawalsQuery);

    if (snapshot.exists()) {
      const all = [];
      snapshot.forEach((orderSnapshot) => {
        all.push(orderSnapshot.val());
      });
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const oldestCreatedAt = all.length ? all[all.length - 1].createdAt : null;
      return { success: true, orders: all, nextCursor: oldestCreatedAt, hasMore: all.length === pageSize };
    }
    return { success: true, orders: [], nextCursor: null, hasMore: false };
  } catch (error) {
    console.error('Error getting all withdrawals:', error);
    return { success: false, error: error.message };
  }
};

// Fetch every page until exhausted — use only for exports/reports, not for
// screen rendering (still downloads the full flat dataset in that case).
export const getAllWithdrawalsFull = async (pageSize = 200) => {
  try {
    let all = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const page = await getAllWithdrawals(pageSize, cursor);
      if (!page.success) return page;
      all = all.concat(page.orders);
      hasMore = page.hasMore;
      cursor = page.nextCursor;
    }

    return { success: true, orders: all };
  } catch (error) {
    console.error('Error getting all withdrawals (full):', error);
    return { success: false, error: error.message };
  }
};

// Filter across all users by status, using the flat index (server-side).
export const getAllWithdrawalsByStatus = async (status, pageSize = 50) => {
  try {
    const flatRef = ref(database, WITHDRAWALS_FLAT_ROOT);
    const withdrawalsQuery = query(flatRef, orderByChild('status'), equalTo(status), limitToLast(pageSize));
    const snapshot = await get(withdrawalsQuery);

    if (snapshot.exists()) {
      const all = [];
      snapshot.forEach((orderSnapshot) => {
        all.push(orderSnapshot.val());
      });
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: all };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting withdrawals by status (all users):', error);
    return { success: false, error: error.message };
  }
};

// Realtime listener — now listens on the small flat index only (capped),
// so each change pushes a fraction of the bytes the old listener did.
export const listenToAllWithdrawals = (callback, pageSize = 50) => {
  const flatRef = ref(database, WITHDRAWALS_FLAT_ROOT);
  const withdrawalsQuery = query(flatRef, orderByChild('createdAt'), limitToLast(pageSize));

  return onValue(
    withdrawalsQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        const all = [];
        snapshot.forEach((orderSnapshot) => {
          all.push(orderSnapshot.val());
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

// Full record for one order (bpPassword, screenshot, notes, etc.) — call
// this when an admin opens a single order, not for the list itself.
export const getWithdrawalDetail = async (userId, orderId) => {
  try {
    const orderRef = ref(database, `${WITHDRAWALS_ROOT}/${userId}/${orderId}`);
    const snapshot = await get(orderRef);
    if (snapshot.exists()) {
      return { success: true, order: { id: orderId, ...snapshot.val() } };
    }
    return { success: false, error: 'Not found' };
  } catch (error) {
    console.error('Error getting withdrawal detail:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWithdrawal = async (userId, orderId) => {
  try {
    const updates = {};
    updates[`${WITHDRAWALS_ROOT}/${userId}/${orderId}`] = null;
    updates[`${WITHDRAWALS_FLAT_ROOT}/${orderId}`] = null;
    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error deleting withdrawal:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// REQUIRED rules.json addition (put this in your RTDB security rules, else
// orderByChild('createdAt') / ('status') falls back to an unindexed full
// download — the exact cost problem this file fixes):
//
// {
//   "rules": {
//     "withdrawalsFlat": {
//       ".indexOn": ["createdAt", "status", "userId"]
//     },
//     "withdrawals": {
//       "$userId": {
//         ".indexOn": ["status", "createdAt"]
//       }
//     }
//   }
// }
// ---------------------------------------------------------------------------