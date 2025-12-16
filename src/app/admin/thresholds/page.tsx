'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  ChartBarIcon,
  BeakerIcon,
  CloudIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  useThresholds,
  useBulkSaveThresholds,
  useFacilities,
  MODULE_LABELS,
  MODULE_COLORS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  CHANNEL_LABELS,
  useNotificationConfigs,
  useCreateNotificationConfig,
  useUpdateNotificationConfig,
  useDeleteNotificationConfig,
} from '@/hooks';
import { ThresholdModule, SeverityLevel, NotificationChannel, UserRole } from '@prisma/client';
import { DEFAULT_THRESHOLDS } from '@/types';

const MODULE_ICONS: Record<ThresholdModule, typeof ChartBarIcon> = {
  ICE_DEPTH: ChartBarIcon,
  REFRIGERATION: BeakerIcon,
  AIR_QUALITY: CloudIcon,
};

const SEVERITY_ORDER: SeverityLevel[] = ['MINOR', 'MODERATE', 'SERIOUS', 'CRITICAL'];
const AVAILABLE_CHANNELS: NotificationChannel[] = ['EMAIL', 'SMS', 'IN_APP', 'PUSH'];

interface ThresholdFormData {
  parameterName: string;
  label: string;
  unit: string;
  minValue: string;
  maxValue: string;
  warningMin: string;
  warningMax: string;
  alertEnabled: boolean;
  alertSeverity: SeverityLevel;
  rinkId?: string | null;
}

