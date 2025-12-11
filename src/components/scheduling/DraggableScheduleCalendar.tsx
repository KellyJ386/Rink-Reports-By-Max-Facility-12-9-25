'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isSameMonth,
  getDay,
  addDays,
} from 'date-fns';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  Squares2X2Icon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import clsx from 'clsx';

export interface Shift {
  id: string;
  userId: string;
  userName?: string;
  user?: { name: string };
  shiftDate: string;
  startTime: string;
  endTime: string;
  position?: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'OPEN';
}

interface DraggableScheduleCalendarProps {
  shifts: Shift[];
  onAddShift?: (date: Date) => void;
  onEditShift?: (shift: Shift) => void;
  onDeleteShift?: (shiftId: string) => void;
  onMoveShift?: (shiftId: string, newDate: string) => void;
  onRequestSwap?: (shift: Shift) => void;
  isEditable?: boolean;
  isLoading?: boolean;
  currentUserId?: string;
}

const statusColors: Record<Shift['status'], string> = {
  SCHEDULED: 'bg-ice-100 border-ice-300 text-ice-800',
  CONFIRMED: 'bg-green-100 border-green-300 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  COMPLETED: 'bg-rink-100 border-rink-300 text-rink-700',
  NO_SHOW: 'bg-red-100 border-red-300 text-red-800',
  CANCELLED: 'bg-rink-100 border-rink-200 text-rink-500 line-through',
  OPEN: 'bg-purple-100 border-purple-300 text-purple-800',
};

// Draggable shift card
function DraggableShift({
  shift,
  onEdit,
  onRequestSwap,
  isEditable,
  isOwnShift,
}: {
  shift: Shift;
  onEdit?: (shift: Shift) => void;
  onRequestSwap?: (shift: Shift) => void;
  isEditable?: boolean;
  isOwnShift?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: shift.id,
    data: shift,
    disabled: !isEditable || shift.status === 'COMPLETED' || shift.status === 'CANCELLED',
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
      }
    : undefined;

  const formatShiftTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  const displayName = shift.userName || shift.user?.name || 'Unknown';
  const canSwap = isOwnShift &&
    shift.status !== 'COMPLETED' &&
    shift.status !== 'CANCELLED' &&
    new Date(shift.shiftDate) > new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'p-2 rounded border text-xs cursor-grab active:cursor-grabbing transition-all group relative',
        statusColors[shift.status],
        isDragging && 'opacity-50 shadow-lg ring-2 ring-ice-500',
        !isEditable && 'cursor-pointer',
        isOwnShift && 'ring-1 ring-blue-400'
      )}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onEdit?.(shift);
        }
      }}
    >
      <div className="font-medium truncate">
        {displayName}
        {isOwnShift && <span className="ml-1 text-[10px] text-blue-600">(You)</span>}
      </div>
      <div className="flex items-center gap-1 text-[10px] opacity-75">
        <ClockIcon className="w-3 h-3" />
        {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
      </div>
      {shift.position && (
        <div className="mt-1 text-[10px] opacity-75">{shift.position}</div>
      )}
      {/* Swap button for own shifts */}
      {canSwap && onRequestSwap && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRequestSwap(shift);
          }}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] transition-opacity"
          title="Request swap"
        >
          Swap
        </button>
      )}
    </div>
  );
}

