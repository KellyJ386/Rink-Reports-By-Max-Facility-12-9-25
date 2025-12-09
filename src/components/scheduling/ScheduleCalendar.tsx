'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
} from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  position?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
}

interface ScheduleCalendarProps {
  shifts: Shift[];
  onAddShift?: (date: Date) => void;
  onEditShift?: (shift: Shift) => void;
  onDeleteShift?: (shiftId: string) => void;
  isEditable?: boolean;
}

const statusColors: Record<Shift['status'], string> = {
  SCHEDULED: 'bg-ice-100 border-ice-300 text-ice-800',
  CONFIRMED: 'bg-green-100 border-green-300 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  COMPLETED: 'bg-rink-100 border-rink-300 text-rink-700',
  NO_SHOW: 'bg-red-100 border-red-300 text-red-800',
  CANCELLED: 'bg-rink-100 border-rink-200 text-rink-500 line-through',
};

export function ScheduleCalendar({
  shifts,
  onAddShift,
  onEditShift,
  onDeleteShift,
  isEditable = false,
}: ScheduleCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, Shift[]> = {};
    shifts.forEach((shift) => {
      const dateKey = format(parseISO(shift.shiftDate), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(shift);
    });
    // Sort shifts by start time within each day
    Object.values(grouped).forEach((dayShifts) => {
      dayShifts.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [shifts]);

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  const formatShiftTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-rink-900">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={goToNextWeek}>
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
        {isEditable && (
          <Button
            onClick={() => onAddShift?.(selectedDate || new Date())}
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            Add Shift
          </Button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-rink-200 rounded-lg overflow-hidden border border-rink-200">
        {/* Day Headers */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={clsx(
              'bg-rink-50 px-3 py-2 text-center text-sm font-medium',
              isToday(day) ? 'text-ice-700' : 'text-rink-600'
            )}
          >
            <div>{format(day, 'EEE')}</div>
            <div
              className={clsx(
                'w-8 h-8 mx-auto flex items-center justify-center rounded-full mt-1',
                isToday(day) && 'bg-ice-600 text-white'
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}

        {/* Day Cells */}
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayShifts = shiftsByDate[dateKey] || [];
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              className={clsx(
                'bg-white min-h-[160px] p-2 cursor-pointer transition-colors',
                isSelected && 'ring-2 ring-ice-500 ring-inset',
                isToday(day) && 'bg-ice-50/50'
              )}
              onClick={() => setSelectedDate(day)}
            >
              <div className="space-y-1">
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={clsx(
                      'p-2 rounded border text-xs cursor-pointer hover:shadow-sm transition-shadow',
                      statusColors[shift.status]
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditShift?.(shift);
                    }}
                  >
                    <div className="font-medium truncate">{shift.userName}</div>
                    <div className="flex items-center gap-1 text-[10px] opacity-75">
                      <ClockIcon className="w-3 h-3" />
                      {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
                    </div>
                    {shift.position && (
                      <div className="mt-1 text-[10px] opacity-75">{shift.position}</div>
                    )}
                  </div>
                ))}

                {dayShifts.length === 0 && (
                  <div className="text-center py-8 text-rink-400 text-xs">
                    No shifts
                  </div>
                )}

                {isEditable && isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddShift?.(day);
                    }}
                    className="w-full p-2 border-2 border-dashed border-rink-200 rounded text-rink-400 hover:border-ice-300 hover:text-ice-600 transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    <PlusIcon className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-ice-100 border border-ice-300" />
          <span className="text-rink-600">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span className="text-rink-600">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
          <span className="text-rink-600">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-rink-100 border border-rink-300" />
          <span className="text-rink-600">Completed</span>
        </div>
      </div>
    </div>
  );
}

// Shift Modal Component
interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: Shift | null;
  date?: Date;
  employees: Array<{ id: string; name: string }>;
  onSave: (data: {
    userId: string;
    shiftDate: string;
    startTime: string;
    endTime: string;
    position?: string;
    notes?: string;
  }) => Promise<void>;
}

export function ShiftModal({
  isOpen,
  onClose,
  shift,
  date,
  employees,
  onSave,
}: ShiftModalProps) {
  const [formData, setFormData] = useState({
    userId: shift?.userId || '',
    shiftDate: shift?.shiftDate || (date ? format(date, 'yyyy-MM-dd') : ''),
    startTime: shift?.startTime ? format(parseISO(shift.startTime), 'HH:mm') : '09:00',
    endTime: shift?.endTime ? format(parseISO(shift.endTime), 'HH:mm') : '17:00',
    position: shift?.position || '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        startTime: `${formData.shiftDate}T${formData.startTime}:00`,
        endTime: `${formData.shiftDate}T${formData.endTime}:00`,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-rink-900 mb-4">
          {shift ? 'Edit Shift' : 'Add Shift'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Employee</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              value={formData.shiftDate}
              onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Position/Role</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="form-input"
              placeholder="e.g., Ice Technician, Front Desk"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {shift ? 'Update' : 'Create'} Shift
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
