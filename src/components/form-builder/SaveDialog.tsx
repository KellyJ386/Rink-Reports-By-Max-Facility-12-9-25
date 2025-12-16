'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';
import { Button } from '@/components/ui/Button';
import {
  DocumentArrowUpIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: { versionType: 'MAJOR' | 'MINOR'; changeNotes?: string }) => Promise<void>;
  currentVersion: number;
  isLoading?: boolean;
}

const versionOptions = [
  {
    id: 'MINOR',
    name: 'Minor Update',
    description: 'Small changes, bug fixes, field adjustments',
    example: 'v1.0 → v1.1',
  },
  {
    id: 'MAJOR',
    name: 'Major Update',
    description: 'Significant changes, new sections, restructuring',
    example: 'v1.0 → v2.0',
  },
];

export function SaveDialog({
  isOpen,
  onClose,
  onSave,
  currentVersion,
  isLoading = false,
}: SaveDialogProps) {
  const [versionType, setVersionType] = useState<'MAJOR' | 'MINOR'>('MINOR');
  const [changeNotes, setChangeNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setError(null);
      await onSave({ versionType, changeNotes: changeNotes.trim() || undefined });
      setChangeNotes('');
      setVersionType('MINOR');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const formatVersion = (v: number) => {
    const major = Math.floor(v / 10);
    const minor = v % 10;
    return `v${major}.${minor}`;
  };

  const getNextVersion = () => {
    if (versionType === 'MAJOR') {
      const currentMajor = Math.floor(currentVersion / 10);
      return `v${currentMajor + 1}.0`;
    } else {
      const major = Math.floor(currentVersion / 10);
      const minor = (currentVersion % 10) + 1;
      return `v${major}.${minor}`;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-ice-100 rounded-lg">
                      <DocumentArrowUpIcon className="w-6 h-6 text-ice-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                        Save Form Version
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        Current: {formatVersion(currentVersion)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Version Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Version Type
                  </label>
                  <RadioGroup value={versionType} onChange={setVersionType}>
                    <div className="space-y-2">
                      {versionOptions.map((option) => (
                        <RadioGroup.Option
                          key={option.id}
                          value={option.id}
                          className={({ checked }) =>
                            `relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                              checked
                                ? 'border-ice-500 bg-ice-50 dark:bg-ice-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`
                          }
                        >
                          {({ checked }) => (
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center">
                                <div className="text-sm">
                                  <RadioGroup.Label
                                    as="p"
                                    className={`font-medium ${
                                      checked
                                        ? 'text-ice-900 dark:text-ice-100'
                                        : 'text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    {option.name}
                                  </RadioGroup.Label>
                                  <RadioGroup.Description
                                    as="span"
                                    className="text-gray-500 text-xs"
                                  >
                                    {option.description}
                                  </RadioGroup.Description>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-mono px-2 py-1 rounded ${
                                  checked
                                    ? 'bg-ice-100 text-ice-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {option.example}
                              </span>
                            </div>
                          )}
                        </RadioGroup.Option>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* New Version Preview */}
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    New version:
                  </span>
                  <span className="font-mono font-bold text-ice-600">
                    {getNextVersion()}
                  </span>
                </div>

                {/* Change Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Change Notes (optional)
                  </label>
                  <textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    placeholder="Describe what changed in this version..."
                    rows={3}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-ice-500 focus:border-ice-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    These notes help track changes over time
                  </p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    isLoading={isLoading}
                    leftIcon={<DocumentArrowUpIcon className="w-4 h-4" />}
                  >
                    Save as {getNextVersion()}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default SaveDialog;
