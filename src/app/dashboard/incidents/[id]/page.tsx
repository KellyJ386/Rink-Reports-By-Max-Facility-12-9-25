'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useIncident, useUpdateIncident } from '@/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BodyDiagram } from '@/components/incidents/BodyDiagram';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ShieldExclamationIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const severityConfig = {
  MINOR: { color: 'bg-green-100 text-green-800 border-green-200', icon: 'text-green-600' },
  MODERATE: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: 'text-yellow-600' },
  SERIOUS: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: 'text-orange-600' },
  CRITICAL: { color: 'bg-red-100 text-red-800 border-red-200', icon: 'text-red-600' },
};

const statusConfig = {
  REPORTED: { color: 'bg-blue-100 text-blue-800', label: 'Reported' },
  INVESTIGATING: { color: 'bg-yellow-100 text-yellow-800', label: 'Under Investigation' },
  RESOLVED: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
  CLOSED: { color: 'bg-gray-100 text-gray-600', label: 'Closed' },
};

interface TimelineEvent {
  id: string;
  type: 'created' | 'status_change' | 'note_added' | 'gm_notified' | 'attachment_added';
  timestamp: string;
  user: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;

  const { data: incident, isLoading, error } = useIncident(incidentId);
  const updateIncident = useUpdateIncident();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Mock timeline for now - would come from API
  const timeline: TimelineEvent[] = [
    {
      id: '1',
      type: 'created',
      timestamp: incident?.reportedAt || new Date().toISOString(),
      user: incident?.reportedBy?.name || 'System',
      description: 'Incident report created',
    },
    ...(incident?.severity === 'SERIOUS' || incident?.severity === 'CRITICAL' ? [{
      id: '2',
      type: 'gm_notified' as const,
      timestamp: incident?.reportedAt || new Date().toISOString(),
      user: 'System',
      description: 'General Manager notified via SMS and email',
    }] : []),
  ];

