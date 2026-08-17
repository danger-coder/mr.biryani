"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* Form primitives shared by both the customer site and the admin panel.
   Every input is label-linked and reports its own error via aria-describedby. */

export function Label({
  className,
  required,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("block text-xs font-medium tracking-wide mb-1.5", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-0.5" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

/* The default tone suits the light admin surface. The customer site overrides
   bg/text via className for its dark brand surface — so nothing here may carry
   a `dark:` variant: tailwind-merge cannot drop a variant class in favour of an
   unvariated one, so `dark:bg-white` would survive the override and repaint the
   field white under OS dark mode, hiding the light text on top of it. */
const baseControl =
  "w-full rounded-lg border bg-white/95 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60 border-slate-300 focus:border-slate-400";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(({ className, error, id, ...props }, ref) => (
  <input
    ref={ref}
    id={id}
    aria-invalid={error ? true : undefined}
    aria-describedby={error && id ? `${id}-error` : undefined}
    className={cn(baseControl, "h-10", error && "border-red-400", className)}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, id, ...props }, ref) => (
  <textarea
    ref={ref}
    id={id}
    aria-invalid={error ? true : undefined}
    aria-describedby={error && id ? `${id}-error` : undefined}
    className={cn(baseControl, "min-h-24 resize-y", error && "border-red-400", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(({ className, error, id, children, ...props }, ref) => (
  <select
    ref={ref}
    id={id}
    aria-invalid={error ? true : undefined}
    aria-describedby={error && id ? `${id}-error` : undefined}
    className={cn(baseControl, "h-10 pr-8", error && "border-red-400", className)}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-500">
      {children}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs opacity-55">{hint}</p>}
      <FieldError id={htmlFor ? `${htmlFor}-error` : undefined}>{error}</FieldError>
    </div>
  );
}

/** Accessible checkbox/switch row. */
export function Toggle({
  label,
  description,
  checked,
  onChange,
  name,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer transition-colors hover:border-slate-300",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-slate-900"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && (
          <span className="block text-xs text-slate-500 mt-0.5">{description}</span>
        )}
      </span>
    </label>
  );
}
