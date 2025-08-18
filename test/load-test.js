const axios = require('axios');

class LoadTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: []
    };
  }

  async testSendContact(concurrent = 100, duration = 60000) {
    console.log(`🚀 Starting load test: ${concurrent} concurrent users for ${duration/1000}s`);
    
    const startTime = Date.now();
    const promises = [];

    // Create concurrent requests
    for (let i = 0; i < concurrent; i++) {
      promises.push(this.sendContactRequests(startTime + duration, i));
    }

    await Promise.all(promises);
    this.printResults();
  }

  async sendContactRequests(endTime, userId) {
    while (Date.now() < endTime) {
      const requestStart = Date.now();
      
      try {
        const response = await axios.post(`${this.baseUrl}/api/v1/messages/send-contact`, {
          phone: `99890${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
          message: `Test message ${Math.random()}`
        }, {
          headers: {
            'Authorization': 'Bearer test-token',
            'balance_type': 'MAIN'
          },
          timeout: 5000
        });

        const requestTime = Date.now() - requestStart;
        this.recordSuccess(requestTime);

      } catch (error) {
        const requestTime = Date.now() - requestStart;
        this.recordFailure(requestTime, error.message);
      }

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  async testSendGroup(groupSize = 1000, concurrent = 50) {
    console.log(`🚀 Testing group SMS: ${groupSize} SMS per request, ${concurrent} concurrent requests`);
    
    const promises = [];
    const startTime = Date.now();

    for (let i = 0; i < concurrent; i++) {
      promises.push(this.sendGroupRequest(groupSize, i));
    }

    await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    console.log(`\n📊 Group Test Results:`);
    console.log(`Total SMS processed: ${groupSize * concurrent}`);
    console.log(`Total time: ${totalTime}ms`);
    console.log(`SMS per second: ${Math.round((groupSize * concurrent) / (totalTime / 1000))}`);
    
    this.printResults();
  }

  async sendGroupRequest(groupSize, requestId) {
    const requestStart = Date.now();
    
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/messages/send-group`, {
        group_id: 1,
        message: `Bulk test message ${requestId}`
      }, {
        headers: {
          'Authorization': 'Bearer test-token',
          'balance_type': 'MAIN'
        },
        timeout: 30000
      });

      const requestTime = Date.now() - requestStart;
      this.recordSuccess(requestTime);

    } catch (error) {
      const requestTime = Date.now() - requestStart;
      this.recordFailure(requestTime, error.message);
    }
  }

  recordSuccess(time) {
    this.results.totalRequests++;
    this.results.successfulRequests++;
    this.results.totalTime += time;
    this.results.minTime = Math.min(this.results.minTime, time);
    this.results.maxTime = Math.max(this.results.maxTime, time);
  }

  recordFailure(time, error) {
    this.results.totalRequests++;
    this.results.failedRequests++;
    this.results.totalTime += time;
    this.results.errors.push(error);
  }

  printResults() {
    const { totalRequests, successfulRequests, failedRequests, totalTime, minTime, maxTime } = this.results;
    
    console.log(`\n📊 Load Test Results:`);
    console.log(`═══════════════════════`);
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Successful: ${successfulRequests} (${((successfulRequests/totalRequests)*100).toFixed(1)}%)`);
    console.log(`Failed: ${failedRequests} (${((failedRequests/totalRequests)*100).toFixed(1)}%)`);
    console.log(`Average Response Time: ${totalRequests > 0 ? Math.round(totalTime/totalRequests) : 0}ms`);
    console.log(`Min Response Time: ${minTime === Infinity ? 0 : minTime}ms`);
    console.log(`Max Response Time: ${maxTime}ms`);
    console.log(`Requests per second: ${totalRequests > 0 ? Math.round(totalRequests/(totalTime/totalRequests/1000)) : 0}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Error samples:`);
      const uniqueErrors = [...new Set(this.results.errors.slice(0, 5))];
      uniqueErrors.forEach(error => console.log(`  - ${error}`));
    }
  }

  async testEndpointHealth() {
    console.log('🔍 Testing endpoint health...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      console.log('✅ Health check passed');
      return true;
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      return false;
    }
  }
}

// Run tests
async function runTests() {
  const tester = new LoadTester();
  
  // Check if server is running
  const isHealthy = await tester.testEndpointHealth();
  if (!isHealthy) {
    console.log('⚠️  Server is not responding. Please start the application first.');
    return;
  }

  // Test scenarios
  console.log('🧪 Running performance tests...\n');
  
  // Light load test
  await tester.testSendContact(50, 30000); // 50 users for 30 seconds
  
  // Reset results for next test
  tester.results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTime: 0,
    minTime: Infinity,
    maxTime: 0,
    errors: []
  };
  
  // Group SMS test
  await tester.testSendGroup(100, 10); // 100 SMS per request, 10 concurrent requests
}

// Check if running directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = LoadTester;
