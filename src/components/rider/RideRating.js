import React, { useState } from 'react';
import Button from '../common/Button';

const RideRating = ({ driver, ride, onSubmit, onClose }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please provide a rating before submitting');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, review, tip);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const quickReviewOptions = [
    'Great driver!',
    'Safe and smooth ride',
    'Very professional',
    'Clean vehicle',
    'On time pickup',
    'Friendly conversation',
    'Helped with luggage'
  ];

  const tipOptions = [0, 1, 2, 3, 5];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Rate Your Ride</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Driver Info */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-700">
                {driver?.driverInfo?.firstName?.[0]}{driver?.driverInfo?.lastName?.[0]}
              </span>
            </div>
            <h4 className="text-lg font-medium text-gray-900">
              {driver?.driverInfo?.firstName} {driver?.driverInfo?.lastName}
            </h4>
            <p className="text-gray-600">
              {driver?.vehicleInfo?.year} {driver?.vehicleInfo?.make} {driver?.vehicleInfo?.model}
            </p>
          </div>

          {/* Trip Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Fare:</span>
                <span className="font-medium">${ride?.finalFare?.toFixed(2) || ride?.estimatedFare?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trip Time:</span>
                <span className="font-medium">
                  {ride?.duration ? `${Math.round(ride.duration)} min` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Star Rating */}
          <div className="text-center">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              How was your ride?
            </h4>
            <div className="flex justify-center space-x-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className={`text-3xl transition-colors ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-600">
              {rating === 0 && 'Tap to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </div>
          </div>

          {/* Quick Review Options */}
          {rating >= 4 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">
                What went well? (Optional)
              </h5>
              <div className="flex flex-wrap gap-2">
                {quickReviewOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      if (review.includes(option)) {
                        setReview(review.replace(option, '').trim());
                      } else {
                        setReview(review ? `${review}, ${option}` : option);
                      }
                    }}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      review.includes(option)
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Share details about your experience..."
            />
          </div>

          {/* Tip Option */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3">
              Add a tip? (Optional)
            </h5>
            <div className="flex space-x-3">
              {tipOptions.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTip(amount)}
                  className={`flex-1 py-2 px-3 text-sm rounded-md border transition-colors ${
                    tip === amount
                      ? 'bg-green-100 border-green-300 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {amount === 0 ? 'No tip' : `$${amount}`}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Skip
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={submitting}
              className="flex-1"
            >
              Submit Rating
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideRating; 