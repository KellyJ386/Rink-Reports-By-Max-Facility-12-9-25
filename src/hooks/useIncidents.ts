import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Incident {
  id: string;
  facilityId: string;
  rinkId: string | null;
  incidentType: string;
  severity: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  occurredAt: string;
  reportedAt: string;
  location: string | null;
  description: string;
  injuryDetails: unknown | null;
  witnesses: string[];
  immediateActions: string | null;
  followUpRequired: boolean;
  followUpNotes: string | null;
  resolvedAt: string | null;
  facility: { id: string; name: string };
  rink: { id: string; name: string } | null;
  reportedBy: { id: string; name: string } | null;
}

interface CreateIncidentInput {
  facilityId: string;
  rinkId?: string;
  incidentType: string;
  severity: string;
  occurredAt: string;
  location?: string;
  description: string;
  injuryDetails?: {
    personName: string;
    personType: string;
    injuryType: string;
    bodyParts: string[];
    treatmentProvided?: string;
    medicalAttention: boolean;
    ambulanceCalled: boolean;
  };
  witnesses?: string[];
  immediateActions?: string;
}

interface UpdateIncidentInput {
  id: string;
  status?: string;
  followUpNotes?: string;
  resolvedAt?: string;
}

// Fetch incidents
async function fetchIncidents(params: {
  facilityId?: string;
  rinkId?: string;
  status?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<Incident[]> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value.toString());
  });

  const response = await fetch(`/api/incidents?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch incidents');
  }
  const data = await response.json();
  return data.data;
}

// Create incident
async function createIncident(input: CreateIncidentInput): Promise<Incident> {
  const response = await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create incident');
  }
  const data = await response.json();
  return data.data;
}

// Update incident
async function updateIncident(input: UpdateIncidentInput): Promise<Incident> {
  const { id, ...updates } = input;
  const response = await fetch(`/api/incidents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error('Failed to update incident');
  }
  const data = await response.json();
  return data.data;
}

// Fetch incident by ID
async function fetchIncidentById(id: string): Promise<Incident> {
  const response = await fetch(`/api/incidents/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch incident');
  }
  const data = await response.json();
  return data.data;
}

// Hooks
export function useIncidents(params: {
  facilityId?: string;
  rinkId?: string;
  status?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () => fetchIncidents(params),
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetchIncidentById(id),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateIncident,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', data.id] });
    },
  });
}

export type { Incident, CreateIncidentInput, UpdateIncidentInput };
