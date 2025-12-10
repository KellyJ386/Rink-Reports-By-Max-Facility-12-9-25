#!/bin/bash

# K6 Load Testing Runner

set -euo pipefail

# Configuration
TEST_ENV="${TEST_ENV:-staging}"
SCENARIO="${SCENARIO:-load}"
OUTPUT_DIR="results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

# Help
usage() {
    cat << EOF
Usage: $0 [OPTIONS] <test>

Tests:
  auth          Run authentication load tests
  booking       Run booking system load tests
  api           Run general API load tests
  journey       Run full user journey tests
  all           Run all tests

Options:
  -e, --env     Environment: development, staging, production (default: staging)
  -s, --scenario Scenario: smoke, load, stress, spike, soak, breakpoint (default: load)
  -o, --output  Output directory (default: results)
  -h, --help    Show this help message

Examples:
  $0 auth                           # Run auth tests in staging with load scenario
  $0 -e production -s smoke api     # Run API smoke tests in production
  $0 -s stress booking              # Run booking stress tests

EOF
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            TEST_ENV="$2"
            shift 2
            ;;
        -s|--scenario)
            SCENARIO="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            TEST="$1"
            shift
            ;;
    esac
done

# Validate test argument
if [ -z "${TEST:-}" ]; then
    error "No test specified"
    usage
fi

# Check k6 is installed
if ! command -v k6 &> /dev/null; then
    error "k6 is not installed. Install it from https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Run test function
run_test() {
    local test_name=$1
    local test_file=$2

    log "Running ${test_name} test..."
    log "Environment: ${TEST_ENV}"
    log "Scenario: ${SCENARIO}"

    k6 run \
        --env TEST_ENV="${TEST_ENV}" \
        --env SCENARIO="${SCENARIO}" \
        --out json="${OUTPUT_DIR}/${test_name}_${TIMESTAMP}.json" \
        "${test_file}"

    if [ $? -eq 0 ]; then
        log "${test_name} test completed successfully"
    else
        error "${test_name} test failed"
        return 1
    fi
}

# Run selected test
case $TEST in
    auth)
        run_test "auth" "scenarios/auth.js"
        ;;
    booking)
        run_test "booking" "scenarios/booking.js"
        ;;
    api)
        run_test "api" "scenarios/api.js"
        ;;
    journey)
        run_test "journey" "scenarios/full-journey.js"
        ;;
    all)
        log "Running all tests..."
        run_test "auth" "scenarios/auth.js"
        run_test "booking" "scenarios/booking.js"
        run_test "api" "scenarios/api.js"
        run_test "journey" "scenarios/full-journey.js"
        log "All tests completed!"
        ;;
    *)
        error "Unknown test: ${TEST}"
        usage
        ;;
esac

# Generate HTML report if k6-reporter is available
if command -v k6-reporter &> /dev/null; then
    log "Generating HTML report..."
    k6-reporter "${OUTPUT_DIR}/${TEST}_${TIMESTAMP}.json" -o "${OUTPUT_DIR}/${TEST}_${TIMESTAMP}.html"
fi

log "Results saved to ${OUTPUT_DIR}/"
