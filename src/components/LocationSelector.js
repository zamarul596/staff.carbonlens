import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, ArrowRight, Search, Home, Building } from 'lucide-react';

const LocationSelector = ({ 
  onLocationSelect, 
  onDistanceCalculate, 
  homeLocation, 
  officeLocation,
  showDirections = false 
}) => {
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [homeAddress, setHomeAddress] = useState(homeLocation || '');
  const [officeAddress, setOfficeAddress] = useState(officeLocation || '');
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [homeMarker, setHomeMarker] = useState(null);
  const [officeMarker, setOfficeMarker] = useState(null);
  const [homePosition, setHomePosition] = useState(null);
  const [officePosition, setOfficePosition] = useState(null);
  const [activeLocation, setActiveLocation] = useState(null); // 'home' or 'office'
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded and ready
      if (window.google && window.google.maps && window.google.maps.Map) {
        // Add a small delay to ensure everything is initialized
        setTimeout(() => {
          if (window.google.maps.DirectionsService) {
            initializeMap();
          }
        }, 100);
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        // Wait for the script to fully load
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            // Add a small delay to ensure everything is initialized
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Wait for Google Maps to be fully loaded
        const checkGoogleMaps = () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            // Add a small delay to ensure everything is initialized
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
    
    // Cleanup timeout on unmount
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

    const initializeMap = () => {
    if (!mapRef.current) return;
    
    // Safety check for Google Maps API
    if (!window.google || !window.google.maps || !window.google.maps.Map || !window.google.maps.DirectionsService) {
      console.error('Google Maps API not fully loaded');
      setApiError('Google Maps API not fully loaded. Please refresh the page.');
      return;
    }

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 1.3521, lng: 103.8198 }, // Singapore default
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        // Remove mapId to allow custom styles, or remove styles to use mapId
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

      // Add click listener to map
      mapInstance.addListener('click', (event) => {
        if (activeLocation) {
          placeMarker(event.latLng, activeLocation);
        }
      });

      setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
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
          } else if (status === 'REQUEST_DENIED') {
            reject(new Error('Billing not enabled. Please enable billing in Google Cloud Console.'));
          } else if (status === 'ZERO_RESULTS') {
            reject(new Error(`Address not found: "${address}". Please check the spelling and try a more specific address.`));
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
      // Check if Google Maps API is available
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
          // Clear any existing routes
          directionsRenderer.setDirections(null);
          
          // Set the new route
          directionsRenderer.setDirections(result);
          
          const route = result.routes[0];
          const leg = route.legs[0];
          
          setDistance(leg.distance.text);
          setDuration(leg.duration.text);
          
          // Fit map to show the entire route
          if (map) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(homePosition);
            bounds.extend(officePosition);
            
            // Extend bounds to include route path
            route.overview_path.forEach(point => {
              bounds.extend(point);
            });
            
            map.fitBounds(bounds);
            map.setZoom(Math.min(map.getZoom(), 15)); // Don't zoom too far out
          }
          
          // Only call onDistanceCalculate when explicitly calculating route
          // This prevents auto-triggering when just setting locations
          if (onDistanceCalculate) {
            onDistanceCalculate({
              distance: leg.distance.value / 1000, // Convert to km
              distanceText: leg.distance.text,
              duration: leg.duration.text,
              homeAddress,
              officeAddress
            });
          }
        } else if (status === 'REQUEST_DENIED') {
          console.error('Directions request failed:', status);
          setApiError('Directions API not enabled. Please enable the Directions API in Google Cloud Console.');
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

    // Remove existing marker
    if (type === 'home' && homeMarker) {
      homeMarker.setMap(null);
    } else if (type === 'office' && officeMarker) {
      officeMarker.setMap(null);
    }

    // Create custom marker icon
    const markerIcon = {
      url: type === 'home' 
        ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="${type === 'home' ? '#ef4444' : '#3b82f6'}" stroke="white" stroke-width="3"/>
            <text x="20" y="25" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${type === 'home' ? '🏠' : '🏢'}</text>
            <rect x="10" y="-5" width="20" height="8" rx="4" fill="${type === 'home' ? '#ef4444' : '#3b82f6'}"/>
            <text x="20" y="2" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${type === 'home' ? 'FROM' : 'TO'}</text>
          </svg>
        `)
        : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
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

    // Create new marker
    const marker = new window.google.maps.Marker({
      position,
      map,
      title: type === 'home' ? 'Home (FROM)' : 'Office (TO)',
      icon: markerIcon,
      draggable: true
    });

    // Add drag listener
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

    // Set marker and position
    if (type === 'home') {
      setHomeMarker(marker);
      setHomePosition(position);
      reverseGeocode(position, 'home');
    } else {
      setOfficeMarker(marker);
      setOfficePosition(position);
      reverseGeocode(position, 'office');
    }

    // Clear active location
    setActiveLocation(null);
  };

  const reverseGeocode = (position, type) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        if (type === 'home') {
          setHomeAddress(address);
          if (onLocationSelect) onLocationSelect('home', address);
        } else {
          setOfficeAddress(address);
          if (onLocationSelect) onLocationSelect('office', address);
        }
      }
    });
  };

  const searchPlaces = async () => {
    if (!searchQuery.trim() || !window.google || !window.google.maps) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Use Places API for better search results like Google Maps
      if (map && window.google.maps.places) {
        const placesService = new window.google.maps.places.PlacesService(map);
        
        // Create a text search request
        const request = {
          query: searchQuery,
          fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types'],
          location: map.getCenter(),
          radius: 50000 // 50km radius
        };

        placesService.textSearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
            // Map results to our format
            const placesResults = results.slice(0, 10).map(place => ({
              name: place.name,
              geometry: { location: place.geometry.location },
              formatted_address: place.formatted_address,
              place_id: place.place_id,
              types: place.types
            }));
            
            console.log('Places API results:', placesResults);
            setSearchResults(placesResults);
            setIsSearching(false);
          } else {
            // Fallback to geocoding if Places API fails
            fallbackToGeocoding();
          }
        });
      } else {
        // Fallback to geocoding if Places API is not available
        fallbackToGeocoding();
      }
    } catch (error) {
      console.error('Search error:', error);
      fallbackToGeocoding();
    }
  };

  const fallbackToGeocoding = () => {
      const geocoder = new window.google.maps.Geocoder();
      
      // Try multiple search variations to get comprehensive results
      const searchVariations = [
        searchQuery,
        `${searchQuery}, Singapore`,
      `${searchQuery}, Malaysia`
    ];

    let allResults = [];
    let completedRequests = 0;

    searchVariations.forEach((query, index) => {
      geocoder.geocode({ address: query }, (results, status) => {
        completedRequests++;
        
        if (status === 'OK' && results.length > 0) {
          // Filter out generic results and add to collection
          const filteredResults = results.filter(result => {
            const address = result.formatted_address.toLowerCase();
            // Filter out country-only results
            const isCountryOnly = address.includes('singapore') && !address.includes(',');
            return !isCountryOnly;
          });

          allResults = allResults.concat(filteredResults);
        }

        // When all requests are complete, process results
        if (completedRequests === searchVariations.length) {
          // Remove duplicates based on place_id
          const uniqueResults = allResults.filter((result, index, self) => 
            index === self.findIndex(r => r.place_id === result.place_id)
          );

          // Sort by relevance (exact matches first)
          const sortedResults = uniqueResults.sort((a, b) => {
              const aAddress = a.formatted_address.toLowerCase();
              const bAddress = b.formatted_address.toLowerCase();
              const query = searchQuery.toLowerCase();
              
            // Prioritize exact matches
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

          console.log('Geocoding results:', geocodeData);
          setSearchResults(geocodeData);
          setIsSearching(false);
        }
      });
    });
  };

  const selectSearchResult = (place) => {
    if (!activeLocation) return;

    console.log('Selected place:', place);
    console.log('Active location:', activeLocation);

    // Check if this is a "no results" placeholder
    if (!place.geometry || !place.geometry.location) {
      console.log('Invalid place selected:', place);
      return;
    }

    const position = place.geometry.location;
    const address = place.formatted_address || place.formattedAddress || place.name || 'Selected Location';
    
    // Place marker on map
    placeMarker(position, activeLocation);
    
    // Update location state
    handleLocationSelect(activeLocation, address);
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    
    // Center map on selected location and show both markers
    if (map) {
      map.setCenter(position);
      map.setZoom(15);
      
      // Fit bounds to show both markers if both exist
      if (homePosition && officePosition) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(homePosition);
        bounds.extend(officePosition);
        map.fitBounds(bounds);
        map.setZoom(Math.min(map.getZoom(), 15)); // Don't zoom too far out
      }
    }
  };

  const handleLocationSelect = (type, address) => {
    if (type === 'home') {
      setHomeAddress(address);
    } else {
      setOfficeAddress(address);
    }

    if (onLocationSelect) {
      onLocationSelect(type, address);
    }
  };

  const addMarker = (position, title, type) => {
    if (!map) return;

    const marker = new window.google.maps.Marker({
      position,
      map,
      title,
      icon: {
        url: type === 'home' 
          ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    return marker;
  };

    return (
    <div className="space-y-6">
      {/* Interactive Map Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">How to Set Your Commute Route</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. <strong>Search</strong> for your home location and tap "Set Home Location"</p>
          <p>2. <strong>Search</strong> for your office location and tap "Set Office Location"</p>
          <p>3. <strong>Drag</strong> the markers to adjust to exact positions</p>
          <p>4. <strong>Calculate Route</strong> to see your commute path and distance</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>🏠 FROM (Home)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span>🏢 TO (Office)</span>
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
              // Auto-search as user types (with debounce)
              if (e.target.value.trim()) {
                clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => {
                  searchPlaces();
                }, 300); // 300ms delay to avoid too many API calls
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
              // Check if this is a "no results" placeholder
              const isNoResults = !place.geometry || !place.geometry.location;
              
              // Get place type icon
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
                  {apiError.includes('Billing not enabled') && (
                    <p className="mt-2">
                      <a 
                        href="https://console.cloud.google.com/project/_/billing/enable" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-red-800"
                      >
                        Enable Billing in Google Cloud Console
                      </a>
                    </p>
                  )}
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
    </div>
  );
};

export default LocationSelector; 