import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hideIconOnInput?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  hideIconOnInput = false,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const rawValue = props.value ?? props.defaultValue;
  const hasValue = rawValue !== undefined && rawValue !== null && String(rawValue).length > 0;
  const showIcon = icon && !(hideIconOnInput && hasValue);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-surface-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {showIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-surface-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-xl bg-surface-900/60 border border-surface-800
            text-surface-100 placeholder-surface-500
            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
            transition-all duration-200
            pl-4 ${icon ? "pr-10" : "pr-4"} py-2.5 text-sm
            ${error ? "border-danger focus:border-danger focus:ring-danger/20" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
};
