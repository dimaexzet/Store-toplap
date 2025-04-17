/**
 * Run All Tests Script for AI Amazona
 * This script runs all tests and generates a comprehensive report.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

// Configuration
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(WORKSPACE_ROOT, 'test-reports');
const REPORT_FILE = path.join(OUTPUT_DIR, `test-report-${new Date().toISOString().replace(/:/g, '-')}.md`);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Status tracking
const testStatus = {
  unitTests: { status: 'pending', passed: 0, failed: 0, skipped: 0, coverage: {} },
  apiTests: { status: 'pending', passed: 0, failed: 0, skipped: 0 },
  e2eTests: { status: 'pending', passed: 0, failed: 0, skipped: 0 },
  securityAudit: { status: 'pending', critical: 0, high: 0, moderate: 0, low: 0 },
  performanceTests: { status: 'pending', passed: 0, failed: 0 }
};

// Test categories and commands
const testCommands = [
  { name: 'Unit Tests', command: 'npm run test:coverage', type: 'unitTests' },
  { name: 'API Tests', command: 'npm test -- --testPathPattern=__tests__/api', type: 'apiTests' },
  { name: 'E2E Tests', command: 'npm test -- --testPathPattern=__tests__/e2e', type: 'e2eTests' },
  { name: 'Security Audit', command: 'npm run security-audit', type: 'securityAudit' },
  { name: 'Performance Tests', command: 'node scripts/performance-test.js', type: 'performanceTests' }
];

// Generate unique test run ID
const testRunId = createHash('md5').update(`${new Date().toISOString()}`).digest('hex').substring(0, 8);

// Run tests and gather results
function runAllTests() {
  console.log(`Starting test run ${testRunId}...`);
  const startTime = new Date();
  
  for (const test of testCommands) {
    try {
      console.log(`\n==== Running ${test.name} ====`);
      const output = execSync(test.command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      
      // Process test results based on type
      processTestResults(test.type, output);
      
      console.log(`✅ ${test.name} completed successfully`);
    } catch (error) {
      console.error(`❌ ${test.name} failed: ${error.message}`);
      
      // Even if the command fails, try to process any output
      if (error.stdout) {
        processTestResults(test.type, error.stdout);
      } else {
        testStatus[test.type].status = 'failed';
      }
    }
  }
  
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  
  // Generate report
  generateReport(startTime, endTime, duration);
  
  console.log(`\nTest run ${testRunId} completed in ${duration.toFixed(2)} seconds`);
  console.log(`Report saved to ${REPORT_FILE}`);
}

// Process test results based on test type
function processTestResults(testType, output) {
  testStatus[testType].status = 'completed';
  
  switch (testType) {
    case 'unitTests':
      processUnitTestResults(output);
      break;
    case 'apiTests':
      processApiTestResults(output);
      break;
    case 'e2eTests':
      processE2ETestResults(output);
      break;
    case 'securityAudit':
      processSecurityAuditResults(output);
      break;
    case 'performanceTests':
      processPerformanceTestResults(output);
      break;
  }
}

// Process unit test results with coverage
function processUnitTestResults(output) {
  // Extract test counts
  const testSummaryMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed,\s+(\d+)\s+total/);
  if (testSummaryMatch) {
    testStatus.unitTests.passed = parseInt(testSummaryMatch[1]);
    testStatus.unitTests.failed = parseInt(testSummaryMatch[2]);
    testStatus.unitTests.skipped = parseInt(testSummaryMatch[3]) - testStatus.unitTests.passed - testStatus.unitTests.failed;
  }
  
  // Extract coverage information
  const coverageMatch = output.match(/All files[^|]+\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)/);
  if (coverageMatch) {
    testStatus.unitTests.coverage = {
      statements: coverageMatch[1].trim(),
      branches: coverageMatch[2].trim(),
      functions: coverageMatch[3].trim(),
      lines: coverageMatch[4].trim()
    };
  }
}

// Process API test results
function processApiTestResults(output) {
  const testSummaryMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed,\s+(\d+)\s+total/);
  if (testSummaryMatch) {
    testStatus.apiTests.passed = parseInt(testSummaryMatch[1]);
    testStatus.apiTests.failed = parseInt(testSummaryMatch[2]);
    testStatus.apiTests.skipped = parseInt(testSummaryMatch[3]) - testStatus.apiTests.passed - testStatus.apiTests.failed;
  }
}

// Process E2E test results
function processE2ETestResults(output) {
  const testSummaryMatch = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed,\s+(\d+)\s+total/);
  if (testSummaryMatch) {
    testStatus.e2eTests.passed = parseInt(testSummaryMatch[1]);
    testStatus.e2eTests.failed = parseInt(testSummaryMatch[2]);
    testStatus.e2eTests.skipped = parseInt(testSummaryMatch[3]) - testStatus.e2eTests.passed - testStatus.e2eTests.failed;
  }
}

// Process security audit results
function processSecurityAuditResults(output) {
  // Look for vulnerability counts
  const criticalMatch = output.match(/Critical:\s+(\d+)/i);
  const highMatch = output.match(/High:\s+(\d+)/i);
  const moderateMatch = output.match(/Moderate:\s+(\d+)/i);
  const lowMatch = output.match(/Low:\s+(\d+)/i);
  
  if (criticalMatch) testStatus.securityAudit.critical = parseInt(criticalMatch[1]);
  if (highMatch) testStatus.securityAudit.high = parseInt(highMatch[1]);
  if (moderateMatch) testStatus.securityAudit.moderate = parseInt(moderateMatch[1]);
  if (lowMatch) testStatus.securityAudit.low = parseInt(lowMatch[1]);
}

// Process performance test results
function processPerformanceTestResults(output) {
  const passMatch = output.match(/PASS/g);
  const failMatch = output.match(/FAIL/g);
  
  if (passMatch) testStatus.performanceTests.passed = passMatch.length;
  if (failMatch) testStatus.performanceTests.failed = failMatch.length;
}

// Generate comprehensive test report
function generateReport(startTime, endTime, duration) {
  // Determine overall status
  const hasFailures = 
    testStatus.unitTests.failed > 0 ||
    testStatus.apiTests.failed > 0 ||
    testStatus.e2eTests.failed > 0 ||
    testStatus.securityAudit.critical > 0 ||
    testStatus.securityAudit.high > 0 ||
    testStatus.performanceTests.failed > 0;
  
  const overallStatus = hasFailures ? '❌ FAILED' : '✅ PASSED';
  
  // Build report content
  let report = `# AI Amazona Test Report

## Summary

- **Test Run ID**: ${testRunId}
- **Date**: ${startTime.toISOString()}
- **Duration**: ${duration.toFixed(2)} seconds
- **Overall Status**: ${overallStatus}

## Test Results

### Unit Tests

- **Status**: ${testStatus.unitTests.status}
- **Passed**: ${testStatus.unitTests.passed}
- **Failed**: ${testStatus.unitTests.failed}
- **Skipped**: ${testStatus.unitTests.skipped}
- **Coverage**:
  - Statements: ${testStatus.unitTests.coverage.statements || 'N/A'}
  - Branches: ${testStatus.unitTests.coverage.branches || 'N/A'}
  - Functions: ${testStatus.unitTests.coverage.functions || 'N/A'}
  - Lines: ${testStatus.unitTests.coverage.lines || 'N/A'}

### API Tests

- **Status**: ${testStatus.apiTests.status}
- **Passed**: ${testStatus.apiTests.passed}
- **Failed**: ${testStatus.apiTests.failed}
- **Skipped**: ${testStatus.apiTests.skipped}

### E2E Tests

- **Status**: ${testStatus.e2eTests.status}
- **Passed**: ${testStatus.e2eTests.passed}
- **Failed**: ${testStatus.e2eTests.failed}
- **Skipped**: ${testStatus.e2eTests.skipped}

### Security Audit

- **Status**: ${testStatus.securityAudit.status}
- **Critical Issues**: ${testStatus.securityAudit.critical}
- **High Issues**: ${testStatus.securityAudit.high}
- **Moderate Issues**: ${testStatus.securityAudit.moderate}
- **Low Issues**: ${testStatus.securityAudit.low}

### Performance Tests

- **Status**: ${testStatus.performanceTests.status}
- **Passed**: ${testStatus.performanceTests.passed}
- **Failed**: ${testStatus.performanceTests.failed}

## Issues and Recommendations

`;

  // Add recommendations based on test results
  if (testStatus.unitTests.failed > 0) {
    report += `### Unit Test Issues
- ${testStatus.unitTests.failed} unit tests are failing
- Focus on fixing these failures before proceeding with other work
- Check test logs for details on specific failures

`;
  }
  
  if (testStatus.unitTests.coverage.statements && parseInt(testStatus.unitTests.coverage.statements) < 70) {
    report += `### Low Test Coverage
- Current statement coverage is only ${testStatus.unitTests.coverage.statements}
- Aim for at least 70% statement coverage
- Focus on adding tests for critical user flows and components

`;
  }
  
  if (testStatus.apiTests.failed > 0) {
    report += `### API Test Issues
- ${testStatus.apiTests.failed} API tests are failing
- This could indicate breaking changes in the API
- Make sure API contracts are maintained and properly documented

`;
  }
  
  if (testStatus.e2eTests.failed > 0) {
    report += `### E2E Test Issues
- ${testStatus.e2eTests.failed} end-to-end tests are failing
- This indicates that critical user flows may be broken
- Prioritize fixing these failures as they represent real user scenarios

`;
  }
  
  if (testStatus.securityAudit.critical > 0 || testStatus.securityAudit.high > 0) {
    report += `### Security Issues
- Found ${testStatus.securityAudit.critical} critical and ${testStatus.securityAudit.high} high-risk security issues
- These should be addressed immediately before deployment
- Check the security audit report for specific recommendations

`;
  }
  
  if (testStatus.performanceTests.failed > 0) {
    report += `### Performance Issues
- ${testStatus.performanceTests.failed} performance tests are failing
- This indicates that the application may be slow under load
- Check the performance test report for specific bottlenecks

`;
  }
  
  // Add general recommendations
  report += `## Next Steps

1. ${hasFailures ? 'Address the identified issues before proceeding with deployment' : 'Proceed with deployment'}
2. Continue to improve test coverage, particularly in critical areas
3. Schedule regular security audits and performance testing
4. Monitor application performance and security in production

## Detailed Reports

- Unit Test Coverage: ${WORKSPACE_ROOT}/coverage/lcov-report/index.html
- Security Audit: ${WORKSPACE_ROOT}/security-audit.json
- Performance Report: ${WORKSPACE_ROOT}/performance-reports/

_Report generated on ${new Date().toISOString()}_
`;

  // Write report to file
  fs.writeFileSync(REPORT_FILE, report);
}

// Run all tests
runAllTests(); 