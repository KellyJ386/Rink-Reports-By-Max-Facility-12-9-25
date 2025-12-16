'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  TruckIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import clsx from 'clsx';

type TabType = 'circle-check' | 'blade-change' | 'ice-make';

interface ZamboniCheck {
  id: string;
  checkTime: string;
  equipmentName: string;
  oilLevel: string;
  waterLevel: string;
  bladesCondition: string;
  lightsWorking: boolean;
  hornWorking: boolean;
  hoursAtCheck: number;
  maintenanceNeeded: boolean;
  operator: string;
}

interface BladeChange {
  id: string;
  changeTime: string;
  equipmentName: string;
  hoursOnOldBlade: number;
  reason: string;
  operator: string;
}

// Mock data
const mockZamboniChecks: ZamboniCheck[] = [
  {
    id: '1',
    checkTime: new Date().toISOString(),
    equipmentName: 'Zamboni #1',
    oilLevel: 'OK',
    waterLevel: 'OK',
    bladesCondition: 'OK',
    lightsWorking: true,
    hornWorking: true,
    hoursAtCheck: 1250,
    maintenanceNeeded: false,
    operator: 'John Smith',
  },
  {
    id: '2',
    checkTime: new Date(Date.now() - 86400000).toISOString(),
    equipmentName: 'Zamboni #2',
    oilLevel: 'LOW',
    waterLevel: 'OK',
    bladesCondition: 'NEEDS_ATTENTION',
    lightsWorking: true,
    hornWorking: true,
    hoursAtCheck: 890,
    maintenanceNeeded: true,
    operator: 'Mike Wilson',
  },
];

const mockBladeChanges: BladeChange[] = [
  {
    id: '1',
    changeTime: new Date(Date.now() - 172800000).toISOString(),
    equipmentName: 'Zamboni #1',
    hoursOnOldBlade: 180,
    reason: 'SCHEDULED',
    operator: 'John Smith',
  },
];

const mockEquipment = [
  { id: 'eq1', name: 'Zamboni #1', currentHours: 1250 },
  { id: 'eq2', name: 'Zamboni #2', currentHours: 890 },
  { id: 'eq3', name: 'Olympia', currentHours: 520 },
];

const mockRinks = [
  { id: 'rink1', name: 'Rink A' },
  { id: 'rink2', name: 'Rink B' },
];

