# Load Testing

This directory contains load testing infrastructure for Max Facility Operations (MFO) using [k6](https://k6.io/).

## Overview

| Test Suite | Description | Default Duration |
|------------|-------------|------------------|
| auth | Authentication flows | ~5 minutes |
| booking | Booking system | ~16 minutes |
| api | General API endpoints | Configurable |
| journey | Full user journeys | ~16 minutes |

## Quick Start

### Prerequisites

```bash
# Install k6
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

### Running Tests

```bash
cd load-testing/k6

# Run smoke test
./run-tests.sh -s smoke auth

# Run load test
./run-tests.sh booking

# Run stress test against production
./run-tests.sh -e production -s stress api

# Run all tests
./run-tests.sh all
```

## Test Scenarios

### Smoke Test
Minimal load to verify the system works correctly.
- 1 virtual user
- 1 minute duration
- Used for: Pre-deployment verification

### Load Test
Normal expected load patterns.
- Ramps from 0 to 100 users
- ~15 minute duration
- Used for: Regular performance testing

### Stress Test
Beyond normal capacity.
- Ramps from 0 to 300 users
- ~25 minute duration
- Used for: Finding performance limits

### Spike Test
Sudden traffic spikes.
- Quick ramp to 500 users
- Tests auto-scaling
- Used for: Flash sale/event scenarios

### Soak Test
Sustained load over time.
- 100 users for 30 minutes
- Used for: Memory leak detection

### Breakpoint Test
Find system breaking point.
- Gradually increases load until failure
- ~30 minute duration
- Used for: Capacity planning

## Test Suites

### Authentication (`auth.js`)

Tests:
- User login
- Token refresh
- Profile retrieval
- Logout

Key metrics:
- `login_success_rate` - Target: >99%
- `login_duration` - Target: P95 <500ms

### Booking (`booking.js`)

Tests:
- View schedule
- Check availability
- Create booking
- View booking details
- List bookings

Key metrics:
- `booking_success_rate` - Target: >95%
- `booking_duration` - Target: P95 <1000ms

### API (`api.js`)

Tests weighted mix of API endpoints simulating real traffic patterns:
- Facilities (20%)
- Schedule (25%)
- Bookings (10%)
- User profile (10%)
- Maintenance (5%)
- Equipment (5%)
- Reports (5%)
- Notifications (5%)
- Other (15%)

Key metrics:
- `api_success_rate` - Target: >99%
- `http_req_duration` - Target: P95 <1000ms

### Full Journey (`full-journey.js`)

Simulates complete user journey:
1. Browse facilities
2. View facility details
3. Check schedule
4. Login
5. Check availability
6. Create booking
7. View confirmation
8. View my bookings
9. Check notifications
10. Logout

Key metrics:
- `journey_success_rate` - Target: >90%
- `journey_duration` - Target: P95 <30s
- `checkout_duration` - Target: P95 <5s

## SLA Thresholds

| Metric | Target |
|--------|--------|
| P50 Response Time | <200ms |
| P90 Response Time | <500ms |
| P95 Response Time | <1000ms |
| P99 Response Time | <2000ms |
| Error Rate | <1% |
| Availability | >99.9% |

## Configuration

Edit `config.js` to customize:

```javascript
// Environments
export const environments = {
  development: { baseUrl: 'http://localhost:3000' },
  staging: { baseUrl: 'https://staging.maxfacilityops.com' },
  production: { baseUrl: 'https://maxfacilityops.com' },
};

// Test users (create these in target environment)
export const testUsers = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  // Add more users for higher concurrency
];
```

## Test Data Setup

Before running tests, ensure test data exists:

```sql
-- Create test users
INSERT INTO users (email, password_hash, role)
VALUES
  ('loadtest1@example.com', '$2b$10$...', 'customer'),
  ('loadtest2@example.com', '$2b$10$...', 'customer');

-- Or use the API
curl -X POST https://staging.maxfacilityops.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"loadtest1@example.com","password":"LoadTest123!"}'
```

## Results & Reporting

Results are saved to `results/` directory:

```
results/
├── auth_20241210_120000.json     # Raw k6 metrics
├── auth-summary.json             # Test summary
├── booking_20241210_120500.json
├── booking-summary.json
└── ...
```

### Grafana Integration

Stream results to Grafana Cloud:

```bash
k6 run --out cloud scenarios/booking.js
```

Or to InfluxDB:

```bash
k6 run --out influxdb=http://localhost:8086/k6 scenarios/booking.js
```

### Generate HTML Report

```bash
# Install k6-reporter
npm install -g k6-reporter

# Generate report
k6-reporter results/booking_20241210_120000.json -o results/booking-report.html
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load tests
        run: |
          cd load-testing/k6
          ./run-tests.sh -e staging -s load booking

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load-testing/k6/results/
```

### Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: load-test
spec:
  schedule: "0 2 * * 1"  # Weekly on Monday at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: k6
              image: grafana/k6
              command:
                - k6
                - run
                - --env
                - TEST_ENV=staging
                - /scripts/scenarios/booking.js
              volumeMounts:
                - name: scripts
                  mountPath: /scripts
          volumes:
            - name: scripts
              configMap:
                name: load-test-scripts
          restartPolicy: OnFailure
```

## Troubleshooting

### High Error Rates

1. Check target environment is healthy
2. Verify test users exist and credentials are correct
3. Check rate limiting configuration
4. Review server logs for errors

### Inconsistent Results

1. Ensure stable network connection
2. Run from same region as target
3. Check for noisy neighbors (shared infrastructure)
4. Run multiple iterations and average

### Memory Issues

For long-running tests, limit data collection:

```bash
k6 run --no-summary scenarios/soak.js
```

## Best Practices

1. **Start small**: Run smoke tests before load tests
2. **Isolate tests**: Use dedicated test environment when possible
3. **Monitor target**: Watch server metrics during tests
4. **Clean up**: Remove test data after testing
5. **Document results**: Track performance over time
6. **Test regularly**: Include in CI/CD pipeline
