import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import useAppStore from '../stores/appStore';
import supabaseApi from '../services/supabaseApi';

// Background image from Figma design
const imgClassy2 = "https://www.figma.com/api/mcp/asset/864fc063-72c9-47f0-8808-3a9da5a9f74b";
const imgBottomOverlay = "https://www.figma.com/api/mcp/asset/9ef18272-73f5-4770-a77e-24f1edc5d676";
const imgTopOverlay = "https://www.figma.com/api/mcp/asset/8c0124a0-fdeb-4dbc-a98b-b3b204b602ea";

function IdentityUpload() {
  const [uploading, setUploading] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const { setIdentityPhoto, setCurrentStep } = useAppStore();

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        console.log('Uploading file to Supabase:', file.name);

        // Upload to Supabase Storage
        const result = await supabaseApi.uploadIdentityPhoto(file);

        console.log('Upload successful:', result);

        setIdentityPhoto(result);
        setCurrentStep('edit-look');
      } catch (error) {
        console.error('Upload failed:', error);
        alert(`Upload failed: ${error.message}. Please try again.`);
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

  return (
    <View style={styles.container}>
      {/* Background Image from Figma design */}
      {Platform.OS === 'web' && (
        <>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            zIndex: 0,
          }}>
            <img
              src={imgClassy2}
              alt=""
              style={{
                position: 'absolute',
                top: '2px',
                left: '-156px',
                width: '565px',
                height: '848px',
                objectFit: 'cover',
                maxWidth: 'none',
              }}
            />
          </div>

          {/* Bottom Overlay */}
          <div style={{
            position: 'fixed',
            bottom: '-11px',
            left: '-7px',
            right: '-16px',
            height: '869px',
            zIndex: 1,
            pointerEvents: 'none',
          }}>
            <img
              src={imgBottomOverlay}
              alt=""
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                maxWidth: 'none',
              }}
            />
          </div>

          {/* Top Overlay */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '120px',
            zIndex: 1,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src={imgTopOverlay}
              alt=""
              style={{
                width: '393px',
                height: '120px',
                maxWidth: 'none',
                transform: 'scaleY(-1)',
              }}
            />
          </div>
        </>
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
        <View style={styles.topSection}>
          <Text style={styles.title}>Upload Photo</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreateWithImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {uploading ? 'UPLOADING...' : 'CREATE A PROFILE'}
            </Text>
          </TouchableOpacity>
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
    backgroundColor: '#000',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 180,
    paddingBottom: 80,
    zIndex: 2,
    ...Platform.select({
      web: {
        display: 'flex',
        minHeight: '100vh',
      },
    }),
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bottomSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0,
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Bebas Neue', 'Archivo Black', 'Anton', 'Impact', 'Arial Black', sans-serif",
      default: 'System',
    }),
    ...Platform.select({
      web: {
        WebkitFontSmoothing: 'antialiased',
        textShadow: '0px 3px 4px #d9d9d9',
      },
    }),
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    maxWidth: 247,
    ...Platform.select({
      web: {
        boxShadow: '0px 5px 12.3px 0px rgba(0,0,0,0.25)',
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12.3,
    elevation: 5,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Bebas Neue', 'Archivo Black', 'Anton', 'Impact', 'Arial Black', sans-serif",
      default: 'System',
    }),
    letterSpacing: -0.4,
    textTransform: 'uppercase',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Bebas Neue', 'Archivo Black', 'Anton', 'Impact', 'Arial Black', sans-serif",
      default: 'System',
    }),
  },
  modalButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Bebas Neue', 'Archivo Black', 'Anton', 'Impact', 'Arial Black', sans-serif",
      default: 'System',
    }),
  },
  modalCancelText: {
    color: '#999',
  },
});

export default IdentityUpload;
