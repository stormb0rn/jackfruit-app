import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import useAppStore from '../stores/appStore';

function Feed() {
  const { posts, setCurrentStep } = useAppStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Feed</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setCurrentStep('profile')} style={styles.profileButton}>
              <Text style={styles.profileButtonText}>👤 Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCurrentStep('upload')} style={styles.createButton}>
              <Text style={styles.createButtonText}>+ Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Create your first transformation and share it</Text>
            <TouchableOpacity onPress={() => setCurrentStep('upload')} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.username}>{post.username}</Text>
                </View>
                <Image source={{ uri: post.photos[0].url }} style={styles.postImage} resizeMode="cover" />
                <View style={styles.postActions}>
                  <Text style={styles.actionText}>❤️ {post.likes || 0}</Text>
                  <Text style={styles.actionText}>💬 {post.comments || 0}</Text>
                </View>
                {post.caption && <Text style={styles.postCaption}>{post.caption}</Text>}
              </View>
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
  content: { maxWidth: 600, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a' },
  headerActions: { flexDirection: 'row', gap: 8 },
  profileButton: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 44, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, backgroundColor: 'white', justifyContent: 'center' },
  profileButtonText: { fontSize: 14, fontWeight: '600' },
  createButton: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 44, borderRadius: 12, backgroundColor: '#007bff', justifyContent: 'center' },
  createButtonText: { fontSize: 14, color: 'white', fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 80, backgroundColor: 'white', borderRadius: 12 },
  emptyIcon: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 24, textAlign: 'center' },
  emptyButton: { paddingVertical: 12, paddingHorizontal: 32, minHeight: 44, borderRadius: 12, backgroundColor: '#007bff' },
  emptyButtonText: { fontSize: 16, color: 'white', fontWeight: '600' },
  postsContainer: { gap: 24 },
  postCard: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden' },
  postHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  username: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  postImage: { width: '100%', height: 300, backgroundColor: '#000' },
  postActions: { flexDirection: 'row', gap: 16, padding: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  actionText: { fontSize: 14 },
  postCaption: { padding: 16, fontSize: 14, color: '#333', lineHeight: 21 },
});

export default Feed;
