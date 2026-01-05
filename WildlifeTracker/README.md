# Wildlife Tracker

A mobile app for capturing GPS-tagged wildlife observations with offline support. Data is stored as JSON files in a GitHub repository.

## 📱 Download Links

**Latest Release:** [GitHub Releases](https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest)

### Direct Download Links
- 📱 **Android APK**: Available in [Releases](https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest)
- 🍎 **iOS**: Available on TestFlight (contact developer)

## Features

- **GPS Location Capture**: Automatically capture precise GPS coordinates for each observation
- **Offline Support**: Works without internet connection, stores data locally
- **Outbox System**: Queues observations for syncing when online
- **GitHub Integration**: Saves observation data as JSON files to your GitHub repository
- **Species Database**: Pre-loaded with common North American wildlife species
- **Cross-Platform**: Built with React Native and Expo for iOS and Android

## Setup Instructions

### 1. Install Dependencies

```bash
cd WildlifeTracker
npm install
```

### 2. Configure GitHub Repository

1. Create a new GitHub repository (public or private)
2. Generate a Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (full control of private repositories)
   - Copy the token (keep it secure!)

### 3. Configure the App

1. Open the app and go to the Settings tab
2. Enter your GitHub Personal Access Token
3. Enter your repository in format: `username/repository-name`
4. Optionally customize the data path (default: `data/observations`)
5. Tap "Test Connection" to verify settings
6. Tap "Save Settings"

### 4. Run the App

```bash
# For development
npx expo start

# Or run on specific platform
npx expo run:ios
npx expo run:android
```

## How to Use

### Making Observations

1. Open the "Observe" tab
2. Select the wildlife species from the dropdown
3. Enter your name as the enumerator
4. Add any additional observations/items (comma-separated)
5. Tap "Capture GPS Location" to get coordinates
6. Tap "Save Observation"

### Offline Usage

- The app works completely offline
- Observations are stored locally and added to the outbox
- When you regain internet connection, go to the "Outbox" tab and tap "Sync All"

### Managing Outbox

- View all pending observations in the "Outbox" tab
- See sync status and retry counts
- Manually trigger sync with "Sync All" button
- Remove items if needed

## Data Format

Each observation is saved as a JSON file with this structure:

```json
{
  "id": "obs_1640995200000_abc123",
  "species": "White-tailed Deer",
  "items": ["tracks", "scat"],
  "enumerator": "John Doe",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 5.2,
    "altitude": 10.5
  },
  "timestamp": "2023-12-31T12:00:00.000Z",
  "synced": true
}
```

## File Structure

```
data/observations/
├── obs_1640995200000_abc123.json
├── obs_1640995260000_def456.json
└── ...
```

## Permissions Required

- **Location**: To capture GPS coordinates for observations
- **Network**: To sync data with GitHub when online

## Troubleshooting

### Location Permissions
- iOS: Settings → Wildlife Tracker → Location → While Using the App
- Android: Settings → Apps → Wildlife Tracker → Permissions → Location

### GitHub Connection Issues
- Verify your Personal Access Token is correct and has `repo` scope
- Check that the repository exists and you have write access
- Ensure repository format is `username/repo-name`

### Sync Failures
- Check internet connection
- Verify GitHub settings are correct
- Look at error messages in the outbox for specific issues

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── ObservationForm.tsx
│   ├── OutboxScreen.tsx
│   └── SettingsScreen.tsx
├── services/           # Business logic
│   ├── locationService.ts
│   ├── storageService.ts
│   └── syncService.ts
└── types/             # TypeScript definitions
    └── index.ts
```

### Key Services

- **LocationService**: Handles GPS location capture
- **StorageService**: Manages local data storage with AsyncStorage
- **SyncService**: Handles GitHub API integration and syncing

## 📦 Distribution & Installation

### For End Users

#### Android Installation
1. Go to the [latest release](https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest)
2. Download `WildlifeTracker-vX.X.X.apk`
3. On your Android device:
   - Enable "Install unknown apps" in Settings → Apps → Special access
   - Open the downloaded APK file
   - Follow installation prompts

#### iOS Installation
Contact the developer for TestFlight access or build instructions.

### For Developers - Building the App

#### Prerequisites
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login
```

#### Build Commands
```bash
# Build Android APK
npm run build:android

# Build iOS (requires Apple Developer account)
npm run build:ios

# Development build
eas build --platform android --profile development
```

#### Automated Releases
The app includes GitHub Actions workflow that automatically builds APKs when you create a new release:

1. Create a new tag: `git tag v1.0.1`
2. Push the tag: `git push origin v1.0.1`
3. GitHub Actions will build the APK and attach it to the release

#### Required Secrets for GitHub Actions
Add these to your repository secrets:
- `EXPO_TOKEN`: Your Expo access token
- `GITHUB_TOKEN`: Automatically provided by GitHub

### Manual Distribution

#### Option 1: GitHub Releases (Recommended)
1. Build the APK using EAS
2. Download the build artifact
3. Create a new GitHub release
4. Upload the APK as a release asset
5. Share the release URL with users

#### Option 2: Direct APK Sharing
- Host the APK on any web server
- Share direct download links
- Users can install directly on Android devices

#### Option 3: Expo Go (Development)
```bash
npx expo start
```
Users can scan the QR code with Expo Go app for testing.

## Configuration

### Update Package Identifiers
Before building, update `app.json` with your identifiers:

```json
{
  "ios": {
    "bundleIdentifier": "com.yourname.wildlifetracker"
  },
  "android": {
    "package": "com.yourname.wildlifetracker"
  }
}
```

### GitHub Repository Setup
1. Replace `YOUR_USERNAME/YOUR_REPO` in this README with your actual GitHub repository
2. Update download links to point to your repository
3. Configure the GitHub Actions workflow for automated builds

## License

This project is open source and available under the MIT License.
