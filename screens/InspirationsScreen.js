import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = 'https://beads-mvp-backend-production.up.railway.app';

export default function InspirationsScreen() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch profiles from backend
  const fetchProfiles = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/profiles`);
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfiles();
  };

  const handleCreateProfile = () => {
    // TODO: Navigate to create profile screen
    console.log('Create profile tapped');
  };

  const handleProfileTap = (profile) => {
    // TODO: Navigate to profile detail
    console.log('Profile tapped:', profile.name);
  };

  const renderProfile = ({ item }) => (
    <TouchableOpacity 
      style={styles.profileCard}
      onPress={() => handleProfileTap(item)}
      activeOpacity={0.9}
    >
      {/* Hero Image */}
      <Image 
        source={{ 
          uri: item.hero_image_url || 'https://via.placeholder.com/400x200/111/666?text=No+Image' 
        }}
        style={styles.heroImage}
        resizeMode="cover"
      />
      
      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.profileName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Ionicons name="star" size={18} color="#FFD700" />
            </View>
          )}
        </View>
        
        {item.is_default && (
          <View style={styles.defaultLabelContainer}>
            <Text style={styles.defaultLabel}>DEFAULT</Text>
          </View>
        )}
        
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <Text style={styles.profileStats}>
          {item.source_count || 0} sources · {item.bead_count || 0} beads
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={styles.loadingText}>Loading profiles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inspirations</Text>
        <TouchableOpacity onPress={handleCreateProfile} style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color="#0A84FF" />
        </TouchableOpacity>
      </View>

      {/* Profile List */}
      <FlatList
        data={profiles}
        renderItem={renderProfile}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0A84FF"
            colors={['#0A84FF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="musical-notes-outline" size={64} color="#444" />
            </View>
            <Text style={styles.emptyText}>No inspiration profiles</Text>
            <Text style={styles.emptySubtext}>
              Create your first profile to customize how beads sound
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateProfile}
            >
              <Ionicons name="add" size={20} color="#fff" style={styles.createButtonIcon} />
              <Text style={styles.createButtonText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  addButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  heroImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#1a1a1a',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  defaultBadge: {
    marginLeft: 8,
  },
  defaultLabelContainer: {
    marginBottom: 8,
  },
  defaultLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  profileStats: {
    fontSize: 13,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#222',
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});