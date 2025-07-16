import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: January 15, 2025
            </p>
          </div>

          <div className="prose max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Your Privacy Matters</h3>
              <p className="text-blue-800">
                At RydeAlong, we are committed to protecting your privacy and ensuring transparency 
                in how we collect, use, and share your personal information. This policy explains 
                our practices in clear, understandable terms.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Information:</strong> Name, email address, phone number, profile photo</li>
              <li><strong>Identity Verification (Drivers):</strong> Driver's license, government ID, Social Security Number (for background checks)</li>
              <li><strong>Vehicle Information (Drivers):</strong> Vehicle registration, insurance documents, vehicle photos</li>
              <li><strong>Payment Information:</strong> Credit/debit card details, bank account information (for payouts), billing address</li>
              <li><strong>Background Check Information (Drivers):</strong> Criminal history, driving record, employment history</li>
              <li><strong>Communications:</strong> Messages, emails, phone calls, and other communications with us or through our platform</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2 Information We Collect Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Location Information:</strong> Real-time GPS location (when using our services), trip routes, pickup and drop-off locations</li>
              <li><strong>Device Information:</strong> Device type, operating system, browser type, IP address, device identifiers</li>
              <li><strong>Usage Information:</strong> App interactions, features used, time spent, ride history, preferences</li>
              <li><strong>Sensor Data:</strong> Accelerometer and gyroscope data (for safety features and trip optimization)</li>
              <li><strong>Camera and Microphone:</strong> Photos for verification, voice commands (with your permission)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Background Check Providers:</strong> Criminal history, driving records, identity verification</li>
              <li><strong>Payment Processors:</strong> Transaction details, fraud prevention information</li>
              <li><strong>Social Media:</strong> Profile information when you choose to connect your accounts</li>
              <li><strong>Business Partners:</strong> Taxi companies, fleet operators, insurance providers</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Providing Our Services</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Matching riders with drivers through our bidding system</li>
              <li>Processing ride requests and facilitating transportation</li>
              <li>Calculating fares, processing payments, and handling payouts</li>
              <li>Providing real-time ride tracking and navigation</li>
              <li>Enabling communication between riders and drivers</li>
              <li>Maintaining and improving platform functionality</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Safety and Security</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Conducting background checks and verifying driver qualifications</li>
              <li>Monitoring trips for safety and security purposes</li>
              <li>Investigating incidents, accidents, or disputes</li>
              <li>Preventing fraud, abuse, and unauthorized access</li>
              <li>Complying with legal requirements and law enforcement requests</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 Improving Our Platform</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Analyzing usage patterns to enhance user experience</li>
              <li>Developing new features and services</li>
              <li>Optimizing driver-rider matching algorithms</li>
              <li>Conducting research and analytics for business insights</li>
              <li>Personalizing your experience and recommendations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.4 Communications</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Sending service-related notifications and updates</li>
              <li>Providing customer support and assistance</li>
              <li>Sharing promotional offers and marketing communications (with your consent)</li>
              <li>Sending important safety and policy updates</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. How We Share Your Information</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Between Riders and Drivers</h3>
            <p className="text-gray-700 mb-4">
              To facilitate rides, we share limited information between riders and drivers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Driver information shared with riders: First name, photo, vehicle details, location, rating</li>
              <li>Rider information shared with drivers: First name, pickup location, destination, rating</li>
              <li>Contact information is masked through our platform for privacy</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Service Providers</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Payment Processors:</strong> Stripe, Square for secure payment processing</li>
              <li><strong>Background Check Services:</strong> Checkr and other verified providers</li>
              <li><strong>Cloud Services:</strong> Firebase, Google Cloud for data storage and processing</li>
              <li><strong>Analytics Providers:</strong> To understand platform usage and improve services</li>
              <li><strong>Customer Support:</strong> Tools to provide efficient customer service</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Business Partners</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Taxi companies and fleet operators (with your consent)</li>
              <li>Insurance providers for coverage verification and claims</li>
              <li>Vehicle maintenance and inspection services</li>
              <li>Emergency services when required for safety</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.4 Legal Requirements</h3>
            <p className="text-gray-700">
              We may share your information when required by law, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Responding to legal processes, court orders, or government requests</li>
              <li>Cooperating with law enforcement investigations</li>
              <li>Protecting our rights, property, or safety, or that of our users</li>
              <li>Enforcing our Terms of Service and other agreements</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            
            <p className="text-gray-700 mb-4">
              We implement comprehensive security measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Encryption:</strong> Data encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li><strong>Access Controls:</strong> Strict employee access controls and regular security training</li>
              <li><strong>Secure Infrastructure:</strong> Industry-standard cloud security with Firebase and Google Cloud</li>
              <li><strong>Regular Audits:</strong> Third-party security assessments and vulnerability testing</li>
              <li><strong>Incident Response:</strong> Rapid response procedures for security incidents</li>
              <li><strong>Data Minimization:</strong> We collect only necessary information and delete data when no longer needed</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Privacy Rights</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Access and Control</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Access:</strong> View and update your account information anytime</li>
              <li><strong>Data Download:</strong> Request a copy of your personal data</li>
              <li><strong>Data Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Data Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Communication Preferences:</strong> Opt out of marketing communications</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Location Privacy</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Control location sharing through device settings</li>
              <li>Location data is only collected when using our services</li>
              <li>Historical location data is automatically deleted after 3 years</li>
              <li>Emergency location sharing can be disabled (not recommended for safety)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 California Privacy Rights (CCPA)</h3>
            <p className="text-gray-700 mb-4">
              California residents have additional rights under the California Consumer Privacy Act:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to know what personal information we collect and how it's used</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of the sale of personal information (we don't sell your data)</li>
              <li>Right to non-discrimination for exercising these rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.4 European Privacy Rights (GDPR)</h3>
            <p className="text-gray-700 mb-4">
              EU residents have rights under the General Data Protection Regulation:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right of access to your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
            
            <p className="text-gray-700 mb-4">
              We retain your information only as long as necessary:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Information:</strong> Until you delete your account, plus 30 days</li>
              <li><strong>Trip Data:</strong> 7 years for business and legal purposes</li>
              <li><strong>Location Data:</strong> 3 years for safety and service improvement</li>
              <li><strong>Payment Information:</strong> As required by payment processors and tax laws</li>
              <li><strong>Background Check Data:</strong> As required by law and regulation</li>
              <li><strong>Communication Records:</strong> 2 years for customer service purposes</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Children's Privacy</h2>
            
            <p className="text-gray-700">
              RydeAlong is not intended for use by children under 18. We do not knowingly collect 
              personal information from children under 18. If we become aware that a child under 
              18 has provided us with personal information, we will delete such information immediately.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. International Data Transfers</h2>
            
            <p className="text-gray-700">
              Your information may be transferred to and processed in countries other than your own, 
              including the United States. We ensure appropriate safeguards are in place for international 
              transfers, including standard contractual clauses approved by regulatory authorities.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Changes to This Policy</h2>
            
            <p className="text-gray-700">
              We may update this Privacy Policy periodically. We will notify you of material changes 
              through the app, email, or website notice. Your continued use of our services after 
              changes become effective constitutes acceptance of the updated policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
            
            <p className="text-gray-700 mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or your 
              personal information, please contact us:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Privacy Officer</h4>
              <div className="space-y-1 text-gray-700">
                <p>RydeAlong, Inc.</p>
                <p>123 Innovation Drive</p>
                <p>San Francisco, CA 94105</p>
                <p>Email: <a href="mailto:privacy@rydealong.com" className="text-primary-600 hover:text-primary-700">privacy@rydealong.com</a></p>
                <p>Phone: +1 (555) 123-PRIVACY</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-8">
              <h4 className="text-lg font-medium text-yellow-900 mb-2">Questions or Concerns?</h4>
              <p className="text-yellow-800">
                We're committed to addressing your privacy concerns promptly. Our privacy team 
                typically responds to inquiries within 48 hours. For urgent privacy matters, 
                please call our privacy hotline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage; 