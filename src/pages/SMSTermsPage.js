import React from 'react';
import { useNavigate } from 'react-router-dom';

const SMSTermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AnyRyde SMS Terms and Conditions
          </h1>
          <p className="text-gray-600">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-gray-700">
          {/* Introduction */}
          <section>
            <p className="text-lg leading-relaxed">
              Text messaging is a communication method that AnyRyde may utilize to reach out to our riders and drivers.
            </p>
          </section>

          {/* Guiding Principles */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Guiding Principles
            </h2>
            <p className="leading-relaxed">
              AnyRyde will preserve texting as a channel for important ride-related communications as outlined in the Categories of Messages section below. 
              AnyRyde will keep texts to a minimum to ensure that customers remain engaged with the texting program and do not opt-out because of overuse.
            </p>
          </section>

          {/* Categories of Messages */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Categories of Messages
            </h2>
            <p className="leading-relaxed mb-4">
              Texting is reserved for information that is considered time-sensitive. Messages will only be permitted for the following categories:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Ride Status Updates:</strong> Driver acceptance, arrival, ride start, and completion notifications
              </li>
              <li>
                <strong>Safety & Emergency:</strong> Emergency alerts, safety notifications, and critical system messages
              </li>
              <li>
                <strong>Scheduled Ride Reminders:</strong> 24-hour and 1-hour reminders for scheduled rides
              </li>
              <li>
                <strong>Account Updates:</strong> Driver application approval status and important account changes
              </li>
              <li>
                <strong>Driver Notifications:</strong> New ride requests and bid updates (drivers only, if opted-in)
              </li>
            </ul>
            <p className="mt-4 leading-relaxed">
              Text messages will <strong>not</strong> be used for personal matters, promotional content (unless explicitly opted-in), 
              or non-essential communications.
            </p>
          </section>

          {/* Message Frequency */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Message Frequency
            </h2>
            <p className="leading-relaxed">
              Message frequency varies based on your usage of the AnyRyde platform. Riders may receive messages related to their active and upcoming rides. 
              Drivers may receive notifications for ride requests if they have opted-in to SMS ride alerts. Emergency notifications may be sent at any time for safety purposes.
            </p>
          </section>

          {/* Opt-In/Opt-Out */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Opt-In and Opt-Out Features
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Opt-In</h3>
                <p className="leading-relaxed">
                  You can opt-in to receive SMS messages by:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Enabling SMS notifications during the registration or onboarding process</li>
                  <li>Enabling SMS in your notification settings at any time</li>
                  <li>Providing your mobile number and agreeing to the SMS opt-in terms</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Opt-Out</h3>
                <p className="leading-relaxed">
                  You may opt-out of receiving SMS texts from AnyRyde at any time by:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Texting the word <strong>STOP</strong> to any message you receive from AnyRyde</li>
                  <li>Disabling SMS notifications in your account settings</li>
                  <li>Contacting AnyRyde support at support@anyryde.com</li>
                </ul>
                <p className="mt-2 leading-relaxed">
                  After opting out, you will receive a confirmation message. Please note that opting out of SMS messages 
                  may impact your ability to receive time-sensitive ride updates.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>Important:</strong> Emergency and safety-related SMS notifications cannot be disabled and will 
                  continue to be sent regardless of your SMS preferences.
                </p>
              </div>
            </div>
          </section>

          {/* Help */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Help and Support
            </h2>
            <p className="leading-relaxed">
              For help with SMS messages, text <strong>HELP</strong> to any message you receive, or contact us at:
            </p>
            <ul className="list-none space-y-1 ml-4 mt-2">
              <li>📧 Email: <a href="mailto:support@anyryde.com" className="text-green-600 hover:text-green-700 underline">support@anyryde.com</a></li>
              <li>📞 Phone: 1-888-ANY-RYDE (1-888-269-7933)</li>
              <li>🌐 Website: <a href="https://anyryde.com" className="text-green-600 hover:text-green-700 underline">www.anyryde.com</a></li>
            </ul>
          </section>

          {/* Message & Data Rates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Message and Data Rates
            </h2>
            <p className="leading-relaxed">
              Standard message and data rates may apply based on your mobile carrier's plan. AnyRyde is not responsible 
              for any charges you may incur from your carrier for receiving SMS messages. Please check with your mobile 
              carrier for details about your plan.
            </p>
          </section>

          {/* Supported Carriers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Supported Carriers
            </h2>
            <p className="leading-relaxed">
              AnyRyde SMS notifications are available on most major US carriers including AT&T, T-Mobile, Verizon, Sprint, 
              and others. If you experience issues receiving messages, please contact your carrier or AnyRyde support.
            </p>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Privacy and Data Security
            </h2>
            <p className="leading-relaxed">
              Your mobile phone number and personal information are protected under our{' '}
              <a href="/privacy" className="text-green-600 hover:text-green-700 underline">Privacy Policy</a>. 
              We will never share your phone number with third parties for marketing purposes. SMS messages may contain 
              ride details and location information necessary for providing our service.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Changes to These Terms
            </h2>
            <p className="leading-relaxed">
              AnyRyde reserves the right to modify these SMS Terms and Conditions at any time. We will notify users of 
              material changes through the app or via email. Your continued use of SMS notifications after changes are 
              made constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Questions or Concerns?
            </h2>
            <p className="leading-relaxed mb-4">
              For any questions or concerns regarding this policy or our SMS text messages, please contact us at:
            </p>
            <div className="space-y-2">
              <p>📧 Email: <a href="mailto:privacy@anyryde.com" className="text-green-600 hover:text-green-700 underline font-medium">privacy@anyryde.com</a></p>
              <p>📞 Phone: 1-888-ANY-RYDE (1-888-269-7933)</p>
              <p>🏢 Address: AnyRyde Technologies, Inc.</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} AnyRyde Technologies, Inc. All rights reserved.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSTermsPage;

