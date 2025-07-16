import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: January 15, 2025
            </p>
          </div>

          <div className="prose max-w-none">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Welcome to RydeAlong</h3>
              <p className="text-blue-800">
                These Terms of Service govern your use of RydeAlong's platform and services. 
                By using our platform, you agree to these terms. Please read them carefully.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            
            <p className="text-gray-700 mb-4">
              By accessing, downloading, or using RydeAlong's platform, mobile applications, or services 
              (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, you may not use our Platform.
            </p>
            
            <p className="text-gray-700">
              These Terms constitute a legally binding agreement between you and RydeAlong, Inc. ("RydeAlong," 
              "we," "us," or "our"). We may update these Terms from time to time, and your continued 
              use of the Platform constitutes acceptance of any updates.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            
            <p className="text-gray-700 mb-4">
              RydeAlong operates a technology platform that connects riders who need transportation with 
              drivers who provide transportation services. Our platform features a unique competitive 
              bidding system where drivers can set their own prices for rides.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Platform Features</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Real-time ride matching between riders and drivers</li>
              <li>Competitive bidding system allowing drivers to set prices</li>
              <li>GPS tracking and navigation services</li>
              <li>In-app communication between riders and drivers</li>
              <li>Payment processing and payout services</li>
              <li>Rating and feedback systems</li>
              <li>Safety features and emergency assistance</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Important Notice</h3>
            <p className="text-gray-700">
              RydeAlong is a technology platform and does not provide transportation services directly. 
              Transportation services are provided by independent drivers or licensed transportation 
              companies. RydeAlong is not a transportation carrier and does not own or operate vehicles.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Eligibility and Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 General Eligibility</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You must be at least 18 years old to use our Platform</li>
              <li>You must provide accurate and complete information during registration</li>
              <li>You must maintain and update your account information</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You may not transfer your account to another person</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Driver-Specific Requirements</h3>
            <p className="text-gray-700 mb-4">
              To drive on the RydeAlong platform, you must additionally:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Hold a valid driver's license and meet local licensing requirements</li>
              <li>Provide proof of vehicle registration and insurance</li>
              <li>Pass a background check and maintain a clean driving record</li>
              <li>Complete driver onboarding and safety training</li>
              <li>Maintain vehicle safety and inspection requirements</li>
              <li>Comply with local transportation regulations and laws</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Platform Usage Rules</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Acceptable Use</h3>
            <p className="text-gray-700 mb-4">You agree to use the Platform only for its intended purposes and in compliance with all applicable laws. You may not:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use the Platform for any illegal, harmful, or fraudulent activities</li>
              <li>Violate any local, state, or federal laws or regulations</li>
              <li>Impersonate another person or create false accounts</li>
              <li>Interfere with or disrupt the Platform's operation</li>
              <li>Attempt to gain unauthorized access to the Platform or user accounts</li>
              <li>Use automated systems or bots to access the Platform</li>
              <li>Reverse engineer, modify, or create derivative works of the Platform</li>
              <li>Upload or transmit viruses, malware, or other malicious code</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Content and Communications</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You are responsible for all content you provide on the Platform</li>
              <li>You may not post offensive, threatening, or inappropriate content</li>
              <li>You may not share personal contact information outside our messaging system</li>
              <li>All communications must be related to transportation services</li>
              <li>We reserve the right to monitor and remove inappropriate content</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Ridesharing Services</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 For Riders</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Ride Requests:</strong> You may request rides through our Platform by providing pickup and destination locations</li>
              <li><strong>Driver Selection:</strong> You can choose from available driver bids based on price, rating, and other factors</li>
              <li><strong>Payment:</strong> You agree to pay the agreed-upon fare and any applicable fees, taxes, or tips</li>
              <li><strong>Behavior:</strong> You must treat drivers with respect and follow their reasonable vehicle rules</li>
              <li><strong>Safety:</strong> You are responsible for your own safety and the safety of any companions</li>
              <li><strong>Cancellations:</strong> Cancellation fees may apply as outlined in our fee schedule</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 For Drivers</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Service Provision:</strong> You agree to provide transportation services safely and professionally</li>
              <li><strong>Bidding:</strong> You may submit bids for ride requests at prices you determine</li>
              <li><strong>Vehicle Standards:</strong> You must maintain your vehicle in safe, clean, and operational condition</li>
              <li><strong>Insurance:</strong> You must maintain valid commercial or rideshare insurance coverage</li>
              <li><strong>Compliance:</strong> You must comply with all applicable transportation laws and regulations</li>
              <li><strong>Background Checks:</strong> You consent to periodic background checks and monitoring</li>
              <li><strong>Customer Service:</strong> You must provide courteous and professional service to riders</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Pricing and Payments</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 Competitive Bidding System</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Drivers set their own prices through competitive bidding</li>
              <li>Riders can see all available bids and choose their preferred option</li>
              <li>No surge pricing - prices are determined by market competition</li>
              <li>Final ride price is agreed upon before the trip begins</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 Fees and Commissions</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>RydeAlong charges drivers a commission of 10-20% of the ride fare</li>
              <li>Additional fees may apply for payment processing, instant payouts, or other services</li>
              <li>All fees are clearly disclosed before you complete a transaction</li>
              <li>We reserve the right to update our fee structure with notice</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3 Payment Processing</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Payments are processed through secure third-party payment processors</li>
              <li>You authorize us to charge your selected payment method</li>
              <li>Refunds and disputes are handled according to our refund policy</li>
              <li>Driver payouts are processed according to your selected schedule</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Safety and Insurance</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.1 Safety Measures</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>All drivers undergo background checks and vehicle inspections</li>
              <li>Real-time trip tracking and emergency assistance features</li>
              <li>Incident reporting and resolution procedures</li>
              <li>Driver and rider rating systems for accountability</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.2 Insurance Requirements</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Drivers must maintain valid auto insurance meeting local requirements</li>
              <li>Commercial or rideshare insurance may be required</li>
              <li>RydeAlong may provide additional coverage as required by law</li>
              <li>Insurance coverage details are available in our Driver Agreement</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Liability and Disclaimers</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.1 Platform Disclaimers</h3>
            <p className="text-gray-700 mb-4">
              THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. 
              TO THE FULLEST EXTENT PERMITTED BY LAW, RYDEIQ DISCLAIMS ALL WARRANTIES, EXPRESS OR 
              IMPLIED, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.2 Limitation of Liability</h3>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RYDEIQ SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION 
              DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.3 User Responsibility</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You use the Platform at your own risk</li>
              <li>You are responsible for verifying driver credentials and vehicle safety</li>
              <li>You must report any safety concerns or incidents immediately</li>
              <li>You acknowledge that transportation services involve inherent risks</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Intellectual Property</h2>
            
            <p className="text-gray-700 mb-4">
              The Platform and all content, features, and functionality are owned by RydeAlong and 
              protected by copyright, trademark, and other intellectual property laws. You may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Copy, modify, or distribute our software or content</li>
              <li>Use our trademarks or branding without permission</li>
              <li>Create derivative works based on our Platform</li>
              <li>Remove or alter any copyright or proprietary notices</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Privacy</h2>
            
            <p className="text-gray-700">
              Your privacy is important to us. Our collection, use, and sharing of your personal 
              information is governed by our Privacy Policy, which is incorporated into these 
              Terms by reference. By using the Platform, you consent to our privacy practices 
              as described in the Privacy Policy.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.1 Termination by You</h3>
            <p className="text-gray-700 mb-4">
              You may terminate your account at any time by contacting us or using the account 
              deletion feature in the app. Termination does not relieve you of any outstanding 
              payment obligations.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.2 Termination by RydeAlong</h3>
            <p className="text-gray-700 mb-4">
              We may suspend or terminate your account immediately if you:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Violate these Terms or our policies</li>
              <li>Engage in fraudulent or illegal activities</li>
              <li>Pose a safety risk to other users</li>
              <li>Fail background checks or other verification requirements</li>
              <li>Provide false or misleading information</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.1 Informal Resolution</h3>
            <p className="text-gray-700 mb-4">
              Before initiating formal legal proceedings, you agree to first attempt to resolve 
              any dispute through our customer support channels. We are committed to working 
              with you to resolve issues fairly and promptly.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.2 Binding Arbitration</h3>
            <p className="text-gray-700 mb-4">
              Any dispute arising out of or relating to these Terms or the Platform shall be 
              resolved through binding arbitration in accordance with the rules of the American 
              Arbitration Association. The arbitration shall take place in San Francisco, California.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.3 Class Action Waiver</h3>
            <p className="text-gray-700">
              You agree that any dispute resolution proceedings will be conducted only on an 
              individual basis and not in a class, consolidated, or representative action.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Governing Law</h2>
            
            <p className="text-gray-700">
              These Terms are governed by the laws of the State of California, without regard 
              to conflict of law principles. Any legal action related to these Terms must be 
              brought in the state or federal courts located in San Francisco, California.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Changes to Terms</h2>
            
            <p className="text-gray-700">
              We may modify these Terms at any time by posting updated terms on our Platform. 
              We will provide notice of material changes through the app, email, or website. 
              Your continued use of the Platform after changes become effective constitutes 
              acceptance of the updated Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. Severability</h2>
            
            <p className="text-gray-700">
              If any provision of these Terms is found to be unenforceable or invalid, the 
              remaining provisions will continue in full force and effect. The unenforceable 
              provision will be modified to the minimum extent necessary to make it enforceable.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">16. Entire Agreement</h2>
            
            <p className="text-gray-700">
              These Terms, together with our Privacy Policy and any other policies referenced 
              herein, constitute the entire agreement between you and RydeAlong regarding the Platform. 
              These Terms supersede all prior or contemporaneous communications and proposals.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">17. Contact Information</h2>
            
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Legal Department</h4>
              <div className="space-y-1 text-gray-700">
                <p>RydeAlong, Inc.</p>
                <p>123 Innovation Drive</p>
                <p>San Francisco, CA 94105</p>
                <p>Email: <a href="mailto:legal@rydealong.com" className="text-primary-600 hover:text-primary-700">legal@rydealong.com</a></p>
                <p>Phone: +1 (555) 123-LEGAL</p>
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-6 mt-8">
              <h4 className="text-lg font-medium text-red-900 mb-2">Important Legal Notice</h4>
              <p className="text-red-800">
                By using RydeAlong's platform, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms of Service. If you do not agree to these 
                terms, you must discontinue use of our platform immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage; 