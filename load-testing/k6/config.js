// K6 Load Testing Configuration

export const environments = {
  development: {
    baseUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000',
  },
  staging: {
    baseUrl: 'https://staging.maxfacilityops.com',
    wsUrl: 'wss://staging.maxfacilityops.com',
  },
  production: {
    baseUrl: 'https://maxfacilityops.com',
    wsUrl: 'wss://maxfacilityops.com',
  },
};

// Test scenarios
export const scenarios = {
  // Smoke test - minimal load to verify system works
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '1m',
  },

  // Load test - normal expected load
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 50 },   // Ramp up
      { duration: '5m', target: 50 },   // Stay at 50 users
      { duration: '2m', target: 100 },  // Ramp up more
      { duration: '5m', target: 100 },  // Stay at 100 users
      { duration: '2m', target: 0 },    // Ramp down
    ],
  },

  // Stress test - beyond normal load
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 300 },
      { duration: '5m', target: 300 },
      { duration: '5m', target: 0 },
    ],
  },

  // Spike test - sudden spike in traffic
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 50 },
      { duration: '30s', target: 500 },  // Spike!
      { duration: '1m', target: 500 },
      { duration: '30s', target: 50 },   // Scale back
      { duration: '2m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },

  // Soak test - sustained load over time
  soak: {
    executor: 'constant-vus',
    vus: 100,
    duration: '30m',
  },

  // Breakpoint test - find system limits
  breakpoint: {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 500,
    maxVUs: 1000,
    stages: [
      { duration: '5m', target: 50 },
      { duration: '5m', target: 100 },
      { duration: '5m', target: 200 },
      { duration: '5m', target: 300 },
      { duration: '5m', target: 400 },
      { duration: '5m', target: 500 },
    ],
  },
};

// SLA thresholds
export const thresholds = {
  // Response time thresholds
  http_req_duration: [
    'p(50)<200',   // 50% of requests should be below 200ms
    'p(90)<500',   // 90% of requests should be below 500ms
    'p(95)<1000',  // 95% of requests should be below 1s
    'p(99)<2000',  // 99% of requests should be below 2s
  ],

  // Error rate threshold
  http_req_failed: ['rate<0.01'], // Less than 1% errors

  // Specific endpoint thresholds
  'http_req_duration{name:login}': ['p(95)<500'],
  'http_req_duration{name:booking_create}': ['p(95)<1000'],
  'http_req_duration{name:booking_list}': ['p(95)<500'],
  'http_req_duration{name:schedule_view}': ['p(95)<300'],

  // Custom metrics
  'booking_success_rate': ['rate>0.99'],
  'login_success_rate': ['rate>0.99'],
};

// Test data
export const testUsers = [
  { email: 'loadtest1@example.com', password: 'LoadTest123!' },
  { email: 'loadtest2@example.com', password: 'LoadTest123!' },
  { email: 'loadtest3@example.com', password: 'LoadTest123!' },
  { email: 'loadtest4@example.com', password: 'LoadTest123!' },
  { email: 'loadtest5@example.com', password: 'LoadTest123!' },
];

export const facilityIds = [
  'facility_main',
  'facility_north',
  'facility_south',
];
