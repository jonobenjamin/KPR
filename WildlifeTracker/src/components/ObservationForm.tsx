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
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { WildlifeObservation, WILDLIFE_SPECIES, GPSLocation } from '../types';
import { LocationService } from '../services/locationService';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';

interface ObservationFormProps {
  onObservationSaved?: () => void;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({ onObservationSaved }) => {
  const [species, setSpecies] = useState<string>('');
  const [items, setItems] = useState<string>('');
  const [enumerator, setEnumerator] = useState<string>('');
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const locationService = LocationService.getInstance();
  const storageService = StorageService.getInstance();
  const syncService = SyncService.getInstance();

  // Load user settings on mount
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const settings = await storageService.getUserSettings();
      if (settings?.enumerator) {
        setEnumerator(settings.enumerator);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location permission is required to capture GPS coordinates.');
        return;
      }

      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        setLocation(currentLocation);
        Alert.alert('Success', 'GPS location captured successfully!');
      } else {
        Alert.alert('Error', 'Failed to get current location. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please check your GPS settings.');
      console.error('Location error:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const saveObservation = async () => {
    // Validation
    if (!species || !enumerator || !location) {
      Alert.alert('Missing Information', 'Please fill in all required fields and capture GPS location.');
      return;
    }

    setIsSaving(true);
    try {
      const observation: WildlifeObservation = {
        id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        species,
        items: items.split(',').map(item => item.trim()).filter(item => item.length > 0),
        enumerator,
        location,
        timestamp: new Date(),
        synced: false,
      };

      // Save to local storage
      await storageService.saveObservation(observation);

      // Add to outbox for syncing
      await storageService.addToOutbox(observation);

      // Try to sync immediately if online
      const isOnline = await syncService.isOnline();
      if (isOnline) {
        try {
          await syncService.syncAllObservations();
        } catch (syncError) {
          console.log('Sync failed, will retry later:', syncError);
        }
      }

      // Save enumerator as default
      await storageService.saveUserSettings({ enumerator });

      // Reset form
      setSpecies('');
      setItems('');
      setLocation(null);

      Alert.alert('Success', 'Observation saved successfully!');
      onObservationSaved?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to save observation. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>New Wildlife Observation</Text>

        {/* Species Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Species *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={species}
              onValueChange={(value) => setSpecies(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select species..." value="" />
              {WILDLIFE_SPECIES.map((spec) => (
                <Picker.Item key={spec} label={spec} value={spec} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Enumerator */}
        <View style={styles.field}>
          <Text style={styles.label}>Enumerator *</Text>
          <TextInput
            style={styles.input}
            value={enumerator}
            onChangeText={setEnumerator}
            placeholder="Your name"
          />
        </View>

        {/* Items */}
        <View style={styles.field}>
          <Text style={styles.label}>Additional Items/Observations</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={items}
            onChangeText={setItems}
            placeholder="Comma-separated items (e.g., tracks, scat, behavior)"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* GPS Location */}
        <View style={styles.field}>
          <Text style={styles.label}>GPS Location *</Text>
          {location ? (
            <View style={styles.locationDisplay}>
              <Text style={styles.locationText}>
                Lat: {location.latitude.toFixed(6)}
              </Text>
              <Text style={styles.locationText}>
                Lon: {location.longitude.toFixed(6)}
              </Text>
              {location.accuracy && (
                <Text style={styles.locationText}>
                  Accuracy: ±{location.accuracy.toFixed(1)}m
                </Text>
              )}
              <TouchableOpacity
                style={styles.recaptureButton}
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                <MaterialIcons name="refresh" size={20} color="#007AFF" />
                <Text style={styles.recaptureText}>Recapture</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation}
            >
              <MaterialIcons name="location-on" size={24} color="white" />
              <Text style={styles.locationButtonText}>
                {isLoadingLocation ? 'Getting Location...' : 'Capture GPS Location'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={saveObservation}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Observation'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  locationButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
  },
  locationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  locationDisplay: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  recaptureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  recaptureText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 5,
  },
  saveButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
