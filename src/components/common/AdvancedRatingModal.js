/**
 * Advanced Rating Modal
 * State-of-the-art rating interface with detailed categories, quick reviews, and tips
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, StarIcon, HeartIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import StarRating from './StarRating';
import CategoryRating from './CategoryRating';
import Button from './Button';
import { ratingService } from '../../services/ratingService';

const AdvancedRatingModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  rideData, 
  userType, // 'rider' or 'driver'
  targetUser, // User being rated
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({});
  const [weightedAverage, setWeightedAverage] = useState(0);
  const [quickReviews, setQuickReviews] = useState([]);
  const [writtenReview, setWrittenReview] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 3;
  const categories = ratingService.getRatingCategories(userType, rideData?.rideType);
  const quickReviewOptions = ratingService.getQuickReviewOptions(userType, overallRating);
  const tipOptions = [0, 1, 2, 3, 5, 10];

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setCurrentStep(1);
      setOverallRating(0);
      setCategoryRatings({});
      setWeightedAverage(0);
      setQuickReviews([]);
      setWrittenReview('');
      setTipAmount(0);
      setError('');
    }
  }, [isOpen]);

  const handleOverallRatingChange = (rating) => {
    setOverallRating(rating);
    // Auto-advance to categories if rating is given
    if (rating > 0 && currentStep === 1) {
      setTimeout(() => setCurrentStep(2), 500);
    }
  };

  const handleCategoryRatingChange = (ratings, average) => {
    setCategoryRatings(ratings);
    setWeightedAverage(average);
  };

  const handleQuickReviewToggle = (review) => {
    setQuickReviews(prev => 
      prev.includes(review) 
        ? prev.filter(r => r !== review)
        : [...prev, review]
    );
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      setError('Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const ratingData = {
        overall: overallRating,
        categories: categoryRatings,
        weightedAverage: weightedAverage,
        review: writtenReview.trim(),
        quickReviews: quickReviews,
        tip: tipAmount,
        rideContext: {
          rideType: rideData?.rideType || 'standard',
          duration: rideData?.duration || 0,
          distance: rideData?.distance || 0
        }
      };

      const ratingType = userType === 'rider' ? 'riderToDriver' : 'driverToRider';
      const result = await ratingService.submitRating(
        rideData?.id, 
        ratingType, 
        ratingData
      );

      if (result.success) {
        onSubmit?.(result.ratingData);
        onClose();
      } else {
        setError(result.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Rating submission error:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return `How was your experience with ${targetUser?.name || 'this user'}?`;
      case 2: return 'Rate specific aspects of the service';
      case 3: return 'Share more details (optional)';
      default: return 'Rate your experience';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Your overall rating helps improve the service for everyone';
      case 2: return 'Detailed feedback helps identify specific areas for improvement';
      case 3: return 'Additional comments and tips are greatly appreciated';
      default: return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return overallRating > 0;
      case 2: return Object.keys(categoryRatings).length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rate Your Experience</h2>
              <p className="text-gray-600 mt-1">Help improve the service for everyone</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="bg-blue-600 h-2 rounded-full"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {getStepTitle()}
                </h3>
                <p className="text-gray-600">
                  {getStepDescription()}
                </p>
              </div>

              {/* Step 1: Overall Rating */}
              {currentStep === 1 && (
                <div className="flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      {targetUser?.photo ? (
                        <img
                          src={targetUser.photo}
                          alt={targetUser.name}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                          {targetUser?.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <h4 className="text-lg font-medium text-gray-900">{targetUser?.name}</h4>
                    <p className="text-gray-600">{targetUser?.role || userType === 'rider' ? 'Driver' : 'Rider'}</p>
                  </div>

                  <StarRating
                    rating={overallRating}
                    onRatingChange={handleOverallRatingChange}
                    size="xlarge"
                    interactive={true}
                    showLabel={false}
                    className="transform scale-150"
                  />

                  {overallRating > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <p className="text-lg font-medium text-gray-900">
                        {overallRating >= 4.5 ? 'Excellent!' :
                         overallRating >= 3.5 ? 'Good!' :
                         overallRating >= 2.5 ? 'Fair' : 'Poor'}
                      </p>
                      <p className="text-gray-600">
                        {overallRating >= 4.5 ? 'Thank you for the great experience!' :
                         overallRating >= 3.5 ? 'We appreciate your feedback!' :
                         overallRating >= 2.5 ? 'We\'ll work to improve!' : 'We apologize for the poor experience.'}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 2: Category Ratings */}
              {currentStep === 2 && (
                <CategoryRating
                  categories={categories}
                  onRatingChange={handleCategoryRatingChange}
                  initialRatings={categoryRatings}
                />
              )}

              {/* Step 3: Additional Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Quick Reviews */}
                  {overallRating >= 3 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        What went well? (Optional)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {quickReviewOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleQuickReviewToggle(option)}
                            className={`px-4 py-2 text-sm rounded-full border transition-all duration-200 ${
                              quickReviews.includes(option)
                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Written Review */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                      Additional Comments (Optional)
                    </h4>
                    <textarea
                      value={writtenReview}
                      onChange={(e) => setWrittenReview(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Share more details about your experience..."
                      maxLength={500}
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {writtenReview.length}/500 characters
                    </div>
                  </div>

                  {/* Tip Option */}
                  {userType === 'rider' && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Add a tip? (Optional)
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {tipOptions.map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setTipAmount(amount)}
                            className={`py-3 px-4 text-sm rounded-lg border transition-all duration-200 ${
                              tipAmount === amount
                                ? 'bg-green-100 border-green-300 text-green-700'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {amount === 0 ? 'No tip' : `$${amount}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? onClose : handlePrevious}
                disabled={submitting}
              >
                {currentStep === 1 ? 'Cancel' : 'Back'}
              </Button>

              <div className="flex space-x-3">
                {currentStep < totalSteps ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={!canProceed()}
                  >
                    Submit Rating
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdvancedRatingModal;
