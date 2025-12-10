'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  MapPinIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface Facility {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  rinksCount: number;
  usersCount: number;
  status: 'active' | 'inactive' | 'maintenance';
  subscriptionTier: string;
  createdAt: string;
}

const mockFacilities: Facility[] = [
  {
    id: '1',
    name: 'Central Ice Arena',
    address: '123 Main Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    phone: '555-123-4567',
    email: 'info@centralarena.com',
    rinksCount: 3,
    usersCount: 24,
    status: 'active',
    subscriptionTier: 'Professional',
    createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'North Campus Rink',
    address: '456 University Ave',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62702',
    phone: '555-234-5678',
    email: 'rink@northcampus.edu',
    rinksCount: 2,
    usersCount: 12,
    status: 'active',
    subscriptionTier: 'Standard',
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
  },
  {
    id: '3',
    name: 'Lakeside Ice Center',
    address: '789 Lake Road',
    city: 'Lakeview',
    state: 'IL',
    zipCode: '62703',
    phone: '555-345-6789',
    email: 'contact@lakesideice.com',
    rinksCount: 1,
    usersCount: 8,
    status: 'maintenance',
    subscriptionTier: 'Basic',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
];

const statusColors = {
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
} as const;

export default function FacilitiesPage() {
  const [facilities] = useState<Facility[]>(mockFacilities);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const filteredFacilities = facilities.filter((facility) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      facility.name.toLowerCase().includes(query) ||
      facility.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facility Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage facilities, rinks, and subscriptions</p>
        </div>
        <Button onClick={() => { setSelectedFacility(null); setShowModal(true); }}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Facility
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <BuildingOfficeIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{facilities.length}</p>
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
                {facilities.filter(f => f.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
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
                {facilities.reduce((sum, f) => sum + f.rinksCount, 0)}
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
                {facilities.reduce((sum, f) => sum + f.usersCount, 0)}
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

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFacilities.map((facility) => (
          <Card key={facility.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <BuildingOfficeIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{facility.name}</h3>
                  <p className="text-sm text-gray-500">{facility.city}, {facility.state}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedFacility(facility); setShowModal(true); }}
              >
                <PencilIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge variant={statusColors[facility.status]}>
                  {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subscription</span>
                <span className="font-medium text-gray-900 dark:text-white">{facility.subscriptionTier}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Rinks</span>
                <span className="font-medium text-gray-900 dark:text-white">{facility.rinksCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Users</span>
                <span className="font-medium text-gray-900 dark:text-white">{facility.usersCount}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              <p className="text-xs text-gray-500">{facility.address}</p>
              <p className="text-xs text-gray-500">{facility.phone}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {selectedFacility ? 'Edit Facility' : 'Add Facility'}
            </h3>
            <form className="space-y-4">
              <Input label="Facility Name" defaultValue={selectedFacility?.name} required />
              <Input label="Address" defaultValue={selectedFacility?.address} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" defaultValue={selectedFacility?.city} required />
                <Input label="State" defaultValue={selectedFacility?.state} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="ZIP Code" defaultValue={selectedFacility?.zipCode} required />
                <Input label="Phone" defaultValue={selectedFacility?.phone} required />
              </div>
              <Input label="Email" type="email" defaultValue={selectedFacility?.email} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subscription Tier</label>
                <select className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700" defaultValue={selectedFacility?.subscriptionTier || 'Basic'}>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">{selectedFacility ? 'Save Changes' : 'Create Facility'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
