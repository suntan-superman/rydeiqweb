import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DateInput = ({
  label,
  placeholder = "MM/YY",
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format date as user types (MM/YY format)
  const formatDate = (input) => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '');
    
    // Don't format if empty
    if (!numbers) return '';
    
    // Format based on length
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      // If more than 4 digits, truncate to 4
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
    }
  };

  // Handle input change
  const handleChange = (e) => {
    const formatted = formatDate(e.target.value);
    setDisplayValue(formatted);
    
    // Call the parent onChange with the raw value (numbers only)
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted.replace(/\D/g, '') // Send only numbers
        }
      };
      onChange(syntheticEvent);
    }
  };

  // Update display value when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setDisplayValue(formatDate(value));
    }
  }, [value]);

  const inputClasses = `
    w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent
    ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id || name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type="text"
        id={id || name}
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
        maxLength={5} // MM/YY = 5 characters
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg
            className="h-4 w-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

DateInput.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
};

export default DateInput;
