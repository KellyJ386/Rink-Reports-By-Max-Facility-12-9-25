'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftAddon, rightAddon, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftAddon && (
            <div className="absolute left-0 inset-y-0 flex items-center pl-3 pointer-events-none text-rink-400">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'form-input',
              leftAddon && 'pl-10',
              rightAddon && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-0 inset-y-0 flex items-center pr-3 text-rink-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
        {helperText && !error && <p className="form-help">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
