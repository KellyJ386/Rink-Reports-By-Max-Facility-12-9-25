'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Witness {
  id: string;
  name: string;
  contact: string;
}

export default function NewIncidentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [injuries, setInjuries] = useState<BodyInjury[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [showWitnessForm, setShowWitnessForm] = useState(false);
  const [newWitness, setNewWitness] = useState({ name: '', contact: '' });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      incidentTime: new Date().toISOString().slice(0, 16),
      location: '',
      incidentType: '',
      description: '',
      severityLevel: 'MINOR',
      ambulanceCalled: false,
      injuredName: '',
      injuredContact: '',
      injuredAge: '',
    },
  });

  const severityLevel = watch('severityLevel');
  const ambulanceCalled = watch('ambulanceCalled');

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
    setIsSubmitting(true);
    try {
      // In production, this would call the API
      const incidentData = {
        ...data,
        facilityId: 'facility-1', // Would come from session
        bodyDiagramData: { injuries },
        witnesses: witnesses.map(({ name, contact }) => ({ name, contact })),
      };

      console.log('Submitting incident:', incidentData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message if ambulance was called
      if (data.ambulanceCalled) {
        alert('GM has been notified via SMS about this serious incident.');
      }

      router.push('/dashboard/incidents');
    } catch (error) {
      console.error('Error submitting incident:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="page-title">Report Incident</h1>
            <p className="page-description">
              Document safety incidents for compliance and follow-up.
            </p>
          </div>
        </div>
      </div>

      {/* Alert for serious incidents */}
      {(ambulanceCalled || ['SERIOUS', 'CRITICAL'].includes(severityLevel)) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">
              {ambulanceCalled ? 'Ambulance Called - ' : ''}High Severity Incident
            </p>
            <p className="text-sm text-red-700 mt-1">
              The General Manager will be notified via SMS immediately upon submission.
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
              <h3 className="text-lg font-semibold text-rink-900 mb-4">Incident Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...register('incidentTime', { required: 'Required' })}
                    type="datetime-local"
                    label="Date & Time of Incident"
                    required
                    error={errors.incidentTime?.message}
                  />
                  <div>
                    <label className="form-label">Location</label>
                    <select
                      {...register('location', { required: 'Required' })}
                      className="form-input"
                    >
                      <option value="">Select location...</option>
                      <option value="Rink A - Ice Surface">Rink A - Ice Surface</option>
                      <option value="Rink A - Boards">Rink A - Boards</option>
                      <option value="Rink A - Penalty Box">Rink A - Penalty Box</option>
                      <option value="Rink B - Ice Surface">Rink B - Ice Surface</option>
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
                    >
                      <option value="">Select type...</option>
                      <option value="Player Collision">Player Collision</option>
                      <option value="Fall on Ice">Fall on Ice</option>
                      <option value="Puck/Stick Injury">Puck/Stick Injury</option>
                      <option value="Slip and Fall">Slip and Fall</option>
                      <option value="Equipment Malfunction">Equipment Malfunction</option>
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
                      className={clsx(
                        'form-input',
                        severityLevel === 'CRITICAL' && 'border-red-500 bg-red-50',
                        severityLevel === 'SERIOUS' && 'border-orange-500 bg-orange-50'
                      )}
                    >
                      <option value="MINOR">Minor - First aid only</option>
                      <option value="MODERATE">Moderate - Medical attention needed</option>
                      <option value="SERIOUS">Serious - Emergency services called</option>
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
                    placeholder="Describe what happened in detail..."
                  />
                  {errors.description && (
                    <p className="form-error">{errors.description.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <input
                    {...register('ambulanceCalled')}
                    type="checkbox"
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
              </div>
            </Card>

            {/* Injured Party */}
            <Card>
              <h3 className="text-lg font-semibold text-rink-900 mb-4">Injured Party Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  {...register('injuredName')}
                  label="Name"
                  placeholder="Full name"
                />
                <Input
                  {...register('injuredContact')}
                  label="Contact Number"
                  placeholder="Phone number"
                />
                <Input
                  {...register('injuredAge')}
                  type="number"
                  label="Age"
                  placeholder="Age"
                />
              </div>
            </Card>

            {/* Body Diagram */}
            <Card>
              <h3 className="text-lg font-semibold text-rink-900 mb-4">Injury Location</h3>
              <BodyDiagram
                injuries={injuries}
                onAddInjury={handleAddInjury}
                onRemoveInjury={handleRemoveInjury}
              />
            </Card>

            {/* Witnesses */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-rink-900">Witnesses</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowWitnessForm(true)}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Witness
                </Button>
              </div>

              {showWitnessForm && (
                <div className="mb-4 p-4 bg-rink-50 rounded-lg">
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
                      className="flex items-center justify-between p-3 bg-rink-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-rink-900">{witness.name}</p>
                        {witness.contact && (
                          <p className="text-sm text-rink-500">{witness.contact}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveWitness(witness.id)}
                        className="p-1 text-rink-400 hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-rink-500 text-center py-4">
                  No witnesses added
                </p>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submission Card */}
            <Card>
              <h3 className="text-lg font-semibold text-rink-900 mb-4">Submit Report</h3>
              <div className="space-y-4">
                <div className="p-3 bg-rink-50 rounded-lg text-sm">
                  <p className="text-rink-600">
                    <strong>Reported by:</strong> Current User
                  </p>
                  <p className="text-rink-600">
                    <strong>Facility:</strong> Main Arena
                  </p>
                  <p className="text-rink-600">
                    <strong>Date:</strong> {new Date().toLocaleDateString()}
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Submit Incident Report
                </Button>

                <p className="text-xs text-rink-500 text-center">
                  Reports cannot be deleted after submission.
                  {(ambulanceCalled || ['SERIOUS', 'CRITICAL'].includes(severityLevel)) &&
                    ' GM will be notified immediately.'}
                </p>
              </div>
            </Card>

            {/* Photo Upload */}
            <Card>
              <h3 className="text-lg font-semibold text-rink-900 mb-4">Attachments</h3>
              <div className="border-2 border-dashed border-rink-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer text-ice-600 hover:text-ice-700"
                >
                  <PlusIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Add Photos</p>
                  <p className="text-xs text-rink-400 mt-1">
                    Click to upload or drag and drop
                  </p>
                </label>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
