'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Incident {
  id: string;
  incidentTime: string;
  location: string;
  incidentType: string;
  description: string;
  severityLevel: 'MINOR' | 'MODERATE' | 'SERIOUS' | 'CRITICAL';
  ambulanceCalled: boolean;
  injuredName?: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'CLOSED';
  reportedBy: string;
}

// Mock data
const mockIncidents: Incident[] = [
  {
    id: '1',
    incidentTime: new Date(Date.now() - 3600000).toISOString(),
    location: 'Rink A - Center Ice',
    incidentType: 'Player Collision',
    description: 'Two players collided during hockey practice. One player complained of wrist pain.',
    severityLevel: 'MODERATE',
    ambulanceCalled: false,
    injuredName: 'Michael Johnson',
    status: 'OPEN',
    reportedBy: 'Sarah Wilson',
  },
  {
    id: '2',
    incidentTime: new Date(Date.now() - 86400000).toISOString(),
    location: 'Lobby - Near Entrance',
    incidentType: 'Slip and Fall',
    description: 'Patron slipped on wet floor near entrance. Minor bruise on knee.',
    severityLevel: 'MINOR',
    ambulanceCalled: false,
    status: 'RESOLVED',
    reportedBy: 'John Smith',
  },
  {
    id: '3',
    incidentTime: new Date(Date.now() - 172800000).toISOString(),
    location: 'Rink B - Goal Crease',
    incidentType: 'Goalie Injury',
    description: 'Goalie took puck to face mask, complained of neck pain. EMS called for evaluation.',
    severityLevel: 'SERIOUS',
    ambulanceCalled: true,
    injuredName: 'Emily Davis',
    status: 'UNDER_INVESTIGATION',
    reportedBy: 'Mike Wilson',
  },
];

const severityColors: Record<string, string> = {
  MINOR: 'bg-green-100 text-green-800 border-green-200',
  MODERATE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SERIOUS: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  UNDER_INVESTIGATION: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-rink-100 text-rink-600',
};

export default function IncidentsPage() {
  const [incidents] = useState<Incident[]>(mockIncidents);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredIncidents = incidents.filter((incident) => {
    if (filterSeverity !== 'all' && incident.severityLevel !== filterSeverity) return false;
    if (filterStatus !== 'all' && incident.status !== filterStatus) return false;
    return true;
  });

  const openCount = incidents.filter((i) => i.status === 'OPEN').length;
  const seriousCount = incidents.filter((i) => ['SERIOUS', 'CRITICAL'].includes(i.severityLevel)).length;
  const ambulanceCount = incidents.filter((i) => i.ambulanceCalled).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Incident Reports</h1>
          <p className="page-description">
            Document and track safety incidents across your facility.
          </p>
        </div>
        <Link href="/dashboard/incidents/new">
          <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
            Report Incident
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{openCount}</p>
            <p className="text-sm text-rink-500">Open Incidents</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{seriousCount}</p>
            <p className="text-sm text-rink-500">Serious/Critical</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <PhoneIcon className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{ambulanceCount}</p>
            <p className="text-sm text-rink-500">EMS Called</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-rink-100 rounded-lg">
            <ClockIcon className="w-6 h-6 text-rink-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">{incidents.length}</p>
            <p className="text-sm text-rink-500">Total This Month</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="form-label">Severity</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="form-input w-40"
          >
            <option value="all">All Severities</option>
            <option value="MINOR">Minor</option>
            <option value="MODERATE">Moderate</option>
            <option value="SERIOUS">Serious</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div>
          <label className="form-label">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input w-48"
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_INVESTIGATION">Under Investigation</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {filteredIncidents.map((incident) => (
          <Card key={incident.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${severityColors[incident.severityLevel]}`}>
                  <ExclamationTriangleIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-rink-900">{incident.incidentType}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${severityColors[incident.severityLevel]}`}>
                      {incident.severityLevel}
                    </span>
                    {incident.ambulanceCalled && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3" />
                        EMS Called
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-rink-500 mt-1">{incident.location}</p>
                  <p className="text-sm text-rink-600 mt-2 line-clamp-2">{incident.description}</p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-rink-500">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {format(new Date(incident.incidentTime), 'MMM d, yyyy h:mm a')}
                    </div>
                    {incident.injuredName && (
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        {incident.injuredName}
                      </div>
                    )}
                    <div>Reported by: {incident.reportedBy}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[incident.status]}`}>
                  {incident.status.replace('_', ' ')}
                </span>
                <Link href={`/dashboard/incidents/${incident.id}`}>
                  <Button variant="ghost" size="sm">
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {filteredIncidents.length === 0 && (
          <Card className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-rink-300 mb-4" />
            <h3 className="text-lg font-medium text-rink-700">No incidents found</h3>
            <p className="text-rink-500 mt-1">No incidents match your filter criteria</p>
          </Card>
        )}
      </div>
    </div>
  );
}
