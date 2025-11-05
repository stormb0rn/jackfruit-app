import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import useAppStore from '../stores/appStore';
import { api } from '../services/api';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { identityPhoto, selectedTransformation, setSelectedTemplate, addGeneratedPhoto, setCurrentStep } = useAppStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template) => {
    if (!identityPhoto || !selectedTransformation) {
      alert('Please complete previous steps first');
      return;
    }

    setGenerating(true);
    try {
      setSelectedTemplate(template.id);
      const result = await api.generateTransformation(identityPhoto.id, selectedTransformation, template.id);
      addGeneratedPhoto(result);
      setCurrentStep('create-post');
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate transformation. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentStep('edit-look')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select a Style Template</Text>
          <Text style={styles.subtitle}>
            Choose from 5 different aesthetic styles to apply to your transformation
          </Text>
        </View>

        {selectedTransformation && (
          <View style={styles.transformInfo}>
            <Text style={styles.transformText}>
              Transformation: <Text style={styles.transformBold}>{selectedTransformation.replace('-', ' ').toUpperCase()}</Text>
            </Text>
          </View>
        )}

        <View style={styles.templatesGrid}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              onPress={() => handleSelectTemplate(template)}
              disabled={generating}
              style={[styles.templateCard, generating && styles.templateCardDisabled]}
              activeOpacity={0.7}
            >
              <Image source={{ uri: template.thumbnail }} style={styles.thumbnailImage} resizeMode="cover" />
              <View style={styles.templateInfo}>
                <Text style={styles.templateId}>{template.id}</Text>
                <Text style={styles.templateName}>{template.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {generating && (
          <View style={styles.generatingOverlay}>
            <View style={styles.generatingBox}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.generatingText}>Generating your transformation...</Text>
              <Text style={styles.generatingSubtext}>This may take a few moments</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { padding: 20, paddingBottom: 40 },
  content: { maxWidth: 1000, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'white', marginBottom: 20 },
  backButtonText: { fontSize: 14, color: '#333', fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center' },
  transformInfo: { padding: 16, backgroundColor: '#e8f5e9', borderRadius: 8, marginBottom: 32, alignItems: 'center' },
  transformText: { fontSize: 14, color: '#2e7d32' },
  transformBold: { fontWeight: 'bold' },
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  templateCard: { backgroundColor: 'white', borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 12, overflow: 'hidden', minWidth: 150, flex: 1, flexBasis: '30%' },
  templateCardDisabled: { opacity: 0.6 },
  thumbnailImage: { width: '100%', height: 150, backgroundColor: '#f5f5f5' },
  templateInfo: { padding: 16, alignItems: 'center' },
  templateId: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  templateName: { fontSize: 14, color: '#888' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loadingText: { marginTop: 16, fontSize: 18, color: '#666' },
  generatingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  generatingBox: { backgroundColor: 'white', padding: 40, borderRadius: 12, alignItems: 'center', maxWidth: 400 },
  generatingText: { marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  generatingSubtext: { marginTop: 8, fontSize: 14, color: '#888', textAlign: 'center' },
});

export default Templates;
