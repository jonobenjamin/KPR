# Wildlife Tracker Map

This HTML map displays concession boundaries, roads, and wildlife observation records from your Firebase database with simple API key authentication.

## Setup Instructions

1. **Configure API Settings**: Open `map.html` and update these variables at the top of the JavaScript section:
   ```javascript
   const API_BASE_URL = 'https://your-backend-url.vercel.app'; // Replace with your actual backend URL
   const API_KEY = 'your-api-key'; // Replace with your actual API key
   ```

2. **Set Environment Variables**: Ensure your backend has this environment variable:
   ```env
   API_KEY=your-secret-api-key
   ```

2. **Backend Requirements**: Make sure your backend is deployed and accessible. The map fetches data from these endpoints:
   - `GET /api/map/boundary` - Concession boundaries (GeoJSON)
   - `GET /api/map/roads` - Road network (GeoJSON)
   - `GET /api/observations` - Wildlife observations with GPS coordinates

## Features

- **Concession Boundaries**: Brown outline with tan fill showing the concession area
- **Road Network**: Brown lines showing all roads within the concession
- **Observation Markers**:
  - 🟢 Green: Animal sightings
  - 🔴 Red: Incidents
  - 🔵 Blue: Maintenance activities

## Usage

Simply open `map.html` in a web browser. The map will automatically:
1. Load concession boundary and road data
2. Fetch observation records from Firebase
3. Display markers for all observations with GPS coordinates
4. Fit the view to show the entire concession area

## Security

- **API Key Authentication**: Simple but effective authentication using secret API keys
- **Header-based**: API keys are sent in request headers, not URLs
- **No Sensitive Data**: Only observations with GPS coordinates are displayed
- **Rate Limiting**: Backend includes rate limiting protection

## Troubleshooting

If the map doesn't load:
1. Check that your backend URL is correct and accessible
2. Verify your API key environment variable is set correctly
3. Check browser console for authentication or network errors
4. Ensure your backend has the required GeoJSON files (`Consession_boundary.geojson` and `KPR_roads.geojson`)
5. Make sure the API key in `map.html` matches your backend's `API_KEY` environment variable

## Environment Variables Required

Add this to your backend's environment variables (`.env` file or hosting platform settings):

```env
API_KEY=your-secret-api-key-here
```

## File Structure

```
html/
├── map.html          # Main map application with API key authentication
└── README.md         # This file
```