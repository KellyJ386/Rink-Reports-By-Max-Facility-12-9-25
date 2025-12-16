// Full User Journey Load Test

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { environments, testUsers, facilityIds, thresholds } from '../config.js';

const env = __ENV.TEST_ENV || 'staging';
const baseUrl = environments[env].baseUrl;

// Custom metrics
const journeySuccessRate = new Rate('journey_success_rate');
const journeyDuration = new Trend('journey_duration');
const checkoutDuration = new Trend('checkout_duration');

export const options = {
  scenarios: {
    full_journey: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 40 },
        { duration: '5m', target: 40 },
        { duration: '2m', target: 0 },
      ],
    },
  },
  thresholds: {
    ...thresholds,
    journey_success_rate: ['rate>0.90'],
    journey_duration: ['p(95)<30000'],
    checkout_duration: ['p(95)<5000'],
  },
};

// Helper functions
function getRandomFutureDate() {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + randomIntBetween(1, 14));
  return futureDate.toISOString().split('T')[0];
}

function getRandomTimeSlot() {
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const startHour = randomItem(hours);
  return {
    startTime: `${startHour.toString().padStart(2, '0')}:00`,
    endTime: `${(startHour + 1).toString().padStart(2, '0')}:00`,
  };
}

export default function () {
  const journeyStart = Date.now();
  let journeySuccess = true;
  let token = null;

  const user = randomItem(testUsers);
  const facilityId = randomItem(facilityIds);

  group('Complete User Journey', function () {
    // Step 1: Visit homepage / facilities
    group('1. Browse Facilities', function () {
      const res = http.get(`${baseUrl}/api/facilities`, {
        tags: { name: 'facilities_list' },
      });

      if (!check(res, { 'facilities loaded': (r) => r.status === 200 })) {
        journeySuccess = false;
      }

      sleep(randomIntBetween(2, 5));
    });

    // Step 2: View facility details
    group('2. View Facility', function () {
      const res = http.get(`${baseUrl}/api/facilities/${facilityId}`, {
        tags: { name: 'facility_detail' },
      });

      check(res, { 'facility details loaded': (r) => r.status === 200 });

      sleep(randomIntBetween(1, 3));
    });

    // Step 3: Check schedule
    group('3. Check Schedule', function () {
      const date = getRandomFutureDate();
      const res = http.get(
        `${baseUrl}/api/facilities/${facilityId}/schedule?date=${date}`,
        { tags: { name: 'schedule_view' } }
      );

      check(res, { 'schedule loaded': (r) => r.status === 200 });

      sleep(randomIntBetween(2, 4));
    });

    // Step 4: Login
    group('4. Login', function () {
      const res = http.post(
        `${baseUrl}/api/auth/login`,
        JSON.stringify({ email: user.email, password: user.password }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'login' },
        }
      );

      if (check(res, { 'login successful': (r) => r.status === 200 })) {
        token = res.json('token');
      } else {
        journeySuccess = false;
        return;
      }

      sleep(1);
    });

    if (!token) {
      journeySuccessRate.add(false);
      return;
    }

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Step 5: Check availability
    group('5. Check Availability', function () {
      const date = getRandomFutureDate();
      const timeSlot = getRandomTimeSlot();

      const res = http.get(
        `${baseUrl}/api/facilities/${facilityId}/availability?date=${date}&startTime=${timeSlot.startTime}&endTime=${timeSlot.endTime}`,
        {
          headers: authHeaders,
          tags: { name: 'availability_check' },
        }
      );

      check(res, { 'availability checked': (r) => r.status === 200 });

      sleep(randomIntBetween(1, 2));
    });

    // Step 6: Create booking
    let bookingId = null;
    group('6. Create Booking', function () {
      const date = getRandomFutureDate();
      const timeSlot = getRandomTimeSlot();
      const checkoutStart = Date.now();

      const res = http.post(
        `${baseUrl}/api/bookings`,
        JSON.stringify({
          facilityId,
          date,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          type: randomItem(['public_skate', 'hockey', 'figure_skating']),
          participants: randomIntBetween(1, 5),
        }),
        {
          headers: authHeaders,
          tags: { name: 'booking_create' },
        }
      );

      checkoutDuration.add(Date.now() - checkoutStart);

      if (check(res, {
        'booking created': (r) => r.status === 200 || r.status === 201,
      })) {
        bookingId = res.json('id') || res.json('booking')?.id;
      } else if (res.status !== 409) {
        // 409 is expected for conflicting bookings
        journeySuccess = false;
      }

      sleep(2);
    });

    // Step 7: View confirmation
    if (bookingId) {
      group('7. View Booking Confirmation', function () {
        const res = http.get(`${baseUrl}/api/bookings/${bookingId}`, {
          headers: authHeaders,
          tags: { name: 'booking_view' },
        });

        check(res, { 'booking confirmation loaded': (r) => r.status === 200 });

        sleep(randomIntBetween(1, 3));
      });
    }

    // Step 8: View user's bookings
    group('8. View My Bookings', function () {
      const res = http.get(`${baseUrl}/api/bookings`, {
        headers: authHeaders,
        tags: { name: 'booking_list' },
      });

      check(res, { 'bookings list loaded': (r) => r.status === 200 });

      sleep(randomIntBetween(1, 2));
    });

    // Step 9: Check notifications
    group('9. Check Notifications', function () {
      const res = http.get(`${baseUrl}/api/notifications`, {
        headers: authHeaders,
        tags: { name: 'notifications' },
      });

      check(res, { 'notifications loaded': (r) => r.status === 200 });

      sleep(1);
    });

    // Step 10: Logout
    group('10. Logout', function () {
      const res = http.post(`${baseUrl}/api/auth/logout`, null, {
        headers: authHeaders,
        tags: { name: 'logout' },
      });

      check(res, { 'logout successful': (r) => r.status === 200 });
    });
  });

  journeySuccessRate.add(journeySuccess);
  journeyDuration.add(Date.now() - journeyStart);

  // Think time before next journey
  sleep(randomIntBetween(5, 15));
}

export function handleSummary(data) {
  const summary = {
    testRun: new Date().toISOString(),
    environment: env,
    metrics: {
      journeySuccessRate: data.metrics.journey_success_rate?.values?.rate,
      journeyDurationP95: data.metrics.journey_duration?.values?.['p(95)'],
      checkoutDurationP95: data.metrics.checkout_duration?.values?.['p(95)'],
      httpReqDurationP95: data.metrics.http_req_duration?.values?.['p(95)'],
      httpReqFailedRate: data.metrics.http_req_failed?.values?.rate,
    },
    thresholds: data.thresholds,
  };

  return {
    'results/full-journey-summary.json': JSON.stringify(summary, null, 2),
  };
}
