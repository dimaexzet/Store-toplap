/**
 * Performance Test Script for AI Amazona
 * This script uses autocannon to test the performance of key application endpoints.
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'performance-reports');
const REPORT_FILE = path.join(OUTPUT_DIR, `performance-report-${new Date().toISOString().replace(/:/g, '-')}.json`);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Test scenarios
const scenarios = [
  {
    name: 'Homepage',
    url: `${BASE_URL}/`,
    method: 'GET',
    connections: 100,
    duration: 30
  },
  {
    name: 'Products Listing',
    url: `${BASE_URL}/products`,
    method: 'GET',
    connections: 100,
    duration: 30
  },
  {
    name: 'Product Detail',
    url: `${BASE_URL}/products/1`, // Assuming product with ID 1 exists
    method: 'GET',
    connections: 50,
    duration: 30
  },
  {
    name: 'Search Functionality',
    url: `${BASE_URL}/api/products?search=shirt`,
    method: 'GET',
    connections: 50,
    duration: 30
  },
  {
    name: 'Cart Operations',
    url: `${BASE_URL}/api/cart`,
    method: 'POST',
    body: JSON.stringify({
      productId: '1',
      quantity: 1
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    connections: 20,
    duration: 20
  },
  {
    name: 'Authentication - Login',
    url: `${BASE_URL}/api/auth/callback/credentials`,
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    connections: 10,
    duration: 10
  }
];

// Performance thresholds
const thresholds = {
  latency: {
    p99: 1500, // milliseconds
    max: 2000  // milliseconds
  },
  requests: {
    average: 500  // requests per second
  }
};

// Run tests
async function runTests() {
  console.log('Starting performance tests...');
  
  const results = {};
  
  for (const scenario of scenarios) {
    console.log(`\nRunning test: ${scenario.name}`);
    console.log(`URL: ${scenario.url}`);
    console.log(`Method: ${scenario.method}`);
    console.log(`Connections: ${scenario.connections}`);
    console.log(`Duration: ${scenario.duration} seconds`);
    
    const result = await new Promise((resolve) => {
      const instance = autocannon({
        url: scenario.url,
        method: scenario.method,
        body: scenario.body,
        headers: scenario.headers,
        connections: scenario.connections,
        duration: scenario.duration,
        title: scenario.name
      }, (err, result) => {
        if (err) {
          console.error(`Error in ${scenario.name}:`, err);
          resolve(null);
        } else {
          resolve(result);
        }
      });
      
      // Log progress during the test
      autocannon.track(instance);
    });
    
    if (result) {
      // Store test results
      results[scenario.name] = {
        url: scenario.url,
        method: scenario.method,
        requests: {
          average: result.requests.average,
          min: result.requests.min,
          max: result.requests.max,
          total: result.requests.total,
          sent: result.requests.sent
        },
        latency: {
          average: result.latency.average,
          min: result.latency.min,
          max: result.latency.max,
          p99: result.latency.p99
        },
        throughput: {
          average: result.throughput.average,
          min: result.throughput.min,
          max: result.throughput.max
        },
        errors: result.errors,
        timeouts: result.timeouts,
        success: result.non2xx === 0 && result.timeouts === 0,
        statusCodeDistribution: result.statusCodeDistribution
      };
      
      // Check against thresholds
      const latencyP99Ok = result.latency.p99 <= thresholds.latency.p99;
      const latencyMaxOk = result.latency.max <= thresholds.latency.max;
      const requestsAvgOk = result.requests.average >= thresholds.requests.average;
      
      console.log('\nResults:');
      console.log(`Requests per second: ${result.requests.average.toFixed(2)} [${requestsAvgOk ? 'PASS' : 'FAIL'}]`);
      console.log(`Latency p99: ${result.latency.p99.toFixed(2)}ms [${latencyP99Ok ? 'PASS' : 'FAIL'}]`);
      console.log(`Latency max: ${result.latency.max.toFixed(2)}ms [${latencyMaxOk ? 'PASS' : 'FAIL'}]`);
      console.log(`Successful requests: ${result.non2xx === 0 ? '100%' : `${(1 - result.non2xx / result.requests.total).toFixed(2) * 100}%`}`);
    }
  }
  
  // Save results to file
  fs.writeFileSync(REPORT_FILE, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    thresholds,
    results
  }, null, 2));
  
  console.log(`\nPerformance test completed. Results saved to ${REPORT_FILE}`);
  
  // Generate summary
  generateSummary(results);
}

// Generate performance summary
function generateSummary(results) {
  console.log('\n===== PERFORMANCE SUMMARY =====');
  
  let overallPass = true;
  let slowestEndpoint = null;
  let slowestLatency = 0;
  let fastestEndpoint = null;
  let fastestLatency = Infinity;
  let highestThroughput = 0;
  let highestThroughputEndpoint = null;
  
  Object.entries(results).forEach(([name, result]) => {
    // Update slowest/fastest endpoints
    if (result.latency.average > slowestLatency) {
      slowestLatency = result.latency.average;
      slowestEndpoint = name;
    }
    
    if (result.latency.average < fastestLatency) {
      fastestLatency = result.latency.average;
      fastestEndpoint = name;
    }
    
    // Update highest throughput
    if (result.requests.average > highestThroughput) {
      highestThroughput = result.requests.average;
      highestThroughputEndpoint = name;
    }
    
    // Check if any thresholds were exceeded
    const latencyP99Ok = result.latency.p99 <= thresholds.latency.p99;
    const latencyMaxOk = result.latency.max <= thresholds.latency.max;
    const requestsAvgOk = result.requests.average >= thresholds.requests.average;
    
    if (!latencyP99Ok || !latencyMaxOk || !requestsAvgOk) {
      overallPass = false;
    }
  });
  
  console.log(`Overall Result: ${overallPass ? 'PASS' : 'FAIL'}`);
  console.log(`Fastest Endpoint: ${fastestEndpoint} (${fastestLatency.toFixed(2)}ms avg)`);
  console.log(`Slowest Endpoint: ${slowestEndpoint} (${slowestLatency.toFixed(2)}ms avg)`);
  console.log(`Highest Throughput: ${highestThroughputEndpoint} (${highestThroughput.toFixed(2)} req/sec)`);
  
  // Provide recommendations based on results
  console.log('\nRecommendations:');
  
  if (slowestLatency > 1000) {
    console.log(`- Optimize the ${slowestEndpoint} endpoint which is too slow (${slowestLatency.toFixed(2)}ms avg)`);
  }
  
  if (!overallPass) {
    console.log('- Review caching strategies for frequently accessed data');
    console.log('- Consider implementing or optimizing database indexes');
    console.log('- Evaluate server resources and scaling options');
  }
  
  // Check if we have memory and CPU data
  try {
    const sysInfo = getSystemMetrics();
    console.log('\nSystem Metrics During Test:');
    console.log(`- CPU Usage: ${sysInfo.cpuUsage}%`);
    console.log(`- Memory Usage: ${sysInfo.memoryUsage}MB / ${sysInfo.totalMemory}MB`);
    
    if (sysInfo.cpuUsage > 80) {
      console.log('- HIGH CPU USAGE: Consider optimizing CPU-intensive operations or scaling horizontally');
    }
    
    if (sysInfo.memoryUsage / sysInfo.totalMemory > 0.8) {
      console.log('- HIGH MEMORY USAGE: Check for memory leaks or increase available memory');
    }
  } catch (error) {
    console.log('- System metrics not available');
  }
  
  console.log('\nNext Steps:');
  console.log('1. Review detailed results in the performance report file');
  console.log('2. Implement recommended optimizations');
  console.log('3. Re-run tests to validate improvements');
}

// Get system metrics (CPU, memory)
function getSystemMetrics() {
  try {
    const platform = process.platform;
    
    if (platform === 'linux') {
      // Linux
      const cpuInfo = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'").toString().trim();
      const memInfo = execSync("free -m | grep Mem").toString().trim();
      const memParts = memInfo.split(/\s+/);
      
      return {
        cpuUsage: parseFloat(cpuInfo),
        memoryUsage: parseInt(memParts[3]),
        totalMemory: parseInt(memParts[1])
      };
    } else if (platform === 'darwin') {
      // macOS
      const cpuInfo = execSync("top -l 1 | grep 'CPU usage' | awk '{print $3}' | cut -d% -f1").toString().trim();
      const memInfo = execSync("vm_stat | grep 'Pages active'").toString().trim();
      const memActive = parseInt(memInfo.split(':')[1].trim().replace('.', '')) * 4096 / 1024 / 1024;
      const totalMem = parseInt(execSync("sysctl hw.memsize | awk '{print $2}'").toString().trim()) / 1024 / 1024;
      
      return {
        cpuUsage: parseFloat(cpuInfo),
        memoryUsage: Math.round(memActive),
        totalMemory: Math.round(totalMem)
      };
    } else if (platform.includes('win')) {
      // Windows
      const cpuInfo = execSync("wmic cpu get loadpercentage").toString().trim().split('\n')[1];
      const memInfo = execSync("wmic OS get FreePhysicalMemory,TotalVisibleMemorySize").toString().trim().split('\n')[1].split(/\s+/);
      
      return {
        cpuUsage: parseFloat(cpuInfo),
        memoryUsage: (parseInt(memInfo[1]) - parseInt(memInfo[0])) / 1024,
        totalMemory: parseInt(memInfo[1]) / 1024
      };
    }
    
    throw new Error('Unsupported platform');
  } catch (error) {
    console.error('Error getting system metrics:', error.message);
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      totalMemory: 0
    };
  }
}

// Run the performance tests
runTests().catch(error => {
  console.error('Performance test failed:', error);
  process.exit(1);
}); 