// Droppable day cell
function DroppableDay({
  date,
  shifts,
  isSelected,
  isEditable,
  onSelect,
  onAddShift,
  onEditShift,
  onRequestSwap,
  isOver,
  currentUserId,
  children,
}: {
  date: Date;
  shifts: Shift[];
  isSelected: boolean;
  isEditable: boolean;
  onSelect: () => void;
  onAddShift?: () => void;
  onEditShift?: (shift: Shift) => void;
  onRequestSwap?: (shift: Shift) => void;
  isOver: boolean;
  currentUserId?: string;
  children?: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'bg-white min-h-[120px] p-2 cursor-pointer transition-colors',
        isSelected && 'ring-2 ring-ice-500 ring-inset',
        isToday(date) && 'bg-ice-50/50',
        isOver && 'bg-ice-100 ring-2 ring-ice-400'
      )}
      onClick={onSelect}
    >
      <div className="space-y-1">
        {shifts.map((shift) => (
          <DraggableShift
            key={shift.id}
            shift={shift}
            onEdit={onEditShift}
            onRequestSwap={onRequestSwap}
            isEditable={isEditable}
            isOwnShift={currentUserId ? shift.userId === currentUserId : false}
          />
        ))}

        {shifts.length === 0 && !isOver && (
          <div className="text-center py-4 text-rink-400 text-xs">No shifts</div>
        )}

        {isOver && (
          <div className="p-2 border-2 border-dashed border-ice-400 rounded bg-ice-50 text-ice-600 text-xs text-center">
            Drop here
          </div>
        )}

        {isEditable && isSelected && !isOver && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddShift?.();
            }}
            className="w-full p-2 border-2 border-dashed border-rink-200 rounded text-rink-400 hover:border-ice-300 hover:text-ice-600 transition-colors text-xs flex items-center justify-center gap-1"
          >
            <PlusIcon className="w-3 h-3" />
            Add
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

// Shift preview during drag
function DragPreview({ shift }: { shift: Shift }) {
  const formatShiftTime = (timeString: string) => {
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch {
      return timeString;
    }
  };

  return (
    <div
      className={clsx(
        'p-2 rounded border text-xs shadow-lg',
        statusColors[shift.status]
      )}
    >
      <div className="font-medium truncate">{shift.userName}</div>
      <div className="flex items-center gap-1 text-[10px] opacity-75">
        <ClockIcon className="w-3 h-3" />
        {formatShiftTime(shift.startTime)} - {formatShiftTime(shift.endTime)}
      </div>
    </div>
  );
}

type ViewMode = 'week' | 'month';

