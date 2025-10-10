/**
 * Category Rating Component
 * Detailed category-specific ratings with weighted scoring
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import StarRating from './StarRating';

const CategoryRating = ({ 
  categories, 
  onRatingChange, 
  initialRatings = {}, 
  disabled = false,
  className = ''
}) => {
  const [ratings, setRatings] = useState(initialRatings);

  useEffect(() => {
    setRatings(initialRatings);
  }, [initialRatings]);

  const handleCategoryRatingChange = (category, rating) => {
    const newRatings = {
      ...ratings,
      [category]: rating
    };
    
    setRatings(newRatings);
    
    // Calculate weighted average
    const weightedSum = Object.entries(newRatings).reduce((sum, [cat, rating]) => {
      const weight = categories[cat]?.weight || 1;
      return sum + (rating * weight);
    }, 0);
    
    const totalWeight = Object.values(categories).reduce((sum, cat) => sum + (cat.weight || 1), 0);
    const weightedAverage = weightedSum / totalWeight;
    
    onRatingChange?.(newRatings, weightedAverage);
  };

  const getCategoryColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCategoryBgColor = (rating) => {
    if (rating >= 4.5) return 'bg-green-50 border-green-200';
    if (rating >= 3.5) return 'bg-yellow-50 border-yellow-200';
    if (rating >= 2.5) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {Object.entries(categories).map(([categoryKey, category], index) => {
        const currentRating = ratings[categoryKey] || 0;
        
        return (
          <motion.div
            key={categoryKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 transition-all duration-300 ${
              currentRating > 0 ? getCategoryBgColor(currentRating) : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{category.label}</h4>
                  {category.weight > 1 && (
                    <span className="text-xs text-gray-500">
                      Weighted {category.weight}x
                    </span>
                  )}
                </div>
              </div>
              
              {currentRating > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`text-lg font-semibold ${getCategoryColor(currentRating)}`}
                >
                  {currentRating.toFixed(1)}
                </motion.div>
              )}
            </div>
            
            <StarRating
              rating={currentRating}
              onRatingChange={(rating) => handleCategoryRatingChange(categoryKey, rating)}
              size="medium"
              interactive={!disabled}
              disabled={disabled}
              className="justify-start"
            />
            
            {currentRating > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-gray-200"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Performance</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentRating / 5) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`h-full ${
                          currentRating >= 4.5 ? 'bg-green-500' :
                          currentRating >= 3.5 ? 'bg-yellow-500' :
                          currentRating >= 2.5 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <span className={`font-medium ${getCategoryColor(currentRating)}`}>
                      {currentRating >= 4.5 ? 'Excellent' :
                       currentRating >= 3.5 ? 'Good' :
                       currentRating >= 2.5 ? 'Fair' : 'Poor'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default CategoryRating;