  const handleStatusUpdate = async () => {
    if (!newStatus || !incident) return;

    try {
      await updateIncident.mutateAsync({
        id: incident.id,
        status: newStatus,
        ...(newStatus === 'RESOLVED' && { resolvedAt: new Date().toISOString() }),
      });
      setShowStatusModal(false);
      setNewStatus('');
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !incident) return;

    try {
      await updateIncident.mutateAsync({
        id: incident.id,
        followUpNotes: incident.followUpNotes
          ? `${incident.followUpNotes}\n\n[${format(new Date(), 'MMM d, yyyy h:mm a')}] ${newNote}`
          : `[${format(new Date(), 'MMM d, yyyy h:mm a')}] ${newNote}`,
      });
      setShowNoteModal(false);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleExportPDF = () => {
    // Trigger print dialog for PDF export
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-600"></div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Incident Not Found</h2>
        <p className="text-gray-500 mb-4">The incident you're looking for doesn't exist or has been removed.</p>
        <Link href="/dashboard/incidents">
          <Button>Back to Incidents</Button>
        </Link>
      </div>
    );
  }

  const severity = incident.severity as keyof typeof severityConfig;
  const status = incident.status as keyof typeof statusConfig;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="page-header print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title">Incident #{incident.id.slice(-6).toUpperCase()}</h1>
              <span className={clsx('px-3 py-1 text-sm font-medium rounded-full', severityConfig[severity]?.color)}>
                {severity}
              </span>
              <span className={clsx('px-3 py-1 text-sm font-medium rounded-full', statusConfig[status]?.color)}>
                {statusConfig[status]?.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Reported on {format(new Date(incident.reportedAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportPDF}>
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print/PDF
          </Button>
          <Link href={`/dashboard/incidents/${incident.id}/edit`}>
            <Button variant="secondary">
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">INCIDENT REPORT</h1>
            <p className="text-gray-600">Report #{incident.id.slice(-6).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{incident.facility?.name}</p>
            <p className="text-sm text-gray-600">Generated: {format(new Date(), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
      </div>

      {/* Alert Banner for Serious Incidents */}
      {(severity === 'SERIOUS' || severity === 'CRITICAL') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 print:bg-red-100">
          <ShieldExclamationIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800">High Severity Incident</p>
            <p className="text-sm text-red-700">
              This incident has been flagged for management review. GM was notified at time of report.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-gray-400" />
              Incident Details
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Incident Type</p>
                <p className="font-medium text-gray-900">{incident.incidentType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(incident.occurredAt), 'MMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900 flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  {incident.location || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rink</p>
                <p className="font-medium text-gray-900">{incident.rink?.name || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-gray-900 whitespace-pre-wrap">{incident.description}</p>
            </div>

            {incident.immediateActions && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-500 mb-2">Immediate Actions Taken</p>
                <p className="text-gray-900 whitespace-pre-wrap">{incident.immediateActions}</p>
              </div>
            )}
          </Card>

          {/* Injury Details */}
          {incident.injuryDetails && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-gray-400" />
                Injured Party Details
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">
                    {(incident.injuryDetails as Record<string, unknown>).personName as string || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Person Type</p>
                  <p className="font-medium text-gray-900">
                    {(incident.injuryDetails as Record<string, unknown>).personType as string || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Injury Type</p>
                  <p className="font-medium text-gray-900">
                    {(incident.injuryDetails as Record<string, unknown>).injuryType as string || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Medical Attention</p>
                  <p className="font-medium text-gray-900">
                    {(incident.injuryDetails as Record<string, unknown>).medicalAttention ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {(incident.injuryDetails as Record<string, unknown>).ambulanceCalled && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Ambulance/EMS was called</span>
                </div>
              )}

              {(incident.injuryDetails as Record<string, unknown>).treatmentProvided && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Treatment Provided</p>
                  <p className="text-gray-900">
                    {(incident.injuryDetails as Record<string, unknown>).treatmentProvided as string}
                  </p>
                </div>
              )}

              {/* Body Diagram - Read Only */}
              {(incident.injuryDetails as Record<string, unknown>).bodyParts &&
               Array.isArray((incident.injuryDetails as Record<string, unknown>).bodyParts) &&
               ((incident.injuryDetails as Record<string, unknown>).bodyParts as string[]).length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500 mb-3">Injury Locations</p>
                  <div className="flex flex-wrap gap-2">
                    {((incident.injuryDetails as Record<string, unknown>).bodyParts as string[]).map((part, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Witnesses */}
          {incident.witnesses && incident.witnesses.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <EyeIcon className="w-5 h-5 text-gray-400" />
                Witnesses ({incident.witnesses.length})
              </h3>
              <div className="space-y-2">
                {incident.witnesses.map((witness, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{witness}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">No attachments uploaded</p>
              <Button variant="secondary" size="sm" className="mt-3 print:hidden">
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </Card>

          {/* Follow-up Notes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-gray-400" />
                Follow-up Notes
              </h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowNoteModal(true)}
                className="print:hidden"
              >
                Add Note
              </Button>
            </div>

            {incident.followUpNotes ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{incident.followUpNotes}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No follow-up notes added yet</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 print:hidden">
          {/* Status Management */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Current Status</p>
                <p className={clsx('font-semibold mt-1 inline-block px-3 py-1 rounded-full text-sm', statusConfig[status]?.color)}>
                  {statusConfig[status]?.label}
                </p>
              </div>

              {status !== 'CLOSED' && (
                <Button
                  className="w-full"
                  onClick={() => setShowStatusModal(true)}
                >
                  Update Status
                </Button>
              )}

              {incident.followUpRequired && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 flex items-center gap-2">
                    <BellAlertIcon className="w-4 h-4" />
                    Follow-up Required
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Report Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Reported By</span>
                <span className="font-medium text-gray-900">{incident.reportedBy?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Report Date</span>
                <span className="font-medium text-gray-900">
                  {format(new Date(incident.reportedAt), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Facility</span>
                <span className="font-medium text-gray-900">{incident.facility?.name}</span>
              </div>
              {incident.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolved</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(incident.resolvedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {timeline.map((event, idx) => (
                <div key={event.id} className="flex gap-3">
                  <div className={clsx(
                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                    event.type === 'created' && 'bg-blue-100',
                    event.type === 'status_change' && 'bg-yellow-100',
                    event.type === 'note_added' && 'bg-green-100',
                    event.type === 'gm_notified' && 'bg-red-100',
                  )}>
                    {event.type === 'created' && <DocumentTextIcon className="w-4 h-4 text-blue-600" />}
                    {event.type === 'status_change' && <ClockIcon className="w-4 h-4 text-yellow-600" />}
                    {event.type === 'note_added' && <ChatBubbleLeftRightIcon className="w-4 h-4 text-green-600" />}
                    {event.type === 'gm_notified' && <BellAlertIcon className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.description}</p>
                    <p className="text-xs text-gray-500">
                      {event.user} • {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                <PrinterIcon className="w-4 h-4 mr-2" />
                Print Report
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Generate Insurance Claim
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Incident Status</h3>

            <div className="space-y-3 mb-6">
              {Object.entries(statusConfig).map(([key, config]) => (
                <label
                  key={key}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                    newStatus === key ? 'border-ice-500 bg-ice-50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="status"
                    value={key}
                    checked={newStatus === key}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-4 h-4 text-ice-600"
                  />
                  <span className={clsx('px-2 py-1 rounded-full text-sm font-medium', config.color)}>
                    {config.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleStatusUpdate}
                disabled={!newStatus}
                isLoading={updateIncident.isPending}
              >
                Update Status
              </Button>
              <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Follow-up Note</h3>

            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="form-input h-32 w-full mb-4"
              placeholder="Enter your note..."
            />

            <div className="flex gap-3">
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                isLoading={updateIncident.isPending}
              >
                Add Note
              </Button>
              <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
