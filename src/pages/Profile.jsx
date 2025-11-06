import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/appStore';

function Profile() {
  const navigate = useNavigate();
  const { posts, currentUser, identityPhoto } = useAppStore();
  const userPosts = posts.filter(post => post.userId === currentUser.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('/feed')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back to Feed</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {identityPhoto?.url ? (
              <Image source={{ uri: identityPhoto.url }} style={styles.profileAvatar} resizeMode="cover" />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>👤</Text>
              </View>
            )}
          </View>

          <Text style={styles.profileUsername}>{currentUser.username}</Text>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigate('/upload')} style={styles.editProfileButton}>
            <Text style={styles.editProfileButtonText}>Create New Post</Text>
          </TouchableOpacity>
        </View>

        {userPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📸</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Start creating transformations</Text>
            <TouchableOpacity onPress={() => navigate('/upload')} style={styles.createButton}>
              <Text style={styles.createButtonText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.postsGrid}>
            {userPosts.map((post) => (
              <TouchableOpacity key={post.id} style={styles.gridItem}>
                <Image source={{ uri: post.photos[0].url }} style={styles.gridImage} resizeMode="cover" />
                {post.photos.length > 1 && (
                  <View style={styles.multiPhotoIndicator}>
                    <Text style={styles.multiPhotoText}>📱 {post.photos.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  content: { maxWidth: 900, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 24 },
  backButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'white', alignSelf: 'flex-start' },
  backButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 16 },
  profileSection: { alignItems: 'center', padding: 24, backgroundColor: 'white', borderRadius: 12, marginBottom: 24 },
  avatarContainer: { marginBottom: 16 },
  profileAvatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#e0e0e0' },
  profileAvatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#e0e0e0' },
  avatarPlaceholderText: { fontSize: 64 },
  profileUsername: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  stats: { flexDirection: 'row', gap: 40, marginBottom: 24 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 14, color: '#888', marginTop: 4 },
  editProfileButton: { paddingVertical: 12, paddingHorizontal: 24, minHeight: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, backgroundColor: 'white' },
  editProfileButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 80, backgroundColor: 'white', borderRadius: 12 },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 24 },
  createButton: { paddingVertical: 12, paddingHorizontal: 32, minHeight: 44, borderRadius: 12, backgroundColor: '#007bff' },
  createButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  gridItem: { width: '32%', aspectRatio: 1, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  multiPhotoIndicator: { position: 'absolute', top: 8, right: 8, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12 },
  multiPhotoText: { fontSize: 12, color: 'white' },
});

export default Profile;