export function DraggableScheduleCalendar({
  shifts,
  onAddShift,
  onEditShift,
  onDeleteShift,
  onMoveShift,
  onRequestSwap,
  isEditable = false,
  isLoading = false,
  currentUserId,
}: DraggableScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Week view dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month view dates
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthStartWeek = startOfWeek(monthStart, { weekStartsOn: 0 });
  const monthEndWeek = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: monthStartWeek, end: monthEndWeek });

  const displayDays = viewMode === 'week' ? weekDays : monthDays;

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
    Object.values(grouped).forEach((dayShifts) => {
      dayShifts.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [shifts]);

  const goToPrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Check for conflicts when moving a shift
  const checkConflict = useCallback(
    (shiftId: string, newDateKey: string): boolean => {
      const movingShift = shifts.find((s) => s.id === shiftId);
      if (!movingShift) return false;

      const targetDayShifts = shiftsByDate[newDateKey] || [];
      const userShifts = targetDayShifts.filter(
        (s) => s.userId === movingShift.userId && s.id !== shiftId
      );

      // Check for time overlap
      const movingStart = new Date(movingShift.startTime).getTime();
      const movingEnd = new Date(movingShift.endTime).getTime();

      for (const existingShift of userShifts) {
        const existingStart = new Date(existingShift.startTime).getTime();
        const existingEnd = new Date(existingShift.endTime).getTime();

        if (movingStart < existingEnd && movingEnd > existingStart) {
          return true;
        }
      }

      return false;
    },
    [shifts, shiftsByDate]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const shift = event.active.data.current as Shift;
    setActiveShift(shift);
    setConflictWarning(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveShift(null);

    if (!over) {
      setConflictWarning(null);
      return;
    }

    const shiftId = active.id as string;
    const newDateKey = over.id as string;
    const shift = shifts.find((s) => s.id === shiftId);

    if (!shift) return;

    const currentDateKey = format(parseISO(shift.shiftDate), 'yyyy-MM-dd');

    if (currentDateKey === newDateKey) {
      setConflictWarning(null);
      return;
    }

    // Check for conflicts
    if (checkConflict(shiftId, newDateKey)) {
      setConflictWarning(
        `Cannot move ${shift.userName}'s shift - conflicts with existing shift on this date`
      );
      setTimeout(() => setConflictWarning(null), 4000);
      return;
    }

    onMoveShift?.(shiftId, newDateKey);
    setConflictWarning(null);
  };

  const [overDateKey, setOverDateKey] = useState<string | null>(null);

  const handleDragOver = (event: { over: { id: string | number } | null }) => {
    setOverDateKey(event.over?.id as string | null);
  };

  const getHeaderTitle = () => {
    if (viewMode === 'week') {
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="space-y-4">
        {/* Conflict Warning */}
        {conflictWarning && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
            {conflictWarning}
          </div>
        )}

        {/* Calendar Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-rink-900">{getHeaderTitle()}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={goToPrevious}>
                <ChevronLeftIcon className="w-5 h-5" />
              </Button>
              <Button variant="secondary" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNext}>
                <ChevronRightIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-rink-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('week')}
                className={clsx(
                  'px-3 py-1.5 text-sm flex items-center gap-1.5',
                  viewMode === 'week'
                    ? 'bg-ice-100 text-ice-700'
                    : 'bg-white text-rink-600 hover:bg-rink-50'
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={clsx(
                  'px-3 py-1.5 text-sm flex items-center gap-1.5',
                  viewMode === 'month'
                    ? 'bg-ice-100 text-ice-700'
                    : 'bg-white text-rink-600 hover:bg-rink-50'
                )}
              >
                <Squares2X2Icon className="w-4 h-4" />
                Month
              </button>
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
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ice-600" />
          </div>
        )}

        {/* Calendar Grid */}
        <div
          className={clsx(
            'grid gap-px bg-rink-200 rounded-lg overflow-hidden border border-rink-200',
            viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-7'
          )}
        >
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div
              key={day}
              className="bg-rink-50 px-3 py-2 text-center text-sm font-medium text-rink-600"
            >
              {day}
            </div>
          ))}

          {/* Day Cells */}
          {displayDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayShifts = shiftsByDate[dateKey] || [];
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = viewMode === 'month' ? isSameMonth(day, currentDate) : true;
            const isOverThisDay = overDateKey === dateKey;

            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  viewMode === 'month' && !isCurrentMonth && 'opacity-40'
                )}
              >
                {/* Date label for month view */}
                {viewMode === 'month' && (
                  <div
                    className={clsx(
                      'bg-white px-2 py-1 text-xs font-medium border-b border-rink-100',
                      isToday(day) ? 'text-ice-700' : 'text-rink-600'
                    )}
                  >
                    <span
                      className={clsx(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full',
                        isToday(day) && 'bg-ice-600 text-white'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                )}

                {/* Week view date header */}
                {viewMode === 'week' && (
                  <div
                    className={clsx(
                      'bg-rink-50 px-3 py-2 text-center text-sm font-medium',
                      isToday(day) ? 'text-ice-700' : 'text-rink-600'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-8 h-8 mx-auto flex items-center justify-center rounded-full',
                        isToday(day) && 'bg-ice-600 text-white'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                )}

                <DroppableDay
                  date={day}
                  shifts={dayShifts}
                  isSelected={isSelected || false}
                  isEditable={isEditable}
                  onSelect={() => setSelectedDate(day)}
                  onAddShift={() => onAddShift?.(day)}
                  onEditShift={onEditShift}
                  onRequestSwap={onRequestSwap}
                  isOver={isOverThisDay}
                  currentUserId={currentUserId}
                />
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
          {isEditable && (
            <div className="ml-auto text-rink-500">
              Drag shifts to reschedule
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeShift ? <DragPreview shift={activeShift} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
