// Authentication Load Tests

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { environments, testUsers, thresholds } from '../config.js';

const env = __ENV.TEST_ENV || 'staging';
const baseUrl = environments[env].baseUrl;

// Custom metrics
const loginSuccessRate = new Rate('login_success_rate');
const loginDuration = new Trend('login_duration');
const loginErrors = new Counter('login_errors');

export const options = {
  scenarios: {
    auth_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    ...thresholds,
    login_success_rate: ['rate>0.99'],
    login_duration: ['p(95)<500'],
  },
};

export default function () {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];

  group('Authentication Flow', function () {
    // Login
    group('Login', function () {
      const loginStart = Date.now();

      const loginRes = http.post(
        `${baseUrl}/api/auth/login`,
        JSON.stringify({
          email: user.email,
          password: user.password,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'login' },
        }
      );

      const loginSuccess = check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login has token': (r) => r.json('token') !== undefined,
      });

      loginSuccessRate.add(loginSuccess);
      loginDuration.add(Date.now() - loginStart);

      if (!loginSuccess) {
        loginErrors.add(1);
        console.error(`Login failed: ${loginRes.status} - ${loginRes.body}`);
        return;
      }

      const token = loginRes.json('token');
      sleep(1);

      // Get user profile
      group('Get Profile', function () {
        const profileRes = http.get(`${baseUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          tags: { name: 'profile' },
        });

        check(profileRes, {
          'profile status is 200': (r) => r.status === 200,
          'profile has email': (r) => r.json('email') !== undefined,
        });
      });

      sleep(2);

      // Refresh token
      group('Refresh Token', function () {
        const refreshRes = http.post(
          `${baseUrl}/api/auth/refresh`,
          null,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            tags: { name: 'refresh_token' },
          }
        );

        check(refreshRes, {
          'refresh status is 200': (r) => r.status === 200,
          'refresh has new token': (r) => r.json('token') !== undefined,
        });
      });

      sleep(1);

      // Logout
      group('Logout', function () {
        const logoutRes = http.post(
          `${baseUrl}/api/auth/logout`,
          null,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            tags: { name: 'logout' },
          }
        );

        check(logoutRes, {
          'logout status is 200': (r) => r.status === 200,
        });
      });
    });
  });

  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  return {
    'results/auth-summary.json': JSON.stringify(data, null, 2),
  };
}
