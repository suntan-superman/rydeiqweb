import React from 'react';

const SecurityNotice = ({ 
  title = "API Configuration Required", 
  message = "Please configure your API keys in the .env file to enable this feature.",
  type = "warning" // warning, error, info
}) => {
  const getIconAndColors = () => {
    switch (type) {
      case 'error':
        return {
          icon: (
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'info':
        return {
          icon: (
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      default: // warning
        return {
          icon: (
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const { icon, bgColor, textColor, borderColor } = getIconAndColors();

  return (
    <div className={`rounded-md ${bgColor} ${borderColor} border p-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${textColor}`}>
            {title}
          </h3>
          <div className={`mt-2 text-sm ${textColor.replace('800', '700')}`}>
            <p>{message}</p>
            {type === 'warning' && (
              <div className="mt-3">
                <p className="font-medium">To fix this:</p>
                <ol className="mt-1 list-decimal list-inside space-y-1">
                  <li>Create a <code className="bg-yellow-100 px-1 rounded">.env</code> file in your project root</li>
                  <li>Add your API keys (see SETUP_GUIDE.md for details)</li>
                  <li>Restart the development server</li>
                  <li>Never commit the .env file to Git</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityNotice; 