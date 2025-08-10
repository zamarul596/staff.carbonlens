import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, User, Lock, Building, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LocationSelector from '../components/LocationSelector';

const CreateAccountScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [homeLocation, setHomeLocation] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [isSettingUpRoute, setIsSettingUpRoute] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const handleLocationSelect = (type, address) => {
    console.log('Location selected:', type, address);
    
    // Set flag to indicate user is setting up route
    setIsSettingUpRoute(true);
    
    if (type === 'home') {
      setHomeLocation(address);
      setValue('homeLocation', address, { shouldValidate: false });
    } else {
      setOfficeLocation(address);
      setValue('officeLocation', address, { shouldValidate: false });
    }
    
    // Clear the flag after 30 seconds if user doesn't complete route setup
    setTimeout(() => {
      console.log('Clearing isSettingUpRoute flag');
      setIsSettingUpRoute(false);
    }, 30000);
  };

  const handleDistanceCalculate = (data) => {
    console.log('Distance calculated:', data);
    
    // Only set route data when user explicitly calculates route
    // This prevents auto-account creation when just selecting locations
    setRouteData(data);
    setValue('distance', data.distance, { shouldValidate: false });
    setValue('homeLocation', data.homeAddress, { shouldValidate: false });
    setValue('officeLocation', data.officeAddress, { shouldValidate: false });
    
    // Clear the flag when route is calculated
    setIsSettingUpRoute(false);
  };

  const onSubmit = async (data) => {
    console.log('Form submission triggered', { isLoading, isSettingUpRoute, data });
    
    // Prevent submission if already loading or setting up route
    if (isLoading || isSettingUpRoute) {
      console.log('Form submission blocked - loading or setting up route');
      return;
    }

    // Validate all required fields
    const requiredFields = {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      employeeId: data.employeeId,
      companyId: data.companyId,
      homeLocation: data.homeLocation,
      officeLocation: data.officeLocation
    };

    // Check for empty fields
    const emptyFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value || value.trim() === '')
      .map(([key]) => key);

    if (emptyFields.length > 0) {
      const fieldNames = {
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        employeeId: 'Employee ID',
        companyId: 'Company ID',
        homeLocation: 'Home Location',
        officeLocation: 'Office Location'
      };
      
      const missingFields = emptyFields.map(field => fieldNames[field]).join(', ');
      toast.error(`Please fill in all required fields: ${missingFields}`);
      return;
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(data.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password length
    if (data.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Validate password match
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Prevent submission if no route data
    if (!routeData) {
      toast.error('Please set up your commute route before creating account');
      return;
    }

    // Validate route data
    if (!routeData.distance || routeData.distance <= 0) {
      toast.error('Please calculate a valid route distance');
      return;
    }

    // Validate location data
    if (!data.homeLocation || !data.officeLocation) {
      toast.error('Please set both home and office locations');
      return;
    }

    // Ensure distance is a valid number
    const distance = parseFloat(routeData.distance);
    if (isNaN(distance) || distance <= 0) {
      toast.error('Please calculate a valid route distance');
      return;
    }

    setIsLoading(true);
    
    try {
      await signUp(
        data.email,
        data.password,
        data.employeeId,
        data.companyId,
        data.homeLocation,
        data.officeLocation,
        distance
      );
      toast.success(`Account created successfully! Route saved: ${data.homeLocation} to ${data.officeLocation} (${distance.toFixed(2)} km)`);
      
      // Navigate to login page after successful account creation
      setTimeout(() => {
        navigate('/login');
      }, 1500); // Wait 1.5 seconds for user to see success message
    } catch (error) {
      toast.error(error.message || 'Account creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
          <p className="text-slate-600">Join CarbonLens to track your carbon footprint</p>
        </div>

        {/* Create Account Form */}
        <form 
          className="mt-8 space-y-8" 
          onSubmit={(e) => {
            console.log('Form onSubmit event triggered');
            if (isLoading || isSettingUpRoute) {
              console.log('Preventing form submission - loading or setting up route');
              e.preventDefault();
              return;
            }
            handleSubmit(onSubmit)(e);
          }}
          noValidate
        >
          {/* Personal Information Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
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

              {/* Employee ID Field */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-semibold text-slate-700 mb-2">
                  Employee ID
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    {...register('employeeId', {
                      required: 'Employee ID is required',
                    })}
                    type="text"
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your employee ID"
                  />
                </div>
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                )}
              </div>

              {/* Company ID Field */}
              <div>
                <label htmlFor="companyId" className="block text-sm font-semibold text-slate-700 mb-2">
                  Company ID
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    {...register('companyId', {
                      required: 'Company ID is required',
                    })}
                    type="text"
                    className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your company ID"
                  />
                </div>
                {errors.companyId && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyId.message}</p>
                )}
              </div>

              {/* Distance Field (Hidden) */}
              <input type="hidden" {...register('distance')} />
              <input type="hidden" {...register('homeLocation')} />
              <input type="hidden" {...register('officeLocation')} />
            </div>
          </div>

          {/* Location Selection Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Commute Route Setup</h3>
            <p className="text-slate-600 mb-6">
              Set up your daily commute route to automatically calculate distances for carbon footprint tracking.
            </p>
            
            {/* Route Status Indicator */}
            {routeData ? (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Route Setup Complete</h3>
                    <div className="mt-1 text-sm text-green-700">
                      <p>Distance: {routeData.distanceText} • Duration: {routeData.duration}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Route Setup Required</h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      <p>Please set up your commute route before creating your account</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <LocationSelector
              onLocationSelect={handleLocationSelect}
              onDistanceCalculate={handleDistanceCalculate}
              homeLocation={homeLocation}
              officeLocation={officeLocation}
              showDirections={true}
            />
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Account Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSettingUpRoute || !routeData || !homeLocation || !officeLocation}
            onClick={(e) => {
              // Prevent form submission if user is setting up route
              if (isSettingUpRoute) {
                e.preventDefault();
                toast.error('Please complete setting up your route before creating account');
                return;
              }
              // Prevent form submission if required data is missing
              if (!routeData) {
                e.preventDefault();
                toast.error('Please set up your commute route before creating account');
                return;
              }
              if (!homeLocation || !officeLocation) {
                e.preventDefault();
                toast.error('Please set both home and office locations');
                return;
              }
            }}
            className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating account...
              </div>
            ) : isSettingUpRoute ? (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Setting Up Route...
              </div>
            ) : !routeData ? (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Set Up Route First
              </div>
            ) : (
              <div className="flex items-center">
                Create Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </div>
            )}
          </button>

          {/* Back to Login Link */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountScreen; 