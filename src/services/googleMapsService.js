// Google Maps Service
// Safely handles Google Maps API integration using environment variables

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    this.mapId = process.env.REACT_APP_GOOGLE_MAPS_MAP_ID;
    this.isLoaded = false;
    this.loadPromise = null;
  }

  // Check if API key is available
  isApiKeyAvailable() {
    if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
      console.warn('Google Maps API key not configured. Please set REACT_APP_GOOGLE_MAPS_API_KEY in your .env file.');
      return false;
    }
    return true;
  }

  // Load Google Maps JavaScript API
  loadGoogleMapsAPI() {
    if (!this.isApiKeyAvailable()) {
      return Promise.reject(new Error('Google Maps API key not configured'));
    }

    if (this.isLoaded) {
      return Promise.resolve(window.google);
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        this.isLoaded = true;
        resolve(window.google);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,geometry&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      // Set up callback
      window.initGoogleMaps = () => {
        this.isLoaded = true;
        delete window.initGoogleMaps;
        resolve(window.google);
      };

      // Handle errors
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      // Add script to head
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  // Get API configuration
  getConfig() {
    return {
      apiKey: this.apiKey,
      mapId: this.mapId,
      libraries: ['places', 'geometry'],
    };
  }

  // Initialize a map
  async initializeMap(container, options = {}) {
    if (!this.isApiKeyAvailable()) {
      throw new Error('Google Maps API key not configured');
    }

    await this.loadGoogleMapsAPI();

    const defaultOptions = {
      zoom: 13,
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco default
      mapId: this.mapId,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
    };

    const mapOptions = { ...defaultOptions, ...options };
    return new window.google.maps.Map(container, mapOptions);
  }

  // Get user's current location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              // handle default case
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  // Geocode an address
  async geocodeAddress(address) {
    if (!this.isApiKeyAvailable()) {
      throw new Error('Google Maps API key not configured');
    }

    await this.loadGoogleMapsAPI();

    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          resolve({
            location: results[0].geometry.location.toJSON(),
            formattedAddress: results[0].formatted_address,
            placeId: results[0].place_id,
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  // Calculate distance between two points
  async calculateDistance(origin, destination) {
    if (!this.isApiKeyAvailable()) {
      throw new Error('Google Maps API key not configured');
    }

    await this.loadGoogleMapsAPI();

    return new Promise((resolve, reject) => {
      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
      }, (response, status) => {
        if (status === 'OK') {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            resolve({
              distance: element.distance,
              duration: element.duration,
            });
          } else {
            reject(new Error(`Distance calculation failed: ${element.status}`));
          }
        } else {
          reject(new Error(`Distance matrix service failed: ${status}`));
        }
      });
    });
  }
}

// Create and export a singleton instance
export const googleMapsService = new GoogleMapsService();
export default googleMapsService; 