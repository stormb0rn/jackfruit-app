import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import transformationConfig from '../config/transformation_prompts.json';

function ConfigAdmin() {
  const [config, setConfig] = useState(transformationConfig);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', prompt_modifier: '' });

  const openModal = (type, id = null) => {
    setCurrentType(type);
    setEditingId(id);

    if (id) {
      const item = config[type][id];
      setFormData({
        id: item.id,
        name: item.name,
        prompt_modifier: item.prompt_modifier
      });
    } else {
      setFormData({ id: '', name: '', prompt_modifier: '' });
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormData({ id: '', name: '', prompt_modifier: '' });
    setEditingId(null);
  };

  const saveItem = () => {
    const newConfig = { ...config };

    if (editingId && editingId !== formData.id) {
      delete newConfig[currentType][editingId];
    }

    newConfig[currentType][formData.id] = {
      id: formData.id,
      name: formData.name,
      prompt_modifier: formData.prompt_modifier
    };

    setConfig(newConfig);
    closeModal();
  };

  const deleteItem = (type, id) => {
    const newConfig = { ...config };
    delete newConfig[type][id];
    setConfig(newConfig);
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    console.log('Export config:', dataStr);
    alert('Configuration exported to console. In production, this would download a file.');
  };

  const renderSection = (type, title) => {
    const items = config[type] || {};

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openModal(type)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsGrid}>
          {Object.entries(items).map(([key, item]) => (
            <View key={key} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() => openModal(type, key)}
                    style={styles.iconButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.iconText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (confirm('Are you sure you want to delete this item?')) {
                        deleteItem(type, key);
                      }
                    }}
                    style={styles.iconButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.iconText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemId}>{item.id}</Text>
              <Text style={styles.itemPrompt}>{item.prompt_modifier}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Character Configuration</Text>
          <Text style={styles.subtitle}>Manage prompt configurations for character generation</Text>
        </View>

        {renderSection('looking', 'Looking')}
        {renderSection('visual_style', 'Visual Style')}

        <View style={styles.exportSection}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportConfig}
            activeOpacity={0.7}
          >
            <Text style={styles.exportButtonText}>Export Configuration</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Item' : 'Add New Item'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>ID</Text>
              <TextInput
                style={styles.input}
                value={formData.id}
                onChangeText={(text) => setFormData({ ...formData, id: text })}
                placeholder="e.g., better_looking"
                editable={!editingId}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Better-Looking"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Prompt Modifier</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.prompt_modifier}
                onChangeText={(text) => setFormData({ ...formData, prompt_modifier: text })}
                placeholder="e.g., better-looking, enhanced features, more attractive"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={closeModal}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={saveItem}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 21,
    color: '#6e6e73',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 32,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  addButton: {
    backgroundColor: '#0071e3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 980,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    flex: 1,
    flexBasis: '30%',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  iconText: {
    fontSize: 16,
  },
  itemId: {
    fontSize: 13,
    color: '#6e6e73',
    marginBottom: 8,
  },
  itemPrompt: {
    fontSize: 14,
    color: '#1d1d1f',
    lineHeight: 21,
  },
  exportSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  exportButton: {
    backgroundColor: '#1d1d1f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 980,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 32,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    color: '#1d1d1f',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6e6e73',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    borderRadius: 8,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  secondaryButton: {
    backgroundColor: '#e8e8ed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 980,
  },
  secondaryButtonText: {
    color: '#1d1d1f',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ConfigAdmin;
