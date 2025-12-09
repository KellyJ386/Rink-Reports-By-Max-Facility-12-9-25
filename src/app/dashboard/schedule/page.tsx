'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScheduleCalendar, ShiftModal, Shift } from '@/components/scheduling';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

// Mock data - in production this would come from API
const mockShifts: Shift[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Smith',
    shiftDate: new Date().toISOString(),
    startTime: new Date(new Date().setHours(6, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(14, 0, 0)).toISOString(),
    position: 'Ice Technician',
    status: 'SCHEDULED',
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Sarah Johnson',
    shiftDate: new Date().toISOString(),
    startTime: new Date(new Date().setHours(14, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(22, 0, 0)).toISOString(),
    position: 'Front Desk',
    status: 'CONFIRMED',
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Mike Wilson',
    shiftDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    startTime: new Date(new Date().setHours(8, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(16, 0, 0)).toISOString(),
    position: 'Zamboni Operator',
    status: 'SCHEDULED',
  },
];

const mockEmployees = [
  { id: 'user1', name: 'John Smith' },
  { id: 'user2', name: 'Sarah Johnson' },
  { id: 'user3', name: 'Mike Wilson' },
  { id: 'user4', name: 'Emily Brown' },
  { id: 'user5', name: 'David Lee' },
];

const stats = [
  {
    name: 'Scheduled Shifts',
    value: '24',
    description: 'This week',
    icon: CalendarDaysIcon,
  },
  {
    name: 'Total Hours',
    value: '168',
    description: 'This week',
    icon: ClockIcon,
  },
  {
    name: 'Staff Available',
    value: '8',
    description: 'Active employees',
    icon: UserGroupIcon,
  },
];

export default function SchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>(mockShifts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleAddShift = (date: Date) => {
    setSelectedShift(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const handleSaveShift = async (data: {
    userId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    position?: string;
  }) => {
    const employee = mockEmployees.find((e) => e.id === data.userId);
    const newShift: Shift = {
      id: selectedShift?.id || `shift-${Date.now()}`,
      userId: data.userId,
      userName: employee?.name || 'Unknown',
      shiftDate: data.shiftDate,
      startTime: data.startTime,
      endTime: data.endTime,
      position: data.position,
      status: 'SCHEDULED',
    };

    if (selectedShift) {
      setShifts(shifts.map((s) => (s.id === selectedShift.id ? newShift : s)));
    } else {
      setShifts([...shifts, newShift]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Schedule</h1>
          <p className="page-description">
            Manage staff schedules, shifts, and time-off requests.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">View Time-Off Requests</Button>
          <Button leftIcon={<PlusIcon className="w-4 h-4" />}>
            Create Schedule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="flex items-center gap-4">
            <div className="p-3 bg-ice-100 rounded-lg">
              <stat.icon className="w-6 h-6 text-ice-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rink-900">{stat.value}</p>
              <p className="text-sm text-rink-500">{stat.name}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Calendar */}
      <Card>
        <ScheduleCalendar
          shifts={shifts}
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
          isEditable={true}
        />
      </Card>

      {/* Upcoming Shifts Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-rink-900 mb-4">Today's Shifts</h3>
          <div className="space-y-3">
            {shifts
              .filter((s) => {
                const shiftDate = new Date(s.shiftDate);
                const today = new Date();
                return shiftDate.toDateString() === today.toDateString();
              })
              .map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 bg-rink-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ice-100 rounded-full flex items-center justify-center">
                      <span className="text-ice-700 font-medium">
                        {shift.userName.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-rink-900">{shift.userName}</p>
                      <p className="text-sm text-rink-500">
                        {shift.position || 'General Staff'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-rink-700">
                      {new Date(shift.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(shift.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <Badge
                      variant={
                        shift.status === 'CONFIRMED'
                          ? 'success'
                          : shift.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {shift.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            {shifts.filter((s) => {
              const shiftDate = new Date(s.shiftDate);
              const today = new Date();
              return shiftDate.toDateString() === today.toDateString();
            }).length === 0 && (
              <p className="text-center text-rink-500 py-4">
                No shifts scheduled for today
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-rink-900 mb-4">
            Pending Time-Off Requests
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-medium text-rink-900">Emily Brown</p>
                <p className="text-sm text-rink-500">Dec 24 - Dec 26, 2025</p>
                <p className="text-xs text-rink-400 mt-1">Holiday vacation</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  Deny
                </Button>
                <Button size="sm">Approve</Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-medium text-rink-900">David Lee</p>
                <p className="text-sm text-rink-500">Dec 31, 2025</p>
                <p className="text-xs text-rink-400 mt-1">Personal day</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary">
                  Deny
                </Button>
                <Button size="sm">Approve</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Shift Modal */}
      <ShiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shift={selectedShift}
        date={selectedDate}
        employees={mockEmployees}
        onSave={handleSaveShift}
      />
    </div>
  );
}
