import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ 
  size = 'medium', 
  variant = 'primary', 
  className = '',
  overlay = false,
  text = ''
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const variantClasses = {
    primary: 'border-primary-500',
    secondary: 'border-secondary-500',
    white: 'border-white',
  };

  const spinnerClasses = `
    animate-spin rounded-full border-b-2 border-t-2 border-transparent
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `;

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={spinnerClasses} />
      {text && (
        <p className="text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xl']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'white']),
  className: PropTypes.string,
  overlay: PropTypes.bool,
  text: PropTypes.string,
};

export default LoadingSpinner; 