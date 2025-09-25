import React, { useState } from 'react';
import { registerUser, forceRegisterUser, USER_TYPES } from '../../services/authService';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

const RegistrationTest = () => {
  const [formData, setFormData] = useState({
    firstName: 'Gabe',
    lastName: 'Ruiz',
    email: 'worksidedemo+gruiz@gmail.com',
    phone: '6613451154',
    password: 'Pinnacle555',
    userType: 'driver',
    city: 'bakersfield',
    emergencyContactName: 'Test Contact',
    emergencyContactPhone: '555-1234',
    emergencyContactRelationship: 'Friend',
    emergencyContactEmail: 'test@example.com'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const testRegistration = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing registration with data:', formData);
      
      // First try normal registration
      let result = await registerUser(formData);
      
      // If normal registration fails with email-already-in-use, try force registration
      if (!result.success && result.error?.code === 'auth/email-already-in-use') {
        console.log('🔄 Normal registration failed with email-already-in-use, trying force registration...');
        result = await forceRegisterUser(formData);
      }
      
      if (result.success) {
        console.log('✅ Registration successful:', result);
        setResult({
          success: true,
          message: 'Registration successful!',
          data: result
        });
        toast.success('Registration successful!');
      } else {
        console.error('❌ Registration failed:', result);
        setResult({
          success: false,
          message: result.error.message,
          error: result.error
        });
        toast.error(`Registration failed: ${result.error.message}`);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      setResult({
        success: false,
        message: error.message,
        error: error
      });
      toast.error(`Registration error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🧪 Registration Test</h3>
      
      <div className="space-y-4">
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <Input
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <Input
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <Input
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="City"
            />
          </div>
        </div>

        {/* Emergency Contact Fields */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name
              </label>
              <Input
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleInputChange}
                placeholder="Emergency Contact Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Phone
              </label>
              <Input
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                placeholder="Emergency Contact Phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <Input
                name="emergencyContactRelationship"
                value={formData.emergencyContactRelationship}
                onChange={handleInputChange}
                placeholder="Relationship"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <Input
                name="emergencyContactEmail"
                type="email"
                value={formData.emergencyContactEmail}
                onChange={handleInputChange}
                placeholder="Emergency Contact Email"
              />
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={testRegistration}
            loading={loading}
            disabled={loading}
            size="large"
          >
            {loading ? 'Testing Registration...' : 'Test Registration'}
          </Button>
          <Button
            onClick={async () => {
              setLoading(true);
              setResult(null);
              try {
                console.log('🚀 Testing force registration with data:', formData);
                const result = await forceRegisterUser(formData);
                if (result.success) {
                  setResult({
                    success: true,
                    message: 'Force registration successful!',
                    data: result
                  });
                  toast.success('Force registration successful!');
                } else {
                  setResult({
                    success: false,
                    message: result.error.message,
                    error: result.error
                  });
                  toast.error(`Force registration failed: ${result.error.message}`);
                }
              } catch (error) {
                setResult({
                  success: false,
                  message: error.message,
                  error: error
                });
                toast.error(`Force registration error: ${error.message}`);
              } finally {
                setLoading(false);
              }
            }}
            loading={loading}
            disabled={loading}
            size="large"
            variant="secondary"
          >
            {loading ? 'Force Registering...' : 'Force Registration'}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              result.success ? 'text-green-900' : 'text-red-900'
            }`}>
              {result.success ? '✅ Success' : '❌ Failed'}
            </h4>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            {result.error && (
              <div className="mt-2 text-xs text-red-600">
                <p><strong>Error Code:</strong> {result.error.code}</p>
                <p><strong>Error Message:</strong> {result.error.message}</p>
              </div>
            )}
            {result.data && (
              <div className="mt-2 text-xs text-green-600">
                <pre>{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Test Instructions</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p>1. <strong>Click "Test Registration"</strong> to test the registration process</p>
            <p>2. <strong>Check the console</strong> for detailed logs</p>
            <p>3. <strong>Look for email verification</strong> in your inbox</p>
            <p>4. <strong>Check spam folder</strong> if no email is received</p>
            <p>5. <strong>Try logging in</strong> after successful registration</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationTest;
