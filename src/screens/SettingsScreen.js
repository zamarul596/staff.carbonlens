import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Person, 
  ArrowBack, 
  Email, 
  Business, 
  LocationOn, 
  Lock,
  Save,
  Settings as SettingsIcon,
  Notifications,
  Security,
  Download
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import LocationUpdater from '../components/LocationUpdater';
import FirebaseService from '../services/firebaseService';
import SkeletonLoader from '../components/SkeletonLoader';

const SettingsScreen = () => {
  const { userData, refreshUserData, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationUpdater, setShowLocationUpdater] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: userData?.email || '',
      employeeId: userData?.employeeId || '',
      companyId: userData?.companyId || '',
    }
  });

  // Handle page loading
  useEffect(() => {
    if (!loading) {
      // Simulate loading time for better UX
      setTimeout(() => {
        setPageLoading(false);
      }, 800);
    }
  }, [loading]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Update user profile data in Firebase (excluding companyId as it's read-only)
      await FirebaseService.updateUserProfile({
        email: data.email,
        employeeId: data.employeeId,
        // companyId is excluded as it's managed by the organization
      });
      
      // Refresh user data to show updated information
      await refreshUserData();
      
      toast.success('Profile information updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationUpdate = async (locationData) => {
    // Update the user data with new location information
    console.log('Location updated:', locationData);
    
    try {
      // Update the location data in Firebase first
      console.log('Calling FirebaseService.updateUserProfile with:', {
        homeLocation: locationData.homeLocation,
        officeLocation: locationData.officeLocation,
        distance: locationData.distance
      });
      
      await FirebaseService.updateUserProfile({
        homeLocation: locationData.homeLocation,
        officeLocation: locationData.officeLocation,
        distance: locationData.distance
      });
      
      console.log('Firebase update completed, refreshing user data...');
      
      // Then refresh user data to show updated location information
      await refreshUserData();
      console.log('User data refreshed successfully');
      toast.success('Location updated successfully!');
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location. Please try again.');
    }
    
    setShowLocationUpdater(false);
  };

  const settingsSections = [
    {
      title: 'Profile Settings',
      icon: Person,
      color: 'blue',
      items: [
        { name: 'Edit Profile', description: 'Update your personal information', href: '/edit-profile', icon: Person },
        { name: 'Change Password', description: 'Update your account password', href: '/change-password', icon: Lock },
        { name: 'Change Location', description: 'Update your location information', action: () => setShowLocationUpdater(true), icon: LocationOn }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
            <Link
              to="/"
                className="flex items-center text-slate-600 hover:text-slate-900 mr-6 transition-colors"
            >
              <ArrowBack className="w-5 h-5 mr-2" />
                <span className="font-medium">Back to Dashboard</span>
            </Link>
              <div className="flex items-center">
                <div className="h-8 w-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                  <SettingsIcon className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">Settings</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-slate-100 px-4 py-2 rounded-lg">
                <Person className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {userData?.employeeId || 'Employee'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pageLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information Skeleton */}
            <div className="lg:col-span-2">
              <SkeletonLoader type="profile" />
            </div>
            
            {/* Settings Menu Skeleton */}
            <div className="space-y-6">
              <SkeletonLoader type="card" />
              <SkeletonLoader type="card" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
              </div>
              <div className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Email className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address'
                            }
                          })}
                          type="email"
                          className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="Enter your email"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Employee ID
                      </label>
                      <div className="relative">
                        <Person className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('employeeId', { required: 'Employee ID is required' })}
                          type="text"
                          className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="Enter employee ID"
                        />
                      </div>
                      {errors.employeeId && (
                        <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Company ID
                      </label>
                      <div className="relative">
                        <Business className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('companyId')}
                          type="text"
                          disabled
                          className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed"
                          placeholder="Company ID (read-only)"
                          value={userData?.companyId || ''}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Company ID is managed by your organization
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Current Route
                      </label>
                      <div className="relative">
                        <LocationOn className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <div className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-600">
                          {userData?.homeLocation && userData?.officeLocation ? (
                            <div className="text-sm">
                              <div className="font-medium">Home: {userData.homeLocation}</div>
                              <div className="font-medium">Office: {userData.officeLocation}</div>
                              {userData?.distance && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Distance: {userData.distance} km
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">No route set up</span>
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Click "Change Location" in the settings menu to update your route
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Settings Menu */}
          <div className="space-y-6">
            {settingsSections.map((section) => (
              <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center">
                    <div className={`p-2 bg-gradient-to-br from-${section.color}-500 to-${section.color}-600 rounded-lg shadow-lg mr-3`}>
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                  <div className="space-y-3">
                      {section.items.map((item) => {
                        if (item.action) {
                          return (
                            <button
                              key={item.name}
                              onClick={item.action}
                              className="w-full flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                            >
                              <div className={`p-2 bg-slate-100 rounded-lg mr-3 group-hover:bg-${section.color}-100 transition-colors`}>
                                <item.icon className={`w-4 h-4 text-slate-600 group-hover:text-${section.color}-600`} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.description}</p>
                              </div>
                              <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          );
                        } else {
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              className="flex items-center p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                            >
                              <div className={`p-2 bg-slate-100 rounded-lg mr-3 group-hover:bg-${section.color}-100 transition-colors`}>
                                <item.icon className={`w-4 h-4 text-slate-600 group-hover:text-${section.color}-600`} />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.description}</p>
                              </div>
                              <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          );
                        }
                      })}
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
          )}
        </div>

      {/* Location Updater Modal */}
      {showLocationUpdater && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Update Location</h2>
                <button
                  onClick={() => setShowLocationUpdater(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <LocationUpdater
                onLocationUpdate={handleLocationUpdate}
                currentHomeLocation={userData?.homeLocation || ''}
                currentOfficeLocation={userData?.officeLocation || ''}
                onClose={() => setShowLocationUpdater(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen; 