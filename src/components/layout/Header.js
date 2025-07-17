/* eslint-disable */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/authService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Header = () => {
  const { user, isAuthenticated, setUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logoutUser();
      if (result.success) {
        setUser(null);
        toast.success('Logged out successfully');
        navigate('/');
      } else {
        toast.error('Failed to logout');
      }
    } catch (error) {
      toast.error('An error occurred during logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AnyRyde</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/compare"
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              Compare Rides
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              Contact
            </Link>
            <Link
              to="/driver-onboarding"
              className="text-gray-700 hover:text-primary-600 transition-colors duration-200 font-medium"
            >
              Drive with Us
            </Link>
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.displayName || user?.email}
                  </span>
                  {user?.photoURL && (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="small"
                  loading={isLoggingOut}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  size="small"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  variant="primary"
                  size="small"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/"
                className="px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                onClick={toggleMenu}
              >
                Home
              </Link>
              <Link
                to="/compare"
                className="px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                onClick={toggleMenu}
              >
                Compare Rides
              </Link>
              <Link
                to="/about"
                className="px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                onClick={toggleMenu}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md"
                onClick={toggleMenu}
              >
                Contact
              </Link>
              <Link
                to="/driver-onboarding"
                className="px-3 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md font-medium"
                onClick={toggleMenu}
              >
                Drive with Us
              </Link>
              {isAuthenticated && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Welcome, {user?.displayName || user?.email}
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 