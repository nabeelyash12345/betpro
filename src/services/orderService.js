// src/services/orderService.js
//
//   orders/{userId}/{orderId}   -> primary record (per-user reads)
//   ordersFlat/{orderId}        -> lightweight index for admin-wide reads,
//                                  written alongside the primary record
//
// WHY THE FLAT INDEX EXISTS (billing):
// The original getAllOrders()/listenToAllOrders() had NO limit at all — they
// downloaded every order under every user, every time, and the listener
// re-downloaded that whole tree on any single change. Cost scales with total
// data forever, not with what's shown on screen. ordersFlat lets Firebase
// filter/order/limit SERVER-SIDE on one small indexed node instead.
//
// ordersFlat entries are trimmed (no bpPassword, no screenshot) — just
// enough for an admin list/table. Fetch the full record from
// orders/{userId}/{orderId} only when an admin opens one order.

import {
  ref,
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  endBefore,
  onValue,
  remove
} from 'firebase/database';
import { database } from '../../firebase';

const ORDERS_ROOT = 'orders';
const ORDERS_FLAT_ROOT = 'ordersFlat';

// Fields kept in the flat index — enough for an admin list view.
const toFlatRecord = (order) => ({
  id: order.id,
  userId: order.userId,
  orderNumber: order.orderNumber,
  type: order.type,
  amount: order.amount,
  status: order.status,
  isDeposit: order.isDeposit,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  userName: order.userName,
  paymentMethod: order.paymentMethod
});

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createOrder = async (userId, orderData) => {
  try {
    const ordersRef = ref(database, `${ORDERS_ROOT}/${userId}`);
    const newOrderRef = push(ordersRef);

    const order = {
      id: newOrderRef.key,
      userId: userId,
      orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: orderData.type || 'BANK',
      amount: orderData.amount || 0,
      accountNumber: orderData.accountNumber,
      paymentMethod: orderData.paymentMethod,
      screenshot: orderData.screenshot || null,
      status: 'pending', // pending, approved, rejected, completed
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: orderData.notes || '',
      isDeposit: orderData.isDeposit || false,
      bpId: orderData.bpId,
      bpPassword: orderData.bpPassword,
      userName: orderData?.userName ?? '',
      userEmail: orderData?.userEmail ?? '',
      screenshotAdmin: '',
      bankName: orderData?.bankName ?? '',
      isBankTransfer: orderData?.isBankTransfer || false
    };

    // Write full record + trimmed flat-index record atomically.
    const updates = {};
    updates[`${ORDERS_ROOT}/${userId}/${newOrderRef.key}`] = order;
    updates[`${ORDERS_FLAT_ROOT}/${newOrderRef.key}`] = toFlatRecord(order);

    await update(ref(database), updates);

    console.log('Order created:', order.id);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// Per-user reads
// NOTE: these still had no limitToLast in the original — added a capped
// pageSize here too, same reasoning as deposits: an unbounded user with
// thousands of orders would otherwise download everything every load.
// ---------------------------------------------------------------------------

export const getUserOrders = async (userId, pageSize = 50) => {
  try {
    const ordersRef = ref(database, `${ORDERS_ROOT}/${userId}`);
    const ordersQuery = query(ordersRef, limitToLast(pageSize));
    const snapshot = await get(ordersQuery);

    if (snapshot.exists()) {
      const orders = [];
      snapshot.forEach((childSnapshot) => {
        orders.push({ id: childSnapshot.key, ...childSnapshot.val() });
      });
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting orders:', error);
    return { success: false, error: error.message };
  }
};

export const listenToUserOrders = (userId, callback, pageSize = 50) => {
  const ordersRef = ref(database, `${ORDERS_ROOT}/${userId}`);
  const ordersQuery = query(ordersRef, limitToLast(pageSize));

  return onValue(
    ordersQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        const orders = [];
        snapshot.forEach((childSnapshot) => {
          orders.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        callback({ success: true, orders });
      } else {
        callback({ success: true, orders: [] });
      }
    },
    (error) => {
      console.error('Error listening to orders:', error);
      callback({ success: false, error: error.message });
    }
  );
};

// ---------------------------------------------------------------------------
// Status update — keep flat index in sync too
// ---------------------------------------------------------------------------

export const updateOrderStatus = async (userId, orderId, status, adminNotes = '') => {
  try {
    const updatedAt = new Date().toISOString();
    const updates = {};
    updates[`${ORDERS_ROOT}/${userId}/${orderId}/status`] = status;
    updates[`${ORDERS_ROOT}/${userId}/${orderId}/updatedAt`] = updatedAt;
    updates[`${ORDERS_ROOT}/${userId}/${orderId}/adminNotes`] = adminNotes;
    updates[`${ORDERS_ROOT}/${userId}/${orderId}/processedBy`] = 'admin';

    updates[`${ORDERS_FLAT_ROOT}/${orderId}/status`] = status;
    updates[`${ORDERS_FLAT_ROOT}/${orderId}/updatedAt`] = updatedAt;

    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// ADMIN-WIDE reads — now hit ordersFlat directly (server-side sort + limit,
// small records only) instead of walking every user's full subtree.
// ---------------------------------------------------------------------------

// Paginated, ordered by createdAt (requires `.indexOn: ["createdAt"]` in
// rules — see note at bottom). Pass the previous page's `nextCursor` as
// `beforeCreatedAt` to fetch the next page.
export const getAllOrders = async (pageSize = 50, beforeCreatedAt = null) => {
  try {
    const flatRef = ref(database, ORDERS_FLAT_ROOT);
    const constraints = [orderByChild('createdAt')];
    if (beforeCreatedAt) constraints.push(endBefore(beforeCreatedAt));
    constraints.push(limitToLast(pageSize));

    const ordersQuery = query(flatRef, ...constraints);
    const snapshot = await get(ordersQuery);

    if (snapshot.exists()) {
      const allOrders = [];
      snapshot.forEach((orderSnapshot) => {
        allOrders.push(orderSnapshot.val());
      });
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const oldestCreatedAt = allOrders.length ? allOrders[allOrders.length - 1].createdAt : null;
      return {
        success: true,
        orders: allOrders,
        nextCursor: oldestCreatedAt,
        hasMore: allOrders.length === pageSize
      };
    }
    return { success: true, orders: [], nextCursor: null, hasMore: false };
  } catch (error) {
    console.error('Error getting all orders:', error);
    return { success: false, error: error.message };
  }
};

// Fetch every page until exhausted — use only for exports/reports, not for
// screen rendering (still downloads the full flat dataset in that case).
export const getAllOrdersFull = async (pageSize = 200) => {
  try {
    let all = [];
    let cursor = null;
    let hasMore = true;

    while (hasMore) {
      const page = await getAllOrders(pageSize, cursor);
      if (!page.success) return page;
      all = all.concat(page.orders);
      hasMore = page.hasMore;
      cursor = page.nextCursor;
    }

    return { success: true, orders: all };
  } catch (error) {
    console.error('Error getting all orders (full):', error);
    return { success: false, error: error.message };
  }
};

// Filter across all users by status, using the flat index (server-side).
export const getAllOrdersByStatus = async (status, pageSize = 50) => {
  try {
    const flatRef = ref(database, ORDERS_FLAT_ROOT);
    const ordersQuery = query(flatRef, orderByChild('status'), equalTo(status), limitToLast(pageSize));
    const snapshot = await get(ordersQuery);

    if (snapshot.exists()) {
      const allOrders = [];
      snapshot.forEach((orderSnapshot) => {
        allOrders.push(orderSnapshot.val());
      });
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: allOrders };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting orders by status:', error);
    return { success: false, error: error.message };
  }
};

// Realtime listener — now listens on the small flat index only (capped),
// so each change pushes a fraction of the bytes the old unbounded listener did.
export const listenToAllOrders = (callback, pageSize = 50) => {
  const flatRef = ref(database, ORDERS_FLAT_ROOT);
  const ordersQuery = query(flatRef, orderByChild('createdAt'), limitToLast(pageSize));

  return onValue(
    ordersQuery,
    (snapshot) => {
      if (snapshot.exists()) {
        const allOrders = [];
        snapshot.forEach((orderSnapshot) => {
          allOrders.push(orderSnapshot.val());
        });
        allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        callback({ success: true, orders: allOrders });
      } else {
        callback({ success: true, orders: [] });
      }
    },
    (error) => {
      console.error('Error listening to all orders:', error);
      callback({ success: false, error: error.message });
    }
  );
};

// Full record for one order (bpPassword, screenshot, notes, etc.) — call
// this when an admin opens a single order, not for the list itself.
export const getOrderDetail = async (userId, orderId) => {
  try {
    const orderRef = ref(database, `${ORDERS_ROOT}/${userId}/${orderId}`);
    const snapshot = await get(orderRef);
    if (snapshot.exists()) {
      return { success: true, order: { id: orderId, ...snapshot.val() } };
    }
    return { success: false, error: 'Not found' };
  } catch (error) {
    console.error('Error getting order detail:', error);
    return { success: false, error: error.message };
  }
};

// Delete order (admin only)
export const deleteOrder = async (userId, orderId) => {
  try {
    const updates = {};
    updates[`${ORDERS_ROOT}/${userId}/${orderId}`] = null;
    updates[`${ORDERS_FLAT_ROOT}/${orderId}`] = null;
    await update(ref(database), updates);
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: error.message };
  }
};

// ---------------------------------------------------------------------------
// REQUIRED rules.json addition — without this, orderByChild('createdAt') /
// ('status') falls back to an unindexed full download (defeats the purpose):
//
// {
//   "rules": {
//     "ordersFlat": {
//       ".indexOn": ["createdAt", "status", "userId"]
//     },
//     "orders": {
//       "$userId": {
//         ".indexOn": ["status", "createdAt"]
//       }
//     }
//   }
// }
// ---------------------------------------------------------------------------