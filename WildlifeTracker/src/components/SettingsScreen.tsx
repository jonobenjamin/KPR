import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';

interface GitHubSettings {
  token: string;
  repo: string;
  path: string;
}

export const SettingsScreen: React.FC = () => {
  const [githubSettings, setGithubSettings] = useState<GitHubSettings>({
    token: '',
    repo: '',
    path: 'data/observations',
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');

  const storageService = StorageService.getInstance();
  const syncService = SyncService.getInstance();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // For now, we'll store GitHub settings in AsyncStorage
      // In a real app, you might want to use secure storage for the token
      const token = await getStoredValue('github_token');
      const repo = await getStoredValue('github_repo');
      const path = await getStoredValue('github_path');

      setGithubSettings({
        token: token || '',
        repo: repo || '',
        path: path || 'data/observations',
      });

      if (token && repo) {
        syncService.setGitHubConfig(token, repo, path || 'data/observations');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const getStoredValue = async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const saveSettings = async () => {
    if (!githubSettings.token || !githubSettings.repo) {
      Alert.alert('Missing Information', 'Please provide both GitHub token and repository.');
      return;
    }

    try {
      await AsyncStorage.setItem('github_token', githubSettings.token);
      await AsyncStorage.setItem('github_repo', githubSettings.repo);
      await AsyncStorage.setItem('github_path', githubSettings.path);

      syncService.setGitHubConfig(githubSettings.token, githubSettings.repo, githubSettings.path);

      Alert.alert('Success', 'GitHub settings saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings.');
      console.error('Save settings error:', error);
    }
  };

  const testConnection = async () => {
    if (!githubSettings.token || !githubSettings.repo) {
      Alert.alert('Missing Information', 'Please provide both GitHub token and repository.');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('unknown');

    try {
      syncService.setGitHubConfig(githubSettings.token, githubSettings.repo, githubSettings.path);
      const isConnected = await syncService.testGitHubConnection();

      setConnectionStatus(isConnected ? 'success' : 'error');
      Alert.alert(
        isConnected ? 'Connection Successful' : 'Connection Failed',
        isConnected
          ? 'GitHub connection is working correctly.'
          : 'Failed to connect to GitHub. Please check your credentials and repository.'
      );
    } catch (error) {
      setConnectionStatus('error');
      Alert.alert('Connection Failed', 'Failed to connect to GitHub. Please check your credentials.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all observations and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllData();
              await AsyncStorage.multiRemove(['github_token', 'github_repo', 'github_path']);
              setGithubSettings({
                token: '',
                repo: '',
                path: 'data/observations',
              });
              Alert.alert('Success', 'All data cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GitHub Configuration</Text>
        <Text style={styles.sectionDescription}>
          Configure your GitHub repository to store observation data as JSON files.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>GitHub Personal Access Token *</Text>
          <TextInput
            style={styles.input}
            value={githubSettings.token}
            onChangeText={(text) => setGithubSettings(prev => ({ ...prev, token: text }))}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>
            Create a token at: GitHub Settings → Developer settings → Personal access tokens
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Repository *</Text>
          <TextInput
            style={styles.input}
            value={githubSettings.repo}
            onChangeText={(text) => setGithubSettings(prev => ({ ...prev, repo: text }))}
            placeholder="owner/repository-name"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>
            Format: username/repository or organization/repository
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Data Path</Text>
          <TextInput
            style={styles.input}
            value={githubSettings.path}
            onChangeText={(text) => setGithubSettings(prev => ({ ...prev, path: text }))}
            placeholder="data/observations"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>
            Folder path within the repository where data files will be stored
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testConnection}
            disabled={isTestingConnection}
          >
            <MaterialIcons
              name={connectionStatus === 'success' ? 'check-circle' : connectionStatus === 'error' ? 'error' : 'wifi'}
              size={20}
              color="white"
            />
            <Text style={styles.buttonText}>
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={saveSettings}
          >
            <MaterialIcons name="save" size={20} color="white" />
            <Text style={styles.buttonText}>Save Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearAllData}
        >
          <MaterialIcons name="delete-forever" size={20} color="white" />
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>

        <Text style={styles.warningText}>
          This will permanently delete all observations, settings, and cached data.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          Wildlife Tracker v1.0.0{'\n'}
          Capture GPS-tagged wildlife observations with offline support.{'\n'}
          Data is stored as JSON files in your GitHub repository.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    marginBottom: 0,
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
