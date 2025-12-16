// General API Load Tests

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { environments, testUsers, facilityIds, thresholds, scenarios } from '../config.js';

const env = __ENV.TEST_ENV || 'staging';
const scenario = __ENV.SCENARIO || 'load';
const baseUrl = environments[env].baseUrl;

// Custom metrics
const apiSuccessRate = new Rate('api_success_rate');
const apiDuration = new Trend('api_duration');

export const options = {
  scenarios: {
    api_test: scenarios[scenario] || scenarios.load,
  },
  thresholds: {
    ...thresholds,
    api_success_rate: ['rate>0.99'],
  },
};

// Weighted endpoints for realistic traffic distribution
const endpoints = [
  { path: '/api/facilities', weight: 20, method: 'GET', requiresAuth: false },
  { path: '/api/facilities/{facilityId}', weight: 15, method: 'GET', requiresAuth: false },
  { path: '/api/facilities/{facilityId}/schedule', weight: 25, method: 'GET', requiresAuth: false },
  { path: '/api/bookings', weight: 10, method: 'GET', requiresAuth: true },
  { path: '/api/users/me', weight: 10, method: 'GET', requiresAuth: true },
  { path: '/api/maintenance/tasks', weight: 5, method: 'GET', requiresAuth: true },
  { path: '/api/equipment', weight: 5, method: 'GET', requiresAuth: true },
  { path: '/api/reports/dashboard', weight: 5, method: 'GET', requiresAuth: true },
  { path: '/api/notifications', weight: 5, method: 'GET', requiresAuth: true },
];

// Calculate cumulative weights for weighted random selection
const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
const cumulativeWeights = endpoints.reduce((acc, e, i) => {
  acc.push((acc[i - 1] || 0) + e.weight);
  return acc;
}, []);

function selectEndpoint() {
  const random = Math.random() * totalWeight;
  const index = cumulativeWeights.findIndex(w => random <= w);
  return endpoints[index];
}

function replacePlaceholders(path) {
  return path
    .replace('{facilityId}', facilityIds[randomIntBetween(0, facilityIds.length - 1)]);
}

export function setup() {
  // Get auth token
  const user = testUsers[0];
  const loginRes = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    console.warn('Setup: Could not get auth token, some tests may fail');
    return { token: null };
  }

  return { token: loginRes.json('token') };
}

export default function (data) {
  const endpoint = selectEndpoint();
  const path = replacePlaceholders(endpoint.path);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add auth header if required and available
  if (endpoint.requiresAuth) {
    if (!data.token) {
      // Try to login
      const user = testUsers[randomIntBetween(0, testUsers.length - 1)];
      const loginRes = http.post(
        `${baseUrl}/api/auth/login`,
        JSON.stringify({ email: user.email, password: user.password }),
        { headers }
      );
      if (loginRes.status === 200) {
        headers['Authorization'] = `Bearer ${loginRes.json('token')}`;
      }
    } else {
      headers['Authorization'] = `Bearer ${data.token}`;
    }
  }

  const startTime = Date.now();
  const res = http.request(endpoint.method, `${baseUrl}${path}`, null, {
    headers,
    tags: { name: path.split('?')[0] },
  });

  const success = check(res, {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });

  apiSuccessRate.add(success);
  apiDuration.add(Date.now() - startTime);

  // Random think time between requests
  sleep(randomIntBetween(1, 5) / 10);
}

export function handleSummary(data) {
  return {
    'results/api-summary.json': JSON.stringify(data, null, 2),
  };
}
