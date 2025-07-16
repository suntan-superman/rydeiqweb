import React, { useState } from 'react';
import Button from '../components/common/Button';

const ComparePage = () => {
  const [viewType, setViewType] = useState('driver'); // 'driver' or 'rider'

  const driverComparison = [
    {
      feature: 'Commission Rate',
      rydeiq: '10-20%',
      uber: '25-50%',
      lyft: '25-50%',
      advantage: 'rydeiq'
    },
    {
      feature: 'Driver Keeps',
      rydeiq: '80-90%',
      uber: '50-75%',
      lyft: '50-75%',
      advantage: 'rydeiq'
    },
    {
      feature: 'Price Setting',
      rydeiq: 'Driver sets own prices',
      uber: 'Platform controlled',
      lyft: 'Platform controlled',
      advantage: 'rydeiq'
    },
    {
      feature: 'Surge Pricing',
      rydeiq: 'None - market competition',
      uber: 'Platform controlled surge',
      lyft: 'Platform controlled surge',
      advantage: 'rydeiq'
    },
    {
      feature: 'Ride Acceptance',
      rydeiq: 'Choose rides freely',
      uber: 'Pressure to accept',
      lyft: 'Pressure to accept',
      advantage: 'rydeiq'
    },
    {
      feature: 'Instant Payout',
      rydeiq: '$1.50 fee',
      uber: '$1.99 fee',
      lyft: '$1.99 fee',
      advantage: 'rydeiq'
    },
    {
      feature: 'Daily Payout',
      rydeiq: '$0.50 fee',
      uber: 'Not available',
      lyft: 'Not available',
      advantage: 'rydeiq'
    },
    {
      feature: 'Weekly Payout',
      rydeiq: 'Free',
      uber: 'Free',
      lyft: 'Free',
      advantage: 'tie'
    },
    {
      feature: 'Driver Support',
      rydeiq: 'Human support 24/7',
      uber: 'Mostly automated',
      lyft: 'Mostly automated',
      advantage: 'rydeiq'
    },
    {
      feature: 'Earnings Transparency',
      rydeiq: 'Full breakdown shown',
      uber: 'Limited transparency',
      lyft: 'Limited transparency',
      advantage: 'rydeiq'
    }
  ];

  const riderComparison = [
    {
      feature: 'Surge Pricing',
      rydeiq: 'Never - competitive bidding',
      uber: 'Yes - up to 5x normal price',
      lyft: 'Yes - up to 5x normal price',
      advantage: 'rydeiq'
    },
    {
      feature: 'Driver Choice',
      rydeiq: 'Choose from all bids',
      uber: 'Algorithm assigns driver',
      lyft: 'Algorithm assigns driver',
      advantage: 'rydeiq'
    },
    {
      feature: 'Price Transparency',
      rydeiq: 'See all bids upfront',
      uber: 'Estimate only',
      lyft: 'Estimate only',
      advantage: 'rydeiq'
    },
    {
      feature: 'Price Negotiation',
      rydeiq: 'Drivers compete for your ride',
      uber: 'Take it or leave it',
      lyft: 'Take it or leave it',
      advantage: 'rydeiq'
    },
    {
      feature: 'Cancellation Fees',
      rydeiq: 'Fair, transparent fees',
      uber: 'Up to $5',
      lyft: 'Up to $5',
      advantage: 'rydeiq'
    },
    {
      feature: 'Wait Time',
      rydeiq: 'See estimated arrival',
      uber: 'See estimated arrival',
      lyft: 'See estimated arrival',
      advantage: 'tie'
    },
    {
      feature: 'Driver Information',
      rydeiq: 'Full profile & vehicle details',
      uber: 'Basic information',
      lyft: 'Basic information',
      advantage: 'rydeiq'
    },
    {
      feature: 'Local Drivers',
      rydeiq: 'Supports local taxi companies',
      uber: 'Platform drivers only',
      lyft: 'Platform drivers only',
      advantage: 'rydeiq'
    },
    {
      feature: 'Booking Options',
      rydeiq: 'Real-time & advance booking',
      uber: 'Real-time & advance booking',
      lyft: 'Real-time & advance booking',
      advantage: 'tie'
    },
    {
      feature: 'Payment Options',
      rydeiq: 'Multiple payment methods',
      uber: 'Multiple payment methods',
      lyft: 'Multiple payment methods',
      advantage: 'tie'
    }
  ];

  const marketComparison = [
    {
      metric: 'Founded',
      rydeiq: '2024',
      uber: '2009',
      lyft: '2012'
    },
    {
      metric: 'Markets',
      rydeiq: '3 (expanding)',
      uber: '900+ cities',
      lyft: '600+ cities'
    },
    {
      metric: 'Drivers',
      rydeiq: '5,000+',
      uber: '5+ million',
      lyft: '2+ million'
    },
    {
      metric: 'Valuation',
      rydeiq: '$50M (Series A)',
      uber: '$82B (Public)',
      lyft: '$11B (Public)'
    },
    {
      metric: 'Revenue Model',
      rydeiq: 'Fair commission',
      uber: 'High commission + fees',
      lyft: 'High commission + fees'
    }
  ];

  const benefits = {
    driver: [
      {
        title: 'Higher Earnings',
        description: 'Keep 80-90% vs 50-75% with others',
        icon: '💰'
      },
      {
        title: 'Price Control',
        description: 'Set your own rates based on demand',
        icon: '🎯'
      },
      {
        title: 'Fair Competition',
        description: 'Compete on service, not algorithm preference',
        icon: '⚖️'
      },
      {
        title: 'Transparent Fees',
        description: 'Know exactly what you earn on each ride',
        icon: '🔍'
      }
    ],
    rider: [
      {
        title: 'No Surge Pricing',
        description: 'Fair prices even during peak times',
        icon: '🚫'
      },
      {
        title: 'Driver Choice',
        description: 'Pick your driver based on preferences',
        icon: '👤'
      },
      {
        title: 'Best Prices',
        description: 'Drivers compete for your business',
        icon: '💵'
      },
      {
        title: 'Full Transparency',
        description: 'See all options and make informed choices',
        icon: '📊'
      }
    ]
  };

  const caseStudies = [
    {
      title: 'Peak Hour Savings',
      scenario: 'Airport ride during Friday rush hour',
      rydeiq: '$28 (competitive bidding)',
      uber: '$45 (3.2x surge)',
      lyft: '$42 (2.8x surge)',
      savings: '38% vs Uber, 33% vs Lyft'
    },
    {
      title: 'Driver Earnings',
      scenario: '$100 gross ride fare',
      rydeiq: '$85 driver keeps (15% commission)',
      uber: '$65 driver keeps (35% commission)',
      lyft: '$70 driver keeps (30% commission)',
      benefit: '31% more than Uber, 21% more than Lyft'
    },
    {
      title: 'Long Distance Trip',
      scenario: '45-minute ride across town',
      rydeiq: '$35 (driver bid)',
      uber: '$52 (base + time + distance)',
      lyft: '$48 (base + time + distance)',
      savings: '33% vs Uber, 27% vs Lyft'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              See How RydeAlong Compares
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
              Fair pricing, transparent earnings, and competitive market dynamics. 
              See why drivers and riders are choosing RydeAlong over traditional platforms.
            </p>
            
            <div className="flex justify-center mb-8">
              <div className="bg-white bg-opacity-20 rounded-lg p-1 flex">
                <button
                  onClick={() => setViewType('driver')}
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
                    viewType === 'driver'
                      ? 'bg-white text-primary-600'
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  For Drivers
                </button>
                <button
                  onClick={() => setViewType('rider')}
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
                    viewType === 'rider'
                      ? 'bg-white text-primary-600'
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  For Riders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Why Choose RydeAlong {viewType === 'driver' ? 'as a Driver' : 'as a Rider'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits[viewType].map((benefit, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Comparison */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Detailed Comparison for {viewType === 'driver' ? 'Drivers' : 'Riders'}
          </h2>
          
          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold">RydeAlong</th>
                    <th className="px-6 py-4 text-center font-semibold">Uber</th>
                    <th className="px-6 py-4 text-center font-semibold">Lyft</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewType === 'driver' ? driverComparison : riderComparison).map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.feature}</td>
                      <td className={`px-6 py-4 text-center ${item.advantage === 'rydeiq' ? 'bg-green-50 text-green-900 font-semibold' : ''}`}>
                        {item.rydeiq}
                        {item.advantage === 'rydeiq' && (
                          <div className="inline-flex ml-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.uber}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.lyft}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Case Studies */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Real-World Examples
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {caseStudies.map((study, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{study.title}</h3>
                <p className="text-gray-600 mb-6">{study.scenario}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-900">RydeAlong</span>
                    <span className="font-bold text-green-900">{study.rydeiq}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                    <span className="text-gray-700">Uber</span>
                    <span className="text-gray-700">{study.uber}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                    <span className="text-gray-700">Lyft</span>
                    <span className="text-gray-700">{study.lyft}</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">
                    {study.savings || study.benefit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Market Position */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Market Position
          </h2>
          
          <div className="bg-gray-50 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Metric</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">RydeAlong</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Uber</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Lyft</th>
                  </tr>
                </thead>
                <tbody>
                  {marketComparison.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.metric}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.rydeiq}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.uber}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.lyft}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 max-w-3xl mx-auto">
              While RydeAlong is newer and smaller than established platforms, our focus on fair 
              pricing and transparent economics is already attracting drivers and riders who 
              want a better alternative to traditional ride-sharing.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-600 to-blue-700 rounded-3xl text-white p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Experience the Difference?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join thousands of drivers and riders who have already made the switch to fair, 
              transparent ride-sharing with RydeAlong.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {viewType === 'driver' ? (
                <>
                  <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                    Start Driving with RydeAlong
                  </Button>
                  <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                    Calculate Your Earnings
                  </Button>
                </>
              ) : (
                <>
                  <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                    Book Your First Ride
                  </Button>
                  <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                    Download Mobile App
                  </Button>
                </>
              )}
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">95%</div>
                <div className="text-sm">Driver Satisfaction</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">40%</div>
                <div className="text-sm">Higher Driver Earnings</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">0</div>
                <div className="text-sm">Surge Pricing Incidents</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage; 