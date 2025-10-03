import { useState, useCallback } from 'react';

/**
 * Custom hook for managing confirmation dialogs
 * 
 * Usage:
 * const { showConfirm, ConfirmDialog } = useConfirm();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await showConfirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item?',
 *     confirmText: 'Yes, Delete',
 *     variant: 'danger'
 *   });
 *   
 *   if (confirmed) {
 *     // Perform delete action
 *   }
 * };
 * 
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 */
export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({});
  const [resolveCallback, setResolveCallback] = useState(null);

  const showConfirm = useCallback((options = {}) => {
    setConfig({
      title: options.title || 'Confirm Action',
      message: options.message || 'Are you sure you want to proceed?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'warning',
      icon: options.icon || null,
    });
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolveCallback(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(true);
    }
    setIsOpen(false);
    setResolveCallback(null);
  }, [resolveCallback]);

  const handleCancel = useCallback(() => {
    if (resolveCallback) {
      resolveCallback(false);
    }
    setIsOpen(false);
    setResolveCallback(null);
  }, [resolveCallback]);

  const ConfirmDialogComponent = useCallback(() => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleCancel}
        />

        {/* Dialog */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all">
            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              {getIconByVariant(config.variant, config.icon)}

              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {config.title}
              </h3>

              {/* Message */}
              <div className="text-sm text-gray-600 text-center mb-6">
                {typeof config.message === 'string' ? (
                  <p>{config.message}</p>
                ) : (
                  config.message
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  {config.cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${getButtonStyle(config.variant)}`}
                >
                  {config.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [isOpen, config, handleConfirm, handleCancel]);

  return {
    showConfirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
};

// Helper functions
const getIconByVariant = (variant, customIcon) => {
  const variantStyles = {
    danger: { bg: 'bg-red-100', color: 'text-red-600' },
    warning: { bg: 'bg-yellow-100', color: 'text-yellow-600' },
    info: { bg: 'bg-blue-100', color: 'text-blue-600' },
    success: { bg: 'bg-green-100', color: 'text-green-600' },
  };

  const style = variantStyles[variant] || variantStyles.warning;

  const defaultIcons = {
    danger: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${style.bg} mb-4`}>
      <div className={style.color}>
        {customIcon || defaultIcons[variant] || defaultIcons.warning}
      </div>
    </div>
  );
};

const getButtonStyle = (variant) => {
  const styles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  };

  return styles[variant] || styles.warning;
};

export default useConfirm;

