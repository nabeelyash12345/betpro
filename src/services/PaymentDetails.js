// src/services/bankService.js
import { database } from '../../firebase';
import { ref, get } from 'firebase/database';

// Get all banks
export const getAllBanks = async () => {
  try {
    const banksRef = ref(database, 'banks');
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

// Get single bank by ID
export const getBankById = async (bankId) => {
  try {
    const bankRef = ref(database, `banks/${bankId}`);
    const snapshot = await get(bankRef);
    
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() };
    } else {
      return { success: false, error: 'Bank not found' };
    }
  } catch (error) {
    console.error('Error getting bank:', error);
    return { success: false, error: error.message };
  }
};

// Get banks by country
export const getBanksByCountry = async (country) => {
  try {
    const result = await getAllBanks();
    if (!result.success) return result;
    
    const filteredBanks = result.data.filter(bank => 
      bank.country?.toLowerCase() === country.toLowerCase()
    );
    
    return { success: true, data: filteredBanks };
  } catch (error) {
    console.error('Error filtering banks by country:', error);
    return { success: false, error: error.message };
  }
};

// Search banks by name
export const searchBanks = async (searchTerm) => {
  try {
    const result = await getAllBanks();
    if (!result.success) return result;
    
    const searchedBanks = result.data.filter(bank => 
      bank.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { success: true, data: searchedBanks };
  } catch (error) {
    console.error('Error searching banks:', error);
    return { success: false, error: error.message };
  }
};