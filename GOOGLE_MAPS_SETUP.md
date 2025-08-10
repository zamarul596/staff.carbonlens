# Google Maps API Setup Guide

## Prerequisites

1. A Google Cloud Platform account
2. A project in Google Cloud Console
3. Billing enabled on your project

## Setup Steps

### 1. Enable Required APIs

Go to the [Google Cloud Console](https://console.cloud.google.com/) and enable the following APIs:

- **Maps JavaScript API** - For displaying maps
- **Directions API** - For calculating routes and distances
- **Geocoding API** - For converting addresses to coordinates
- **Places API** - For address autocomplete (optional)

### 2. Create API Key

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key

### 3. Configure Environment Variables

Create a `.env` file in your project root:

```env
# Google Maps API Configuration
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase Configuration (if using Firebase)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 4. Secure Your API Key

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "Application restrictions", select "HTTP referrers (web sites)"
4. Add your domain (e.g., `localhost:3000/*` for development)
5. Under "API restrictions", select "Restrict key"
6. Select the APIs you enabled in step 1

### 5. Usage Limits and Billing

- **Maps JavaScript API**: $7 per 1,000 map loads
- **Directions API**: $5 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests
- **Places API**: $17 per 1,000 requests

For development, you can use up to $200 in free credits per month.

## Features Implemented

### LocationSelector Component

The `LocationSelector` component provides:

- **Address Input**: Users can enter home and office addresses
- **Route Calculation**: Automatic distance calculation using Google Directions API
- **Visual Map**: Interactive map showing the route
- **Distance Display**: Shows calculated distance and estimated travel time

### Integration Points

1. **CreateAccountScreen**: Users set up their commute route during account creation
2. **EmployeeCommutingPage**: Pre-filled distance based on user's saved route
3. **Carbon Footprint Calculation**: Uses calculated distances for emission calculations

## API Usage Examples

### Basic Map Display
```javascript
const map = new google.maps.Map(mapRef.current, {
  center: { lat: 1.3521, lng: 103.8198 }, // Singapore
  zoom: 12
});
```

### Route Calculation
```javascript
const directionsService = new google.maps.DirectionsService();
const request = {
  origin: homeAddress,
  destination: officeAddress,
  travelMode: google.maps.TravelMode.DRIVING
};

directionsService.route(request, (result, status) => {
  if (status === 'OK') {
    const distance = result.routes[0].legs[0].distance.value / 1000; // km
    const duration = result.routes[0].legs[0].duration.text;
  }
});
```

### Address Geocoding
```javascript
const geocoder = new google.maps.Geocoder();
geocoder.geocode({ address: '123 Main St' }, (results, status) => {
  if (status === 'OK') {
    const location = results[0].geometry.location;
  }
});
```

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Check if the API key is correct
   - Verify that required APIs are enabled
   - Check API restrictions and quotas

2. **Maps Not Loading**
   - Ensure the API key is in the environment variables
   - Check browser console for errors
   - Verify billing is enabled

3. **Directions Not Calculating**
   - Check if Directions API is enabled
   - Verify address format is correct
   - Check API quotas and billing

### Error Handling

The component includes error handling for:
- Invalid addresses
- API quota exceeded
- Network errors
- Geocoding failures

## Security Best Practices

1. **Restrict API Key**: Always restrict your API key to specific domains
2. **Monitor Usage**: Set up billing alerts to avoid unexpected charges
3. **Rate Limiting**: Implement client-side rate limiting for API calls
4. **Error Handling**: Always handle API errors gracefully

## Cost Optimization

1. **Caching**: Cache route calculations to avoid repeated API calls
2. **Batch Requests**: Group multiple requests when possible
3. **Lazy Loading**: Only load maps when needed
4. **Usage Monitoring**: Monitor API usage to optimize costs 