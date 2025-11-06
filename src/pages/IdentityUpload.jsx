import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/appStore';
import supabaseApi from '../services/supabaseApi';
import { LiquidGlassChevronButton, LiquidGlassTextButton } from '../components/LiquidGlass';

// Images from Figma design
const imgTopOverlay = "https://www.figma.com/api/mcp/asset/cef63ab8-e64f-41b9-ba02-70007facee6b";
const imgCameraButton = "https://www.figma.com/api/mcp/asset/3ad97cd2-1921-4c60-a29a-15ba3d50f340";
const imgChevronIcon = "https://www.figma.com/api/mcp/asset/0b7542bc-543c-4925-a593-aaf56807d4ca";

function IdentityUpload() {
  const [uploading, setUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { setIdentityPhoto, identityPhoto } = useAppStore();

  // Initialize camera on component mount
  useEffect(() => {
    startCamera();
    return () => {
      // Cleanup: stop camera when component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage({ blob, url: imageUrl });
      }
    }, 'image/jpeg', 0.95);
  };

  const handleUpload = async () => {
    if (!capturedImage) {
      alert('Please take a photo first');
      return;
    }

    setUploading(true);
    try {
      // Convert blob to File
      const file = new File([capturedImage.blob], 'selfie.jpg', { type: 'image/jpeg' });

      console.log('Uploading file to Supabase:', file.name);
      const result = await supabaseApi.uploadIdentityPhoto(file);
      console.log('Upload successful:', result);

      setIdentityPhoto(result);
      navigate('/edit-look');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Revoke the object URL to free memory
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Overlay */}
      <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'web' ? 120 : 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          <img
            src={imgTopOverlay}
            alt=""
            style={{
              width: '100%',
              height: Platform.OS === 'web' ? 120 : 80,
              maxWidth: 'none',
              transform: 'scaleY(-1)',
            }}
          />
        </div>

      {/* Hidden canvas for capturing photos */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigate('/landing')}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>TAKE A SELFIE</Text>

      {/* Camera Preview / Captured Image Container */}
      <View style={styles.cameraContainer}>
        {capturedImage ? (
          // Show captured image
          <Image
            source={{ uri: capturedImage.url }}
            style={styles.capturedImage}
            resizeMode="cover"
          />
        ) : (
          // Show live camera feed
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror only
            }}
          />
        )}

        {!isCameraReady && !capturedImage && (
          <View style={styles.cameraLoading}>
            <Text style={styles.cameraLoadingText}>📸</Text>
            <Text style={styles.cameraLoadingSubtext}>Starting camera...</Text>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Retake Button (shown when image is captured) - Liquid Glass Style */}
        {capturedImage && (
          <LiquidGlassTextButton
            onClick={handleRetake}
            variant="dark"
          >
            Retake
          </LiquidGlassTextButton>
        )}

        {/* Thumbnail - Previous Photo */}
        {!capturedImage && (
          <View style={styles.thumbnail}>
            {identityPhoto?.url ? (
              <Image
                source={{ uri: identityPhoto.url }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailEmpty} />
            )}
          </View>
        )}

        {/* Camera Button (Take Photo) */}
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={capturedImage ? handleUpload : handleTakePhoto}
          disabled={uploading || (!isCameraReady && !capturedImage)}
          activeOpacity={0.8}
        >
          {!uploading && (
            capturedImage ? (
              <View style={styles.uploadButtonContent}>
                <Text style={styles.uploadButtonText}>Upload</Text>
              </View>
            ) : (
              <div style={{
                width: 73,
                height: 73,
                borderRadius: '50%',
                border: '4px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                position: 'relative',
              }}>
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                }} />
              </div>
            )
          )}
          {uploading && <Text style={styles.uploadingText}>...</Text>}
        </TouchableOpacity>

        {/* Next Button (placeholder for alignment when no image captured) */}
        {!capturedImage && (
          <View style={styles.nextButtonPlaceholder} />
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(194, 190, 255, 0.76)',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  title: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 79 : 55,
    left: 0,
    right: 0,
    fontSize: Platform.OS === 'web' ? 17 : 16,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    letterSpacing: -0.4,
    textTransform: 'uppercase',
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Bebas Neue', 'Archivo Black', sans-serif",
      default: 'System',
    }),
    zIndex: 2,
  },
  cameraContainer: {
    position: 'absolute',
    top: 122 + 100,
    left: '50%',
    width: 353,
    height: 560,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    zIndex: 1,
    ...Platform.select({
      web: {
        transform: 'translateX(-50%)',
      },
      default: {
        marginLeft: -353 / 2, // React Native centering
      },
    }),
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  cameraLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: '#1a1a1a',
  },
  cameraLoadingText: {
    fontSize: 64,
  },
  cameraLoadingSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: Platform.select({
      web: "'SF Pro', -apple-system, sans-serif",
      default: 'System',
    }),
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 35,
    zIndex: 10,
  },
  thumbnail: {
    width: 73,
    height: 71,
    borderRadius: 19,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#666',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  retakeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      },
    }),
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    fontFamily: Platform.select({
      web: "'SF Pro', -apple-system, sans-serif",
      default: 'System',
    }),
  },
  cameraButton: {
    width: 73,
    height: 73,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonContent: {
    width: 73,
    height: 73,
    borderRadius: 999,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0px 5px 12px rgba(0,0,0,0.3)',
      },
    }),
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
    textTransform: 'uppercase',
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Bebas Neue', sans-serif",
      default: 'System',
    }),
  },
  uploadingText: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
  nextButtonPlaceholder: {
    width: 40,
    height: 40,
  },
});

export default IdentityUpload;
