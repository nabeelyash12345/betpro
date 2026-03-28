// src/services/orderService.js

import { ref, push, set, get, update, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { database } from '../../firebase';

// Create a new order
export const createOrder = async (userId, orderData) => {
  try {
    const ordersRef = ref(database, `orders/${userId}`);
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
      bpId:orderData.bpId,
      bpPassword:orderData.bpPassword,
      userName:orderData?.displayName ?? "",
      userEmail:orderData?.email ?? ""
    };
    
    await set(newOrderRef, order);
    console.log('Order created:', order.id);
    return { success: true, order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
};

// Get all orders for a user
export const getUserOrders = async (userId) => {
  try {
    const ordersRef = ref(database, `orders/${userId}`);
    const snapshot = await get(ordersRef);
    
    if (snapshot.exists()) {
      const orders = [];
      snapshot.forEach((childSnapshot) => {
        orders.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      // Sort by newest first
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting orders:', error);
    return { success: false, error: error.message };
  }
};

// Listen to real-time order updates
export const listenToUserOrders = (userId, callback) => {
  const ordersRef = ref(database, `orders/${userId}`);
  return onValue(ordersRef, (snapshot) => {
    if (snapshot.exists()) {
      const orders = [];
      snapshot.forEach((childSnapshot) => {
        orders.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback({ success: true, orders });
    } else {
      callback({ success: true, orders: [] });
    }
  }, (error) => {
    console.error('Error listening to orders:', error);
    callback({ success: false, error: error.message });
  });
};

// Update order status (admin only)
export const updateOrderStatus = async (userId, orderId, status, adminNotes = '') => {
  try {
    const orderRef = ref(database, `orders/${userId}/${orderId}`);
    await update(orderRef, {
      status: status,
      updatedAt: new Date().toISOString(),
      adminNotes: adminNotes,
      processedBy: 'admin'
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
};

// Get all orders for admin (across all users)
export const getAllOrders = async () => {
  try {
    const usersRef = ref(database, 'orders');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const allOrders = [];
      snapshot.forEach((userOrders) => {
        const userId = userOrders.key;
        userOrders.forEach((orderSnapshot) => {
          allOrders.push({
            id: orderSnapshot.key,
            userId: userId,
            ...orderSnapshot.val()
          });
        });
      });
      // Sort by newest first
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return { success: true, orders: allOrders };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('Error getting all orders:', error);
    return { success: false, error: error.message };
  }
};

// Listen to all orders for admin
export const listenToAllOrders = (callback) => {
  const ordersRef = ref(database, 'orders');
  return onValue(ordersRef, (snapshot) => {
    if (snapshot.exists()) {
      const allOrders = [];
      snapshot.forEach((userOrders) => {
        const userId = userOrders.key;
        userOrders.forEach((orderSnapshot) => {
          allOrders.push({
            id: orderSnapshot.key,
            userId: userId,
            ...orderSnapshot.val()
          });
        });
      });
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback({ success: true, orders: allOrders });
    } else {
      callback({ success: true, orders: [] });
    }
  }, (error) => {
    console.error('Error listening to all orders:', error);
    callback({ success: false, error: error.message });
  });
};

// Delete order (admin only)
export const deleteOrder = async (userId, orderId) => {
  try {
    const orderRef = ref(database, `orders/${userId}/${orderId}`);
    await remove(orderRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: error.message };
  }
};