// src/components/AdminImageDisplay.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function AdminImageDisplay({ imageData, label = "Screenshot" }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!imageData) {
    return null;
  }

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity 
          style={styles.imagePreviewContainer}
          onPress={() => setModalVisible(true)}
        >
          {!imageError ? (
            <Image 
              source={{ uri: imageData }} 
              style={styles.imagePreview}
              resizeMode="cover"
              onError={handleImageError}
            />
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="image-outline" size={40} color="#EF4444" />
              <Text style={styles.errorText}>Failed to load image</Text>
            </View>
          )}
          <View style={styles.overlay}>
            <Ionicons name="eye-outline" size={24} color="white" />
            <Text style={styles.viewText}>Tap to view full size</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Full Screen Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          {!imageError && (
            <Image 
              source={{ uri: imageData }} 
              style={styles.modalImage}
              resizeMode="contain"
              onError={handleImageError}
            />
          )}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  viewText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
});