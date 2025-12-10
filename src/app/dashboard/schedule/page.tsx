'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DraggableScheduleCalendar, ShiftModal, Shift } from '@/components/scheduling';
import {
  useShifts,
  useMoveShift,
  useCreateShift,
  useUpdateShift,
  useTimeOffRequests,
  useReviewTimeOff,
  useUsers,
} from '@/hooks';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { format, startOfWeek, endOfWeek, formatDistanceToNow } from 'date-fns';

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '30s', value: 30000 },
  { label: '1m', value: 60000 },
  { label: '5m', value: 300000 },
];

export default function SchedulePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState(60000);

  // Fetch real data from API
  const {
    data: shifts = [],
    isLoading: shiftsLoading,
    error: shiftsError,
    refetch: refetchShifts,
    dataUpdatedAt,
  } = useShifts();

  const { data: usersData, isLoading: usersLoading } = useUsers({ pageSize: 100 });
  const employees = useMemo(() => {
    if (!usersData?.items) return [];
    return usersData.items
      .filter((u) => u.isActive)
      .map((u) => ({ id: u.id, name: u.name }));
  }, [usersData]);

  const { data: timeOffRequests = [], refetch: refetchTimeOff } = useTimeOffRequests('PENDING');

  // Mutations
  const moveShiftMutation = useMoveShift();
  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShift();
  const reviewTimeOffMutation = useReviewTimeOff();

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
        value: employees.length.toString(),
        description: 'Active employees',
        icon: UserGroupIcon,
      },
    ];
  }, [shifts, employees]);

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

  const handleMoveShift = async (shiftId: string, newDate: string) => {
    try {
      await moveShiftMutation.mutateAsync({ shiftId, newDate });
    } catch (error) {
      console.error('Failed to move shift:', error);
    }
  };

  const handleSaveShift = async (data: {
    scheduleId?: string;
    userId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    position?: string;
  }) => {
    try {
      if (selectedShift) {
        // Update existing shift
        await updateShiftMutation.mutateAsync({
          id: selectedShift.id,
          userId: data.userId,
          shiftDate: data.shiftDate,
          startTime: data.startTime,
          endTime: data.endTime,
          position: data.position,
        });
      } else {
        // Create new shift - need a scheduleId
        await createShiftMutation.mutateAsync({
          scheduleId: data.scheduleId || 'default',
          userId: data.userId,
          shiftDate: data.shiftDate,
          startTime: data.startTime,
          endTime: data.endTime,
          position: data.position,
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save shift:', error);
    }
  };

  const handleApproveTimeOff = async (requestId: string) => {
    try {
      await reviewTimeOffMutation.mutateAsync({ requestId, action: 'approve' });
      refetchTimeOff();
    } catch (error) {
      console.error('Failed to approve time off:', error);
    }
  };

  const handleDenyTimeOff = async (requestId: string) => {
    try {
      await reviewTimeOffMutation.mutateAsync({ requestId, action: 'deny' });
      refetchTimeOff();
    } catch (error) {
      console.error('Failed to deny time off:', error);
    }
  };

  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return 'Never';
    return formatDistanceToNow(dataUpdatedAt, { addSuffix: true });
  };

  if (shiftsLoading || usersLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (shiftsError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">
        <p className="font-medium">Failed to load schedule</p>
        <p className="text-sm mt-1">{shiftsError.message}</p>
        <button
          onClick={() => refetchShifts()}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage staff schedules, shifts, and time-off requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Updated {formatLastUpdated()}</span>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          >
            {REFRESH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetchShifts()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh now"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <Button leftIcon={<PlusIcon className="w-4 h-4" />} onClick={() => handleAddShift(new Date())}>
            Add Shift
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
            {todayShifts.length > 0 ? (
              todayShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 bg-rink-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ice-100 rounded-full flex items-center justify-center">
                      <span className="text-ice-700 font-medium">
                        {(shift.userName || shift.user?.name || 'U')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-rink-900">
                        {shift.userName || shift.user?.name || 'Unknown'}
                      </p>
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
                          : shift.status === 'COMPLETED'
                          ? 'info'
                          : 'default'
                      }
                    >
                      {shift.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
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
            {timeOffRequests.length > 0 ? (
              timeOffRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-rink-900">
                      {request.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-rink-500">
                      {format(new Date(request.startDate), 'MMM d')} -{' '}
                      {format(new Date(request.endDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-rink-400 mt-1">
                      {request.reason || request.type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDenyTimeOff(request.id)}
                      disabled={reviewTimeOffMutation.isPending}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveTimeOff(request.id)}
                      disabled={reviewTimeOffMutation.isPending}
                    >
                      <CheckIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-rink-500 py-4">
                No pending time-off requests
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Shift Modal */}
      <ShiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shift={selectedShift}
        date={selectedDate}
        employees={employees}
        onSave={handleSaveShift}
      />
    </div>
  );
}
