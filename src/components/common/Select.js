import React from 'react';

const Select = ({ 
  label, 
  options = [], 
  error, 
  className = '', 
  onChange,
  ...props 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <select
        {...props}
        onChange={(e) => {
          if (onChange) {
            onChange(e);
          }
          if (props.onChange) {
            props.onChange(e);
          }
        }}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
        `}
      >
        <option value="">Select an option...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
