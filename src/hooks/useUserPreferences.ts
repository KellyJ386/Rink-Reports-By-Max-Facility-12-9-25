'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface UserNotificationPrefs {
  id: string;
  userId: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string;
  digestIncludeAlerts: boolean;
  digestIncludeForms: boolean;
  digestIncludeIncidents: boolean;
  digestIncludeReadings: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesInput {
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  dailyDigestEnabled?: boolean;
  dailyDigestTime?: string;
  digestIncludeAlerts?: boolean;
  digestIncludeForms?: boolean;
  digestIncludeIncidents?: boolean;
  digestIncludeReadings?: boolean;
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
}

async function fetchPreferences(): Promise<UserNotificationPrefs> {
  const res = await fetch('/api/user/preferences');
  if (!res.ok) throw new Error('Failed to fetch preferences');
  const json = await res.json();
  return json.data;
}

async function updatePreferences(input: UpdatePreferencesInput): Promise<UserNotificationPrefs> {
  const res = await fetch('/api/user/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  const json = await res.json();
  return json.data;
}

export function useUserPreferences() {
  return useQuery({
    queryKey: ['userPreferences'],
    queryFn: fetchPreferences,
    staleTime: 60000,
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
}

// Time format utilities
export function formatTime24to12(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTime12to24(time12: string): string {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12;

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

export const TIME_OPTIONS = [
  { value: '00:00', label: '12:00 AM' },
  { value: '01:00', label: '1:00 AM' },
  { value: '02:00', label: '2:00 AM' },
  { value: '03:00', label: '3:00 AM' },
  { value: '04:00', label: '4:00 AM' },
  { value: '05:00', label: '5:00 AM' },
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '23:00', label: '11:00 PM' },
];
