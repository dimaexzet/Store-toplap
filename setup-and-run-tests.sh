#!/bin/bash

# Script to install dependencies and run all tests for AI Amazona

echo "=== AI Amazona Testing and Audit Setup ==="
echo ""

# Function to check command success
check_success() {
  if [ $? -ne 0 ]; then
    echo "❌ Error: $1 failed"
    exit 1
  else
    echo "✅ $1 completed successfully"
  fi
}

# Install dependencies
echo "Installing dependencies..."
npm install
check_success "Dependency installation"

# Check for autocannon and dotenv which are required for performance tests
if ! npm list autocannon dotenv | grep -q "autocannon"; then
  echo "Installing autocannon and dotenv for performance testing..."
  npm install --save-dev autocannon
  npm install dotenv
  check_success "Performance testing dependencies installation"
fi

# Create necessary directories
echo "Setting up directories..."
mkdir -p test-reports
mkdir -p performance-reports
mkdir -p coverage

# Run all tests
echo ""
echo "=== Running All Tests and Audits ==="
echo ""

echo "Running unit tests with coverage..."
npm run test:coverage
# Don't exit on test failure, we want to run all tests
echo "Unit tests completed"

echo ""
echo "Running security audit..."
npm run security-audit
echo "Security audit completed"

echo ""
echo "Running performance tests..."
npm run performance-test
echo "Performance tests completed"

echo ""
echo "Generating comprehensive test report..."
npm run test:all
check_success "Test report generation"

echo ""
echo "=== Testing and Audit Complete ==="
echo ""
echo "Results are available in the following locations:"
echo "- Test reports: ./test-reports/"
echo "- Coverage reports: ./coverage/lcov-report/index.html"
echo "- Security audit: ./security-audit.json"
echo "- Performance reports: ./performance-reports/"

# Open test report if on a GUI system
if [ -n "$DISPLAY" ] || [ "$(uname)" = "Darwin" ]; then
  LATEST_REPORT=$(ls -t ./test-reports/*.md | head -1)
  if [ -n "$LATEST_REPORT" ]; then
    echo ""
    echo "Opening latest test report..."
    if [ "$(uname)" = "Darwin" ]; then
      open "$LATEST_REPORT"
    elif [ "$(command -v xdg-open)" ]; then
      xdg-open "$LATEST_REPORT"
    fi
  fi
fi 