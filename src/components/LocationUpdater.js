import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ArrowRight, Search, Home, Building, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import FirebaseService from '../services/firebaseService';

const LocationUpdater = ({ 
  onLocationUpdate, 
  currentHomeLocation = '', 
  currentOfficeLocation = '',
  onClose 
}) => {
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [homeAddress, setHomeAddress] = useState(currentHomeLocation);
  const [officeAddress, setOfficeAddress] = useState(currentOfficeLocation);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [homeMarker, setHomeMarker] = useState(null);
  const [officeMarker, setOfficeMarker] = useState(null);
  const [homePosition, setHomePosition] = useState(null);
  const [officePosition, setOfficePosition] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null);
  const mapRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.Map) {
        setTimeout(() => {
          if (window.google.maps.DirectionsService) {
            initializeMap();
          }
        }, 100);
        return;
      }

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            setTimeout(() => {
              if (window.google.maps.DirectionsService) {
                initializeMap();
              } else {
                setTimeout(checkGoogleMaps, 200);
              }
            }, 100);
          } else {
            setTimeout(checkGoogleMaps, 200);
          }
        };
        checkGoogleMaps();
        return;
      }

      const script = document.createElement('script');
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setApiError('Missing Google Maps API key. Set REACT_APP_GOOGLE_MAPS_API_KEY at build time and rebuild.');
        return;
      }
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            setTimeout(() => {
              if (window.google.maps.DirectionsService) {
                initializeMap();
              } else {
                setTimeout(checkGoogleMaps, 200);
              }
            }, 100);
          } else {
            setTimeout(checkGoogleMaps, 200);
          }
        };
        checkGoogleMaps();
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;
    
    if (!window.google || !window.google.maps || !window.google.maps.Map || !window.google.maps.DirectionsService) {
      console.error('Google Maps API not fully loaded');
      setApiError('Google Maps API not fully loaded. Please refresh the page.');
      return;
    }

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 1.3521, lng: 103.8198 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      const directionsServiceInstance = new window.google.maps.DirectionsService();
      const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4
        }
      });

      directionsRendererInstance.setMap(mapInstance);

      mapInstance.addListener('click', (event) => {
        if (activeLocation) {
          placeMarker(event.latLng, activeLocation);
        }
      });

      setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);

      if (currentHomeLocation) {
        geocodeAddress(currentHomeLocation).then(position => {
          placeMarker(position, 'home');
        }).catch(console.error);
      }
      if (currentOfficeLocation) {
        geocodeAddress(currentOfficeLocation).then(position => {
          placeMarker(position, 'office');
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setApiError('Failed to initialize Google Maps. Please refresh the page.');
    }
  };

  const geocodeAddress = (address) => {
    return new Promise((resolve, reject) => {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK') {
            resolve(results[0].geometry.location);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      } catch (error) {
        reject(new Error('Google Maps API not loaded properly'));
      }
    });
  };

  const calculateRoute = async () => {
    if (!homePosition || !officePosition) {
      setApiError('Please place both home and office markers on the map');
      return;
    }

    setIsLoading(true);
    setApiError(null);
    
    try {
      if (!window.google || !window.google.maps) {
        throw new Error('Google Maps API not loaded');
      }

      if (!directionsService) {
        throw new Error('Directions service not available');
      }

      const request = {
        origin: homePosition,
        destination: officePosition,
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(null);
          directionsRenderer.setDirections(result);
          
          const route = result.routes[0];
          const leg = route.legs[0];
          
          setDistance(leg.distance.text);
          setDuration(leg.duration.text);
          
          if (map) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(homePosition);
            bounds.extend(officePosition);
            
            route.overview_path.forEach(point => {
              bounds.extend(point);
            });
            
            map.fitBounds(bounds);
            map.setZoom(Math.min(map.getZoom(), 15));
          }
        } else {
          console.error('Directions request failed:', status);
          setApiError(`Directions service failed: ${status}`);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error calculating route:', error);
      setApiError(error.message);
      setIsLoading(false);
    }
  };

  const placeMarker = (position, type) => {
    if (!map) return;

    if (type === 'home' && homeMarker) {
      homeMarker.setMap(null);
    } else if (type === 'office' && officeMarker) {
      officeMarker.setMap(null);
    }

    const markerIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="${type === 'home' ? '#ef4444' : '#3b82f6'}" stroke="white" stroke-width="3"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${type === 'home' ? '🏠' : '🏢'}</text>
          <rect x="10" y="-5" width="20" height="8" rx="4" fill="${type === 'home' ? '#ef4444' : '#3b82f6'}"/>
          <text x="20" y="2" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${type === 'home' ? 'FROM' : 'TO'}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 20)
    };

    const marker = new window.google.maps.Marker({
      position,
      map,
      title: type === 'home' ? 'Home (FROM)' : 'Office (TO)',
      icon: markerIcon,
      draggable: true
    });

    marker.addListener('dragend', (event) => {
      const newPosition = event.latLng;
      if (type === 'home') {
        setHomePosition(newPosition);
        reverseGeocode(newPosition, 'home');
      } else {
        setOfficePosition(newPosition);
        reverseGeocode(newPosition, 'office');
      }
    });

    if (type === 'home') {
      setHomeMarker(marker);
      setHomePosition(position);
      reverseGeocode(position, 'home');
    } else {
      setOfficeMarker(marker);
      setOfficePosition(position);
      reverseGeocode(position, 'office');
    }

    setActiveLocation(null);
  };

  const reverseGeocode = (position, type) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        if (type === 'home') {
          setHomeAddress(address);
        } else {
          setOfficeAddress(address);
        }
      }
    });
  };

  const searchPlaces = async () => {
    if (!searchQuery.trim() || !window.google || !window.google.maps) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Always use geocoding to avoid deprecated PlacesService warnings
      fallbackToGeocoding();
    } catch (error) {
      console.error('Search error:', error);
      fallbackToGeocoding();
    }
  };

  const fallbackToGeocoding = () => {
    const geocoder = new window.google.maps.Geocoder();
    
    const searchVariations = [
      searchQuery,
      `${searchQuery}, Singapore`,
      `${searchQuery}, Malaysia`
    ];

    let allResults = [];
    let completedRequests = 0;

    searchVariations.forEach((query) => {
      geocoder.geocode({ address: query }, (results, status) => {
        completedRequests++;
        
        if (status === 'OK' && results.length > 0) {
          const filteredResults = results.filter(result => {
            const address = result.formatted_address.toLowerCase();
            const isCountryOnly = address.includes('singapore') && !address.includes(',');
            return !isCountryOnly;
          });

          allResults = allResults.concat(filteredResults);
        }

        if (completedRequests === searchVariations.length) {
          const uniqueResults = allResults.filter((result, index, self) => 
            index === self.findIndex(r => r.place_id === result.place_id)
          );

          const sortedResults = uniqueResults.sort((a, b) => {
            const aAddress = a.formatted_address.toLowerCase();
            const bAddress = b.formatted_address.toLowerCase();
            const query = searchQuery.toLowerCase();
            
            const aExactMatch = aAddress.includes(query);
            const bExactMatch = bAddress.includes(query);
            
            if (aExactMatch && !bExactMatch) return -1;
            if (!aExactMatch && bExactMatch) return 1;
            
            return 0;
          });
          
          const geocodeData = sortedResults.slice(0, 10).map(result => ({
            name: result.formatted_address,
            geometry: { location: result.geometry.location },
            formatted_address: result.formatted_address,
            place_id: result.place_id
          }));

          setSearchResults(geocodeData);
          setIsSearching(false);
        }
      });
    });
  };

  const selectSearchResult = (place) => {
    if (!activeLocation) return;

    if (!place.geometry || !place.geometry.location) {
      return;
    }

    const position = place.geometry.location;
    const address = place.formatted_address || place.formattedAddress || place.name || 'Selected Location';
    
    placeMarker(position, activeLocation);
    
    setSearchQuery('');
    setSearchResults([]);
    
    if (map) {
      map.setCenter(position);
      map.setZoom(15);
      
      if (homePosition && officePosition) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(homePosition);
        bounds.extend(officePosition);
        map.fitBounds(bounds);
        map.setZoom(Math.min(map.getZoom(), 15));
      }
    }
  };

  const handleSaveLocation = async () => {
    if (!homeAddress || !officeAddress) {
      toast.error('Please set both home and office locations');
      return;
    }

    if (!distance) {
      toast.error('Please calculate the route distance first');
      return;
    }

    setIsSaving(true);
    
    try {
      const distanceValue = parseFloat(distance.replace(/[^\d.]/g, ''));
      
      const locationData = {
        homeLocation: homeAddress,
        officeLocation: officeAddress,
        distance: distanceValue
      };

      // Call the parent callback with the location data
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      } else {
        // If no callback provided, update Firebase directly
        await FirebaseService.updateUserProfile(locationData);
        toast.success('Location updated successfully!');
        
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error(error.message || 'Failed to update location');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">Update Your Commute Route</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. <strong>Search</strong> for your home location and tap "Set Home Location"</p>
          <p>2. <strong>Search</strong> for your office location and tap "Set Office Location"</p>
          <p>3. <strong>Calculate Route</strong> to see your commute path and distance</p>
          <p>4. <strong>Save Changes</strong> to update your location information</p>
        </div>
      </div>

      {/* Search and Location Selection */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => {
                  searchPlaces();
                }, 300);
              } else {
                setSearchResults([]);
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
            className="w-full pl-10 pr-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
            placeholder="Search for a location..."
          />
        </div>

        {/* Search Results */}
        {(searchResults.length > 0 || isSearching) && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-h-80 overflow-y-auto">
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center">
                {isSearching && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                )}
                <p className="text-sm font-medium text-slate-700">
                  {isSearching ? 'Searching...' : `Found ${searchResults.length} location${searchResults.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            {searchResults.map((place, index) => {
              const isNoResults = !place.geometry || !place.geometry.location;
              
              const getPlaceIcon = (types) => {
                if (!types) return '📍';
                if (types.includes('establishment')) return '🏢';
                if (types.includes('point_of_interest')) return '📍';
                if (types.includes('street_address')) return '🏠';
                if (types.includes('route')) return '🛣️';
                if (types.includes('sublocality')) return '🏘️';
                if (types.includes('locality')) return '🏙️';
                return '📍';
              };
              
              return (
                <div
                  key={place.place_id || index}
                  className={`p-4 border-b border-slate-100 last:border-b-0 ${
                    isNoResults 
                      ? 'bg-slate-50 cursor-default' 
                      : 'hover:bg-slate-50 cursor-pointer touch-manipulation'
                  }`}
                  onClick={() => !isNoResults && selectSearchResult(place)}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 mt-1 ${
                      isNoResults ? 'bg-slate-200' : 'bg-blue-100'
                    }`}>
                      <span className={`text-sm ${
                        isNoResults ? 'text-slate-500' : 'text-blue-600'
                      }`}>
                        {isNoResults ? '!' : getPlaceIcon(place.types)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-base truncate ${
                        isNoResults ? 'text-slate-500' : 'text-slate-900'
                      }`}>
                        {place.name || 'Location'}
                      </div>
                      <div className={`text-sm mt-1 ${
                        isNoResults ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {place.formatted_address || place.formattedAddress}
                      </div>
                    </div>
                    {!isNoResults && (
                      <div className="flex-shrink-0 ml-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Location Selection Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveLocation('home')}
            className={`flex items-center justify-center px-6 py-4 rounded-xl border-2 transition-all font-medium text-base touch-manipulation ${
              activeLocation === 'home'
                ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                : 'border-slate-300 hover:border-green-300 hover:bg-green-50 hover:shadow-sm active:bg-green-100'
            }`}
          >
            <Home className="w-5 h-5 mr-2" />
            Set Home Location (FROM)
          </button>
          <button
            type="button"
            onClick={() => setActiveLocation('office')}
            className={`flex items-center justify-center px-6 py-4 rounded-xl border-2 transition-all font-medium text-base touch-manipulation ${
              activeLocation === 'office'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                : 'border-slate-300 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm active:bg-blue-100'
            }`}
          >
            <Building className="w-5 h-5 mr-2" />
            Set Office Location (TO)
          </button>
        </div>

        {/* Active Location Indicator */}
        {activeLocation && (
          <div className={`p-4 rounded-xl border-2 ${
            activeLocation === 'home' 
              ? 'bg-green-50 border-green-300 shadow-md' 
              : 'bg-blue-50 border-blue-300 shadow-md'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                activeLocation === 'home' ? 'bg-green-500' : 'bg-blue-500'
              }`}></div>
              <div>
                <p className={`text-sm font-bold ${
                  activeLocation === 'home' ? 'text-green-800' : 'text-blue-800'
                }`}>
                  Setting {activeLocation === 'home' ? 'Home (FROM)' : 'Office (TO)'} Location
                </p>
                <p className={`text-xs ${
                  activeLocation === 'home' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  Click on the map or select from search results to place your {activeLocation} marker
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Locations Display */}
      {(homeAddress || officeAddress) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Selected Locations</h3>
          <div className="space-y-2">
            {homeAddress && (
              <div className="flex items-center">
                <Home className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-slate-600">Home: {homeAddress}</span>
              </div>
            )}
            {officeAddress && (
              <div className="flex items-center">
                <Building className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-slate-600">Office: {officeAddress}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculate Route Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={calculateRoute}
          disabled={!homePosition || !officePosition || isLoading}
          className="flex items-center px-8 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg touch-manipulation w-full md:w-auto"
        >
          <Navigation className="w-6 h-6 mr-3" />
          {isLoading ? 'Calculating Route...' : 'Calculate Commute Route'}
        </button>
      </div>

      {/* Error Display */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Google Maps API Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{apiError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distance and Duration Display */}
      {(distance || duration) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Navigation className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-slate-600">Distance</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{distance}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-slate-600">Duration</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{duration}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Route Map</h3>
          <p className="text-sm text-slate-600">Visual representation of your commute route</p>
        </div>
        <div 
          ref={mapRef} 
          className="w-full h-80 md:h-96"
          style={{ minHeight: '320px' }}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={handleSaveLocation}
          disabled={!homeAddress || !officeAddress || !distance || isSaving}
          className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Saving...' : 'Save Location Changes'}
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center px-8 py-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-bold text-lg"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationUpdater;
