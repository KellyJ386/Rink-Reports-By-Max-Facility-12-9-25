'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import { FieldPalette } from './FieldPalette';
import { FormCanvas } from './FormCanvas';
import { FieldProperties } from './FieldProperties';
import { FormFieldConfig } from '@/types';
import { FieldType, FormCategory } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeftIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface FormBuilderProps {
  formId?: string;
  initialData?: {
    name: string;
    description?: string;
    category: FormCategory;
    fields: FormFieldConfig[];
  };
  onSave: (data: {
    name: string;
    description?: string;
    category: FormCategory;
    fields: FormFieldConfig[];
  }) => Promise<void>;
  onBack: () => void;
}

export function FormBuilder({ formId, initialData, onSave, onBack }: FormBuilderProps) {
  const [formName, setFormName] = useState(initialData?.name || 'Untitled Form');
  const [formDescription, setFormDescription] = useState(initialData?.description || '');
  const [formCategory, setFormCategory] = useState<FormCategory>(
    initialData?.category || 'CUSTOM'
  );
  const [fields, setFields] = useState<FormFieldConfig[]>(initialData?.fields || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  const createFieldFromType = (fieldType: FieldType): FormFieldConfig => {
    const baseField: FormFieldConfig = {
      id: uuidv4(),
      fieldType,
      label: getDefaultLabel(fieldType),
      isRequired: false,
      orderIndex: fields.length,
      width: 'full',
    };

    // Add default options for selection fields
    if (['DROPDOWN', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'].includes(fieldType)) {
      baseField.options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' },
      ];
    }

    return baseField;
  };

  const getDefaultLabel = (fieldType: FieldType): string => {
    const labels: Partial<Record<FieldType, string>> = {
      TEXT: 'Text Field',
      TEXTAREA: 'Text Area',
      NUMBER: 'Number',
      EMAIL: 'Email Address',
      PHONE: 'Phone Number',
      DROPDOWN: 'Select Option',
      MULTI_SELECT: 'Select Multiple',
      RADIO: 'Choose One',
      CHECKBOX: 'Select All That Apply',
      TOGGLE: 'Toggle Option',
      DATE: 'Select Date',
      TIME: 'Select Time',
      DATETIME: 'Select Date & Time',
      FILE_UPLOAD: 'Upload File',
      PHOTO: 'Upload Photo',
      SIGNATURE: 'Signature',
      SECTION_HEADER: 'Section Title',
      INSTRUCTIONAL_TEXT: 'Instructions text here...',
    };
    return labels[fieldType] || 'New Field';
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dragging from palette
    if (active.data.current?.type === 'palette-field') {
      const fieldType = active.data.current.fieldType as FieldType;
      const newField = createFieldFromType(fieldType);
      setFields([...fields, newField]);
      setSelectedFieldId(newField.id);
      return;
    }

    // Reordering existing fields
    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex).map((f, i) => ({
          ...f,
          orderIndex: i,
        }));
      });
    }
  };

  const handleRemoveField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(null);
    }
  }, [selectedFieldId]);

  const handleUpdateField = useCallback((updatedField: FormFieldConfig) => {
    setFields((prev) =>
      prev.map((f) => (f.id === updatedField.id ? updatedField : f))
    );
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        name: formName,
        description: formDescription,
        category: formCategory,
        fields,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const categories: { value: FormCategory; label: string }[] = [
    { value: 'ICE_OPERATIONS', label: 'Ice Operations' },
    { value: 'INCIDENT_REPORTING', label: 'Incident Reporting' },
    { value: 'REFRIGERATION', label: 'Refrigeration' },
    { value: 'AIR_QUALITY', label: 'Air Quality' },
    { value: 'FACILITY_CHECKLIST', label: 'Facility Checklist' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  return (
    <div className="h-screen flex flex-col bg-rink-50">
      {/* Header */}
      <header className="bg-white border-b border-rink-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>
              Back
            </Button>
            <div className="h-6 w-px bg-rink-200" />
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="text-lg font-semibold text-rink-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                placeholder="Form name..."
              />
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as FormCategory)}
                className="text-sm text-rink-600 bg-rink-100 border-none rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-ice-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
              leftIcon={<EyeIcon className="w-4 h-4" />}
            >
              Preview
            </Button>
            <Button
              variant="secondary"
              leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
            >
              Export
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<CheckIcon className="w-4 h-4" />}
            >
              Save Form
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-2 max-w-xl">
          <input
            type="text"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full text-sm text-rink-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            placeholder="Add a description..."
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Field Palette */}
          <FieldPalette />

          {/* Form Canvas */}
          <FormCanvas
            fields={fields}
            selectedFieldId={selectedFieldId}
            onSelectField={setSelectedFieldId}
            onRemoveField={handleRemoveField}
          />

          {/* Field Properties */}
          <FieldProperties
            field={selectedField}
            onUpdate={handleUpdateField}
            onClose={() => setSelectedFieldId(null)}
          />

          <DragOverlay>
            {activeId ? (
              <div className="bg-white border-2 border-ice-500 rounded-lg p-4 shadow-xl opacity-90">
                <p className="text-sm font-medium text-rink-900">
                  {activeId.startsWith('palette-')
                    ? activeId.replace('palette-', '')
                    : fields.find((f) => f.id === activeId)?.label}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
