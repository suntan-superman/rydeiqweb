import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

import googleMapsService from '../../services/googleMapsService';

// Completely isolated input component that bypasses React's reconciliation
const StablePlacesInput = forwardRef(({ 
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
}, ref) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const initialized = useRef(false);
  const currentValue = useRef(value);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);
  const suggestionsContainer = useRef(null);
  const searchModeRef = useRef(facilitiesOnly ? 'facilities' : 'addresses');
  const toggleButtonRef = useRef(null);

  // Expose input ref to parent
  useImperativeHandle(ref, () => inputRef.current);

  // Initialize component only once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeComponent = async () => {
      try {
        // Load Google Maps API
        await googleMapsService.loadGoogleMapsAPI();

        if (window.google?.maps?.places) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          
          if (window.google.maps.places.Place) {
            console.log('Using new Google Maps Place API for details');
          } else {
            const map = new window.google.maps.Map(document.createElement('div'));
            placesService.current = new window.google.maps.places.PlacesService(map);
          }
        }

        // Create the actual DOM elements
        createDOMElements();
        setupEventListeners();
        
      } catch (error) {
        console.warn('Google Maps API not available:', error.message);
        createDOMElements(); // Create fallback input
      }
    };

    initializeComponent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createDOMElements = () => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = ''; // Clear any existing content

    // Create label if provided
    if (label) {
      const labelEl = document.createElement('label');
      labelEl.htmlFor = id;
      labelEl.className = 'block text-sm font-medium text-gray-700 mb-2';
      labelEl.textContent = label;
      if (required) {
        const asterisk = document.createElement('span');
        asterisk.className = 'text-red-500 ml-1';
        asterisk.textContent = '*';
        labelEl.appendChild(asterisk);
      }
      container.appendChild(labelEl);
    }

    // Create input wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'relative';

    // Create icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none';
    
    // Create icon (simplified - using text icon instead of heroicons for DOM creation)
    const icon = document.createElement('div');
    icon.className = 'w-4 h-4 text-gray-400 flex items-center justify-center text-lg';
    icon.innerHTML = '📍'; // Using emoji as fallback
    iconContainer.appendChild(icon);

    // Create toggle button for facilities only mode
    if (facilitiesOnly) {
      const toggleContainer = document.createElement('div');
      toggleContainer.className = 'absolute inset-y-0 right-0 pr-3 flex items-center';
      
      const toggleButton = document.createElement('button');
      toggleButton.type = 'button';
      toggleButton.className = `
        px-2 py-1 text-xs font-medium rounded border transition-colors
        ${searchModeRef.current === 'facilities' 
          ? 'bg-green-100 text-green-700 border-green-300' 
          : 'bg-gray-100 text-gray-600 border-gray-300'}
      `.trim();
      toggleButton.innerHTML = searchModeRef.current === 'facilities' ? '🏥 Facilities' : '📍 Addresses';
      toggleButton.title = searchModeRef.current === 'facilities' 
        ? 'Switch to address search' 
        : 'Switch to healthcare facility search';
      
      toggleButtonRef.current = toggleButton;
      toggleContainer.appendChild(toggleButton);
      inputWrapper.appendChild(toggleContainer);
    }

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.value = currentValue.current;
    input.placeholder = placeholder;
    input.disabled = disabled;
    input.autoComplete = 'off';
    input.className = `
      w-full pl-10 py-2 border border-gray-300 rounded-md 
      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
      disabled:bg-gray-50 disabled:text-gray-500
      ${facilitiesOnly ? 'pr-24' : 'pr-12'}
      ${className}
    `.trim();

    inputRef.current = input;

    // Create suggestions container
    const suggestions = document.createElement('div');
    suggestions.className = 'absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg hidden';
    suggestions.style.display = 'none';
    suggestionsContainer.current = suggestions;

    // Assemble elements
    inputWrapper.appendChild(iconContainer);
    inputWrapper.appendChild(input);
    inputWrapper.appendChild(suggestions);
    container.appendChild(inputWrapper);
  };

  const setupEventListeners = () => {
    if (!inputRef.current) return;

    const input = inputRef.current;

    // Input change handler
    const handleInput = (e) => {
      const newValue = e.target.value;
      currentValue.current = newValue;
      
      if (onChange) {
        onChange(newValue);
      }

      // Clear previous timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Debounced suggestions
      debounceTimer.current = setTimeout(() => {
        getPlaceSuggestions(newValue);
      }, 300);
    };

    // Focus handler
    const handleFocus = () => {
      if (suggestionsContainer.current && suggestionsContainer.current.children.length > 0) {
        suggestionsContainer.current.style.display = 'block';
      }
    };

    // Blur handler (delayed to allow for suggestion clicks)
    const handleBlur = () => {
      setTimeout(() => {
        if (suggestionsContainer.current) {
          suggestionsContainer.current.style.display = 'none';
        }
      }, 150);
    };

    // Keyboard handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (suggestionsContainer.current) {
          suggestionsContainer.current.style.display = 'none';
        }
        input.blur();
      }
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    input.addEventListener('keydown', handleKeyDown);

    // Toggle button handler
    const handleToggle = () => {
      const newMode = searchModeRef.current === 'facilities' ? 'addresses' : 'facilities';
      searchModeRef.current = newMode;
      
      // Update button appearance
      if (toggleButtonRef.current) {
        toggleButtonRef.current.className = `
          px-2 py-1 text-xs font-medium rounded border transition-colors
          ${newMode === 'facilities' 
            ? 'bg-green-100 text-green-700 border-green-300' 
            : 'bg-gray-100 text-gray-600 border-gray-300'}
        `.trim();
        toggleButtonRef.current.innerHTML = newMode === 'facilities' ? '🏥 Facilities' : '📍 Addresses';
        toggleButtonRef.current.title = newMode === 'facilities' 
          ? 'Switch to address search' 
          : 'Switch to healthcare facility search';
      }
      
      // Re-search with current input if there's text
      if (currentValue.current && currentValue.current.trim().length >= 2) {
        getPlaceSuggestions(currentValue.current);
      }
    };

    if (toggleButtonRef.current) {
      toggleButtonRef.current.addEventListener('click', handleToggle);
    }

    // Cleanup function
    return () => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
      input.removeEventListener('keydown', handleKeyDown);
      if (toggleButtonRef.current) {
        toggleButtonRef.current.removeEventListener('click', handleToggle);
      }
    };
  };

  // Enhanced healthcare facility detection
  const isHealthcareFacility = (prediction) => {
    if (!prediction) return false;
    
    // Check place types
    const healthcareTypes = [
      'hospital', 'doctor', 'health', 'pharmacy', 'physiotherapist', 
      'dentist', 'veterinary_care', 'medical_lab', 'dialysis',
      'rehabilitation_center', 'medical_center', 'clinic', 'urgent_care',
      'assisted_living', 'nursing_home', 'mental_health'
    ];
    
    const hasHealthcareType = prediction.types?.some(type => 
      healthcareTypes.some(healthType => type.toLowerCase().includes(healthType))
    );
    
    // Check description text for healthcare keywords
    const description = (prediction.description || '').toLowerCase();
    const mainText = (prediction.structured_formatting?.main_text || '').toLowerCase();
    const healthcareKeywords = [
      'hospital', 'medical', 'clinic', 'doctor', 'pharmacy', 'dialysis',
      'rehabilitation', 'therapy', 'urgent care', 'emergency', 'health',
      'dental', 'dentist', 'orthopedic', 'cardiology', 'oncology',
      'pediatric', 'psychiatric', 'radiology', 'surgery', 'imaging',
      'lab', 'laboratory', 'wellness', 'care center', 'assisted living',
      'nursing', 'senior', 'veteran', 'kaiser', 'dignity', 'adventist'
    ];
    
    const hasHealthcareKeyword = healthcareKeywords.some(keyword => 
      description.includes(keyword) || mainText.includes(keyword)
    );
    
    return hasHealthcareType || hasHealthcareKeyword;
  };

  const getPlaceSuggestions = async (input) => {
    if (!input.trim() || input.length < 2 || !autocompleteService.current) {
      if (suggestionsContainer.current) {
        suggestionsContainer.current.innerHTML = '';
        suggestionsContainer.current.style.display = 'none';
      }
      return;
    }

    try {
      const currentMode = facilitiesOnly ? searchModeRef.current : 'addresses';
      const request = {
        input: input.trim(),
        types: currentMode === 'facilities' ? ['establishment'] : ['address'],
        componentRestrictions: { country: 'us' },
        locationBias: {
          radius: 50000,
          center: { lat: 35.3733, lng: -119.0187 } // Bakersfield, CA
        }
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          let processedPredictions = predictions;
          
          // If in facilities mode, prioritize healthcare facilities
          if (currentMode === 'facilities') {
            processedPredictions = predictions.sort((a, b) => {
              const aIsHealthcare = isHealthcareFacility(a);
              const bIsHealthcare = isHealthcareFacility(b);
              
              // Healthcare facilities first
              if (aIsHealthcare && !bIsHealthcare) return -1;
              if (!aIsHealthcare && bIsHealthcare) return 1;
              return 0;
            });
            
            // If in facilities mode but no healthcare facilities found, try address search as fallback
            const healthcareFacilities = processedPredictions.filter(p => isHealthcareFacility(p));
            if (healthcareFacilities.length === 0) {
              // Fallback: try address search for specific street addresses
              const fallbackRequest = {
                input: input.trim(),
                types: ['address'],
                componentRestrictions: { country: 'us' },
                locationBias: {
                  radius: 50000,
                  center: { lat: 35.3733, lng: -119.0187 }
                }
              };
              
              autocompleteService.current.getPlacePredictions(fallbackRequest, (fallbackPredictions, fallbackStatus) => {
                if (fallbackStatus === window.google.maps.places.PlacesServiceStatus.OK && fallbackPredictions) {
                  displaySuggestions(fallbackPredictions.slice(0, 8));
                }
              });
              return;
            }
          }
          
          displaySuggestions(processedPredictions.slice(0, 8)); // Show more results for healthcare
        } else {
          // If facilities search failed, try address search as fallback
          if (currentMode === 'facilities') {
            const fallbackRequest = {
              input: input.trim(),
              types: ['address'],
              componentRestrictions: { country: 'us' },
              locationBias: {
                radius: 50000,
                center: { lat: 35.3733, lng: -119.0187 }
              }
            };
            
            autocompleteService.current.getPlacePredictions(fallbackRequest, (fallbackPredictions, fallbackStatus) => {
              if (fallbackStatus === window.google.maps.places.PlacesServiceStatus.OK && fallbackPredictions) {
                displaySuggestions(fallbackPredictions.slice(0, 8));
              } else {
                if (suggestionsContainer.current) {
                  suggestionsContainer.current.innerHTML = '';
                  suggestionsContainer.current.style.display = 'none';
                }
              }
            });
          } else {
            if (suggestionsContainer.current) {
              suggestionsContainer.current.innerHTML = '';
              suggestionsContainer.current.style.display = 'none';
            }
          }
        }
      });
    } catch (error) {
      console.error('Error getting place suggestions:', error);
    }
  };

  const displaySuggestions = (predictions) => {
    if (!suggestionsContainer.current) return;

    const container = suggestionsContainer.current;
    container.innerHTML = '';

    predictions.forEach(prediction => {
      const suggestionEl = document.createElement('div');
      suggestionEl.className = 'p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors';
      
      const isHealthcare = isHealthcareFacility(prediction);

      suggestionEl.innerHTML = `
        <div class="flex items-start space-x-3">
          <div class="mt-1">
            ${isHealthcare ? 
              '<div class="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center"><div class="w-2 h-2 bg-green-500 rounded-full"></div></div>' :
              '<div class="w-4 h-4 text-gray-400">📍</div>'
            }
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 truncate">${prediction.structured_formatting.main_text}</div>
            <div class="text-sm text-gray-600 truncate">${prediction.structured_formatting.secondary_text || ''}</div>
            ${isHealthcare ? '<div class="text-xs text-green-600 mt-1">Healthcare Facility</div>' : ''}
          </div>
        </div>
      `;

      suggestionEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectSuggestion(prediction);
      });

      container.appendChild(suggestionEl);
    });

    container.style.display = 'block';
  };

  const selectSuggestion = async (prediction) => {
    if (!inputRef.current) return;

    const address = prediction.description;
    inputRef.current.value = address;
    currentValue.current = address;

    if (suggestionsContainer.current) {
      suggestionsContainer.current.style.display = 'none';
    }

    // Focus back to input
    inputRef.current.focus();

    try {
      const placeDetails = await getPlaceDetails(prediction.place_id);
      
      if (onChange) {
        onChange(address);
      }
      
      if (onPlaceSelect) {
        onPlaceSelect(placeDetails);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const getPlaceDetails = async (placeId) => {
    return new Promise((resolve, reject) => {
      if (window.google.maps.places.Place) {
        // Use new Place API
        const place = new window.google.maps.places.Place({ id: placeId });
        const request = {
          fields: ['displayName', 'formattedAddress', 'location', 'types']
        };

        place.fetchFields(request).then((placeResult) => {
          resolve({
            address: placeResult.place.formattedAddress,
            coordinates: {
              lat: placeResult.place.location.lat(),
              lng: placeResult.place.location.lng()
            },
            name: placeResult.place.displayName,
            types: placeResult.place.types
          });
        }).catch(reject);
      } else {
        // Use legacy PlacesService
        const request = {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'types']
        };

        placesService.current.getDetails(request, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve({
              address: place.formatted_address,
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              name: place.name,
              types: place.types
            });
          } else {
            reject(new Error(`Places service failed: ${status}`));
          }
        });
      }
    });
  };

  // Update value from props (only if different)
  useEffect(() => {
    if (inputRef.current && currentValue.current !== value) {
      inputRef.current.value = value;
      currentValue.current = value;
    }
  }, [value]);

  return <div ref={containerRef} className="w-full" />;
});

StablePlacesInput.displayName = 'StablePlacesInput';

export default StablePlacesInput;
