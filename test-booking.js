import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testBooking = {
  providerId: 'test-provider-id',
  serviceId: 'test-service-id',
  scheduledAt: '2024-01-15T10:00:00Z',
  locationAddress: '123 Test Street',
  locationCity: 'Lagos',
  locationState: 'Lagos',
  latitude: 6.5244,
  longitude: 3.3792,
  totalAmount: 5000,
  notes: 'Test booking'
};

async function testBookingEndpoints() {
  try {
    console.log('🧪 Testing Booking Endpoints...\n');

    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);

    // Test 2: Login to get token
    console.log('\n2. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      
      const token = loginData.data?.token;
      if (token) {
        console.log('✅ Token received');
        
        // Test 3: Create booking
        console.log('\n3. Testing create booking...');
        const bookingResponse = await fetch(`${BASE_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(testBooking)
        });
        
        const bookingData = await bookingResponse.json();
        console.log('📝 Create booking response:', bookingData.message);
        
        if (bookingResponse.ok) {
          console.log('✅ Booking created successfully');
          
          // Test 4: Get bookings
          console.log('\n4. Testing get bookings...');
          const getBookingsResponse = await fetch(`${BASE_URL}/bookings`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const getBookingsData = await getBookingsResponse.json();
          console.log('📋 Get bookings response:', getBookingsData.message);
          
          if (getBookingsResponse.ok) {
            console.log('✅ Bookings retrieved successfully');
          } else {
            console.log('❌ Failed to get bookings');
          }
        } else {
          console.log('❌ Failed to create booking');
        }
      } else {
        console.log('❌ No token received');
      }
    } else {
      console.log('❌ Login failed');
    }

    // Test 5: Test provider availability
    console.log('\n5. Testing provider availability...');
    const availabilityResponse = await fetch(`${BASE_URL}/bookings/provider/test-provider-id/availability?date=2024-01-15`);
    const availabilityData = await availabilityResponse.json();
    console.log('📅 Provider availability response:', availabilityData.message);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testBookingEndpoints();























