// src/services/Uploadscreenshot.js
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a screenshot to Firebase Storage and returns the download URL.
 * Uses fetch().blob() on the local file URI — this is the React Native
 * compatible way to create a Blob. Converting base64 -> Uint8Array manually
 * does NOT work reliably in RN (Hermes/JSC) and causes
 * "Blobs from ArrayBuffer/ArrayBufferView are not supported" errors.
 *
 * @param {string} uri - local file URI from ImagePicker (result.assets[0].uri)
 * @param {string} userId - the user's UID (used to organize storage path)
 * @param {string} type - "deposit" or "withdrawal"
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export const uploadScreenshot = async (uri, userId, type = "deposit") => {
  try {
    const storage = getStorage();

    // ✅ This is the RN-safe way to build a Blob — fetch the local file
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = `screenshots/${userId}/${type}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    const metadata = { contentType: "image/jpeg" };

    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob, metadata);

    // Get the public download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error("Screenshot upload failed:", error);
    return { success: false, error: error.message };
  }
};