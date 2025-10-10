/**
 * Advanced Star Rating Component
 * Interactive star rating with smooth animations and accessibility support
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  maxRating = 5, 
  size = 'medium',
  interactive = true,
  showLabel = true,
  label = '',
  category = null,
  disabled = false,
  className = ''
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [displayRating, setDisplayRating] = useState(rating);

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
    xlarge: 'w-12 h-12'
  };

  const starSize = sizeClasses[size] || sizeClasses.medium;

  useEffect(() => {
    setDisplayRating(rating);
  }, [rating]);

  const handleStarClick = (starRating) => {
    if (!interactive || disabled) return;
    
    setDisplayRating(starRating);
    setHoveredRating(0);
    onRatingChange?.(starRating);
  };

  const handleStarHover = (starRating) => {
    if (!interactive || disabled) return;
    setHoveredRating(starRating);
  };

  const handleMouseLeave = () => {
    if (!interactive || disabled) return;
    setHoveredRating(0);
  };

  const getStarColor = (starIndex) => {
    const currentRating = hoveredRating || displayRating;
    return starIndex < currentRating ? '#FCD34D' : '#E5E7EB';
  };

  const getStarFill = (starIndex) => {
    const currentRating = hoveredRating || displayRating;
    if (starIndex < Math.floor(currentRating)) return 1; // Full star
    if (starIndex === Math.floor(currentRating) && currentRating % 1 !== 0) {
      return currentRating % 1; // Partial star
    }
    return 0; // Empty star
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {showLabel && label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {category && (
            <span className="text-xs text-gray-500 ml-1">
              {category.icon} {category.label}
            </span>
          )}
        </label>
      )}
      
      <div 
        className="flex items-center space-x-1"
        onMouseLeave={handleMouseLeave}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={interactive ? `Rate ${label || 'this item'}` : `${displayRating} out of ${maxRating} stars`}
      >
        {Array.from({ length: maxRating }, (_, index) => (
          <motion.button
            key={index}
            type="button"
            className={`${starSize} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-all duration-200 ${
              interactive && !disabled ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
            }`}
            onClick={() => handleStarClick(index + 1)}
            onMouseEnter={() => handleStarHover(index + 1)}
            disabled={!interactive || disabled}
            aria-label={`Rate ${index + 1} star${index + 1 > 1 ? 's' : ''}`}
            whileHover={interactive && !disabled ? { scale: 1.1 } : {}}
            whileTap={interactive && !disabled ? { scale: 0.95 } : {}}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${index}-${getStarColor(index)}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                {/* Background star */}
                <svg
                  className={`${starSize} text-gray-300 absolute inset-0`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                
                {/* Filled star */}
                <svg
                  className={`${starSize} absolute inset-0`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  style={{ 
                    color: getStarColor(index),
                    clipPath: `inset(0 ${100 - (getStarFill(index) * 100)}% 0 0)`
                  }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      
      {/* Rating display */}
      {displayRating > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-gray-600"
        >
          {displayRating.toFixed(1)} out of {maxRating}
        </motion.div>
      )}
    </div>
  );
};

export default StarRating;
