import { messageHandler } from '../utils/index.js';
import { SUCCESS, BAD_REQUEST } from '../constants/statusCode.js';

class LocationController {
  async searchLocation(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.length < 3) {
        return messageHandler(res, BAD_REQUEST, 'Query must be at least 3 characters long');
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Nigeria')}&limit=5&countrycodes=ng&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Alabastar-App/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter for Nigerian locations
      const nigerianStates = [
        'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
        'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
        'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
        'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
        'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
      ];

      const filteredSuggestions = data
        .filter((item) => {
          const address = item.display_name.toLowerCase();
          return nigerianStates.some(state => 
            address.includes(state.toLowerCase())
          );
        })
        .map((item) => ({
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: item.address,
          city: item.address?.city || item.address?.town || item.address?.village || '',
          state: item.address?.state || '',
          country: item.address?.country || ''
        }));

      return messageHandler(res, SUCCESS, 'Locations retrieved successfully', {
        suggestions: filteredSuggestions
      });
    } catch (error) {
      console.error('Location search error:', error);
      return messageHandler(res, BAD_REQUEST, 'Failed to search locations');
    }
  }

  async reverseGeocode(req, res) {
    try {
      const { lat, lon } = req.query;
      
      console.log('Reverse geocoding request:', { lat, lon });
      
      if (!lat || !lon) {
        return messageHandler(res, BAD_REQUEST, 'Latitude and longitude are required');
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Alabastar-App/1.0'
          }
        }
      );

      console.log('Nominatim response status:', response.status);

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Nominatim response data:', data);
      
      if (data.address) {
        const location = {
          city: data.address.city || data.address.town || data.address.village || '',
          state: data.address.state || '',
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          address: data.display_name,
          country: data.address.country || ''
        };
        
        return messageHandler(res, SUCCESS, 'Location details retrieved successfully', location);
      } else {
        return messageHandler(res, BAD_REQUEST, 'No location found for the given coordinates');
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return messageHandler(res, BAD_REQUEST, 'Failed to get location details');
    }
  }
}

export default new LocationController();
