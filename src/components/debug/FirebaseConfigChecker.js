import React, { useState, useEffect } from 'react';
import { auth } from '../../services/firebase';

const FirebaseConfigChecker = () => {
  const [config, setConfig] = useState({});
  const [authState, setAuthState] = useState({});
  const [emailSettings, setEmailSettings] = useState({});

  useEffect(() => {
    // Check Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
    };
    setConfig(firebaseConfig);

    // Check auth state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthState({
        hasUser: !!user,
        userEmail: user?.email,
        userVerified: user?.emailVerified,
        userUid: user?.uid,
        providerData: user?.providerData
      });
    });

    // Check email settings (this would need to be done via Firebase Admin SDK in production)
    setEmailSettings({
      note: "Email settings can only be checked in Firebase Console > Authentication > Templates",
      consoleUrl: `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/templates`,
      requiredSettings: [
        "Email verification template must be enabled",
        "Sender email must be configured",
        "Action URL should be set to your domain",
        "No rate limiting should be active"
      ]
    });

    return () => unsubscribe();
  }, []);

  const getConfigStatus = () => {
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missing = required.filter(key => !config[key]);
    return {
      isValid: missing.length === 0,
      missing,
      hasAllRequired: required.every(key => config[key])
    };
  };

  const configStatus = getConfigStatus();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Firebase Configuration Checker</h3>
      
      <div className="space-y-4">
        {/* Configuration Status */}
        <div className={`p-4 rounded-lg ${
          configStatus.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h4 className={`font-medium mb-2 ${
            configStatus.isValid ? 'text-green-900' : 'text-red-900'
          }`}>
            Configuration Status: {configStatus.isValid ? '✅ Valid' : '❌ Invalid'}
          </h4>
          
          {!configStatus.isValid && (
            <div className="text-sm">
              <p className="text-red-800 mb-2">Missing configuration:</p>
              <ul className="list-disc list-inside text-red-700">
                {configStatus.missing.map(key => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Configuration Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Configuration Details</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>API Key:</strong> {config.apiKey ? 'Set' : 'Not set'}</p>
            <p><strong>Auth Domain:</strong> {config.authDomain || 'Not set'}</p>
            <p><strong>Project ID:</strong> {config.projectId || 'Not set'}</p>
            <p><strong>Storage Bucket:</strong> {config.storageBucket || 'Not set'}</p>
            <p><strong>Messaging Sender ID:</strong> {config.messagingSenderId || 'Not set'}</p>
            <p><strong>App ID:</strong> {config.appId || 'Not set'}</p>
          </div>
        </div>

        {/* Auth State */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Current Auth State</h4>
          <div className="text-sm text-blue-800">
            <p><strong>Has User:</strong> {authState.hasUser ? 'Yes' : 'No'}</p>
            {authState.hasUser && (
              <>
                <p><strong>Email:</strong> {authState.userEmail || 'Not set'}</p>
                <p><strong>Verified:</strong> {authState.userVerified ? 'Yes' : 'No'}</p>
                <p><strong>UID:</strong> {authState.userUid || 'Not set'}</p>
                <p><strong>Provider:</strong> {authState.providerData?.[0]?.providerId || 'Not set'}</p>
              </>
            )}
          </div>
        </div>

        {/* Email Settings Instructions */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Email Verification Settings</h4>
          <div className="text-sm text-yellow-800">
            <p className="mb-2">
              <strong>Firebase Console:</strong>{' '}
              <a 
                href={emailSettings.consoleUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-600 hover:text-yellow-700 underline"
              >
                Open Authentication Templates
              </a>
            </p>
            <p className="mb-2">Required settings:</p>
            <ul className="list-disc list-inside space-y-1">
              {emailSettings.requiredSettings?.map((setting, index) => (
                <li key={index}>{setting}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Troubleshooting Steps */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">Troubleshooting Steps</h4>
          <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
            <li>Check that all environment variables are set in your .env file</li>
            <li>Verify Firebase project is active and billing is enabled</li>
            <li>Check Firebase Console > Authentication > Templates > Email verification</li>
            <li>Ensure sender email is configured and verified</li>
            <li>Check that your domain is authorized in Firebase Console</li>
            <li>Look for error messages in browser console Network tab</li>
            <li>Try registering with a different email address</li>
            <li>Check spam/junk folder for verification emails</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FirebaseConfigChecker;
