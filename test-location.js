// Simple test script for location API
import fetch from 'node-fetch';

const testLocationAPI = async () => {
  try {
    console.log('Testing location API...');
    
    // Test reverse geocoding
    const response = await fetch('http://localhost:8000/api/location/reverse?lat=7.444797&lon=3.8341669999999994');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error testing location API:', error);
  }
};

testLocationAPI();






