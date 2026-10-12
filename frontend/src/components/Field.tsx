/**
 * Form field primitives.
 *
 * The audit found 89 inputs, selects and textareas with no accessible name:
 * each form rendered a <label> as a sibling with no htmlFor and no matching
 * id. Field generates a stable id from React's useId and wires the label to
 * the control, so screen readers announce the field name and clicking the
 * label focuses the input. No caller has to remember to do it.
 */
import React, { useId } from "react";

interface FieldProps {
  label: string;
  /** Rendered after the label, e.g. "*" for required. */
  marker?: string;
  hint?: string;
  error?: string | null;
  className?: string;
  inputClassName?: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
    className: string;
  }) => React.ReactNode;
}

/**
 * Usage:
 *   <Field label="Email / Username" error={error}>
 *     {(p) => <input {...p} type="email" value={email} onChange={...} />}
 *   </Field>
 */
export default function Field({
  label,
  marker,
  hint,
  error,
  className = "",
  inputClassName = "",
  children,
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {marker && <span className="ml-1 text-[var(--critical)]">{marker}</span>}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        className: `field-input ${error ? "invalid" : ""} ${inputClassName}`.trim(),
      })}
      {hint && !error && (
        <span id={hintId} className="mt-1.5 block text-[11.5px] text-[var(--text-4)]">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}