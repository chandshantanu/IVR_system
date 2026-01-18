const axios = require('axios');

async function testAPI() {
  try {
    // Test call history endpoint
    const response = await axios.get('http://localhost:3001/api/analytics/calls/history', {
      params: { limit: 3 }
    });

    console.log('Call History API Response:');
    console.log('Total calls:', response.data.total);
    console.log('\nFirst call data:');
    if (response.data.calls && response.data.calls.length > 0) {
      const firstCall = response.data.calls[0];
      console.log('Call SID:', firstCall.callSid);
      console.log('Caller Number:', firstCall.callerNumber);
      console.log('Called Number:', firstCall.calledNumber);
      console.log('Status:', firstCall.status);
      console.log('Flow:', firstCall.flow);
      console.log('\nFull call object:');
      console.log(JSON.stringify(firstCall, null, 2));
    } else {
      console.log('No calls returned');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
