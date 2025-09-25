import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { forceDeleteUser, checkUserExistsInAuth } from '../../services/authService';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

const UserCleanupDebugger = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('worksidedemo+gruiz@gmail.com');
  const [password, setPassword] = useState('Pinnacle555');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const addResult = (action, success, message, details = null) => {
    const result = {
      action,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    setResults(prev => [...prev, result]);
  };

  const checkUserExists = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Checking if user exists:', email);
      const result = await checkUserExistsInAuth(email);
      
      if (result.exists) {
        addResult('Check User Exists', true, 'User exists in Firebase Auth', result);
        toast.success('User exists in Firebase Auth');
      } else {
        addResult('Check User Exists', true, 'User does not exist in Firebase Auth', result);
        toast.success('User does not exist in Firebase Auth');
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      addResult('Check User Exists', false, error.message, error);
      toast.error('Error checking user existence');
    } finally {
      setLoading(false);
    }
  };

  const forceDelete = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('🗑️ Force deleting user:', email);
      const result = await forceDeleteUser(email, password);
      
      if (result.success) {
        addResult('Force Delete User', true, result.message, result);
        toast.success('User deleted successfully');
      } else {
        addResult('Force Delete User', false, result.error.message, result.error);
        toast.error(`Failed to delete user: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Error force deleting user:', error);
      addResult('Force Delete User', false, error.message, error);
      toast.error('Error force deleting user');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🗑️ User Cleanup Debugger</h3>
      
      <div className="space-y-4">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={checkUserExists}
            loading={loading}
            disabled={loading || !email}
            size="small"
          >
            Check User Exists
          </Button>
          
          <Button
            onClick={forceDelete}
            loading={loading}
            disabled={loading || !email || !password}
            variant="outline"
            size="small"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Force Delete User
          </Button>
          
          <Button
            onClick={clearResults}
            variant="outline"
            size="small"
            disabled={loading}
          >
            Clear Results
          </Button>
        </div>

        {/* Current User Info */}
        {user && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Current Logged In User</h4>
            <div className="text-sm text-blue-800">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Results</h4>
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`font-medium ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success ? '✅' : '❌'} {result.action}
                  </h5>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className={`text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
                
                {result.details && (
                  <div className="mt-2 text-xs text-gray-600">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-900 mb-2">Instructions</h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>1. <strong>Check User Exists</strong> - Verify if the user exists in Firebase Auth</p>
            <p>2. <strong>Force Delete User</strong> - Delete the user from Firebase Auth (requires password)</p>
            <p>3. <strong>Wait 1-2 minutes</strong> - Firebase needs time to propagate the deletion</p>
            <p>4. <strong>Try Registration Again</strong> - Attempt to register the user again</p>
            <p>5. <strong>Check Console</strong> - Look for detailed error messages</p>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="font-medium text-red-900 mb-2">⚠️ Warning</h4>
          <div className="text-sm text-red-800">
            <p>Force deleting a user will permanently remove them from Firebase Authentication. This action cannot be undone. Make sure you have the correct email and password before proceeding.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCleanupDebugger;
