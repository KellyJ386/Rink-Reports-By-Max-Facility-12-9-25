'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  useFacilitiesLive,
  useCreateFacility,
  useUpdateFacility,
  type Facility,
} from '@/hooks';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  MapPinIcon,
  UsersIcon,
  ArrowPathIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

// Refresh intervals
const REFRESH_OPTIONS = [
  { label: 'Manual', value: 0 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
];

export default function FacilitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
    email: '',
    timezone: 'America/New_York',
  });

  // Fetch facilities with live refresh
  const {
    data: facilities,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useFacilitiesLive(
    { search: searchQuery || undefined },
    { refreshInterval, enabled: true }
  );

  // Mutations
  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility();

  // Update last refresh time
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastRefresh(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Reset form when modal opens
  useEffect(() => {
    if (showModal && selectedFacility) {
      setFormData({
        name: selectedFacility.name,
        slug: selectedFacility.slug,
        address: selectedFacility.address || '',
        city: selectedFacility.city || '',
        state: selectedFacility.state || '',
        postalCode: selectedFacility.postalCode || '',
        phone: selectedFacility.phone || '',
        email: selectedFacility.email || '',
        timezone: selectedFacility.timezone || 'America/New_York',
      });
    } else if (showModal) {
      setFormData({
        name: '',
        slug: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
        email: '',
        timezone: 'America/New_York',
      });
    }
  }, [showModal, selectedFacility]);

  const facilityList = facilities || [];

  // Filter facilities
  const filteredFacilities = facilityList.filter((facility) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      facility.name.toLowerCase().includes(query) ||
      facility.city?.toLowerCase().includes(query)
    );
  });

  // Stats
  const totalFacilities = facilityList.length;
  const totalRinks = facilityList.reduce((sum, f) => sum + (f.rinks?.length || 0), 0);
  const totalUsers = facilityList.reduce((sum, f) => sum + (f._count?.facilityUsers || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedFacility) {
        // Update existing facility
        await updateFacility.mutateAsync({
          facilityId: selectedFacility.id,
          name: formData.name,
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          timezone: formData.timezone,
        });
      } else {
        // Create new facility - requires organizationId
        // For now, we'll need to get organizationId from somewhere
        await createFacility.mutateAsync({
          organizationId: 'default-org', // This should come from context/session
          name: formData.name,
          slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
          address: formData.address || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          timezone: formData.timezone,
        });
      }
      setShowModal(false);
      setSelectedFacility(null);
    } catch (err) {
      console.error('Failed to save facility:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Facility Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage facilities, rinks, and subscriptions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Controls */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-rink-200 p-1">
            {REFRESH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRefreshInterval(opt.value)}
                className={`px-3 py-1 text-sm rounded ${
                  refreshInterval === opt.value
                    ? 'bg-ice-600 text-white'
                    : 'text-rink-600 hover:bg-rink-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => refetch()}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setSelectedFacility(null);
              setShowModal(true);
            }}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Facility
          </Button>
        </div>
      </div>

      {/* Live Status Indicator */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-rink-200 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-rink-600">
          {refreshInterval > 0 && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Live updates every {refreshInterval / 1000}s</span>
            </>
          )}
          {refreshInterval === 0 && (
            <>
              <ClockIcon className="w-4 h-4" />
              <span>Manual refresh</span>
            </>
          )}
        </div>
        <span className="text-xs text-rink-400">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalFacilities}
              </p>
              <p className="text-sm text-gray-500">Total Facilities</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {facilityList.filter((f) => f._count?.incidentReports === 0).length}
              </p>
              <p className="text-sm text-gray-500">No Open Incidents</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <MapPinIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRinks}
              </p>
              <p className="text-sm text-gray-500">Total Rinks</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <UsersIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalUsers}
              </p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="text-center py-12">
          <XCircleIcon className="w-12 h-12 mx-auto text-red-300 mb-4" />
          <h3 className="text-lg font-medium text-rink-700">Failed to load facilities</h3>
          <p className="text-rink-500 mt-1">Please try again later</p>
          <Button variant="secondary" onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </Card>
      )}

      {/* Facilities Grid */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <Card key={facility.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {facility.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {facility.city}, {facility.state}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFacility(facility);
                    setShowModal(true);
                  }}
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Organization</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {facility.organization?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Rinks</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {facility.rinks?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Users</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {facility._count?.facilityUsers || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Form Templates</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {facility._count?.formTemplates || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Submissions</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {facility._count?.formSubmissions || 0}
                  </span>
                </div>
              </div>

              {/* Rinks List */}
              {facility.rinks && facility.rinks.length > 0 && (
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Rinks</p>
                  <div className="flex flex-wrap gap-1">
                    {facility.rinks.map((rink) => (
                      <Badge key={rink.id} variant="default">
                        {rink.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <p className="text-xs text-gray-500">{facility.address}</p>
                {facility.phone && (
                  <p className="text-xs text-gray-500">{facility.phone}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredFacilities.length === 0 && (
        <Card className="text-center py-12">
          <BuildingOfficeIcon className="w-12 h-12 mx-auto text-rink-300 mb-4" />
          <h3 className="text-lg font-medium text-rink-700">No facilities found</h3>
          <p className="text-rink-500 mt-1">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first facility to get started'}
          </p>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {selectedFacility ? 'Edit Facility' : 'Add Facility'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Facility Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {!selectedFacility && (
                <Input
                  label="Slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  placeholder="facility-slug"
                  helperText="URL-friendly identifier (lowercase, no spaces)"
                  required
                />
              )}
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="ZIP Code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Timezone
                </label>
                <select
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="America/Toronto">Toronto</option>
                  <option value="America/Vancouver">Vancouver</option>
                </select>
              </div>

              {/* Error Display */}
              {(createFacility.error || updateFacility.error) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {createFacility.error?.message || updateFacility.error?.message}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createFacility.isPending || updateFacility.isPending}
                >
                  {selectedFacility ? 'Save Changes' : 'Create Facility'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
