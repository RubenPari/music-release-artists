import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  placeholder?: string
}

export function Select({
  label,
  options,
  placeholder,
  id,
  className = '',
  ...props
}: SelectProps) {
  const selectId = id || props.name

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-[#08060d]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full rounded-lg border border-[#e5e4e7] bg-white px-3 py-2 text-[#08060d]
          focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/50 focus:border-[#aa3bff]
          disabled:cursor-not-allowed disabled:bg-[#f4f3ec] disabled:opacity-50
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
