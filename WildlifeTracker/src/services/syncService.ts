import * as Network from 'expo-network';
import { WildlifeObservation } from '../types';
import { StorageService } from './storageService';

export class SyncService {
  private static instance: SyncService;
  private storageService: StorageService;

  // GitHub configuration - these should be configurable
  private githubToken: string = ''; // Will be set from user settings
  private githubRepo: string = ''; // Format: owner/repo
  private githubPath: string = 'data/observations'; // Path within repo

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // Configure GitHub credentials
  setGitHubConfig(token: string, repo: string, path?: string): void {
    this.githubToken = token;
    this.githubRepo = repo;
    if (path) this.githubPath = path;
  }

  // Check if device is online
  async isOnline(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected && networkState.isInternetReachable;
    } catch (error) {
      console.error('Error checking network status:', error);
      return false;
    }
  }

  // Sync all unsynced observations
  async syncAllObservations(): Promise<{ success: number; failed: number }> {
    if (!await this.isOnline()) {
      throw new Error('No internet connection');
    }

    if (!this.githubToken || !this.githubRepo) {
      throw new Error('GitHub credentials not configured');
    }

    const unsyncedObservations = await this.storageService.getUnsyncedObservations();
    let successCount = 0;
    let failedCount = 0;

    for (const observation of unsyncedObservations) {
      try {
        await this.uploadObservationToGitHub(observation);
        await this.storageService.markObservationSynced(observation.id);
        await this.storageService.removeFromOutbox(observation.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync observation ${observation.id}:`, error);
        await this.updateSyncError(observation.id, error.message);
        failedCount++;
      }
    }

    return { success: successCount, failed: failedCount };
  }

  // Upload single observation to GitHub
  private async uploadObservationToGitHub(observation: WildlifeObservation): Promise<void> {
    const filename = `${observation.id}.json`;
    const filePath = `${this.githubPath}/${filename}`;

    // Get current file content to check if it exists
    let sha: string | undefined;
    try {
      const existingFile = await this.getGitHubFile(filePath);
      sha = existingFile.sha;
    } catch (error) {
      // File doesn't exist, that's fine
    }

    const content = JSON.stringify(observation, null, 2);
    const encodedContent = btoa(content); // Base64 encode

    const url = `https://api.github.com/repos/${this.githubRepo}/contents/${filePath}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add wildlife observation: ${observation.species} at ${observation.timestamp.toISOString()}`,
        content: encodedContent,
        sha: sha, // Include SHA if updating existing file
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
    }
  }

  // Get file from GitHub
  private async getGitHubFile(path: string): Promise<any> {
    const url = `https://api.github.com/repos/${this.githubRepo}/contents/${path}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.githubToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file: ${response.status}`);
    }

    return await response.json();
  }

  // Update sync error status
  private async updateSyncError(observationId: string, error: string): Promise<void> {
    const observations = await this.storageService.getAllObservations();
    const observation = observations.find(obs => obs.id === observationId);
    if (observation) {
      observation.syncError = error;
      observation.syncAttempted = new Date();
      await this.storageService.saveObservation(observation);
      await this.storageService.incrementRetryCount(observationId);
    }
  }

  // Test GitHub connection
  async testGitHubConnection(): Promise<boolean> {
    if (!this.githubToken || !this.githubRepo) {
      return false;
    }

    try {
      const url = `https://api.github.com/repos/${this.githubRepo}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing GitHub connection:', error);
      return false;
    }
  }
}
