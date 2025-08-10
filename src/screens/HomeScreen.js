import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, DirectionsCar, Flight, Settings, Person, Close, Menu, Logout, CheckCircle, Dashboard } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';
import carbonLensLogo from '../images/carbonlens_logo.png';

const HomeScreen = () => {
  const { userData, logout, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading time for better UX
    const loadData = async () => {
      setPageLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setPageLoading(false);
    };

    if (!loading) {
      loadData();
    }
  }, [loading]);

  const handleLogout = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to sign out?\n\n' +
      'You will be logged out of your account and redirected to the login page.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const menuItems = [
    {
      name: 'Dashboard',
      icon: Dashboard,
      path: '/',
      active: true
    },
    {
      name: 'Employee Check-in',
      icon: CheckCircle,
      path: '/employee-commuting'
    },
    {
      name: 'Business Travel',
      icon: Flight,
      path: '/business-travel'
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
                             <div className="h-10 w-10 mr-3 shadow-lg bg-white rounded-xl flex items-center justify-center">
                 <img src={carbonLensLogo} alt="CarbonLens Logo" className="h-8 w-8" />
               </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">CarbonLens</h1>
                <p className="text-xs text-slate-500">Sustainability Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-slate-100 px-4 py-2 rounded-lg">
                <Person className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {userData?.employeeId || 'Employee'}
                </span>
              </div>
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {isMenuOpen ? <Close className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
                         {/* Sidebar Header */}
             <div className="flex items-center justify-between p-6 border-b border-slate-200">
               <div className="flex items-center">
                 <span className="text-lg font-bold text-slate-900">Navigation</span>
               </div>
             </div>

            {/* Navigation Menu */}
            <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
              <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`group flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-200 ${
                        item.active
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className={`p-2 rounded-lg mr-4 ${
                        item.active 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
                          : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-semibold">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* Logout Section */}
            <div className="flex-shrink-0 flex border-t border-slate-200 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all duration-200"
              >
                <div className="p-2 bg-slate-100 rounded-lg mr-4">
                  <Logout className="h-5 w-5" />
                </div>
                <span className="font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {pageLoading ? (
              <>
                {/* Welcome Section Skeleton */}
                <div className="mb-10">
                  <div className="h-8 bg-slate-200 rounded w-64 mb-3 animate-pulse"></div>
                  <div className="h-5 bg-slate-200 rounded w-96 animate-pulse"></div>
                </div>



                {/* Quick Actions Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                      <div className="animate-pulse">
                        <div className="h-6 bg-slate-200 rounded w-32 mb-3"></div>
                        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Welcome Section */}
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-3">
                    Welcome back, {userData?.employeeId || 'Employee'}!
                  </h2>
                  <p className="text-slate-600 text-lg">
                    Monitor and manage your carbon footprint with our comprehensive sustainability platform
                  </p>
                </div>



            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Link
                to="/employee-commuting"
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-all duration-200 hover:border-blue-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Employee Check-in</h3>
                    <p className="text-slate-600 mb-4">Record your daily commute and transportation method</p>
                    <div className="flex items-center text-blue-600 font-medium">
                      <span>Check in now</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Link>

              <Link
                to="/business-travel"
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:shadow-lg transition-all duration-200 hover:border-purple-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">Business Travel</h3>
                    <p className="text-slate-600 mb-4">Track business trips and travel emissions</p>
                    <div className="flex items-center text-purple-600 font-medium">
                      <span>View records</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                    <Flight className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Link>
            </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default HomeScreen; 