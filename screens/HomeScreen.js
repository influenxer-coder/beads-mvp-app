import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const BACKEND_URL = 'https://beads-mvp-backend-production.up.railway.app';
const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const [beads, setBeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [playingAudio, setPlayingAudio] = useState(null);
  const [currentSound, setCurrentSound] = useState(null);
  const [playingBeadId, setPlayingBeadId] = useState(null);

  // Configure audio mode
  useEffect(() => {
    configureAudio();
    return () => {
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, []);

  const configureAudio = async () => {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  };

  // Fetch feed from backend
  const fetchFeed = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/feed`);
      const data = await response.json();
      
      if (data.feed) {
        setBeads(data.feed);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const playAudio = async (audioUrl, beadId) => {
  try {
    // Add null check
    if (!audioUrl) {
      console.log('No audio URL for this bead');
      return;
    }

    // If already playing this bead, pause it
    if (playingBeadId === beadId && currentSound) {
      await currentSound.pauseAsync();
      setPlayingBeadId(null);
      return;
    }

    // Stop any currently playing audio
    if (currentSound) {
      await currentSound.unloadAsync();
    }

    // Load and play new audio
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: true }
    );

    setCurrentSound(sound);
    setPlayingBeadId(beadId);

    // Handle playback status
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        setPlayingBeadId(null);
      }
    });

  } catch (error) {
    console.error('Error playing audio:', error);
  }
};

  const renderBead = ({ item }) => {
    const isExpanded = expandedCards.has(item.id);
    const isPlaying = playingBeadId === item.id;
    const hasAudio = item.audio_url !== null;
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => toggleCard(item.id)}
        activeOpacity={0.9}
      >
        {/* Header with author and progress */}
        <View style={styles.cardHeader}>
          <View style={styles.authorContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.author[0].toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{item.author}</Text>
              <Text style={styles.progress}>Part {item.progress}</Text>
            </View>
          </View>
          
          {/* Audio play button */}
          {hasAudio && (
            <TouchableOpacity 
              style={styles.playButtonHeader}
              onPress={(e) => {
                e.stopPropagation();
                playAudio(item.audio_url, item.id);
              }}
            >
              <Ionicons 
                name={isPlaying ? "pause-circle" : "play-circle"} 
                size={32} 
                color="#0A84FF" 
              />
            </TouchableOpacity>
          )}
          
          {/* Expand/Collapse indicator */}
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#888" 
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Content/Script */}
        <Text 
          style={styles.content} 
          numberOfLines={isExpanded ? undefined : 4}
        >
          {item.content}
        </Text>

        {/* Read more indicator for collapsed state */}
        {!isExpanded && item.content.length > 200 && (
          <Text style={styles.readMore}>Tap to read more</Text>
        )}

        {/* Footer with timestamp */}
        <View style={styles.cardFooter}>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          
          {hasAudio && (
            <View style={styles.audioIndicator}>
              <Ionicons name="musical-notes" size={14} color="#0A84FF" />
              <Text style={styles.audioText}>Audio ready</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={styles.loadingText}>Loading your feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Infinite Learning</Text>
        <Text style={styles.headerSubtitle}>Your Learning Feed</Text>
      </View>

      {/* Feed */}
      <FlatList
        data={beads}
        renderItem={renderBead}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
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
            <Text style={styles.emptyText}>No beads yet</Text>
            <Text style={styles.emptySubtext}>Upload a PDF to get started</Text>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  feedContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progress: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  playButtonHeader: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    lineHeight: 26,
  },
  content: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 8,
  },
  readMore: {
    fontSize: 13,
    color: '#0A84FF',
    fontWeight: '500',
    marginBottom: 12,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  audioText: {
    fontSize: 12,
    color: '#0A84FF',
    marginLeft: 4,
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
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});