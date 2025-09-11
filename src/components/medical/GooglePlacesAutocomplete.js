import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { MapPinIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import googleMapsService from '../../services/googleMapsService';

const GooglePlacesAutocomplete = ({ 
  value = '', 
  onChange, 
  onPlaceSelect,
  placeholder = 'Enter address...',
  label,
  required = false,
  disabled = false,
  className = '',
  facilitiesOnly = false,
  id
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [isInternalUpdate, setIsInternalUpdate] = useState(false);
  
  const inputRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);
  const [useNewAPI, setUseNewAPI] = useState(false);
  const focusPreservationRef = useRef(false);

  // Initialize Google Maps services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await googleMapsService.loadGoogleMapsAPI();
        
        if (window.google?.maps?.places) {
          // Temporarily use legacy API until new API documentation is clearer
          // TODO: Re-enable new AutocompleteSuggestion API once parameter requirements are stable
          if (false && window.google.maps.places.AutocompleteSuggestion) {
            setUseNewAPI(true);
            console.log('Using new Google Maps AutocompleteSuggestion API');
          } else {
            // Use legacy AutocompleteService (still supported until March 2025+)
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            console.log('Using legacy Google Maps AutocompleteService API (stable)');
          }
          
          // Use new Place API if available, fallback to PlacesService
          if (window.google.maps.places.Place) {
            console.log('Using new Google Maps Place API for details');
          } else {
            // Create a dummy map for PlacesService (required by legacy API)
            const map = new window.google.maps.Map(document.createElement('div'));
            placesService.current = new window.google.maps.places.PlacesService(map);
            console.log('Using legacy Google Maps PlacesService API');
          }
        }
      } catch (error) {
        console.warn('Google Maps API not available:', error.message);
      }
    };

    initializeServices();
  }, []);

  // Update input value when prop changes (but preserve focus)
  useEffect(() => {
    if (!isInternalUpdate) {
      // Check if input currently has focus
      const wasFocused = inputRef.current === document.activeElement;
      focusPreservationRef.current = wasFocused;
      
      setInputValue(value);
      
      // Restore focus if it was focused before
      if (wasFocused && inputRef.current) {
        setTimeout(() => {
          inputRef.current.focus();
        }, 0);
      }
    }
    setIsInternalUpdate(false);
  }, [value, isInternalUpdate]);

  // Focus preservation effect - runs after every render
  useEffect(() => {
    if (focusPreservationRef.current && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  });

  // Get place suggestions from Google Places API (with new/legacy API support)
  const getPlaceSuggestions = useCallback(async (input) => {
    if (!input.trim() || input.length < 2) {
      setSuggestions([]);
      return;
    }

    // Check if we can use either API
    if (!useNewAPI && !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      if (useNewAPI && window.google?.maps?.places?.AutocompleteSuggestion) {
        // Use new AutocompleteSuggestion API with minimal parameters
        const request = {
          input: input
          // Using minimal request to avoid parameter validation issues
          // Will add more parameters once we confirm what's supported
        };

        const { suggestions: newSuggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        
        const suggestionList = newSuggestions.slice(0, 5).map(suggestion => ({
          placeId: suggestion.placePrediction?.placeId || suggestion.queryPrediction?.placeId,
          address: suggestion.placePrediction?.text?.text || suggestion.queryPrediction?.text?.text,
          mainText: suggestion.placePrediction?.structuredFormat?.mainText?.text || suggestion.queryPrediction?.text?.text,
          secondaryText: suggestion.placePrediction?.structuredFormat?.secondaryText?.text || '',
          types: suggestion.placePrediction?.types || []
        }));
        
        setSuggestions(suggestionList);
        setShowSuggestions(true);
        setIsLoading(false);
      } else {
        // Fallback to legacy AutocompleteService
        const request = {
          input: input,
          types: facilitiesOnly ? ['establishment'] : ['establishment', 'geocode'],
          componentRestrictions: { country: 'us' },
          ...(facilitiesOnly && {
            types: ['hospital', 'doctor', 'health', 'pharmacy', 'physiotherapist']
          })
        };

        autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const suggestionList = predictions.slice(0, 5).map(prediction => ({
              placeId: prediction.place_id,
              address: prediction.description,
              mainText: prediction.structured_formatting.main_text,
              secondaryText: prediction.structured_formatting.secondary_text,
              types: prediction.types
            }));
            setSuggestions(suggestionList);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
          setIsLoading(false);
        });
      }
    } catch (error) {
      console.error('Error getting place suggestions:', error);
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [facilitiesOnly, useNewAPI]);

  // Get detailed place information using new Place API or legacy PlacesService
  const getPlaceDetails = useCallback(async (placeId) => {
    try {
      if (window.google?.maps?.places?.Place) {
        // Use new Place API
        const place = new window.google.maps.places.Place({
          id: placeId,
          requestedLanguage: 'en'
        });

        await place.fetchFields({
          fields: [
            'id',
            'formattedAddress',
            'location',
            'displayName',
            'types',
            'nationalPhoneNumber',
            'websiteURI'
          ]
        });

        const placeData = {
          placeId: place.id,
          address: place.formattedAddress,
          name: place.displayName,
          coordinates: {
            lat: place.location.lat(),
            lng: place.location.lng()
          },
          types: place.types,
          phone: place.nationalPhoneNumber,
          website: place.websiteURI,
          facilityName: place.types?.some(type => 
            ['hospital', 'doctor', 'health', 'pharmacy', 'physiotherapist'].includes(type)
          ) ? place.displayName : null
        };
        
        return placeData;
      } else {
        // Fallback to legacy PlacesService
        return new Promise((resolve, reject) => {
          if (!placesService.current) {
            reject(new Error('Places service not available'));
            return;
          }

          const request = {
            placeId: placeId,
            fields: [
              'place_id',
              'formatted_address', 
              'geometry.location',
              'name',
              'types',
              'formatted_phone_number',
              'website'
            ]
          };

          placesService.current.getDetails(request, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              const placeData = {
                placeId: place.place_id,
                address: place.formatted_address,
                name: place.name,
                coordinates: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                types: place.types,
                phone: place.formatted_phone_number,
                website: place.website,
                facilityName: place.types?.some(type => 
                  ['hospital', 'doctor', 'health', 'pharmacy', 'physiotherapist'].includes(type)
                ) ? place.name : null
              };
              resolve(placeData);
            } else {
              reject(new Error(`Failed to get place details: ${status}`));
            }
          });
        });
      }
    } catch (error) {
      throw new Error(`Error getting place details: ${error.message}`);
    }
  }, []);

  // Handle input changes with debouncing and focus preservation
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Mark as internal update and preserve focus state
    setIsInternalUpdate(true);
    focusPreservationRef.current = true;
    setInputValue(newValue);
    
    // Call onChange prop with stable reference
    if (onChange) {
      onChange(newValue);
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      getPlaceSuggestions(newValue);
    }, 300);
  }, [onChange, getPlaceSuggestions]);

  // Handle suggestion selection with focus preservation
  const handleSuggestionSelect = useCallback(async (suggestion) => {
    setInputValue(suggestion.address);
    setShowSuggestions(false);
    setIsLoading(true);

    // Preserve focus on input
    if (inputRef.current) {
      inputRef.current.focus();
    }

    try {
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      setSelectedCoordinates(placeDetails.coordinates);
      
      // Call onPlaceSelect with full place details
      if (onPlaceSelect) {
        onPlaceSelect(placeDetails);
      }
      
      // Call onChange with address
      if (onChange) {
        onChange(suggestion.address);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setIsLoading(false);
      // Ensure focus is maintained
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [getPlaceDetails, onPlaceSelect, onChange]);

  // Handle click outside to close suggestions without losing focus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the entire autocomplete container
      if (inputRef.current && !inputRef.current.parentElement.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input focus
  const handleFocus = useCallback(() => {
    focusPreservationRef.current = true;
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
    // Note: Arrow key navigation can be added here if needed
  }, []);

  // Use current location (only for pickup locations)
  const useCurrentLocation = useCallback(async () => {
    if (!placeholder.toLowerCase().includes('pickup')) return;

    setIsLoading(true);
    try {
      const currentLocation = await googleMapsService.getCurrentLocation();
      const geocodeResult = await googleMapsService.geocodeAddress(
        `${currentLocation.lat},${currentLocation.lng}`
      );

      setInputValue(geocodeResult.formattedAddress);
      setSelectedCoordinates(currentLocation);

      const locationData = {
        placeId: geocodeResult.placeId,
        address: geocodeResult.formattedAddress,
        coordinates: currentLocation,
        name: 'Current Location',
        types: ['current_location']
      };

      if (onPlaceSelect) {
        onPlaceSelect(locationData);
      }
      if (onChange) {
        onChange(geocodeResult.formattedAddress);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Unable to get your current location. Please ensure location permissions are enabled.');
    } finally {
      setIsLoading(false);
    }
  }, [placeholder, onChange, onPlaceSelect]);

  // Memoized suggestion item component with focus preservation
  const SuggestionItem = useMemo(() => React.memo(({ suggestion, onSelect }) => {
    const isHealthcareRelated = suggestion.types?.some(type => 
      ['hospital', 'doctor', 'health', 'pharmacy', 'physiotherapist'].includes(type)
    );

    const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onSelect(suggestion);
    };

    return (
      <div
        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
        onMouseDown={handleClick} // Use onMouseDown instead of onClick to prevent focus loss
      >
        <div className="flex items-start space-x-3">
          <div className="mt-1">
            {isHealthcareRelated ? (
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            ) : (
              <MapPinIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{suggestion.mainText}</div>
            <div className="text-sm text-gray-600 truncate">{suggestion.secondaryText}</div>
            {isHealthcareRelated && (
              <div className="text-xs text-green-600 mt-1">Healthcare Facility</div>
            )}
          </div>
        </div>
      </div>
    );
  }), []);

  return (
    <div className="relative" ref={inputRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-3 pointer-events-none">
          {selectedCoordinates ? (
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          ) : (
            <MapPinIcon className="w-4 h-4 text-gray-400" />
          )}
        </div>
        
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          autoComplete="off"
          suppressHydrationWarning={true}
          className={`
            w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md 
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${className}
          `}
        />

        {/* Current Location Button (only for pickup) */}
        {placeholder.toLowerCase().includes('pickup') && (
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={disabled || isLoading}
            className="absolute right-2 top-2 p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
            title="Use current location"
          >
            <GlobeAltIcon className="w-4 h-4" />
          </button>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute right-2 top-2 p-1">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <SuggestionItem
              key={`${suggestion.placeId}-${index}`}
              suggestion={suggestion}
              onSelect={handleSuggestionSelect}
            />
          ))}
        </div>
      )}

      {/* No suggestions message */}
      {showSuggestions && suggestions.length === 0 && inputValue.length > 2 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
          No locations found. Try a different search term.
        </div>
      )}
    </div>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps, nextProps) => {
  // Only re-render if essential props actually change
  return (
    prevProps.value === nextProps.value &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.label === nextProps.label &&
    prevProps.required === nextProps.required &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.facilitiesOnly === nextProps.facilitiesOnly &&
    prevProps.id === nextProps.id &&
    prevProps.className === nextProps.className
    // Note: we don't compare onChange and onPlaceSelect functions as they may change
  );
};

export default React.memo(GooglePlacesAutocomplete, arePropsEqual);
