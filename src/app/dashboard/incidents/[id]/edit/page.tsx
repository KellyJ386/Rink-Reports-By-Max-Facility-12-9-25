'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useIncident, useUpdateIncident } from '@/hooks';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BodyDiagram } from '@/components/incidents/BodyDiagram';
import { BodyInjury } from '@/types';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const injuryTypes = [
  'Laceration/Cut',
  'Bruise/Contusion',
  'Sprain/Strain',
  'Fracture',
  'Concussion',
  'Abrasion/Scrape',
  'Dislocation',
  'Burn',
  'Frostbite',
  'Other',
];

const personTypes = [
  'Player',
  'Spectator',
  'Staff',
  'Coach',
  'Referee',
  'Visitor',
  'Contractor',
  'Other',
];

interface Witness {
  id: string;
  name: string;
  contact: string;
}

export default function EditIncidentPage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;

  const { data: incident, isLoading } = useIncident(incidentId);
  const updateIncident = useUpdateIncident();

  const [injuries, setInjuries] = useState<BodyInjury[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [showWitnessForm, setShowWitnessForm] = useState(false);
  const [newWitness, setNewWitness] = useState({ name: '', contact: '' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm();

  const severityLevel = watch('severityLevel');
  const ambulanceCalled = watch('ambulanceCalled');
  const injuredName = watch('injuredName');

  // Load incident data into form
  useEffect(() => {
    if (incident) {
      const injuryDetails = incident.injuryDetails as Record<string, unknown> | null;

      reset({
        incidentTime: incident.occurredAt ? new Date(incident.occurredAt).toISOString().slice(0, 16) : '',
        location: incident.location || '',
        incidentType: incident.incidentType || '',
        description: incident.description || '',
        severityLevel: incident.severity || 'MINOR',
        ambulanceCalled: injuryDetails?.ambulanceCalled || false,
        injuredName: injuryDetails?.personName || '',
        injuredContact: '',
        injuredAge: '',
        injuredPersonType: injuryDetails?.personType || '',
        injuryType: injuryDetails?.injuryType || '',
        treatmentProvided: injuryDetails?.treatmentProvided || '',
        medicalAttention: injuryDetails?.medicalAttention || false,
        immediateActions: incident.immediateActions || '',
        followUpRequired: incident.followUpRequired || false,
        followUpNotes: incident.followUpNotes || '',
      });

      // Load witnesses
      if (incident.witnesses && Array.isArray(incident.witnesses)) {
        setWitnesses(
          incident.witnesses.map((w, idx) => ({
            id: `witness-${idx}`,
            name: typeof w === 'string' ? w.split(' (')[0] : '',
            contact: typeof w === 'string' && w.includes('(') ? w.split('(')[1]?.replace(')', '') : '',
          }))
        );
      }

      // Load body parts as injuries
      if (injuryDetails?.bodyParts && Array.isArray(injuryDetails.bodyParts)) {
        setInjuries(
          (injuryDetails.bodyParts as string[]).map((part, idx) => ({
            id: `injury-${idx}`,
            bodyPart: part,
            x: 50,
            y: 50,
            description: part,
          }))
        );
      }
    }
  }, [incident, reset]);

  const handleAddInjury = (injury: BodyInjury) => {
    setInjuries([...injuries, injury]);
  };

  const handleRemoveInjury = (id: string) => {
    setInjuries(injuries.filter((i) => i.id !== id));
  };

  const handleAddWitness = () => {
    if (newWitness.name.trim()) {
      setWitnesses([
        ...witnesses,
        { id: `witness-${Date.now()}`, ...newWitness },
      ]);
      setNewWitness({ name: '', contact: '' });
      setShowWitnessForm(false);
    }
  };

  const handleRemoveWitness = (id: string) => {
    setWitnesses(witnesses.filter((w) => w.id !== id));
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    setSubmitError(null);
    setSaveSuccess(false);

    try {
      const injuryDetails = data.injuredName
        ? {
            personName: data.injuredName as string,
            personType: (data.injuredPersonType as string) || 'Other',
            injuryType: (data.injuryType as string) || 'Other',
            bodyParts: injuries.map((i) => i.bodyPart),
            treatmentProvided: data.treatmentProvided as string,
            medicalAttention: Boolean(data.medicalAttention),
            ambulanceCalled: Boolean(data.ambulanceCalled),
          }
        : undefined;

      await updateIncident.mutateAsync({
        id: incidentId,
        incidentType: data.incidentType as string,
        severity: data.severityLevel as string,
        occurredAt: new Date(data.incidentTime as string).toISOString(),
        location: data.location as string,
        description: data.description as string,
        injuryDetails,
        witnesses: witnesses.map(
          ({ name, contact }) => `${name}${contact ? ` (${contact})` : ''}`
        ),
        immediateActions: data.immediateActions as string,
        followUpRequired: Boolean(data.followUpRequired),
        followUpNotes: data.followUpNotes as string,
      } as never);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating incident:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update incident'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ice-600"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Incident Not Found
        </h2>
        <Button onClick={() => router.push('/dashboard/incidents')}>
          Back to Incidents
        </Button>
      </div>
    );
  }

  // Check if incident can be edited (not closed)
  const canEdit = incident.status !== 'CLOSED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="page-title">Edit Incident #{incidentId.slice(-6).toUpperCase()}</h1>
            <p className="page-description">
              Update incident details and add follow-up information.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
            <CheckCircleIcon className="w-5 h-5" />
            <span className="font-medium">Changes saved successfully</span>
          </div>
        )}
      </div>

      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            This incident is closed and cannot be edited. Contact an administrator
            to reopen if necessary.
          </p>
        </div>
      )}

      {/* Alert for serious incidents */}
      {(ambulanceCalled || ['SERIOUS', 'CRITICAL'].includes(severityLevel)) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">
              {ambulanceCalled ? 'Ambulance Called - ' : ''}High Severity Incident
            </p>
            <p className="text-sm text-red-700 mt-1">
              Changes to severity may trigger additional notifications.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Details */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Incident Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register('incidentTime', { required: 'Required' })}
                    type="datetime-local"
                    label="Date & Time of Incident"
                    required
                    disabled={!canEdit}
                    error={errors.incidentTime?.message as string}
                  />
                  <div>
                    <label className="form-label">Location</label>
                    <select
                      {...register('location', { required: 'Required' })}
                      className="form-input"
                      disabled={!canEdit}
                    >
                      <option value="">Select location...</option>
                      <option value="Rink A - Ice Surface">
                        Rink A - Ice Surface
                      </option>
                      <option value="Rink A - Boards">Rink A - Boards</option>
                      <option value="Rink A - Penalty Box">
                        Rink A - Penalty Box
                      </option>
                      <option value="Rink B - Ice Surface">
                        Rink B - Ice Surface
                      </option>
                      <option value="Lobby">Lobby</option>
                      <option value="Locker Room">Locker Room</option>
                      <option value="Parking Lot">Parking Lot</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Incident Type</label>
                    <select
                      {...register('incidentType', { required: 'Required' })}
                      className="form-input"
                      disabled={!canEdit}
                    >
                      <option value="">Select type...</option>
                      <option value="Player Collision">Player Collision</option>
                      <option value="Fall on Ice">Fall on Ice</option>
                      <option value="Puck/Stick Injury">Puck/Stick Injury</option>
                      <option value="Slip and Fall">Slip and Fall</option>
                      <option value="Equipment Malfunction">
                        Equipment Malfunction
                      </option>
                      <option value="Medical Emergency">Medical Emergency</option>
                      <option value="Altercation">Altercation</option>
                      <option value="Property Damage">Property Damage</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Severity Level</label>
                    <select
                      {...register('severityLevel')}
                      disabled={!canEdit}
                      className={clsx(
                        'form-input',
                        severityLevel === 'CRITICAL' && 'border-red-500 bg-red-50',
                        severityLevel === 'SERIOUS' && 'border-orange-500 bg-orange-50'
                      )}
                    >
                      <option value="MINOR">Minor - First aid only</option>
                      <option value="MODERATE">
                        Moderate - Medical attention needed
                      </option>
                      <option value="SERIOUS">
                        Serious - Emergency services called
                      </option>
                      <option value="CRITICAL">Critical - Life-threatening</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Description of Incident</label>
                  <textarea
                    {...register('description', {
                      required: 'Required',
                      minLength: { value: 20, message: 'Please provide more detail' },
                    })}
                    className="form-input h-32"
                    disabled={!canEdit}
                    placeholder="Describe what happened in detail..."
                  />
                  {errors.description && (
                    <p className="form-error">{errors.description.message as string}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <input
                    {...register('ambulanceCalled')}
                    type="checkbox"
                    disabled={!canEdit}
                    className="w-5 h-5 text-red-600 rounded border-red-300 focus:ring-red-500"
                  />
                  <div>
                    <label className="font-medium text-red-800 flex items-center gap-2">
                      <PhoneIcon className="w-5 h-5" />
                      Ambulance/EMS Called
                    </label>
                    <p className="text-sm text-red-700">
                      Check this if emergency services were contacted
                    </p>
                  </div>
                </div>

                <div>
                  <label className="form-label">Immediate Actions Taken</label>
                  <textarea
                    {...register('immediateActions')}
                    className="form-input h-24"
                    disabled={!canEdit}
                    placeholder="Describe what actions were taken immediately after the incident..."
                  />
                </div>
              </div>
            </Card>

            {/* Injured Party */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Injured Party Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    {...register('injuredName')}
                    label="Name"
                    placeholder="Full name"
                    disabled={!canEdit}
                  />
                  <Input
                    {...register('injuredContact')}
                    label="Contact Number"
                    placeholder="Phone number"
                    disabled={!canEdit}
                  />
                  <Input
                    {...register('injuredAge')}
                    type="number"
                    label="Age"
                    placeholder="Age"
                    disabled={!canEdit}
                  />
                  <div>
                    <label className="form-label">Person Type</label>
                    <select
                      {...register('injuredPersonType')}
                      className="form-input"
                      disabled={!canEdit}
                    >
                      <option value="">Select type...</option>
                      {personTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {injuredName && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="form-label">Injury Type</label>
                      <select
                        {...register('injuryType')}
                        className="form-input"
                        disabled={!canEdit}
                      >
                        <option value="">Select injury type...</option>
                        {injuryTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Treatment Provided</label>
                      <Input
                        {...register('treatmentProvided')}
                        placeholder="e.g., Ice pack applied, wound cleaned..."
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input
                        {...register('medicalAttention')}
                        type="checkbox"
                        disabled={!canEdit}
                        className="w-4 h-4 text-ice-600 rounded border-gray-300 focus:ring-ice-500"
                      />
                      <label className="text-sm text-gray-700">
                        Professional medical attention was sought or recommended
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Body Diagram */}
            {canEdit && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Injury Location
                </h3>
                <BodyDiagram
                  injuries={injuries}
                  onAddInjury={handleAddInjury}
                  onRemoveInjury={handleRemoveInjury}
                  readOnly={!canEdit}
                />
              </Card>
            )}

            {/* Witnesses */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Witnesses</h3>
                {canEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowWitnessForm(true)}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Witness
                  </Button>
                )}
              </div>

              {showWitnessForm && canEdit && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <Input
                      value={newWitness.name}
                      onChange={(e) =>
                        setNewWitness({ ...newWitness, name: e.target.value })
                      }
                      label="Witness Name"
                      placeholder="Full name"
                    />
                    <Input
                      value={newWitness.contact}
                      onChange={(e) =>
                        setNewWitness({ ...newWitness, contact: e.target.value })
                      }
                      label="Contact Info"
                      placeholder="Phone or email"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleAddWitness}>
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowWitnessForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {witnesses.length > 0 ? (
                <div className="space-y-2">
                  {witnesses.map((witness) => (
                    <div
                      key={witness.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{witness.name}</p>
                        {witness.contact && (
                          <p className="text-sm text-gray-500">{witness.contact}</p>
                        )}
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWitness(witness.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No witnesses recorded
                </p>
              )}
            </Card>

            {/* Follow-up Section */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Follow-up Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    {...register('followUpRequired')}
                    type="checkbox"
                    className="w-4 h-4 text-ice-600 rounded border-gray-300 focus:ring-ice-500"
                  />
                  <label className="text-sm text-gray-700">
                    Follow-up action required
                  </label>
                </div>

                <div>
                  <label className="form-label">Follow-up Notes</label>
                  <textarea
                    {...register('followUpNotes')}
                    className="form-input h-32"
                    placeholder="Add notes about follow-up actions, investigation results, etc..."
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Save Card */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Save Changes
              </h3>
              <div className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {submitError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canEdit}
                  isLoading={updateIncident.isPending}
                >
                  Save Changes
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/incidents/${incidentId}`)}
                >
                  Cancel
                </Button>

                {isDirty && (
                  <p className="text-xs text-yellow-600 text-center">
                    You have unsaved changes
                  </p>
                )}
              </div>
            </Card>

            {/* Status Info */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Status
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-gray-900">
                    {incident.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reported By</span>
                  <span className="font-medium text-gray-900">
                    {incident.reportedBy?.name || 'Unknown'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  To change status, use the Status Management section on the
                  incident detail page.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
