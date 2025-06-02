import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_BUCKET_NAME,
} from '../lib/supabase';

export default function LibraryScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [libraryItems, setLibraryItems] = useState([]);

  // 📥 Fetch previously uploaded PDFs from Supabase
  useEffect(() => {
    const fetchLibraryItems = async () => {
        try {
          const res = await fetch(`${SUPABASE_URL}/rest/v1/documents?select=*`, {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          });
      
          if (!res.ok) {
            throw new Error('Failed to fetch documents');
          }
      
          const data = await res.json();
      
          const formatted = data.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.type || 'PDF',
            uri: item.url,
          }));
      
          setLibraryItems(formatted);
        } catch (err) {
          console.error('❌ Error loading documents:', err);
        }
      };
      

    fetchLibraryItems();
  }, []);

  // 📤 Upload PDF file + save to Supabase
  const handleUploadPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      const { name, uri } = file;
      const fileExt = name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      try {
        const fileResponse = await fetch(uri);
        const blob = await fileResponse.blob();

        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET_NAME}/${fileName}`;
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/pdf',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'x-upsert': 'true',
          },
          body: blob,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('❌ Upload failed:', errorText);
          alert('Upload failed: ' + errorText);
          return;
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${fileName}`;

        // Save metadata in Supabase DB
        const docResponse = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              apikey: SUPABASE_ANON_KEY,
              Prefer: 'return=representation',
            },
            body: JSON.stringify({ title: name, url: publicUrl, type: 'PDF' }),
          });
          

        if (!docResponse.ok) {
          const docError = await docResponse.text();
          console.error('❌ Metadata save failed:', docError);
          alert('Failed to save document info.');
          return;
        }

        const savedDoc = await docResponse.json();
        const newItem = {
          id: savedDoc[0].id,
          title: savedDoc[0].title,
          type: savedDoc[0].type,
          uri: savedDoc[0].url,
        };

        setLibraryItems((prev) => [...prev, newItem]);
        setModalVisible(false);
        alert('✅ PDF uploaded and saved!');
      } catch (err) {
        console.error('⚠️ Upload error:', err);
        alert('Upload error: ' + err.message);
      }
    }
  };

  // ➕ Add a link (stored only locally for now)
  const handleUploadLink = () => {
    if (linkInput.trim() !== '') {
      const newItem = {
        id: Date.now().toString(),
        title: linkInput,
        type: 'Link',
        uri: linkInput,
      };
      setLibraryItems((prev) => [...prev, newItem]);
      setLinkInput('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>My Library</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.plus}>
          <Text style={styles.plusText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Library List */}
      <FlatList
        data={libraryItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemType}>{item.type}</Text>
          </View>
        )}
      />

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Library</Text>

            <TouchableOpacity style={styles.actionBtn} onPress={handleUploadPDF}>
              <Text style={styles.actionText}>Upload PDF from device</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Paste a webpage link"
              placeholderTextColor="#666"
              value={linkInput}
              onChangeText={setLinkInput}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.actionBtn} onPress={handleUploadLink}>
              <Text style={styles.actionText}>Upload Link</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  plus: {
    padding: 4,
  },
  plusText: {
    fontSize: 32,
    color: '#0A84FF',
    fontWeight: '400',
  },
  item: {
    paddingVertical: 14,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  itemTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  itemType: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#111',
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 10,
    fontSize: 16,
  },
  actionBtn: {
    paddingVertical: 14,
  },
  actionText: {
    color: '#0A84FF',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelBtn: {
    paddingVertical: 16,
  },
  cancelText: {
    color: '#ff5f57',
    fontSize: 16,
    textAlign: 'center',
  },
});
