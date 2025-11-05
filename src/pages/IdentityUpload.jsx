import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import useAppStore from '../stores/appStore';
import { api } from '../services/api';

function IdentityUpload() {
  const [uploading, setUploading] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const { setIdentityPhoto, setCurrentStep } = useAppStore();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const response = await fetch(reader.result);
          const blob = await response.blob();
          const uploadFile = new File([blob], 'identity.jpg', { type: 'image/jpeg' });

          const result = await api.uploadIdentityPhoto(uploadFile);
          setIdentityPhoto(result);
          setCurrentStep('edit-look');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleCreateWithImage = () => {
    // Show modal to choose camera or album
    setShowImageSourceModal(true);
  };

  const handleTakePhoto = () => {
    setShowImageSourceModal(false);
    document.getElementById('cameraInput').click();
  };

  const handleChooseFromAlbum = () => {
    setShowImageSourceModal(false);
    document.getElementById('albumInput').click();
  };

  const handleCreateAvatar = () => {
    // For now, just go to edit-look step
    // In future, this could be a different flow
    setCurrentStep('edit-look');
  };

  return (
    <View style={styles.container}>
      {/* Background Image */}
      {Platform.OS === 'web' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: 'url(/holographic-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 0,
        }} />
      )}

      {/* Hidden file inputs */}
      <input
        id="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, zIndex: -1 }}
      />
      <input
        id="albumInput"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, zIndex: -1 }}
      />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.centerWrapper}>
          <Text style={styles.title}>WELCOME TO JACKFRUIT</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleCreateWithImage}
              disabled={uploading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {uploading ? 'Uploading...' : 'Create with Image'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleCreateAvatar}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Create an Avatar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Image Source Modal */}
      {showImageSourceModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>📷 Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChooseFromAlbum}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>🖼️ Choose from Album</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowImageSourceModal(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalButtonText, styles.modalCancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#d8e3f0', // Fallback color
    width: '100%',
    height: '100%',
  },
  fileInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
    ...Platform.select({
      web: {
        display: 'flex',
        minHeight: '100vh',
      },
    }),
  },
  centerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 500,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginBottom: 60,
    letterSpacing: 1,
    // Bold display font from Google Fonts
    fontFamily: Platform.select({
      web: "'Bebas Neue', 'Archivo Black', 'Anton', 'Impact', 'Arial Black', sans-serif",
      default: 'System',
    }),
    textTransform: 'uppercase',
    ...Platform.select({
      web: {
        WebkitFontSmoothing: 'antialiased',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  button: {
    backgroundColor: '#FFF4D6',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    maxWidth: 320,
    // Subtle shadow
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    // Space Mono font
    fontFamily: Platform.select({
      web: "'Space Mono', monospace",
      default: 'Courier',
    }),
    letterSpacing: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#FFF4D6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    fontFamily: Platform.select({
      web: "'Space Mono', monospace",
      default: 'Courier',
    }),
  },
  modalCancelText: {
    color: '#666',
  },
});

export default IdentityUpload;