const statusColors: Record<string, string> = {
  OK: 'bg-green-100 text-green-800',
  LOW: 'bg-yellow-100 text-yellow-800',
  NEEDS_ATTENTION: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function IceOpsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('circle-check');
  const [showForm, setShowForm] = useState(false);
  const [zamboniChecks, setZamboniChecks] = useState(mockZamboniChecks);
  const [bladeChanges, setBladeChanges] = useState(mockBladeChanges);
  const { register, handleSubmit, reset } = useForm();

  const tabs = [
    { id: 'circle-check' as TabType, label: 'Circle Checks', icon: TruckIcon },
    { id: 'blade-change' as TabType, label: 'Blade Changes', icon: WrenchScrewdriverIcon },
    { id: 'ice-make' as TabType, label: 'Ice Make Logs', icon: ClockIcon },
  ];

  const onSubmitCircleCheck = (data: unknown) => {
    const formData = data as Record<string, string | number | boolean>;
    const equipment = mockEquipment.find((e) => e.id === formData.equipmentId);
    const newCheck: ZamboniCheck = {
      id: `check-${Date.now()}`,
      checkTime: new Date().toISOString(),
      equipmentName: equipment?.name || 'Unknown',
      oilLevel: formData.oilLevel as string,
      waterLevel: formData.waterLevel as string,
      bladesCondition: formData.bladesCondition as string,
      lightsWorking: formData.lightsWorking === 'true',
      hornWorking: formData.hornWorking === 'true',
      hoursAtCheck: Number(formData.hoursAtCheck),
      maintenanceNeeded: formData.maintenanceNeeded === 'true',
      operator: 'Current User',
    };
    setZamboniChecks([newCheck, ...zamboniChecks]);
    setShowForm(false);
    reset();
  };

  const onSubmitBladeChange = (data: unknown) => {
    const formData = data as Record<string, string | number>;
    const equipment = mockEquipment.find((e) => e.id === formData.equipmentId);
    const newChange: BladeChange = {
      id: `blade-${Date.now()}`,
      changeTime: new Date().toISOString(),
      equipmentName: equipment?.name || 'Unknown',
      hoursOnOldBlade: Number(formData.hoursOnOldBlade),
      reason: formData.reason as string,
      operator: 'Current User',
    };
    setBladeChanges([newChange, ...bladeChanges]);
    setShowForm(false);
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ice Operations</h1>
          <p className="page-description">
            Manage Zamboni checks, blade changes, and ice make logs.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          New Entry
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-ice-100 rounded-lg">
            <TruckIcon className="w-6 h-6 text-ice-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">3</p>
            <p className="text-sm text-rink-500">Active Equipment</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">12</p>
            <p className="text-sm text-rink-500">Checks This Week</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">1</p>
            <p className="text-sm text-rink-500">Maintenance Needed</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-rink-100 rounded-lg">
            <WrenchScrewdriverIcon className="w-6 h-6 text-rink-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-rink-900">180</p>
            <p className="text-sm text-rink-500">Avg Blade Hours</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-rink-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-ice-600 text-ice-600'
                  : 'border-transparent text-rink-500 hover:text-rink-700'
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          {activeTab === 'circle-check' && (
            <>
              <h3 className="text-lg font-semibold text-rink-900 mb-4">
                New Circle Check
              </h3>
              <form onSubmit={handleSubmit(onSubmitCircleCheck)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Equipment</label>
                    <select {...register('equipmentId', { required: true })} className="form-input">
                      <option value="">Select equipment...</option>
                      {mockEquipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name} ({eq.currentHours} hrs)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Rink</label>
                    <select {...register('rinkId', { required: true })} className="form-input">
                      <option value="">Select rink...</option>
                      {mockRinks.map((rink) => (
                        <option key={rink.id} value={rink.id}>
                          {rink.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    {...register('hoursAtCheck', { required: true })}
                    type="number"
                    label="Current Hours"
                    placeholder="e.g., 1250"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="form-label">Oil Level</label>
                    <select {...register('oilLevel')} className="form-input">
                      <option value="OK">OK</option>
                      <option value="LOW">Low</option>
                      <option value="NEEDS_ATTENTION">Needs Attention</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Water Level</label>
                    <select {...register('waterLevel')} className="form-input">
                      <option value="OK">OK</option>
                      <option value="LOW">Low</option>
                      <option value="NEEDS_ATTENTION">Needs Attention</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Blades</label>
                    <select {...register('bladesCondition')} className="form-input">
                      <option value="OK">OK</option>
                      <option value="NEEDS_ATTENTION">Needs Attention</option>
                      <option value="CRITICAL">Needs Change</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Lights Working</label>
                    <select {...register('lightsWorking')} className="form-input">
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Horn Working</label>
                    <select {...register('hornWorking')} className="form-input">
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Maintenance Needed?</label>
                    <select {...register('maintenanceNeeded')} className="form-input">
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <Input
                    {...register('fuelLevel')}
                    type="number"
                    min="0"
                    max="100"
                    label="Fuel Level (%)"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="form-label">Issues Found / Notes</label>
                  <textarea {...register('notes')} className="form-input h-20" placeholder="Describe any issues..." />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Check</Button>
                </div>
              </form>
            </>
          )}

          {activeTab === 'blade-change' && (
            <>
              <h3 className="text-lg font-semibold text-rink-900 mb-4">
                Record Blade Change
              </h3>
              <form onSubmit={handleSubmit(onSubmitBladeChange)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Equipment</label>
                    <select {...register('equipmentId', { required: true })} className="form-input">
                      <option value="">Select equipment...</option>
                      {mockEquipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    {...register('hoursOnOldBlade', { required: true })}
                    type="number"
                    label="Hours on Old Blade"
                    placeholder="e.g., 180"
                  />
                  <div>
                    <label className="form-label">Reason for Change</label>
                    <select {...register('reason')} className="form-input">
                      <option value="SCHEDULED">Scheduled Maintenance</option>
                      <option value="DAMAGE">Blade Damage</option>
                      <option value="PERFORMANCE">Poor Performance</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Notes</label>
                  <textarea {...register('notes')} className="form-input h-20" placeholder="Additional details..." />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Change</Button>
                </div>
              </form>
            </>
          )}
        </Card>
      )}

      {/* Content based on active tab */}
      {activeTab === 'circle-check' && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-rink-200">
            <h3 className="text-lg font-semibold text-rink-900">Recent Circle Checks</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-rink-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Oil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Water</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Blades</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rink-100">
                {zamboniChecks.map((check) => (
                  <tr key={check.id} className="hover:bg-rink-50">
                    <td className="px-4 py-3 text-sm text-rink-900">
                      {format(new Date(check.checkTime), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-rink-900">{check.equipmentName}</td>
                    <td className="px-4 py-3 text-sm text-rink-600">{check.hoursAtCheck}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[check.oilLevel]}`}>
                        {check.oilLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[check.waterLevel]}`}>
                        {check.waterLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[check.bladesCondition]}`}>
                        {check.bladesCondition}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {check.maintenanceNeeded ? (
                        <Badge variant="warning">Needs Service</Badge>
                      ) : (
                        <Badge variant="success">OK</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-rink-600">{check.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'blade-change' && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-rink-200">
            <h3 className="text-lg font-semibold text-rink-900">Blade Change History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-rink-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Hours on Old Blade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-rink-500 uppercase">Changed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rink-100">
                {bladeChanges.map((change) => (
                  <tr key={change.id} className="hover:bg-rink-50">
                    <td className="px-4 py-3 text-sm text-rink-900">
                      {format(new Date(change.changeTime), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-rink-900">{change.equipmentName}</td>
                    <td className="px-4 py-3 text-sm text-rink-600">{change.hoursOnOldBlade} hours</td>
                    <td className="px-4 py-3">
                      <Badge variant={change.reason === 'SCHEDULED' ? 'default' : 'warning'}>
                        {change.reason.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-rink-600">{change.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'ice-make' && (
        <Card className="text-center py-12">
          <ClockIcon className="w-12 h-12 mx-auto text-rink-300 mb-4" />
          <h3 className="text-lg font-medium text-rink-700">Ice Make Logs</h3>
          <p className="text-rink-500 mt-1">Track ice building sessions and flood counts</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Log Ice Make Session
          </Button>
        </Card>
      )}
    </div>
  );
}
