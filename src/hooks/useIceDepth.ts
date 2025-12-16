import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ReadingPoint {
  pointId: string;
  x: number;
  y: number;
  depth: number | null;
}

interface IceDepthReading {
  id: string;
  rinkId: string;
  recordedAt: string;
  recordedBy: { id: string; name: string };
  pointsConfig: number;
  readingPoints: ReadingPoint[];
  averageDepth: number | null;
  minDepth: number | null;
  maxDepth: number | null;
  variance: number | null;
  ambientTemp: number | null;
  iceTemp: number | null;
  humidity: number | null;
  notes: string | null;
  status: string;
  aiAnalysis: unknown | null;
  rink: {
    id: string;
    name: string;
    facility?: { id: string; name: string };
  };
}

interface IceDepthAnalysis {
  summary: string;
  patterns: string[];
  risks: string[];
  recommendations: string[];
  weekOverWeekChange: number | null;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  problemAreas: Array<{ pointId: string; issue: string; severity: string }>;
}

interface CreateReadingInput {
  rinkId: string;
  pointsConfig: number;
  readingPoints: ReadingPoint[];
  ambientTemp?: number;
  iceTemp?: number;
  humidity?: number;
  notes?: string;
}

// Fetch ice depth readings
async function fetchIceDepthReadings(params: {
  rinkId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  includeAnalysis?: boolean;
}): Promise<IceDepthReading[]> {
  const searchParams = new URLSearchParams();
  if (params.rinkId) searchParams.set('rinkId', params.rinkId);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.includeAnalysis) searchParams.set('includeAnalysis', 'true');

  const response = await fetch(`/api/ice-depth?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch ice depth readings');
  }
  const data = await response.json();
  return data.data;
}

// Create new reading
async function createReading(input: CreateReadingInput): Promise<IceDepthReading> {
  const response = await fetch('/api/ice-depth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create reading');
  }
  const data = await response.json();
  return data.data;
}

// Analyze reading with AI
async function analyzeReading(readingId: string): Promise<IceDepthAnalysis> {
  const response = await fetch('/api/ice-depth/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ readingId }),
  });
  if (!response.ok) {
    throw new Error('Failed to analyze reading');
  }
  const data = await response.json();
  return data.data;
}

// Fetch analysis comparison data
async function fetchAnalysisComparison(params: {
  rinkId: string;
  weeks?: number;
}): Promise<{
  weeklyData: Array<{
    weekStart: string;
    averageDepth: number;
    minDepth: number;
    maxDepth: number;
    readingsCount: number;
  }>;
  comparison: Array<{
    currentWeek: string;
    previousWeek: string;
    depthChange: number;
    percentChange: number;
  }> | null;
  trends: { trend: string; confidence: number };
  totalReadings: number;
}> {
  const searchParams = new URLSearchParams();
  searchParams.set('rinkId', params.rinkId);
  if (params.weeks) searchParams.set('weeks', params.weeks.toString());

  const response = await fetch(`/api/ice-depth/analyze?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch analysis');
  }
  const data = await response.json();
  return data.data;
}

// Hooks
export function useIceDepthReadings(params: {
  rinkId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  includeAnalysis?: boolean;
} = {}) {
  return useQuery({
    queryKey: ['ice-depth-readings', params],
    queryFn: () => fetchIceDepthReadings(params),
  });
}

export function useIceDepthAnalysis(params: { rinkId: string; weeks?: number }) {
  return useQuery({
    queryKey: ['ice-depth-analysis', params],
    queryFn: () => fetchAnalysisComparison(params),
    enabled: !!params.rinkId,
  });
}

export function useCreateIceDepthReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ice-depth-readings'] });
    },
  });
}

export function useAnalyzeIceDepth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ice-depth-readings'] });
      queryClient.invalidateQueries({ queryKey: ['ice-depth-analysis'] });
    },
  });
}

export type { IceDepthReading, IceDepthAnalysis, CreateReadingInput, ReadingPoint };
