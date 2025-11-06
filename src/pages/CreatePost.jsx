import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/appStore';
import supabaseApi from '../services/supabaseApi';

function CreatePost() {
  const [caption, setCaption] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();
  const { generatedPhotos, identityPhoto, currentUser, addPost } = useAppStore();

  const availablePhotos = [
    ...(identityPhoto ? [{ ...identityPhoto, type: 'identity' }] : []),
    ...generatedPhotos
  ];

  const togglePhotoSelection = (photo) => {
    setSelectedPhotos(prev => {
      const isSelected = prev.find(p => p.id === photo.id);
      if (isSelected) return prev.filter(p => p.id !== photo.id);
      return [...prev, photo];
    });
  };

  const handleCreatePost = async () => {
    if (selectedPhotos.length === 0) {
      alert('Please select at least one photo');
      return;
    }
    setPosting(true);
    try {
      console.log('Creating post with:', {
        photos: selectedPhotos.length,
        caption: caption
      });

      // For now, just store locally until user authentication is implemented
      // TODO: Call supabaseApi.createPost when auth is ready
      const newPost = {
        id: `post-${Date.now()}`,
        userId: currentUser?.id || 'anonymous',
        username: currentUser?.username || 'Anonymous User',
        userAvatar: identityPhoto?.url,
        photos: selectedPhotos,
        caption: caption,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: []
      };

      addPost(newPost);
      setSelectedPhotos([]);
      setCaption('');
      navigate('/feed');

      console.log('Post created successfully');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert(`Failed to create post: ${error.message}. Please try again.`);
    } finally {
      setPosting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/templates')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Your Post</Text>
          <Text style={styles.subtitle}>Select photos and add a caption</Text>
        </View>

        <View style={styles.postPreview}>
          <Text style={styles.previewTitle}>Selected: {selectedPhotos.length} photo(s)</Text>
          {selectedPhotos.length > 0 && (
            <Image source={{ uri: selectedPhotos[0].url }} style={styles.previewImage} resizeMode="cover" />
          )}
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption..."
            multiline
          />
        </View>

        <Text style={styles.sectionTitle}>Select Photos ({selectedPhotos.length})</Text>
        <View style={styles.photosGrid}>
          {availablePhotos.map((photo) => {
            const isSelected = selectedPhotos.find(p => p.id === photo.id);
            return (
              <TouchableOpacity
                key={photo.id}
                onPress={() => togglePhotoSelection(photo)}
                style={[styles.photoCard, isSelected && styles.photoCardSelected]}
              >
                <Image source={{ uri: photo.url }} style={styles.photoImage} resizeMode="cover" />
                {isSelected && <View style={styles.checkmark}><Text style={styles.checkmarkText}>✓</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleCreatePost} disabled={posting || selectedPhotos.length === 0} style={[styles.postButton, (posting || selectedPhotos.length === 0) && styles.postButtonDisabled]}>
            <Text style={styles.postButtonText}>{posting ? 'Posting...' : 'Post to Feed'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  content: { maxWidth: 900, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'white', marginBottom: 20 },
  backButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  postPreview: { backgroundColor: 'white', borderRadius: 12, marginBottom: 40, padding: 16 },
  previewTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  previewImage: { width: '100%', height: 250, borderRadius: 12, marginBottom: 12 },
  captionInput: { padding: 12, fontSize: 14, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, minHeight: 80 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 40 },
  photoCard: { width: '30%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: '#e0e0e0' },
  photoCardSelected: { borderColor: '#007bff' },
  photoImage: { width: '100%', height: '100%' },
  checkmark: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, backgroundColor: '#007bff', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  checkmarkText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  actions: { alignItems: 'center' },
  postButton: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 44, minWidth: 120, borderRadius: 12, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center' },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
});

export default CreatePost;
