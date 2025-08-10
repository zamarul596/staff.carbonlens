import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  DirectionsCar, 
  DirectionsBus, 
  Train, 
  DirectionsBike, 
  DirectionsWalk,
  Delete,
  ArrowBack,
  CalendarToday,
  CheckCircle,
  ElectricCar,
  TwoWheeler,
  DirectionsSubway,
  DirectionsTransit,
  Schedule,
  Person,
  LocationOn,
  Timeline
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import SkeletonLoader from '../components/SkeletonLoader';
import FirebaseService from '../services/firebaseService';

const EmployeeCommutingPage = () => {
  const { userData, loading } = useAuth();
  const navigate = useNavigate();
  const [checkInRecords, setCheckInRecords] = useState([]);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [userRouteData, setUserRouteData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [lastUsedTransport, setLastUsedTransport] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(5);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const watchedTransportMethod = watch('transportMethod');

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      
      try {
        // Load employee commuting records from Firebase
        const commutingData = await FirebaseService.loadEmployeeCommutingRecords();
        setCheckInRecords(commutingData);
        calculateTotalEmissions(commutingData);

        // Load user's route data from profile
        if (userData?.homeLocation && userData?.officeLocation && userData?.distance) {
          setUserRouteData({
            homeAddress: userData.homeLocation,
            officeAddress: userData.officeLocation,
            distance: userData.distance
          });
          setValue('distance', userData.distance);
        }

        // Get last used transportation method
        if (commutingData.length > 0) {
          // Sort by date and time to get the truly most recent record
          const sortedRecords = commutingData.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.checkInTime}`);
            const dateB = new Date(`${b.date} ${b.checkInTime}`);
            return dateB - dateA; // Newest first
          });
          
          const lastRecord = sortedRecords[0];
          console.log('Setting lastUsedTransport from loaded data:', {
            transportMethod: lastRecord.transportMethod,
            transportType: lastRecord.transportType,
            date: lastRecord.date,
            time: lastRecord.checkInTime
          });
          
          setLastUsedTransport({
            transportMethod: lastRecord.transportMethod,
            transportType: lastRecord.transportType
          });
        }
        
      } catch (error) {
        console.error('Error loading employee commuting data:', error);
        toast.error('Failed to load commuting records');
      }
      
      setPageLoading(false);
    };

    if (!loading) {
      loadData();
    }
  }, [userData, setValue, loading]);

  // Debug: Monitor lastUsedTransport changes
  useEffect(() => {
    console.log('lastUsedTransport changed to:', lastUsedTransport);
  }, [lastUsedTransport]);

  const calculateTotalEmissions = (records) => {
    const total = records.reduce((sum, record) => sum + record.emissions, 0);
    setTotalEmissions(total);
  };

  const transportMethods = [
    { 
      value: 'car', 
      label: 'Car', 
      icon: DirectionsCar,
      hasTypes: true,
      types: [
        { value: 'petrol', label: 'Petrol', emissionFactor: 0.171 }, // DEFRA 2024
        { value: 'diesel', label: 'Diesel', emissionFactor: 0.160 }, // DEFRA 2024
        { value: 'ev', label: 'Electric Vehicle (EV)', emissionFactor: 0.054 }, // DEFRA 2024
        { value: 'hybrid', label: 'Hybrid', emissionFactor: 0.120 } // DEFRA 2024
      ]
    },
    { 
      value: 'motorcycle', 
      label: 'Motorcycle', 
      icon: TwoWheeler,
      hasTypes: true,
      types: [
        { value: 'petrol', label: 'Petrol', emissionFactor: 0.103 }, // DEFRA 2024
        { value: 'diesel', label: 'Diesel', emissionFactor: 0.103 }, // DEFRA 2024
        { value: 'ev', label: 'Electric Motorcycle', emissionFactor: 0.054 } // DEFRA 2024
      ]
    },
    { 
      value: 'bus', 
      label: 'Bus', 
      icon: DirectionsBus,
      hasTypes: false,
      emissionFactor: 0.104 // Local bus (DEFRA 2024)
    },
    { 
      value: 'lrt', 
      label: 'LRT/Tram', 
      icon: DirectionsSubway,
      hasTypes: false,
      emissionFactor: 0.041 // Light rail/tram (DEFRA 2024)
    },
    { 
      value: 'train', 
      label: 'Train', 
      icon: Train,
      hasTypes: false,
      emissionFactor: 0.041 // National rail (DEFRA 2024)
    },
    { 
      value: 'bicycle', 
      label: 'Bicycle', 
      icon: DirectionsBike,
      hasTypes: false,
      emissionFactor: 0 // Zero emissions
    },
    { 
      value: 'walk', 
      label: 'Walk', 
      icon: DirectionsWalk,
      hasTypes: false,
      emissionFactor: 0 // Zero emissions
    },
    { 
      value: 'coach', 
      label: 'Coach', 
      icon: DirectionsBus,
      hasTypes: false,
      emissionFactor: 0.027 // Coach (DEFRA 2024)
    },
    { 
      value: 'other', 
      label: 'Other', 
      icon: DirectionsCar,
      hasTypes: false,
      emissionFactor: 0.104 // Default to bus emission factor
    }
  ];

  const onSubmit = async (data) => {
    try {
      const selectedMethod = transportMethods.find(method => method.value === data.transportMethod);
      let emissionFactor = 0;
      
      if (selectedMethod?.hasTypes) {
        const selectedType = selectedMethod.types.find(type => type.value === data.transportType);
        emissionFactor = selectedType?.emissionFactor || 0;
      } else {
        emissionFactor = selectedMethod?.emissionFactor || 0;
      }
      
      // Calculate emissions for round-trip (check-in and check-out)
      // Formula: Emissions (kg CO₂e) = Distance (km) × Emission factor (kg CO₂e/km) × 2 (round-trip)
      const roundTripDistance = data.distance * 2; // Multiply by 2 for round-trip
      const emissions = (roundTripDistance * emissionFactor).toFixed(2);
      
      const newRecord = {
        id: Date.now(),
        date: data.date,
        transportMethod: data.transportMethod,
        transportType: data.transportType || null,
        distance: parseFloat(data.distance),
        roundTripDistance: roundTripDistance, // Store round-trip distance
        emissions: parseFloat(emissions),
        checkInTime: data.checkInTime,
        employeeId: userData?.employeeId || 'EMP001'
      };

      // Save to Firebase
      await FirebaseService.saveEmployeeCommutingRecord(newRecord);

      const updatedRecords = [...checkInRecords, newRecord];
      setCheckInRecords(updatedRecords);
      calculateTotalEmissions(updatedRecords);
      
      // Update last used transportation method
      const newLastUsedTransport = {
        transportMethod: newRecord.transportMethod,
        transportType: newRecord.transportType
      };
      console.log('Updating lastUsedTransport to:', newLastUsedTransport);
      setLastUsedTransport(newLastUsedTransport);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
      
      setShowCheckInForm(false);
      reset();
      toast.success('Commute recorded successfully! Round-trip emissions calculated.');
    } catch (error) {
      console.error('Error saving commute record:', error);
      toast.error('Failed to save commute record');
    }
  };

  const deleteRecord = async (id) => {
    try {
      // Delete from Firebase
      await FirebaseService.deleteEmployeeCommutingRecord(id);
      
      const updatedRecords = checkInRecords.filter(record => record.id !== id);
      setCheckInRecords(updatedRecords);
      calculateTotalEmissions(updatedRecords);
      
      // Update last used transportation method based on remaining records
      if (updatedRecords.length > 0) {
        // Sort by date and time to get the truly most recent record
        const sortedRecords = updatedRecords.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.checkInTime}`);
          const dateB = new Date(`${b.date} ${b.checkInTime}`);
          return dateB - dateA; // Newest first
        });
        
        const lastRecord = sortedRecords[0];
        console.log('Delete: Setting lastUsedTransport to:', {
          transportMethod: lastRecord.transportMethod,
          transportType: lastRecord.transportType,
          date: lastRecord.date,
          time: lastRecord.checkInTime
        });
        
        setLastUsedTransport({
          transportMethod: lastRecord.transportMethod,
          transportType: lastRecord.transportType
        });
      } else {
        // No records left, clear last used transport
        console.log('Delete: No records left, clearing lastUsedTransport');
        setLastUsedTransport(null);
      }
      
      // Reset to first page if current page is now empty
      const newTotalPages = Math.ceil(updatedRecords.length / recordsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1);
      }
      
      toast.success('Record deleted successfully!');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const quickCheckIn = async () => {
    if (!lastUsedTransport || !userRouteData?.distance) {
      toast.error('No previous transportation method found or route not set up');
      return;
    }

    // Confirm quick check-in
    const transportLabel = getTransportLabel(lastUsedTransport.transportMethod, lastUsedTransport.transportType);
    const confirmed = window.confirm(
      `Quick check-in using ${transportLabel}?\n\n` +
      `Date: ${getCurrentDate()}\n` +
      `Time: ${getCurrentTime()}\n` +
      `Distance: ${userRouteData.distance} km (round-trip: ${userRouteData.distance * 2} km)\n\n` +
      `Click OK to confirm or Cancel to use the form instead.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const selectedMethod = transportMethods.find(method => method.value === lastUsedTransport.transportMethod);
      let emissionFactor = 0;
      
      if (selectedMethod?.hasTypes) {
        const selectedType = selectedMethod.types.find(type => type.value === lastUsedTransport.transportType);
        emissionFactor = selectedType?.emissionFactor || 0;
      } else {
        emissionFactor = selectedMethod?.emissionFactor || 0;
      }
      
      // Calculate emissions for round-trip
      const roundTripDistance = userRouteData.distance * 2;
      const emissions = (roundTripDistance * emissionFactor).toFixed(2);
      
      const newRecord = {
        id: Date.now(),
        date: getCurrentDate(),
        transportMethod: lastUsedTransport.transportMethod,
        transportType: lastUsedTransport.transportType,
        distance: parseFloat(userRouteData.distance),
        roundTripDistance: roundTripDistance,
        emissions: parseFloat(emissions),
        checkInTime: getCurrentTime(),
        employeeId: userData?.employeeId || 'EMP001'
      };

      // Save to Firebase
      await FirebaseService.saveEmployeeCommutingRecord(newRecord);

      const updatedRecords = [...checkInRecords, newRecord];
      setCheckInRecords(updatedRecords);
      calculateTotalEmissions(updatedRecords);
      
      // Update last used transportation method
      const newLastUsedTransport = {
        transportMethod: newRecord.transportMethod,
        transportType: newRecord.transportType
      };
      console.log('Quick check-in: Updating lastUsedTransport to:', newLastUsedTransport);
      setLastUsedTransport(newLastUsedTransport);
      
      // Reset to first page to show the new record
      setCurrentPage(1);
      
      toast.success(`Quick check-in recorded using ${transportLabel}!`);
    } catch (error) {
      console.error('Error saving quick check-in:', error);
      toast.error('Failed to save quick check-in');
    }
  };

  const getTransportIcon = (method) => {
    const transportMethod = transportMethods.find(m => m.value === method);
    const Icon = transportMethod?.icon || DirectionsCar;
    return <Icon className="w-5 h-5" />;
  };

  const getTransportLabel = (method, type) => {
    const transportMethod = transportMethods.find(m => m.value === method);
    if (transportMethod?.hasTypes && type) {
      const typeData = transportMethod.types.find(t => t.value === type);
      return `${transportMethod.label} - ${typeData?.label || 'Unknown'}`;
    }
    return transportMethod?.label || 'Unknown';
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    return new Date().toTimeString().slice(0, 5);
  };

  const handleChangeRoute = () => {
    navigate('/settings');
  };

  // Pagination functions
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = checkInRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(checkInRecords.length / recordsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show first 3 pages, current page, and last 2 pages
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-gray-900 mr-6 transition-colors"
              >
                <ArrowBack className="w-5 h-5 mr-2" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Employee Commuting</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 bg-gray-100 px-4 py-2 rounded-lg">
                <Person className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {userData?.employeeId || 'Employee'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pageLoading ? (
          <>
            {/* Summary Card Skeleton */}
            <SkeletonLoader type="summary" className="mb-8" />
            
            {/* Route Info Skeleton */}
            <SkeletonLoader type="route-info" className="mb-8" />
            
            {/* Check-in Button Skeleton */}
            <div className="mb-8">
              <div className="h-12 bg-slate-200 rounded-xl w-48 animate-pulse"></div>
            </div>
            
            {/* Records Table Skeleton */}
            <SkeletonLoader type="table" />
          </>
        ) : (
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Daily Commute Check-in</h2>
                <p className="text-gray-600">Record your daily commute to work</p>
              </div>
            </div>

        {/* Route Information Card */}
        {userRouteData ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-600 rounded-lg mr-3">
                  <Timeline className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Your Commute Route</h3>
              </div>
              <button
                onClick={handleChangeRoute}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <LocationOn className="w-4 h-4 mr-2" />
                Change Route
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <LocationOn className="w-4 h-4 text-red-500 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">From</p>
                  <p className="text-sm font-medium text-gray-900">{userRouteData.homeAddress}</p>
                </div>
              </div>
              <div className="flex items-center">
                <LocationOn className="w-4 h-4 text-blue-500 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">To</p>
                  <p className="text-sm font-medium text-gray-900">{userRouteData.officeAddress}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Timeline className="w-4 h-4 text-green-500 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Distance</p>
                  <p className="text-sm font-medium text-gray-900">{userRouteData.distance} km</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                  <Timeline className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No Route Set Up</h3>
              </div>
              <button
                onClick={handleChangeRoute}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <LocationOn className="w-4 h-4 mr-2" />
                Set Up Route
              </button>
            </div>
            <div className="text-center py-4">
              <p className="text-gray-600 mb-2">You haven't set up your commute route yet.</p>
              <p className="text-sm text-gray-500">Set up your route to automatically calculate distances for check-ins.</p>
            </div>
          </div>
        )}

        {/* Quick Check-in Info */}
        {lastUsedTransport && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="text-sm font-semibold text-blue-800">Quick Check-in Available</h4>
            </div>
            <p className="text-sm text-blue-700">
              Use your last transportation method: <strong>{getTransportLabel(lastUsedTransport.transportMethod, lastUsedTransport.transportType)}</strong>
            </p>
          </div>
        )}

        {/* Check-in Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          {lastUsedTransport && (
            <button
              onClick={quickCheckIn}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <CheckCircle className="w-5 h-5 mr-3" />
              Quick Check-in ({getTransportLabel(lastUsedTransport.transportMethod, lastUsedTransport.transportType)})
            </button>
          )}
          
          <button
            onClick={() => setShowCheckInForm(!showCheckInForm)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <CheckCircle className="w-5 h-5 mr-3" />
            {lastUsedTransport ? 'Change Transportation Method' : 'Record Today\'s Commute'}
          </button>
        </div>

        {/* Check-in Form */}
        {showCheckInForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Daily Commute Check-in</h3>
            
            {/* DEFRA Information */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Emission Calculation Information</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Emissions are calculated using DEFRA 2024 conversion factors</p>
                <p>• Distance is multiplied by 2 for round-trip (to and from work)</p>
                <p>• Formula: Emissions = Distance × Emission Factor × 2</p>
                <p>• Walking and cycling have zero emissions</p>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <div className="relative">
                    <CalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('date', { required: 'Date is required' })}
                      type="date"
                      defaultValue={getCurrentDate()}
                      readOnly
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-in Time
                  </label>
                  <div className="relative">
                    <Schedule className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      {...register('checkInTime', { required: 'Check-in time is required' })}
                      type="time"
                      defaultValue={getCurrentTime()}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  {errors.checkInTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.checkInTime.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transportation Method
                  </label>
                  <select
                    {...register('transportMethod', { required: 'Transportation method is required' })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Select transportation method</option>
                    {transportMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  {errors.transportMethod && (
                    <p className="mt-1 text-sm text-red-600">{errors.transportMethod.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Transportation Type
                  </label>
                  <select
                    {...register('transportType', {
                      validate: (value) => {
                        const selectedMethod = transportMethods.find(m => m.value === watchedTransportMethod);
                        if (selectedMethod?.hasTypes && !value) {
                          return 'Transportation type is required for this method';
                        }
                        return true;
                      }
                    })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={!watchedTransportMethod || !transportMethods.find(m => m.value === watchedTransportMethod)?.hasTypes}
                  >
                    <option value="">Select type</option>
                    {watchedTransportMethod && transportMethods.find(m => m.value === watchedTransportMethod)?.hasTypes && 
                      transportMethods.find(m => m.value === watchedTransportMethod)?.types.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))
                    }
                  </select>
                  {errors.transportType && (
                    <p className="mt-1 text-sm text-red-600">{errors.transportType.message}</p>
                  )}
                  {watchedTransportMethod && transportMethods.find(m => m.value === watchedTransportMethod)?.hasTypes && !errors.transportType && (
                    <p className="mt-1 text-xs text-gray-500">Please select a transportation type</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    {...register('distance', { 
                      required: 'Distance is required',
                      min: { value: 0, message: 'Distance must be positive' }
                    })}
                    type="number"
                    step="0.1"
                    defaultValue={userRouteData?.distance || ''}
                    readOnly
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="Based on your saved route"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This distance will be multiplied by 2 for round-trip calculation (check-in + check-out)
                  </p>
                  {errors.distance && (
                    <p className="mt-1 text-sm text-red-600">{errors.distance.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckInForm(false);
                    reset();
                  }}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Object.keys(errors).length > 0}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Check-in
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Records List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-8 py-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Commute History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Transportation
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Distance (Round-trip)
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Emissions
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkInTime}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-blue-600 mr-3">
                          {getTransportIcon(record.transportMethod)}
                        </span>
                        <span className="text-sm text-gray-900">
                          {getTransportLabel(record.transportMethod, record.transportType)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.roundTripDistance ? `${record.roundTripDistance} km (round-trip)` : `${record.distance} km`}
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.emissions} kg CO₂
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, checkInRecords.length)} of {checkInRecords.length} records
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((pageNumber, index) => (
                      <button
                        key={index}
                        onClick={() => typeof pageNumber === 'number' ? handlePageChange(pageNumber) : null}
                        disabled={pageNumber === '...'}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          pageNumber === currentPage
                            ? 'bg-blue-600 text-white'
                            : pageNumber === '...'
                            ? 'text-gray-400 cursor-default'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  
                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeCommutingPage; 