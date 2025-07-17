import React, { useState } from 'react';

const CookiePolicyPage = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const cookieTypes = [
    {
      id: 'essential',
      title: 'Essential Cookies',
      purpose: 'Required for basic platform functionality',
      retention: 'Session or up to 1 year',
      canDisable: false,
      examples: [
        'User authentication and login sessions',
        'Security tokens and CSRF protection',
        'Load balancing and server routing',
        'Basic functionality preferences',
        'Shopping cart and booking state'
      ]
    },
    {
      id: 'functional',
      title: 'Functional Cookies',
      purpose: 'Enhance user experience and remember preferences',
      retention: 'Up to 2 years',
      canDisable: true,
      examples: [
        'Language and region preferences',
        'Display settings and theme choices',
        'Previously entered form data',
        'Accessibility settings',
        'Location preferences for ride requests'
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      purpose: 'Help us understand how you use our platform',
      retention: 'Up to 2 years',
      canDisable: true,
      examples: [
        'Page views and user interactions',
        'Time spent on different sections',
        'Click patterns and navigation flows',
        'Performance monitoring',
        'Error tracking and debugging'
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing Cookies',
      purpose: 'Deliver relevant advertising and measure effectiveness',
      retention: 'Up to 1 year',
      canDisable: true,
      examples: [
        'Social media integration',
        'Third-party advertising platforms',
        'Conversion tracking',
        'Remarketing and retargeting',
        'Campaign effectiveness measurement'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: January 15, 2025
            </p>
          </div>

          <div className="prose max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
              <h3 className="text-lg font-medium text-blue-900 mb-2">About This Policy</h3>
              <p className="text-blue-800">
                This Cookie Policy explains how AnyRyde uses cookies and similar tracking technologies 
                on our website and mobile applications to provide, improve, and secure our services.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. What Are Cookies?</h2>
            
            <p className="text-gray-700 mb-4">
              Cookies are small text files that are placed on your device (computer, smartphone, or tablet) 
              when you visit our website or use our mobile applications. They help us recognize your device 
              and store information about your preferences and actions.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1 Types of Technologies We Use</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>HTTP Cookies:</strong> Traditional cookies stored in your browser</li>
              <li><strong>Local Storage:</strong> Data stored locally on your device</li>
              <li><strong>Session Storage:</strong> Temporary data for your current session</li>
              <li><strong>Mobile Identifiers:</strong> Device-specific identifiers on mobile apps</li>
              <li><strong>Pixels and Beacons:</strong> Small tracking images for analytics</li>
              <li><strong>SDKs:</strong> Software development kits for mobile app functionality</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Cookies</h2>
            
            <p className="text-gray-700 mb-6">
              We use cookies and similar technologies for several purposes to enhance your experience 
              and ensure our platform operates effectively:
            </p>

            <div className="space-y-4">
              {cookieTypes.map((cookieType) => (
                <div key={cookieType.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection(cookieType.id)}
                    className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{cookieType.title}</h3>
                        <p className="text-sm text-gray-600">{cookieType.purpose}</p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-xs text-gray-500">Retention: {cookieType.retention}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            cookieType.canDisable 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {cookieType.canDisable ? 'Optional' : 'Required'}
                          </span>
                        </div>
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          expandedSection === cookieType.id ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {expandedSection === cookieType.id && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Examples of {cookieType.title}:</h4>
                      <ul className="list-disc pl-6 space-y-1 text-gray-700">
                        {cookieType.examples.map((example, index) => (
                          <li key={index}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Third-Party Cookies</h2>
            
            <p className="text-gray-700 mb-4">
              We work with trusted third-party services that may place their own cookies on your device. 
              These help us provide better services and understand how our platform is used.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Analytics Services</h3>
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Google Analytics</h4>
              <p className="text-gray-700 text-sm mb-2">
                Helps us understand user behavior and improve our platform performance.
              </p>
              <p className="text-gray-600 text-xs">
                Learn more: <a href="https://policies.google.com/privacy" className="text-primary-600 hover:text-primary-700">Google Privacy Policy</a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Payment Processing</h3>
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Stripe</h4>
              <p className="text-gray-700 text-sm mb-2">
                Secure payment processing and fraud prevention for transactions.
              </p>
              <p className="text-gray-600 text-xs">
                Learn more: <a href="https://stripe.com/privacy" className="text-primary-600 hover:text-primary-700">Stripe Privacy Policy</a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Maps and Location Services</h3>
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Google Maps</h4>
              <p className="text-gray-700 text-sm mb-2">
                Provides mapping, navigation, and location services for rides.
              </p>
              <p className="text-gray-600 text-xs">
                Learn more: <a href="https://policies.google.com/privacy" className="text-primary-600 hover:text-primary-700">Google Privacy Policy</a>
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.4 Customer Support</h3>
            <div className="bg-gray-50 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Customer Support Tools</h4>
              <p className="text-gray-700 text-sm mb-2">
                Help us provide efficient customer service and support experiences.
              </p>
              <p className="text-gray-600 text-xs">
                Various third-party support platforms may be used.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Managing Your Cookie Preferences</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Cookie Consent Management</h3>
            <p className="text-gray-700 mb-4">
              When you first visit our website, you'll see a cookie consent banner where you can choose 
              which types of cookies to accept. You can change your preferences at any time by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Clicking the "Cookie Preferences" link in our website footer</li>
              <li>Accessing cookie settings in your account preferences</li>
              <li>Using your browser's built-in cookie management tools</li>
              <li>Contacting our support team for assistance</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Block all cookies or only third-party cookies</li>
              <li>Delete existing cookies from your device</li>
              <li>Set your browser to notify you when cookies are being set</li>
              <li>Browse in "incognito" or "private" mode</li>
            </ul>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-4">
              <h4 className="text-lg font-medium text-yellow-900 mb-2">Important Note</h4>
              <p className="text-yellow-800">
                Disabling essential cookies may prevent you from using certain features of our platform, 
                such as logging in, making bookings, or accessing your account information.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Mobile App Settings</h3>
            <p className="text-gray-700 mb-4">
              For our mobile applications, you can manage tracking preferences through:
            </p>
                         <ul className="list-disc pl-6 space-y-2 text-gray-700">
               <li><strong>iOS:</strong> Settings &gt; Privacy &amp; Security &gt; Tracking</li>
               <li><strong>Android:</strong> Settings &gt; Privacy &gt; Ads</li>
               <li><strong>App Settings:</strong> Privacy preferences within the AnyRyde app</li>
               <li><strong>Device Settings:</strong> Location services and app permissions</li>
             </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Cookie Retention and Deletion</h2>
            
            <p className="text-gray-700 mb-4">
              Different types of cookies are kept for different periods:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain until their expiration date or you delete them</li>
              <li><strong>Essential Cookies:</strong> May be recreated when necessary for platform functionality</li>
              <li><strong>Optional Cookies:</strong> Respect your preferences and won't be recreated if disabled</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. International Data Transfers</h2>
            
            <p className="text-gray-700">
              Some of our third-party services may transfer cookie data to countries outside your region. 
              We ensure that appropriate safeguards are in place for any international transfers, including 
              standard contractual clauses and adequacy decisions where applicable.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Your Rights</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.1 General Rights</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to be informed about our cookie use (this policy)</li>
              <li>Right to give or withdraw consent for non-essential cookies</li>
              <li>Right to access information about cookies we've set</li>
              <li>Right to request deletion of cookie data</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.2 Regional Rights</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>EU/UK (GDPR):</strong> Enhanced consent requirements and data protection rights</li>
              <li><strong>California (CCPA):</strong> Right to opt-out of sale of personal information</li>
              <li><strong>Other Jurisdictions:</strong> Rights may vary based on local privacy laws</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Updates to This Policy</h2>
            
            <p className="text-gray-700">
              We may update this Cookie Policy from time to time to reflect changes in our practices, 
              technologies, or legal requirements. We will notify you of material changes through our 
              platform, email, or other appropriate means.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Contact Us</h2>
            
            <p className="text-gray-700 mb-4">
              If you have questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Privacy Team</h4>
              <div className="space-y-1 text-gray-700">
                <p>AnyRyde, Inc.</p>
                <p>123 Innovation Drive</p>
                <p>San Francisco, CA 94105</p>
                <p>Email: <a href="mailto:privacy@rydealong.com" className="text-primary-600 hover:text-primary-700">privacy@rydealong.com</a></p>
                <p>Phone: +1 (555) 123-PRIVACY</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Quick Reference Guide</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3">✓ What You Can Do</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Accept or reject optional cookies</li>
                  <li>• Change your preferences anytime</li>
                  <li>• Clear cookies from your browser</li>
                  <li>• Use private browsing mode</li>
                  <li>• Contact us with questions</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">ℹ What We Use Cookies For</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Keeping you logged in</li>
                  <li>• Remembering your preferences</li>
                  <li>• Improving our platform</li>
                  <li>• Ensuring security</li>
                  <li>• Providing customer support</li>
                </ul>
              </div>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-400 p-6 mt-8">
              <h4 className="text-lg font-medium text-purple-900 mb-2">Need Help?</h4>
              <p className="text-purple-800">
                Our privacy team is here to help you understand and manage your cookie preferences. 
                We typically respond to cookie-related inquiries within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage; 