'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DraggableScheduleCalendar, ShiftModal, Shift } from '@/components/scheduling';
import { useShifts, useMoveShift, useCreateShift, useTimeOffRequests, useReviewTimeOff } from '@/hooks';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, startOfWeek, endOfWeek } from 'date-fns';

// Mock employees - would come from API
const mockEmployees = [
  { id: 'user1', name: 'John Smith' },
  { id: 'user2', name: 'Sarah Johnson' },
  { id: 'user3', name: 'Mike Wilson' },
  { id: 'user4', name: 'Emily Brown' },
  { id: 'user5', name: 'David Lee' },
];

// Generate mock shifts for demo
const generateMockShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  const today = new Date();
  const positions = ['Ice Technician', 'Front Desk', 'Zamboni Operator', 'Maintenance', 'Manager'];
  const statuses: Shift['status'][] = ['SCHEDULED', 'CONFIRMED', 'SCHEDULED'];

  for (let dayOffset = -2; dayOffset <= 5; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    // Morning shift
    if (Math.random() > 0.3) {
      const emp = mockEmployees[Math.floor(Math.random() * mockEmployees.length)];
      const startTime = new Date(date);
      startTime.setHours(6, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(14, 0, 0, 0);

      shifts.push({
        id: `shift-${dayOffset}-am`,
        userId: emp.id,
        userName: emp.name,
        shiftDate: date.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        position: positions[Math.floor(Math.random() * positions.length)],
        status: dayOffset < 0 ? 'COMPLETED' : statuses[Math.floor(Math.random() * statuses.length)],
      });
    }

    // Afternoon shift
    if (Math.random() > 0.2) {
      const emp = mockEmployees[Math.floor(Math.random() * mockEmployees.length)];
      const startTime = new Date(date);
      startTime.setHours(14, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(22, 0, 0, 0);

      shifts.push({
        id: `shift-${dayOffset}-pm`,
        userId: emp.id,
        userName: emp.name,
        shiftDate: date.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        position: positions[Math.floor(Math.random() * positions.length)],
        status: dayOffset < 0 ? 'COMPLETED' : statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
  }

  return shifts;
};

const mockShifts = generateMockShifts();

export default function SchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>(mockShifts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const today = new Date();
    const weekStartDate = startOfWeek(today, { weekStartsOn: 0 });
    const weekEndDate = endOfWeek(today, { weekStartsOn: 0 });

    const weekShifts = shifts.filter((s) => {
      const shiftDate = new Date(s.shiftDate);
      return shiftDate >= weekStartDate && shiftDate <= weekEndDate;
    });

    const totalHours = weekShifts.reduce((sum, s) => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return [
      {
        name: 'Scheduled Shifts',
        value: weekShifts.length.toString(),
        description: 'This week',
        icon: CalendarDaysIcon,
      },
      {
        name: 'Total Hours',
        value: Math.round(totalHours).toString(),
        description: 'This week',
        icon: ClockIcon,
      },
      {
        name: 'Staff Available',
        value: mockEmployees.length.toString(),
        description: 'Active employees',
        icon: UserGroupIcon,
      },
    ];
  }, [shifts]);

  // Today's shifts
  const todayShifts = useMemo(() => {
    const today = new Date();
    return shifts.filter((s) => {
      const shiftDate = new Date(s.shiftDate);
      return shiftDate.toDateString() === today.toDateString();
    });
  }, [shifts]);

  const handleAddShift = (date: Date) => {
    setSelectedShift(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  const handleMoveShift = (shiftId: string, newDate: string) => {
    setShifts((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;

        // Parse the original times
        const oldStart = new Date(shift.startTime);
        const oldEnd = new Date(shift.endTime);

        // Create new date objects preserving the time
        const newDateObj = new Date(newDate);
        const newStart = new Date(newDateObj);
        newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
        const newEnd = new Date(newDateObj);
        newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0, 0);

        return {
          ...shift,
          shiftDate: newDateObj.toISOString(),
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        };
      })
    );
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

      {/* Drag-and-Drop Calendar */}
      <Card>
        <DraggableScheduleCalendar
          shifts={shifts}
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
          onMoveShift={handleMoveShift}
          isEditable={true}
        />
      </Card>

      {/* Upcoming Shifts Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-rink-900 mb-4">Today's Shifts</h3>
          <div className="space-y-3">
            {todayShifts.map((shift) => (
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
            {todayShifts.length === 0 && (
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
