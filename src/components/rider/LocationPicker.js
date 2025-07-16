import React, { useState, useRef, useEffect } from 'react';
import { useRide } from '../../contexts/RideContext';
import Button from '../common/Button';
import Input from '../common/Input';

const LocationPicker = ({ onLocationsSet }) => {
  const {
    pickupLocation,
    destinationLocation,
    setPickup,
    setDestination,
    swapLocations,
    clearLocations,
    estimatedFare
  } = useRide();

  const [pickupInput, setPickupInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [loadingGeocode, setLoadingGeocode] = useState(false);

  const pickupInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const autocompleteService = useRef(null);
  const geocoderService = useRef(null);

  // Initialize Google Maps services
  useEffect(() => {
    if (window.google?.maps) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      geocoderService.current = new window.google.maps.Geocoder();
    } else {
      // Load Google Maps API if not already loaded
      loadGoogleMapsAPI();
    }
  }, []);

  // Update input values when locations change
  useEffect(() => {
    if (pickupLocation) {
      setPickupInput(pickupLocation.address);
    }
  }, [pickupLocation]);

  useEffect(() => {
    if (destinationLocation) {
      setDestinationInput(destinationLocation.address);
    }
  }, [destinationLocation]);

  const loadGoogleMapsAPI = () => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        geocoderService.current = new window.google.maps.Geocoder();
      };
      document.head.appendChild(script);
    }
  };

  // Get place suggestions from Google Places API
  const getPlaceSuggestions = async (input, callback) => {
    if (!input.trim() || !autocompleteService.current) {
      callback([]);
      return;
    }

    const request = {
      input: input,
      types: ['establishment', 'geocode'],
      componentRestrictions: { country: 'us' }, // Restrict to US for now
    };

    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        const suggestions = predictions.slice(0, 5).map(prediction => ({
          placeId: prediction.place_id,
          address: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text
        }));
        callback(suggestions);
      } else {
        callback([]);
      }
    });
  };

  // Get coordinates for a place using place ID
  const getPlaceDetails = async (placeId) => {
    return new Promise((resolve, reject) => {
      if (!geocoderService.current) {
        reject(new Error('Geocoder service not available'));
        return;
      }

      geocoderService.current.geocode({ placeId }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const place = results[0];
          const location = {
            address: place.formatted_address,
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            placeId: placeId
          };
          resolve(location);
        } else {
          reject(new Error('Failed to get place details'));
        }
      });
    });
  };

  // Handle pickup input changes
  const handlePickupInputChange = (e) => {
    const value = e.target.value;
    setPickupInput(value);
    
    if (value.length > 2) {
      getPlaceSuggestions(value, (suggestions) => {
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(true);
      });
    } else {
      setShowPickupSuggestions(false);
    }
  };

  // Handle destination input changes
  const handleDestinationInputChange = (e) => {
    const value = e.target.value;
    setDestinationInput(value);
    
    if (value.length > 2) {
      getPlaceSuggestions(value, (suggestions) => {
        setDestinationSuggestions(suggestions);
        setShowDestinationSuggestions(true);
      });
    } else {
      setShowDestinationSuggestions(false);
    }
  };

  // Handle pickup selection
  const handlePickupSelect = async (suggestion) => {
    setLoadingGeocode(true);
    try {
      const location = await getPlaceDetails(suggestion.placeId);
      setPickup(location);
      setPickupInput(suggestion.address);
      setShowPickupSuggestions(false);
    } catch (error) {
      console.error('Error getting pickup location details:', error);
    } finally {
      setLoadingGeocode(false);
    }
  };

  // Handle destination selection
  const handleDestinationSelect = async (suggestion) => {
    setLoadingGeocode(true);
    try {
      const location = await getPlaceDetails(suggestion.placeId);
      setDestination(location);
      setDestinationInput(suggestion.address);
      setShowDestinationSuggestions(false);
    } catch (error) {
      console.error('Error getting destination location details:', error);
    } finally {
      setLoadingGeocode(false);
    }
  };

  // Use current location for pickup
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setLoadingGeocode(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          geocoderService.current.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                const location = {
                  address: results[0].formatted_address,
                  coordinates: { lat: latitude, lng: longitude },
                  placeId: results[0].place_id
                };
                setPickup(location);
                setPickupInput(location.address);
              } else {
                console.error('Failed to reverse geocode current location');
              }
              setLoadingGeocode(false);
            }
          );
        } catch (error) {
          console.error('Error using current location:', error);
          setLoadingGeocode(false);
        }
      },
      (error) => {
        console.error('Error getting current location:', error);
        alert('Unable to get your current location');
        setLoadingGeocode(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleSwapLocations = () => {
    swapLocations();
    // Swap input values too
    const tempInput = pickupInput;
    setPickupInput(destinationInput);
    setDestinationInput(tempInput);
  };

  const handleClearLocations = () => {
    clearLocations();
    setPickupInput('');
    setDestinationInput('');
    setShowPickupSuggestions(false);
    setShowDestinationSuggestions(false);
  };

  const SuggestionItem = ({ suggestion, onSelect }) => (
    <div
      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
      onClick={() => onSelect(suggestion)}
    >
      <div className="font-medium text-gray-900">{suggestion.mainText}</div>
      <div className="text-sm text-gray-600">{suggestion.secondaryText}</div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Where to?</h3>
        {(pickupLocation || destinationLocation) && (
          <Button
            variant="ghost"
            size="small"
            onClick={handleClearLocations}
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Pickup Location */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup Location
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <Input
              ref={pickupInputRef}
              type="text"
              placeholder="Enter pickup location"
              value={pickupInput}
              onChange={handlePickupInputChange}
              onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
              className="pl-10"
              disabled={loadingGeocode}
            />
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={loadingGeocode}
              className="absolute right-2 top-2 p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              title="Use current location"
            >
              📍
            </button>
          </div>
          
          {/* Pickup Suggestions */}
          {showPickupSuggestions && pickupSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
              {pickupSuggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={`pickup-${index}`}
                  suggestion={suggestion}
                  onSelect={handlePickupSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        {pickupLocation && destinationLocation && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwapLocations}
              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              title="Swap pickup and destination"
            >
              ⇅
            </button>
          </div>
        )}

        {/* Destination Location */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            <Input
              ref={destinationInputRef}
              type="text"
              placeholder="Where are you going?"
              value={destinationInput}
              onChange={handleDestinationInputChange}
              onFocus={() => destinationSuggestions.length > 0 && setShowDestinationSuggestions(true)}
              className="pl-10"
              disabled={loadingGeocode}
            />
          </div>
          
          {/* Destination Suggestions */}
          {showDestinationSuggestions && destinationSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
              {destinationSuggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={`destination-${index}`}
                  suggestion={suggestion}
                  onSelect={handleDestinationSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Estimated Fare Display */}
        {pickupLocation && destinationLocation && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-blue-700">Estimated Fare</span>
                <div className="text-2xl font-bold text-blue-900">
                  ${estimatedFare.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-600">
                  {pickupLocation.address.split(',')[0]} → {destinationLocation.address.split(',')[0]}
                </div>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => onLocationsSet && onLocationsSet()}
                  className="mt-2"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Location Options */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Options</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                setDestinationInput('Airport');
                getPlaceSuggestions('Airport', (suggestions) => {
                  if (suggestions.length > 0) {
                    handleDestinationSelect(suggestions[0]);
                  }
                });
              }}
            >
              <div className="font-medium text-gray-900">🛫 Airport</div>
              <div className="text-sm text-gray-600">Quick airport ride</div>
            </button>
            <button
              type="button"
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => {
                setDestinationInput('Downtown');
                getPlaceSuggestions('Downtown', (suggestions) => {
                  if (suggestions.length > 0) {
                    handleDestinationSelect(suggestions[0]);
                  }
                });
              }}
            >
              <div className="font-medium text-gray-900">🏙️ Downtown</div>
              <div className="text-sm text-gray-600">City center</div>
            </button>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loadingGeocode && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-2 text-sm text-gray-600">Getting location...</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 