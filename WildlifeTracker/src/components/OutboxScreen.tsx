import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { OutboxItem } from '../types';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';

export const OutboxScreen: React.FC = () => {
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const storageService = StorageService.getInstance();
  const syncService = SyncService.getInstance();

  useEffect(() => {
    loadOutbox();
    checkConnectivity();
  }, []);

  const loadOutbox = async () => {
    try {
      const items = await storageService.getOutbox();
      setOutboxItems(items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error loading outbox:', error);
    }
  };

  const checkConnectivity = async () => {
    const online = await syncService.isOnline();
    setIsOnline(online);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadOutbox(), checkConnectivity()]);
    setIsRefreshing(false);
  };

  const syncAll = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your internet connection.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncService.syncAllObservations();
      Alert.alert(
        'Sync Complete',
        `Successfully synced ${result.success} observations. ${result.failed} failed.`
      );
      await loadOutbox();
    } catch (error) {
      Alert.alert('Sync Failed', error.message || 'Failed to sync observations.');
    } finally {
      setIsSyncing(false);
    }
  };

  const removeItem = async (observationId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from the outbox? It will not be synced.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.removeFromOutbox(observationId);
              await loadOutbox();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item from outbox.');
            }
          },
        },
      ]
    );
  };

  const renderOutboxItem = ({ item }: { item: OutboxItem }) => {
    const { observation } = item;
    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemHeader}>
          <Text style={styles.speciesText}>{observation.species}</Text>
          <Text style={styles.timestampText}>
            {observation.timestamp.toLocaleDateString()} {observation.timestamp.toLocaleTimeString()}
          </Text>
        </View>

        <Text style={styles.enumeratorText}>By: {observation.enumerator}</Text>

        {observation.items.length > 0 && (
          <Text style={styles.itemsText}>
            Items: {observation.items.join(', ')}
          </Text>
        )}

        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={16} color="#666" />
          <Text style={styles.locationText}>
            {observation.location.latitude.toFixed(4)}, {observation.location.longitude.toFixed(4)}
          </Text>
        </View>

        {observation.syncError && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={16} color="#FF3B30" />
            <Text style={styles.errorText}>
              Sync failed: {observation.syncError}
            </Text>
          </View>
        )}

        <View style={styles.itemFooter}>
          <Text style={styles.retryText}>
            Retry attempts: {item.retryCount}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeItem(observation.id)}
          >
            <MaterialIcons name="delete" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.syncButton, (!isOnline || isSyncing) && styles.syncButtonDisabled]}
          onPress={syncAll}
          disabled={!isOnline || isSyncing}
        >
          <MaterialIcons name="sync" size={20} color="white" />
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        Outbox ({outboxItems.length} items)
      </Text>

      {outboxItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="inbox" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No items in outbox</Text>
          <Text style={styles.emptySubtext}>
            Observations will appear here when you're offline or sync fails
          </Text>
        </View>
      ) : (
        <FlatList
          data={outboxItems}
          renderItem={renderOutboxItem}
          keyExtractor={(item) => item.observation.id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  online: {
    backgroundColor: '#34C759',
  },
  offline: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  syncButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  syncButtonDisabled: {
    backgroundColor: '#ccc',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 15,
    paddingBottom: 10,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
  },
  itemContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  speciesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
  },
  enumeratorText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    flex: 1,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryText: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    padding: 5,
  },
});
