'use client';

import { useDroppable, useDraggable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  TrashIcon,
  Cog6ToothIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { FormFieldConfig } from '@/types';
import { FieldType } from '@prisma/client';

interface FormCanvasProps {
  fields: FormFieldConfig[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onRemoveField: (id: string) => void;
}

function getFieldIcon(fieldType: FieldType): string {
  const icons: Record<FieldType, string> = {
    TEXT: 'Aa',
    TEXTAREA: '¶',
    NUMBER: '#',
    EMAIL: '@',
    PHONE: '☎',
    DROPDOWN: '▼',
    MULTI_SELECT: '☑',
    RADIO: '◉',
    CHECKBOX: '☐',
    TOGGLE: '⇄',
    DATE: '📅',
    TIME: '⏰',
    DATETIME: '📆',
    FILE_UPLOAD: '📎',
    PHOTO: '📷',
    SIGNATURE: '✍',
    SECTION_HEADER: 'H',
    INSTRUCTIONAL_TEXT: 'i',
    BODY_DIAGRAM: '👤',
    RINK_DIAGRAM: '⬭',
  };
  return icons[fieldType] || '?';
}

interface SortableFieldProps {
  field: FormFieldConfig;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableField({ field, isSelected, onSelect, onRemove }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderFieldPreview = () => {
    switch (field.fieldType) {
      case 'SECTION_HEADER':
        return (
          <div className="py-2">
            <h3 className="text-lg font-semibold text-rink-900">{field.label}</h3>
            {field.helpText && <p className="text-sm text-rink-500">{field.helpText}</p>}
          </div>
        );
      case 'INSTRUCTIONAL_TEXT':
        return (
          <div className="py-2 px-4 bg-ice-50 border-l-4 border-ice-500 rounded">
            <p className="text-sm text-rink-700">{field.label}</p>
          </div>
        );
      case 'TOGGLE':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-rink-700">{field.label}</span>
            <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-rink-200">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
            </div>
          </div>
        );
      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            <span className="text-sm font-medium text-rink-700">{field.label}</span>
            <div className="space-y-1">
              {(field.options || [{ value: 'option1', label: 'Option 1' }]).slice(0, 3).map((opt, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-rink-300" disabled />
                  <span className="text-sm text-rink-600">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case 'RADIO':
        return (
          <div className="space-y-2">
            <span className="text-sm font-medium text-rink-700">{field.label}</span>
            <div className="space-y-1">
              {(field.options || [{ value: 'option1', label: 'Option 1' }]).slice(0, 3).map((opt, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input type="radio" className="border-rink-300" disabled />
                  <span className="text-sm text-rink-600">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      case 'DROPDOWN':
      case 'MULTI_SELECT':
        return (
          <div>
            <label className="form-label">{field.label}</label>
            <select className="form-input" disabled>
              <option>{field.placeholder || 'Select an option...'}</option>
            </select>
          </div>
        );
      case 'TEXTAREA':
        return (
          <div>
            <label className="form-label">{field.label}</label>
            <textarea
              className="form-input h-20"
              placeholder={field.placeholder}
              disabled
            />
          </div>
        );
      case 'SIGNATURE':
        return (
          <div>
            <label className="form-label">{field.label}</label>
            <div className="h-24 border-2 border-dashed border-rink-300 rounded-lg flex items-center justify-center text-rink-400">
              Sign here
            </div>
          </div>
        );
      case 'PHOTO':
      case 'FILE_UPLOAD':
        return (
          <div>
            <label className="form-label">{field.label}</label>
            <div className="h-20 border-2 border-dashed border-rink-300 rounded-lg flex items-center justify-center text-rink-400">
              <span className="text-sm">Click or drag to upload</span>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <label className="form-label">
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.fieldType === 'NUMBER' ? 'number' : 'text'}
              className="form-input"
              placeholder={field.placeholder}
              disabled
            />
            {field.helpText && <p className="form-help">{field.helpText}</p>}
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'group relative bg-white border rounded-lg transition-all',
        isDragging && 'opacity-50 shadow-lg',
        isSelected
          ? 'border-ice-500 ring-2 ring-ice-500/20'
          : 'border-rink-200 hover:border-rink-300'
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Bars3Icon className="w-4 h-4 text-rink-400" />
      </div>

      {/* Field type indicator */}
      <div className="absolute right-2 top-2 flex items-center gap-1">
        <span className="text-xs font-mono text-rink-400 bg-rink-100 px-1.5 py-0.5 rounded">
          {getFieldIcon(field.fieldType)}
        </span>
      </div>

      {/* Field content */}
      <div className="p-4 pl-8">{renderFieldPreview()}</div>

      {/* Actions */}
      <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="p-1.5 text-rink-400 hover:text-ice-600 hover:bg-ice-50 rounded"
        >
          <Cog6ToothIcon className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-rink-400 hover:text-red-600 hover:bg-red-50 rounded"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function FormCanvas({ fields, selectedFieldId, onSelectField, onRemoveField }: FormCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'form-canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex-1 p-6 overflow-y-auto bg-rink-100',
        isOver && 'bg-ice-50'
      )}
    >
      <div className="max-w-2xl mx-auto">
        {/* Form Header Preview */}
        <div className="bg-white rounded-lg border border-rink-200 p-6 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-rink-500">Timestamp:</span>
              <span className="ml-2 text-rink-700">Auto-populated</span>
            </div>
            <div>
              <span className="text-rink-500">User:</span>
              <span className="ml-2 text-rink-700">Auto-populated</span>
            </div>
            <div>
              <span className="text-rink-500">Facility:</span>
              <span className="ml-2 text-rink-700">Auto-populated</span>
            </div>
            <div>
              <span className="text-rink-500">Weather:</span>
              <span className="ml-2 text-rink-700">Auto-populated</span>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        {fields.length === 0 ? (
          <div
            className={clsx(
              'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
              isOver ? 'border-ice-400 bg-ice-50' : 'border-rink-300'
            )}
          >
            <p className="text-rink-500 text-lg">Drag fields here to build your form</p>
            <p className="text-rink-400 text-sm mt-2">
              Fields will be displayed in the order you arrange them
            </p>
          </div>
        ) : (
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={() => onSelectField(field.id)}
                  onRemove={() => onRemoveField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        )}

        {/* Drop zone indicator when dragging */}
        {fields.length > 0 && (
          <div
            className={clsx(
              'mt-3 border-2 border-dashed rounded-lg p-4 text-center transition-colors',
              isOver ? 'border-ice-400 bg-ice-50' : 'border-rink-300 opacity-50'
            )}
          >
            <p className="text-rink-400 text-sm">Drop here to add field</p>
          </div>
        )}
      </div>
    </div>
  );
}
