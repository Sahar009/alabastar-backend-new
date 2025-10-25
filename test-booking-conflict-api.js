// Test script for booking conflict API
const testBookingConflictAPI = async () => {
  try {
    // First, let's test with a mock provider ID
    const providerId = "test-provider-id";
    
    const response = await fetch(`http://localhost:8000/api/bookings/active/${providerId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

testBookingConflictAPI();
