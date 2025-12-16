'use client';

import { useDraggable } from '@dnd-kit/core';
import {
  Bars3BottomLeftIcon,
  DocumentTextIcon,
  HashtagIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChevronDownIcon,
  ListBulletIcon,
  CircleStackIcon,
  CheckIcon,
  ArrowsRightLeftIcon,
  CalendarIcon,
  ClockIcon,
  CalendarDaysIcon,
  PaperClipIcon,
  CameraIcon,
  PencilSquareIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon,
  MinusIcon,
  UserIcon,
  BuildingOfficeIcon,
  TableCellsIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { FieldType } from '@prisma/client';

interface FieldDefinition {
  type: FieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const inputFields: FieldDefinition[] = [
  { type: 'TEXT', label: 'Text Input', icon: Bars3BottomLeftIcon, description: 'Single line text' },
  { type: 'TEXTAREA', label: 'Text Area', icon: DocumentTextIcon, description: 'Multi-line text' },
  { type: 'NUMBER', label: 'Number', icon: HashtagIcon, description: 'Numeric input' },
  { type: 'EMAIL', label: 'Email', icon: EnvelopeIcon, description: 'Email address' },
  { type: 'PHONE', label: 'Phone', icon: PhoneIcon, description: 'Phone number' },
];

const selectionFields: FieldDefinition[] = [
  { type: 'DROPDOWN', label: 'Dropdown', icon: ChevronDownIcon, description: 'Select one option' },
  { type: 'MULTI_SELECT', label: 'Multi-select', icon: ListBulletIcon, description: 'Select multiple' },
  { type: 'RADIO', label: 'Radio Buttons', icon: CircleStackIcon, description: 'Single choice' },
  { type: 'CHECKBOX', label: 'Checkbox', icon: CheckIcon, description: 'Multiple choices' },
  { type: 'TOGGLE', label: 'Toggle Switch', icon: ArrowsRightLeftIcon, description: 'On/Off switch' },
];

const dateTimeFields: FieldDefinition[] = [
  { type: 'DATE', label: 'Date Picker', icon: CalendarIcon, description: 'Select a date' },
  { type: 'TIME', label: 'Time Picker', icon: ClockIcon, description: 'Select a time' },
  { type: 'DATETIME', label: 'Date & Time', icon: CalendarDaysIcon, description: 'Date and time' },
];

const mediaFields: FieldDefinition[] = [
  { type: 'FILE_UPLOAD', label: 'File Upload', icon: PaperClipIcon, description: 'Attach files' },
  { type: 'PHOTO', label: 'Photo Upload', icon: CameraIcon, description: 'Take or upload photo' },
  { type: 'SIGNATURE', label: 'Signature', icon: PencilSquareIcon, description: 'Digital signature' },
];

const layoutFields: FieldDefinition[] = [
  { type: 'SECTION_HEADER', label: 'Section Header', icon: ChatBubbleBottomCenterTextIcon, description: 'Section title' },
  { type: 'INSTRUCTIONAL_TEXT', label: 'Instructions', icon: InformationCircleIcon, description: 'Help text' },
  { type: 'DIVIDER', label: 'Divider', icon: MinusIcon, description: 'Visual separator' },
];

const autoFields: FieldDefinition[] = [
  { type: 'AUTO_USER', label: 'Auto User', icon: UserIcon, description: 'Current user name' },
  { type: 'AUTO_DATE', label: 'Auto Date', icon: CalendarIcon, description: 'Submission date' },
  { type: 'AUTO_FACILITY', label: 'Auto Facility', icon: BuildingOfficeIcon, description: 'Facility name' },
];

const rinkFields: FieldDefinition[] = [
  { type: 'RINK_DIAGRAM', label: 'Rink Diagram', icon: MapIcon, description: 'Interactive rink map' },
  { type: 'ICE_GRID', label: 'Ice Depth Grid', icon: TableCellsIcon, description: 'Ice measurements' },
];

function DraggableField({ field }: { field: FieldDefinition }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${field.type}`,
    data: {
      type: 'palette-field',
      fieldType: field.type,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx(
        'flex items-center gap-3 p-3 bg-white border border-rink-200 rounded-lg cursor-grab',
        'hover:border-ice-300 hover:shadow-sm transition-all',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div className="p-2 bg-rink-100 rounded-lg">
        <field.icon className="w-5 h-5 text-rink-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-rink-900">{field.label}</p>
        <p className="text-xs text-rink-500">{field.description}</p>
      </div>
    </div>
  );
}

function FieldGroup({ title, fields }: { title: string; fields: FieldDefinition[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-rink-400 uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="space-y-2">
        {fields.map((field) => (
          <DraggableField key={field.type} field={field} />
        ))}
      </div>
    </div>
  );
}

export function FieldPalette() {
  return (
    <div className="w-72 bg-rink-50 border-r border-rink-200 overflow-y-auto h-full">
      <div className="p-4 border-b border-rink-200 bg-white sticky top-0 z-10">
        <h3 className="font-semibold text-rink-900">Field Types</h3>
        <p className="text-sm text-rink-500 mt-1">Drag fields to the canvas</p>
      </div>
      <div className="p-4 space-y-6">
        <FieldGroup title="Input Fields" fields={inputFields} />
        <FieldGroup title="Selection" fields={selectionFields} />
        <FieldGroup title="Date & Time" fields={dateTimeFields} />
        <FieldGroup title="Media" fields={mediaFields} />
        <FieldGroup title="Rink Specific" fields={rinkFields} />
        <FieldGroup title="Auto-Populate" fields={autoFields} />
        <FieldGroup title="Layout" fields={layoutFields} />
      </div>
    </div>
  );
}
