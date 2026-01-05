import AsyncStorage from '@react-native-async-storage/async-storage';
import { WildlifeObservation, OutboxItem } from '../types';

const STORAGE_KEYS = {
  OBSERVATIONS: 'wildlife_observations',
  OUTBOX: 'sync_outbox',
  USER_SETTINGS: 'user_settings',
};

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Observations management
  async saveObservation(observation: WildlifeObservation): Promise<void> {
    try {
      const observations = await this.getAllObservations();
      const existingIndex = observations.findIndex(obs => obs.id === observation.id);

      if (existingIndex >= 0) {
        observations[existingIndex] = observation;
      } else {
        observations.push(observation);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(observations));
    } catch (error) {
      console.error('Error saving observation:', error);
      throw error;
    }
  }

  async getAllObservations(): Promise<WildlifeObservation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OBSERVATIONS);
      if (!data) return [];

      const observations = JSON.parse(data);
      // Convert timestamp strings back to Date objects
      return observations.map((obs: any) => ({
        ...obs,
        timestamp: new Date(obs.timestamp),
        syncAttempted: obs.syncAttempted ? new Date(obs.syncAttempted) : undefined,
      }));
    } catch (error) {
      console.error('Error getting observations:', error);
      return [];
    }
  }

  async getUnsyncedObservations(): Promise<WildlifeObservation[]> {
    const observations = await this.getAllObservations();
    return observations.filter(obs => !obs.synced);
  }

  async markObservationSynced(id: string): Promise<void> {
    const observations = await this.getAllObservations();
    const observation = observations.find(obs => obs.id === id);
    if (observation) {
      observation.synced = true;
      await AsyncStorage.setItem(STORAGE_KEYS.OBSERVATIONS, JSON.stringify(observations));
    }
  }

  // Outbox management
  async addToOutbox(observation: WildlifeObservation): Promise<void> {
    try {
      const outbox = await this.getOutbox();
      const outboxItem: OutboxItem = {
        observation,
        createdAt: new Date(),
        retryCount: 0,
      };
      outbox.push(outboxItem);
      await AsyncStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(outbox));
    } catch (error) {
      console.error('Error adding to outbox:', error);
      throw error;
    }
  }

  async getOutbox(): Promise<OutboxItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OUTBOX);
      if (!data) return [];

      const outbox = JSON.parse(data);
      return outbox.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        observation: {
          ...item.observation,
          timestamp: new Date(item.observation.timestamp),
          syncAttempted: item.observation.syncAttempted ? new Date(item.observation.syncAttempted) : undefined,
        },
      }));
    } catch (error) {
      console.error('Error getting outbox:', error);
      return [];
    }
  }

  async removeFromOutbox(observationId: string): Promise<void> {
    try {
      const outbox = await this.getOutbox();
      const filteredOutbox = outbox.filter(item => item.observation.id !== observationId);
      await AsyncStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(filteredOutbox));
    } catch (error) {
      console.error('Error removing from outbox:', error);
      throw error;
    }
  }

  async incrementRetryCount(observationId: string): Promise<void> {
    try {
      const outbox = await this.getOutbox();
      const item = outbox.find(item => item.observation.id === observationId);
      if (item) {
        item.retryCount += 1;
        await AsyncStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(outbox));
      }
    } catch (error) {
      console.error('Error incrementing retry count:', error);
      throw error;
    }
  }

  // User settings
  async saveUserSettings(settings: { enumerator: string }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }

  async getUserSettings(): Promise<{ enumerator: string } | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  // Clear all data (for testing/debugging)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.OBSERVATIONS,
        STORAGE_KEYS.OUTBOX,
        STORAGE_KEYS.USER_SETTINGS,
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}
