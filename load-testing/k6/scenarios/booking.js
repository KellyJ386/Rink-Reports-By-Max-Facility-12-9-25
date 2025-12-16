// Booking System Load Tests

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { environments, testUsers, facilityIds, thresholds } from '../config.js';

const env = __ENV.TEST_ENV || 'staging';
const baseUrl = environments[env].baseUrl;

// Custom metrics
const bookingSuccessRate = new Rate('booking_success_rate');
const bookingDuration = new Trend('booking_duration');
const bookingErrors = new Counter('booking_errors');
const concurrentBookings = new Counter('concurrent_bookings');

export const options = {
  scenarios: {
    booking_flow: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 30 },
        { duration: '5m', target: 30 },
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    ...thresholds,
    booking_success_rate: ['rate>0.95'],
    booking_duration: ['p(95)<1000'],
  },
};

// Helper to generate random future date
function getRandomFutureDate() {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + randomIntBetween(1, 30));
  return futureDate.toISOString().split('T')[0];
}

// Helper to generate random time slot
function getRandomTimeSlot() {
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const startHour = hours[randomIntBetween(0, hours.length - 1)];
  const endHour = startHour + randomIntBetween(1, 2);
  return {
    startTime: `${startHour.toString().padStart(2, '0')}:00`,
    endTime: `${endHour.toString().padStart(2, '0')}:00`,
  };
}

export function setup() {
  // Login and get token for tests
  const user = testUsers[0];
  const loginRes = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({
      email: user.email,
      password: user.password,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    throw new Error(`Setup failed: Could not login - ${loginRes.body}`);
  }

  return { token: loginRes.json('token') };
}

export default function (data) {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  const facilityId = facilityIds[Math.floor(Math.random() * facilityIds.length)];

  // Login for this VU
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

  if (loginRes.status !== 200) {
    console.error(`Login failed: ${loginRes.body}`);
    return;
  }

  const token = loginRes.json('token');
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  group('Booking Flow', function () {
    // Browse schedule
    group('View Schedule', function () {
      const scheduleRes = http.get(
        `${baseUrl}/api/facilities/${facilityId}/schedule?date=${getRandomFutureDate()}`,
        {
          headers: authHeaders,
          tags: { name: 'schedule_view' },
        }
      );

      check(scheduleRes, {
        'schedule status is 200': (r) => r.status === 200,
        'schedule has slots': (r) => Array.isArray(r.json('slots')),
      });
    });

    sleep(randomIntBetween(1, 3));

    // Check availability
    group('Check Availability', function () {
      const date = getRandomFutureDate();
      const timeSlot = getRandomTimeSlot();

      const availRes = http.get(
        `${baseUrl}/api/facilities/${facilityId}/availability?date=${date}&startTime=${timeSlot.startTime}&endTime=${timeSlot.endTime}`,
        {
          headers: authHeaders,
          tags: { name: 'availability_check' },
        }
      );

      check(availRes, {
        'availability status is 200': (r) => r.status === 200,
        'availability has result': (r) => r.json('available') !== undefined,
      });
    });

    sleep(randomIntBetween(2, 5));

    // Create booking
    group('Create Booking', function () {
      const date = getRandomFutureDate();
      const timeSlot = getRandomTimeSlot();
      const bookingStart = Date.now();

      concurrentBookings.add(1);

      const bookingRes = http.post(
        `${baseUrl}/api/bookings`,
        JSON.stringify({
          facilityId: facilityId,
          date: date,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          type: 'public_skate',
          participants: randomIntBetween(1, 10),
          notes: `Load test booking - ${Date.now()}`,
        }),
        {
          headers: authHeaders,
          tags: { name: 'booking_create' },
        }
      );

      const bookingSuccess = check(bookingRes, {
        'booking status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'booking has id': (r) => r.json('id') !== undefined || r.json('booking')?.id !== undefined,
      });

      bookingSuccessRate.add(bookingSuccess);
      bookingDuration.add(Date.now() - bookingStart);

      if (!bookingSuccess) {
        bookingErrors.add(1);
        // 409 Conflict is expected for concurrent bookings to same slot
        if (bookingRes.status !== 409) {
          console.error(`Booking failed: ${bookingRes.status} - ${bookingRes.body}`);
        }
      } else {
        const bookingId = bookingRes.json('id') || bookingRes.json('booking')?.id;

        sleep(1);

        // View booking details
        if (bookingId) {
          group('View Booking', function () {
            const detailRes = http.get(
              `${baseUrl}/api/bookings/${bookingId}`,
              {
                headers: authHeaders,
                tags: { name: 'booking_view' },
              }
            );

            check(detailRes, {
              'booking detail status is 200': (r) => r.status === 200,
            });
          });
        }
      }
    });

    sleep(randomIntBetween(1, 3));

    // List user's bookings
    group('List Bookings', function () {
      const listRes = http.get(
        `${baseUrl}/api/bookings?limit=10`,
        {
          headers: authHeaders,
          tags: { name: 'booking_list' },
        }
      );

      check(listRes, {
        'booking list status is 200': (r) => r.status === 200,
        'booking list has data': (r) => Array.isArray(r.json('bookings')) || Array.isArray(r.json()),
      });
    });
  });

  sleep(randomIntBetween(3, 10));
}

export function teardown(data) {
  // Cleanup: Cancel test bookings
  console.log('Teardown: Cleaning up test bookings...');
}

export function handleSummary(data) {
  return {
    'results/booking-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  const lines = [];
  lines.push('\n=== Booking Load Test Summary ===\n');

  if (data.metrics.booking_success_rate) {
    lines.push(`Booking Success Rate: ${(data.metrics.booking_success_rate.values.rate * 100).toFixed(2)}%`);
  }

  if (data.metrics.booking_duration) {
    const dur = data.metrics.booking_duration.values;
    lines.push(`Booking Duration (p95): ${dur['p(95)']?.toFixed(0) || 'N/A'}ms`);
    lines.push(`Booking Duration (avg): ${dur.avg?.toFixed(0) || 'N/A'}ms`);
  }

  if (data.metrics.http_req_duration) {
    const dur = data.metrics.http_req_duration.values;
    lines.push(`\nHTTP Request Duration (p95): ${dur['p(95)']?.toFixed(0) || 'N/A'}ms`);
    lines.push(`HTTP Request Duration (p99): ${dur['p(99)']?.toFixed(0) || 'N/A'}ms`);
  }

  if (data.metrics.http_req_failed) {
    lines.push(`\nHTTP Error Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  }

  return lines.join('\n');
}
