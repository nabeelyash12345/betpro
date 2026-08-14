
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

const DEPOSITS_ROOT = 'deposits';
const DEPOSITS_FLAT_ROOT = 'depositsFlat';

// Fields kept in the flat index — enough for an admin list view.
// Keep this list small; every field here is duplicated storage + bandwidth.
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

    // Write full record + trimmed flat-index record in one atomic update.
    // (Two separate set() calls would risk one succeeding without the other.)
    const updates = {};
    updates[`${DEPOSITS_ROOT}/${userId}/${newOrderRef.key}`] = order;
    updates[`${DEPOSITS_FLAT_ROOT}/${newOrderRef.key}`] = toFlatRecord(order);

    await update(ref(database), updates);

    console.log('Deposit created:', order.id);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating deposit:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// Per-user reads (unchanged — these were already cheap: one small subtree)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Status update — keep flat index in sync too
// ---------------------------------------------------------------------------

export const updateDepositStatus = async (userId, orderId, status, adminId, adminNotes = '') => {
  try {
    const updatedAt = new Date().toISOString();
    const updates = {};
    updates[`${DEPOSITS_ROOT}/${userId}/${orderId}/status`] = status;
    updates[`${DEPOSITS_ROOT}/${userId}/${orderId}/updatedAt`] = updatedAt;
    updates[`${DEPOSITS_ROOT}/${userId}/${orderId}/adminNotes`] = adminNotes;
    updates[`${DEPOSITS_ROOT}/${userId}/${orderId}/processedBy`] = adminId || 'unknown';

    updates[`${DEPOSITS_FLAT_ROOT}/${orderId}/status`] = status;
    updates[`${DEPOSITS_FLAT_ROOT}/${orderId}/updatedAt`] = updatedAt;

    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating deposit:', error);
    return { success: false, error: error.message };
  }
};

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
// ADMIN-WIDE reads — now hit depositsFlat directly (server-side sort + limit,
// small records only). This is the main billing fix: previously this walked
// every user's full subtree; now it's one indexed query on one flat node.
//
// Full detail (bpPassword, screenshot, etc.) is fetched per-order on demand
// via getDepositDetail(), not bundled into every list load.
// ---------------------------------------------------------------------------

// Paginated, ordered by createdAt (requires `.indexOn: ["createdAt"]` in
// rules — see note at bottom of file). Pass the oldest `createdAt` from the
// previous page as `beforeCreatedAt` to fetch the next page.
export const getAllDeposits = async (pageSize = 50, beforeCreatedAt = null) => {
  try {
    const flatRef = ref(database, DEPOSITS_FLAT_ROOT);
    const constraints = [orderByChild('createdAt')];
    if (beforeCreatedAt) constraints.push(endBefore(beforeCreatedAt));
    constraints.push(limitToLast(pageSize));

    const depositsQuery = query(flatRef, ...constraints);
    const snapshot = await get(depositsQuery);

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
    console.error('Error getting all deposits:', error);
    return { success: false, error: error.message };
  }
};

// Fetch every page until exhausted — use only for exports/reports, not for
// screen rendering, since it still downloads the full flat dataset in that case.
export const getAllDepositsFull = async (pageSize = 200) => {
  try {
    let all = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const page = await getAllDeposits(pageSize, cursor);
      if (!page.success) return page;
      all = all.concat(page.orders);
      hasMore = page.hasMore;
      cursor = page.nextCursor;
    }

    return { success: true, orders: all };
  } catch (error) {
    console.error('Error getting all deposits (full):', error);
    return { success: false, error: error.message };
  }
};

// Realtime listener — now listens on the small flat index only (capped),
// so each change pushes a fraction of the bytes the old listener did.
export const listenToAllDeposits = (callback, pageSize = 50) => {
  const flatRef = ref(database, DEPOSITS_FLAT_ROOT);
  const depositsQuery = query(flatRef, orderByChild('createdAt'), limitToLast(pageSize));

  return onValue(
    depositsQuery,
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
      console.error('Error listening to all deposits:', error);
      callback({ success: false, error: error.message });
    }
  );
};

// Full record for one order (bpPassword, screenshot, notes, etc.) — call this
// when an admin opens a single order from the list, not for the list itself.
export const getDepositDetail = async (userId, orderId) => {
  try {
    const orderRef = ref(database, `${DEPOSITS_ROOT}/${userId}/${orderId}`);
    const snapshot = await get(orderRef);
    if (snapshot.exists()) {
      return { success: true, order: { id: orderId, ...snapshot.val() } };
    }
    return { success: false, error: 'Not found' };
  } catch (error) {
    console.error('Error getting deposit detail:', error);
    return { success: false, error: error.message };
  }
};

export const deleteDeposit = async (userId, orderId) => {
  try {
    const updates = {};
    updates[`${DEPOSITS_ROOT}/${userId}/${orderId}`] = null;
    updates[`${DEPOSITS_FLAT_ROOT}/${orderId}`] = null;
    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error deleting deposit:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// REQUIRED rules.json addition (put this in your RTDB security rules, else
// orderByChild('createdAt') / ('status') falls back to an unindexed full
// download and warns "Using an unspecified index" in the console — the
// exact cost problem this file fixes):
//
// {
//   "rules": {
//     "depositsFlat": {
//       ".indexOn": ["createdAt", "status", "userId"]
//     },
//     "deposits": {
//       "$userId": {
//         ".indexOn": ["status", "createdAt"]
//       }
//     }
//   }
// }
// ---------------------------------------------------------------------------