import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Flight, DirectionsCar, Train, DirectionsBus, DirectionsBoat } from '@mui/icons-material';

const BusinessTravelLocationSelector = ({ 
  onLocationSelect, 
  onDistanceCalculate,
  selectedMode = 'plane'
}) => {
  const [map, setMap] = useState(null);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [fromPosition, setFromPosition] = useState(null);
  const [toPosition, setToPosition] = useState(null);
  const [fromMarker, setFromMarker] = useState(null);
  const [toMarker, setToMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null); // 'from' or 'to'
  const mapRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded and ready
      if (window.google && window.google.maps && window.google.maps.Map) {
        setTimeout(() => {
          if (window.google.maps.Geocoder) {
            initializeMap();
          }
        }, 100);
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            setTimeout(() => {
              if (window.google.maps.Geocoder) {
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            setTimeout(() => {
              if (window.google.maps.Geocoder) {
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
    
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.error('Google Maps API not fully loaded');
      setApiError('Google Maps API not fully loaded. Please refresh the page.');
      return;
    }

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 1.3521, lng: 103.8198 }, // Singapore default
        zoom: 4, // Zoom out for international travel
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

      // Add click listener to map
      mapInstance.addListener('click', (event) => {
        if (activeLocation) {
          placeMarker(event.latLng, activeLocation);
        }
      });

      setMap(mapInstance);
    } catch (error) {
      console.error('Error initializing map:', error);
      setApiError('Failed to initialize Google Maps. Please refresh the page.');
    }
  };

  const calculateDistance = () => {
    if (!fromPosition || !toPosition) {
      setApiError('Please select both from and to locations');
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Calculate straight-line distance (great circle distance)
      const R = 6371; // Earth's radius in kilometers
      const lat1 = fromPosition.lat() * Math.PI / 180;
      const lat2 = toPosition.lat() * Math.PI / 180;
      const deltaLat = (toPosition.lat() - fromPosition.lat()) * Math.PI / 180;
      const deltaLng = (toPosition.lng() - fromPosition.lng()) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // For business travel, we might need to adjust distance based on travel mode
      let adjustedDistance = distance;
      
      // Add some realistic routing factor for different modes
      switch (selectedMode) {
        case 'plane':
          // For planes, use straight-line distance (they fly direct)
          adjustedDistance = distance;
          break;
        case 'car':
          // For cars, add 20% for road routing
          adjustedDistance = distance * 1.2;
          break;
        case 'train':
          // For trains, add 30% for rail routing
          adjustedDistance = distance * 1.3;
          break;
        case 'bus':
          // For buses, add 25% for road routing
          adjustedDistance = distance * 1.25;
          break;
        case 'ship':
          // For ships, add 50% for sea routing
          adjustedDistance = distance * 1.5;
          break;
        default:
          adjustedDistance = distance;
      }

      if (onDistanceCalculate) {
        onDistanceCalculate({
          distance: Math.round(adjustedDistance),
          distanceText: `${Math.round(adjustedDistance)} km`,
          fromAddress,
          toAddress
        });
      }

      // Fit map to show both markers
      if (map) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(fromPosition);
        bounds.extend(toPosition);
        map.fitBounds(bounds);
        map.setZoom(Math.min(map.getZoom(), 10)); // Don't zoom too far out
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error calculating distance:', error);
      setApiError('Failed to calculate distance');
      setIsLoading(false);
    }
  };

  const placeMarker = (position, type) => {
    if (!map) return;

    // Remove existing marker
    if (type === 'from' && fromMarker) {
      fromMarker.setMap(null);
    } else if (type === 'to' && toMarker) {
      toMarker.setMap(null);
    }

    // Create custom marker icon
    const markerIcon = {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="${type === 'from' ? '#ef4444' : '#3b82f6'}" stroke="white" stroke-width="3"/>
          <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${type === 'from' ? '📍' : '🎯'}</text>
          <rect x="10" y="-5" width="20" height="8" rx="4" fill="${type === 'from' ? '#ef4444' : '#3b82f6'}"/>
          <text x="20" y="2" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${type === 'from' ? 'FROM' : 'TO'}</text>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 20)
    };

    // Create new marker
    const marker = new window.google.maps.Marker({
      position,
      map,
      title: type === 'from' ? 'From Location' : 'To Location',
      icon: markerIcon,
      draggable: true
    });

    // Add drag listener
    marker.addListener('dragend', (event) => {
      const newPosition = event.latLng;
      if (type === 'from') {
        setFromPosition(newPosition);
        reverseGeocode(newPosition, 'from');
      } else {
        setToPosition(newPosition);
        reverseGeocode(newPosition, 'to');
      }
    });

    // Set marker and position
    if (type === 'from') {
      setFromMarker(marker);
      setFromPosition(position);
      reverseGeocode(position, 'from');
    } else {
      setToMarker(marker);
      setToPosition(position);
      reverseGeocode(position, 'to');
    }

    // Clear active location
    setActiveLocation(null);
  };

  const reverseGeocode = (position, type) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        if (type === 'from') {
          setFromAddress(address);
          if (onLocationSelect) onLocationSelect('from', address);
        } else {
          setToAddress(address);
          if (onLocationSelect) onLocationSelect('to', address);
        }
      }
    });
  };

  const searchPlaces = async () => {
    if (!searchQuery.trim() || !window.google || !window.google.maps) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      if (map && window.google.maps.places) {
        const placesService = new window.google.maps.places.PlacesService(map);
        
        const request = {
          query: searchQuery,
          fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types'],
          location: map.getCenter(),
          radius: 500000 // 500km radius for international search
        };

        placesService.textSearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            const placesResults = results.slice(0, 10).map(place => ({
              name: place.name,
              geometry: { location: place.geometry.location },
              formatted_address: place.formatted_address,
              place_id: place.place_id,
              types: place.types
            }));
            
            setSearchResults(placesResults);
            setIsSearching(false);
          } else {
            fallbackToGeocoding();
          }
        });
      } else {
        fallbackToGeocoding();
      }
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
      `${searchQuery}, Malaysia`,
      `${searchQuery}, Indonesia`,
      `${searchQuery}, Thailand`,
      `${searchQuery}, Vietnam`,
      `${searchQuery}, Philippines`,
      `${searchQuery}, India`,
      `${searchQuery}, China`,
      `${searchQuery}, Japan`,
      `${searchQuery}, Australia`,
      `${searchQuery}, United States`,
      `${searchQuery}, United Kingdom`,
      `${searchQuery}, Germany`,
      `${searchQuery}, France`
    ];

    let allResults = [];
    let completedRequests = 0;

    searchVariations.forEach((query, index) => {
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
    const address = place.formatted_address || place.name || 'Selected Location';
    
    placeMarker(position, activeLocation);
    
    if (activeLocation === 'from') {
      setFromAddress(address);
    } else {
      setToAddress(address);
    }
    
    if (onLocationSelect) {
      onLocationSelect(activeLocation, address);
    }
    
    setSearchQuery('');
    setSearchResults([]);
    
    if (map) {
      map.setCenter(position);
      map.setZoom(10);
      
      if (fromPosition && toPosition) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(fromPosition);
        bounds.extend(toPosition);
        map.fitBounds(bounds);
        map.setZoom(Math.min(map.getZoom(), 10));
      }
    }
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'plane': return <Flight className="w-4 h-4" />;
      case 'car': return <DirectionsCar className="w-4 h-4" />;
      case 'train': return <Train className="w-4 h-4" />;
      case 'bus': return <DirectionsBus className="w-4 h-4" />;
      case 'ship': return <DirectionsBoat className="w-4 h-4" />;
      default: return <Flight className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">How to Set Your Business Travel Route</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. <strong>Search</strong> for your departure location and tap "Set From Location"</p>
          <p>2. <strong>Search</strong> for your destination location and tap "Set To Location"</p>
          <p>3. <strong>Drag</strong> the markers to adjust to exact positions</p>
          <p>4. <strong>Calculate Distance</strong> to see the travel distance</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>📍 FROM (Departure)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>🎯 TO (Destination)</span>
          </div>
          <div className="flex items-center">
            {getModeIcon(selectedMode)}
            <span className="ml-1">{selectedMode.toUpperCase()}</span>
          </div>
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
                      {place.types && !isNoResults && (
                        <div className="text-xs text-slate-400 mt-1">
                          {place.types.slice(0, 2).join(' • ')}
                        </div>
                      )}
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
            onClick={() => setActiveLocation('from')}
            className={`flex items-center justify-center px-6 py-4 rounded-xl border-2 transition-all font-medium text-base touch-manipulation ${
              activeLocation === 'from'
                ? 'border-red-500 bg-red-50 text-red-700 shadow-md'
                : 'border-slate-300 hover:border-red-300 hover:bg-red-50 hover:shadow-sm active:bg-red-100'
            }`}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Set From Location
          </button>
          <button
            type="button"
            onClick={() => setActiveLocation('to')}
            className={`flex items-center justify-center px-6 py-4 rounded-xl border-2 transition-all font-medium text-base touch-manipulation ${
              activeLocation === 'to'
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                : 'border-slate-300 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm active:bg-blue-100'
            }`}
          >
            <MapPin className="w-5 h-5 mr-2" />
            Set To Location
          </button>
        </div>

        {/* Active Location Indicator */}
        {activeLocation && (
          <div className={`p-4 rounded-xl border-2 ${
            activeLocation === 'from' 
              ? 'bg-red-50 border-red-300 shadow-md' 
              : 'bg-blue-50 border-blue-300 shadow-md'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                activeLocation === 'from' ? 'bg-red-500' : 'bg-blue-500'
              }`}></div>
              <div>
                <p className={`text-sm font-bold ${
                  activeLocation === 'from' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  Setting {activeLocation === 'from' ? 'From' : 'To'} Location
                </p>
                <p className={`text-xs ${
                  activeLocation === 'from' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  Click on the map or select from search results to place your {activeLocation} marker
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Locations Display */}
      {(fromAddress || toAddress) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Selected Locations</h3>
          <div className="space-y-2">
            {fromAddress && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-slate-600">From: {fromAddress}</span>
              </div>
            )}
            {toAddress && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-slate-600">To: {toAddress}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculate Distance Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={calculateDistance}
          disabled={!fromPosition || !toPosition || isLoading}
          className="flex items-center px-8 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg touch-manipulation w-full md:w-auto"
        >
          <MapPin className="w-6 h-6 mr-3" />
          {isLoading ? 'Calculating Distance...' : 'Calculate Travel Distance'}
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
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{apiError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Travel Route Map</h3>
          <p className="text-sm text-slate-600">Visual representation of your business travel route</p>
        </div>
        <div 
          ref={mapRef} 
          className="w-full h-80 md:h-96"
          style={{ minHeight: '320px' }}
        />
      </div>
    </div>
  );
};

export default BusinessTravelLocationSelector; 