export default function ThresholdsPage() {
  const [activeModule, setActiveModule] = useState<ThresholdModule>('ICE_DEPTH');
  const [selectedRinkId, setSelectedRinkId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, ThresholdFormData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch facilities to get first facility ID
  const { data: facilities } = useFacilities();
  const facilityId = facilities?.[0]?.id;

  // Fetch thresholds
  const { data: thresholdsData, isLoading, refetch } = useThresholds(facilityId || null, {
    module: activeModule,
    includeDefaults: true,
  });

  // Fetch notification configs
  const { data: notificationData } = useNotificationConfigs(facilityId || null, activeModule);

  // Mutations
  const bulkSaveMutation = useBulkSaveThresholds();
  const createNotificationMutation = useCreateNotificationConfig();
  const updateNotificationMutation = useUpdateNotificationConfig();
  const deleteNotificationMutation = useDeleteNotificationConfig();

  // Get rinks from thresholds data
  const rinks = thresholdsData?.rinks || [];

  // Initialize form data from thresholds
  useEffect(() => {
    if (!thresholdsData) return;

    const newFormData: Record<string, ThresholdFormData> = {};

    // Process existing thresholds
    thresholdsData.thresholds.forEach((t) => {
      const key = `${t.parameterName}:${t.rinkId || 'facility'}`;
      const defaults = DEFAULT_THRESHOLDS[t.module]?.[t.parameterName];
      newFormData[key] = {
        parameterName: t.parameterName,
        label: defaults?.label || t.parameterName,
        unit: defaults?.unit || '',
        minValue: t.minValue?.toString() || '',
        maxValue: t.maxValue?.toString() || '',
        warningMin: t.warningMin?.toString() || '',
        warningMax: t.warningMax?.toString() || '',
        alertEnabled: t.alertEnabled,
        alertSeverity: t.alertSeverity,
        rinkId: t.rinkId,
      };
    });

    // Add defaults that don't exist yet
    thresholdsData.defaults?.forEach((d) => {
      const key = `${d.parameterName}:facility`;
      if (!newFormData[key]) {
        newFormData[key] = {
          parameterName: d.parameterName,
          label: d.label,
          unit: d.unit,
          minValue: d.minValue?.toString() || '',
          maxValue: d.maxValue?.toString() || '',
          warningMin: d.warningMin?.toString() || '',
          warningMax: d.warningMax?.toString() || '',
          alertEnabled: d.alertEnabled,
          alertSeverity: d.alertSeverity as SeverityLevel,
          rinkId: null,
        };
      }
    });

    setFormData(newFormData);
    setHasChanges(false);
  }, [thresholdsData]);

  // Get parameters for current module
  const moduleParameters = useMemo(() => {
    const params = Object.entries(DEFAULT_THRESHOLDS[activeModule] || {}).map(([name, config]) => ({
      name,
      ...config,
    }));
    return params;
  }, [activeModule]);

  // Filter form data for display
  const displayedThresholds = useMemo(() => {
    const filtered: ThresholdFormData[] = [];

    moduleParameters.forEach((param) => {
      // If rink is selected and it's ice depth, show rink-specific or fall back to facility
      const rinkKey = `${param.name}:${selectedRinkId}`;
      const facilityKey = `${param.name}:facility`;

      if (selectedRinkId && activeModule === 'ICE_DEPTH' && formData[rinkKey]) {
        filtered.push(formData[rinkKey]);
      } else if (formData[facilityKey]) {
        filtered.push(formData[facilityKey]);
      } else {
        // Add default
        filtered.push({
          parameterName: param.name,
          label: param.label,
          unit: param.unit,
          minValue: param.min?.toString() || '',
          maxValue: param.max?.toString() || '',
          warningMin: param.warningMin?.toString() || '',
          warningMax: param.warningMax?.toString() || '',
          alertEnabled: true,
          alertSeverity: 'MODERATE',
          rinkId: selectedRinkId,
        });
      }
    });

    return filtered;
  }, [formData, moduleParameters, selectedRinkId, activeModule]);

  const handleInputChange = (parameterName: string, field: keyof ThresholdFormData, value: string | boolean | SeverityLevel) => {
    const key = `${parameterName}:${selectedRinkId || 'facility'}`;
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!facilityId) return;
    setSaving(true);

    try {
      const thresholds = Object.values(formData)
        .filter((t) => activeModule === 'ICE_DEPTH' ? true : !t.rinkId) // Only save rink-specific for ice depth
        .map((t) => ({
          facilityId,
          rinkId: t.rinkId || null,
          module: activeModule,
          parameterName: t.parameterName,
          minValue: t.minValue ? parseFloat(t.minValue) : null,
          maxValue: t.maxValue ? parseFloat(t.maxValue) : null,
          warningMin: t.warningMin ? parseFloat(t.warningMin) : null,
          warningMax: t.warningMax ? parseFloat(t.warningMax) : null,
          alertEnabled: t.alertEnabled,
          alertSeverity: t.alertSeverity,
          isActive: true,
        }));

      await bulkSaveMutation.mutateAsync({ thresholds });
      setHasChanges(false);
      refetch();
    } catch (error) {
      console.error('Failed to save thresholds:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNotification = async (severity: SeverityLevel) => {
    if (!facilityId) return;

    await createNotificationMutation.mutateAsync({
      facilityId,
      module: activeModule,
      alertSeverity: severity,
      channels: ['IN_APP'],
      isEnabled: true,
      requiresAck: severity === 'CRITICAL',
    });
  };

  const handleToggleNotificationChannel = async (
    configId: string,
    currentChannels: NotificationChannel[],
    channel: NotificationChannel
  ) => {
    const newChannels = currentChannels.includes(channel)
      ? currentChannels.filter((c) => c !== channel)
      : [...currentChannels, channel];

    await updateNotificationMutation.mutateAsync({
      id: configId,
      channels: newChannels,
    });
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotificationMutation.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse p-4">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Threshold Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure alert thresholds for each module and rink
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowNotifications(!showNotifications)}
            leftIcon={<BellIcon className="w-4 h-4" />}
          >
            {showNotifications ? 'Hide Notifications' : 'Notification Settings'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => refetch()}
            leftIcon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Refresh
          </Button>
          {hasChanges && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      {/* Module Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        {Object.entries(MODULE_LABELS).map(([module, label]) => {
          const Icon = MODULE_ICONS[module as ThresholdModule];
          const isActive = activeModule === module;
          return (
            <button
              key={module}
              onClick={() => {
                setActiveModule(module as ThresholdModule);
                setSelectedRinkId(null);
              }}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Rink Selector (for Ice Depth only) */}
      {activeModule === 'ICE_DEPTH' && rinks.length > 0 && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rink:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedRinkId(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !selectedRinkId
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              All Rinks (Default)
            </button>
            {rinks.map((rink) => (
              <button
                key={rink.id}
                onClick={() => setSelectedRinkId(rink.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedRinkId === rink.id
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {rink.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Threshold Settings */}
      <Card padding="none">
        <CardHeader
          title={`${MODULE_LABELS[activeModule]} Thresholds`}
          description={
            selectedRinkId
              ? `Custom thresholds for ${rinks.find((r) => r.id === selectedRinkId)?.name}`
              : 'Default thresholds for all rinks'
          }
        />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Min Value</th>
                  <th>Warning Min</th>
                  <th>Warning Max</th>
                  <th>Max Value</th>
                  <th>Alert Severity</th>
                  <th>Alerts</th>
                </tr>
              </thead>
              <tbody>
                {displayedThresholds.map((threshold) => (
                  <tr key={threshold.parameterName}>
                    <td>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {threshold.label}
                        </span>
                        <span className="text-gray-500 ml-2">({threshold.unit})</span>
                      </div>
                    </td>
                    <td>
                      <Input
                        type="number"
                        step="0.01"
                        value={threshold.minValue}
                        onChange={(e) =>
                          handleInputChange(threshold.parameterName, 'minValue', e.target.value)
                        }
                        className="w-24"
                        placeholder="—"
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        step="0.01"
                        value={threshold.warningMin}
                        onChange={(e) =>
                          handleInputChange(threshold.parameterName, 'warningMin', e.target.value)
                        }
                        className="w-24"
                        placeholder="—"
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        step="0.01"
                        value={threshold.warningMax}
                        onChange={(e) =>
                          handleInputChange(threshold.parameterName, 'warningMax', e.target.value)
                        }
                        className="w-24"
                        placeholder="—"
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        step="0.01"
                        value={threshold.maxValue}
                        onChange={(e) =>
                          handleInputChange(threshold.parameterName, 'maxValue', e.target.value)
                        }
                        className="w-24"
                        placeholder="—"
                      />
                    </td>
                    <td>
                      <select
                        value={threshold.alertSeverity}
                        onChange={(e) =>
                          handleInputChange(
                            threshold.parameterName,
                            'alertSeverity',
                            e.target.value as SeverityLevel
                          )
                        }
                        className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                      >
                        {SEVERITY_ORDER.map((sev) => (
                          <option key={sev} value={sev}>
                            {SEVERITY_LABELS[sev]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={threshold.alertEnabled}
                          onChange={(e) =>
                            handleInputChange(threshold.parameterName, 'alertEnabled', e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Threshold Legend */}
      <Card>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Critical (below Min / above Max)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Warning (approaching limits)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Normal (within acceptable range)
            </span>
          </div>
        </div>
      </Card>

      {/* Notification Settings Panel */}
      {showNotifications && (
        <Card padding="none">
          <CardHeader
            title="Notification Settings"
            description="Configure who receives alerts and how they're notified"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAddNotification('MODERATE')}
                leftIcon={<PlusIcon className="w-4 h-4" />}
              >
                Add Rule
              </Button>
            }
          />
          <CardContent>
            {notificationData?.configs && notificationData.configs.length > 0 ? (
              <div className="space-y-4">
                {notificationData.configs.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={SEVERITY_COLORS[config.alertSeverity]}>
                        {SEVERITY_LABELS[config.alertSeverity]}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {config.recipientRole
                            ? `All ${config.recipientRole.replace('_', ' ')} users`
                            : config.recipientName || 'Specific User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {config.requiresAck && (
                            <span className="text-red-600 mr-2">Requires Acknowledgment</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        {AVAILABLE_CHANNELS.map((channel) => (
                          <button
                            key={channel}
                            onClick={() =>
                              handleToggleNotificationChannel(
                                config.id,
                                config.channels,
                                channel
                              )
                            }
                            className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                              config.channels.includes(channel)
                                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {CHANNEL_LABELS[channel]}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(config.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No notification rules configured</p>
                <p className="text-sm mt-1">Add rules to notify users when thresholds are exceeded</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 shadow-lg flex items-center gap-4">
          <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Unsaved Changes</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              You have unsaved threshold changes
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Saving...' : 'Save Now'}
          </Button>
        </div>
      )}
    </div>
  );
}
