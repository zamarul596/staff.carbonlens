import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Flight, 
  DirectionsCar, 
  Train, 
  DirectionsBus, 
  DirectionsBoat,
  Add,
  Delete,
  ArrowBack,
  CalendarToday,
  LocationOn,
  Business,
  Person,
  CheckCircle,
  PendingActions,
  Send
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import SkeletonLoader from '../components/SkeletonLoader';
import LocationSelector from '../components/LocationSelector';
import FirebaseService from '../services/firebaseService';

const BusinessTravelPage = () => {
  const { userData, loading } = useAuth();
  const [travelRecords, setTravelRecords] = useState([]);
  const [pendingTravel, setPendingTravel] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const watchMode = watch('mode');

  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      
      try {
        // Load pending travel from Firebase
        const pendingTravelData = await FirebaseService.loadPendingBusinessTravel();
        if (pendingTravelData && !pendingTravelData.deleted) {
          setPendingTravel(pendingTravelData);
        }

        // Load completed travel records from Firebase
        const completedTravelData = await FirebaseService.loadCompletedBusinessTravel();
        setTravelRecords(completedTravelData);
        calculateTotalEmissions(completedTravelData);
        
      } catch (error) {
        console.error('Error loading business travel data:', error);
        toast.error('Failed to load business travel data');
      }
      
      setPageLoading(false);
    };

    if (!loading) {
      loadData();
    }
  }, [loading]);

  const calculateTotalEmissions = (records) => {
    const total = records.reduce((sum, record) => sum + record.emissions, 0);
    setTotalEmissions(total);
  };

  // DEFRA validated emission factors (kg CO2e per km)
  // Source: UK Government GHG Conversion Factors for Company Reporting 2024
  // https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024
  const travelModes = [
    { 
      value: 'plane', 
      label: 'Airplane (Short-haul)', 
      icon: Flight, 
      emissionFactor: 0.255, // Domestic/Short-haul flights (DEFRA 2024)
      description: 'Short-haul flights (< 3700 km)'
    },
    { 
      value: 'plane_long', 
      label: 'Airplane (Long-haul)', 
      icon: Flight, 
      emissionFactor: 0.139, // Long-haul flights (DEFRA 2024)
      description: 'Long-haul flights (> 3700 km)'
    },
    { 
      value: 'car', 
      label: 'Car (Petrol)', 
      icon: DirectionsCar, 
      emissionFactor: 0.171, // Average petrol car (DEFRA 2024)
      description: 'Average petrol car'
    },
    { 
      value: 'car_diesel', 
      label: 'Car (Diesel)', 
      icon: DirectionsCar, 
      emissionFactor: 0.160, // Average diesel car (DEFRA 2024)
      description: 'Average diesel car'
    },
    { 
      value: 'car_electric', 
      label: 'Car (Electric)', 
      icon: DirectionsCar, 
      emissionFactor: 0.054, // Electric car (UK grid mix) (DEFRA 2024)
      description: 'Electric car (UK grid mix)'
    },
    { 
      value: 'train', 
      label: 'Train', 
      icon: Train, 
      emissionFactor: 0.041, // National rail (DEFRA 2024)
      description: 'National rail (average)'
    },
    { 
      value: 'bus', 
      label: 'Bus', 
      icon: DirectionsBus, 
      emissionFactor: 0.104, // Local bus (DEFRA 2024)
      description: 'Local bus (average)'
    },
    { 
      value: 'coach', 
      label: 'Coach', 
      icon: DirectionsBus, 
      emissionFactor: 0.027, // Coach (DEFRA 2024)
      description: 'Coach (long distance)'
    },
    { 
      value: 'ship', 
      label: 'Ship/Ferry', 
      icon: DirectionsBoat, 
      emissionFactor: 0.018, // Ferry (DEFRA 2024)
      description: 'Ferry (passenger)'
    },
    { 
      value: 'motorbike', 
      label: 'Motorbike', 
      icon: DirectionsCar, 
      emissionFactor: 0.103, // Average motorcycle (DEFRA 2024)
      description: 'Average motorcycle'
    }
  ];

  const handleLocationSelect = (type, address) => {
    if (type === 'home') {
      setValue('fromLocation', address);
    } else {
      setValue('toLocation', address);
    }
  };

  const handleDistanceCalculate = (routeData) => {
    setValue('distance', routeData.distance);
    setValue('fromLocation', routeData.homeAddress);
    setValue('toLocation', routeData.officeAddress);
  };

  const calculateManualDistance = () => {
    const fromLocation = watch('fromLocation');
    const toLocation = watch('toLocation');
    
    if (!fromLocation || !toLocation) {
      toast.error('Please select both from and to locations first');
      return;
    }

    // For business travel, we'll use a simple estimation
    // In a real app, you'd use a geocoding service to get coordinates and calculate distance
    const estimatedDistance = Math.floor(Math.random() * 1000) + 100; // 100-1100 km for demo
    setValue('distance', estimatedDistance);
    
    // Suggest appropriate travel mode based on distance
    const recommendedMode = getRecommendedMode(estimatedDistance);
    setValue('mode', recommendedMode);
    
    const recommendedModeData = travelModes.find(m => m.value === recommendedMode);
    const emissionFactor = getEmissionFactor(recommendedMode, estimatedDistance);
    const estimatedEmissions = (estimatedDistance * emissionFactor).toFixed(2);
    
    toast.success(
      `Estimated distance: ${estimatedDistance} km\n` +
      `Recommended mode: ${recommendedModeData?.label}\n` +
      `Estimated emissions: ${estimatedEmissions} kg CO₂e`
    );
    
    // Auto-submit the form after setting distance
    setTimeout(() => {
      const formData = {
        date: watch('date'),
        mode: recommendedMode,
        purpose: watch('purpose'),
        cost: watch('cost'),
        fromLocation: watch('fromLocation'),
        toLocation: watch('toLocation'),
        distance: estimatedDistance
      };
      onSubmit(formData);
    }, 500);
  };

  const onSubmit = async (data) => {
    if (!data.fromLocation || !data.toLocation) {
      toast.error('Please select both from and to locations using the map');
      return;
    }

    // If no distance is set, use the manual calculation
    if (!data.distance || data.distance <= 0) {
      calculateManualDistance();
      return;
    }

    const selectedMode = travelModes.find(mode => mode.value === data.mode);
    
    // Use DEFRA formula: Emissions (kg CO₂e) = Distance (km) × Emission factor (kg CO₂e/km)
    const emissionFactor = getEmissionFactor(data.mode, data.distance);
    const emissions = (data.distance * emissionFactor).toFixed(2);
    
    const newSegment = {
      id: Date.now(),
      date: data.date,
      mode: data.mode,
      distance: parseFloat(data.distance),
      emissions: parseFloat(emissions),
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      purpose: data.purpose
    };

    try {
      // Add to pending travel or create new pending travel
      let updatedPending;
      if (pendingTravel) {
        updatedPending = {
          ...pendingTravel,
          segments: [...pendingTravel.segments, newSegment]
        };
      } else {
        updatedPending = {
          id: Date.now(),
          purpose: data.purpose,
          segments: [newSegment],
          status: 'pending'
        };
      }

      // Save to Firebase
      await FirebaseService.savePendingBusinessTravel(updatedPending);
      setPendingTravel(updatedPending);

      setShowAddForm(false);
      setShowLocationSelector(false);
      reset();
      toast.success('Travel segment added to pending trip!');
    } catch (error) {
      console.error('Error saving pending travel:', error);
      toast.error('Failed to save travel segment');
    }
  };

  const submitPendingTravel = async () => {
    if (!pendingTravel || pendingTravel.segments.length === 0) {
      toast.error('No pending travel to submit');
      return;
    }

    try {
      // Calculate total emissions and distance for the entire trip
      const totalTripEmissions = pendingTravel.segments.reduce((sum, segment) => sum + segment.emissions, 0);
      const totalTripDistance = pendingTravel.segments.reduce((sum, segment) => sum + segment.distance, 0);

      const completedTravel = {
        ...pendingTravel,
        totalEmissions: totalTripEmissions,
        totalDistance: totalTripDistance,
        status: 'completed'
      };

      // Submit to Firebase
      await FirebaseService.submitCompletedBusinessTravel(completedTravel);

      const updatedRecords = [...travelRecords, completedTravel];
      setTravelRecords(updatedRecords);
      calculateTotalEmissions(updatedRecords);
      setPendingTravel(null);
      toast.success('Business travel submitted successfully!');
    } catch (error) {
      console.error('Error submitting completed travel:', error);
      toast.error('Failed to submit business travel');
    }
  };

  const deletePendingSegment = async (segmentId) => {
    if (!pendingTravel) return;

    try {
      const updatedSegments = pendingTravel.segments.filter(segment => segment.id !== segmentId);
      
      if (updatedSegments.length === 0) {
        // Clear pending travel from Firebase
        await FirebaseService.savePendingBusinessTravel({ deleted: true });
        setPendingTravel(null);
      } else {
        const updatedPending = {
          ...pendingTravel,
          segments: updatedSegments
        };
        // Save updated pending travel to Firebase
        await FirebaseService.savePendingBusinessTravel(updatedPending);
        setPendingTravel(updatedPending);
      }
      
      toast.success('Segment removed from pending trip');
    } catch (error) {
      console.error('Error deleting pending segment:', error);
      toast.error('Failed to remove segment');
    }
  };

  const deleteRecord = async (id) => {
    try {
      // Delete from Firebase
      await FirebaseService.deleteBusinessTravelRecord(id);
      
      const updatedRecords = travelRecords.filter(record => record.id !== id);
      setTravelRecords(updatedRecords);
      calculateTotalEmissions(updatedRecords);
      toast.success('Record deleted successfully!');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const getModeIcon = (mode) => {
    const modeData = travelModes.find(m => m.value === mode);
    const Icon = modeData?.icon || Flight;
    return <Icon className="w-5 h-5" />;
  };

  const getModeLabel = (mode) => {
    const modeData = travelModes.find(m => m.value === mode);
    return modeData?.label || 'Unknown';
  };

  const getTripDateRange = (segments) => {
    if (!segments || segments.length === 0) return 'No dates set';
    
    const dates = segments.map(segment => new Date(segment.date)).sort((a, b) => a - b);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    if (startDate.getTime() === endDate.getTime()) {
      return startDate.toLocaleDateString();
    } else {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
  };

  const getRecommendedMode = (distance) => {
    if (distance > 3700) {
      return 'plane_long'; // Long-haul flights
    } else if (distance > 500) {
      return 'plane'; // Short-haul flights
    } else if (distance > 100) {
      return 'train'; // Medium distance - train
    } else if (distance > 50) {
      return 'coach'; // Medium distance - coach
    } else {
      return 'car'; // Short distance - car
    }
  };

  const getEmissionFactor = (mode, distance) => {
    const selectedMode = travelModes.find(m => m.value === mode);
    if (!selectedMode) return 0;
    
    // For planes, use distance to determine short vs long haul
    if (mode === 'plane' && distance > 3700) {
      return travelModes.find(m => m.value === 'plane_long').emissionFactor;
    } else if (mode === 'plane' && distance <= 3700) {
      return travelModes.find(m => m.value === 'plane').emissionFactor;
    }
    
    return selectedMode.emissionFactor;
  };

  const getTransportModesUsed = (record) => {
    if (record.segments) {
      // For multi-segment trips, get unique modes
      const modes = [...new Set(record.segments.map(segment => segment.mode))];
      return modes.map(mode => getModeLabel(mode)).join(', ');
    } else {
      // For single segment trips
      return getModeLabel(record.mode);
    }
  };

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
                <h1 className="text-xl font-bold text-slate-900">Business Travel</h1>
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
          <>
            {/* Summary Card Skeleton */}
            <SkeletonLoader type="summary" className="mb-8" />
            
            {/* Add Button Skeleton */}
            <div className="mb-8">
              <div className="h-12 bg-slate-200 rounded-xl w-48 animate-pulse"></div>
            </div>
            
            {/* Records Table Skeleton */}
            <SkeletonLoader type="table" />
          </>
        ) : (
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">Business Travel Management</h2>
                <p className="text-slate-600 text-lg">Track and manage business travel carbon footprint</p>
              </div>
            </div>

            {/* Pending Travel Card */}
            {pendingTravel && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <PendingActions className="w-6 h-6 text-amber-600 mr-3" />
                    <h3 className="text-xl font-bold text-amber-800">Pending Business Travel</h3>
                  </div>
                  <button
                    onClick={submitPendingTravel}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Trip
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-amber-700 font-medium">Purpose: {pendingTravel.purpose}</p>
                  <p className="text-amber-600 text-sm">
                    Trip Period: {getTripDateRange(pendingTravel.segments)}
                  </p>
                </div>

                <div className="space-y-3">
                  {pendingTravel.segments.map((segment, index) => (
                    <div key={segment.id} className="bg-white rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="text-purple-600 mr-3">
                              {getModeIcon(segment.mode)}
                            </span>
                            <span className="font-medium text-slate-900">
                              {getModeLabel(segment.mode)}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p><strong>Date:</strong> {new Date(segment.date).toLocaleDateString()}</p>
                            <p><strong>From:</strong> {segment.fromLocation}</p>
                            <p><strong>To:</strong> {segment.toLocation}</p>
                            <p><strong>Distance:</strong> {segment.distance} km</p>
                            <p><strong>Emissions:</strong> {segment.emissions} kg CO₂</p>
                          </div>
                        </div>
                        <button
                          onClick={() => deletePendingSegment(segment.id)}
                          className="text-red-600 hover:text-red-900 transition-colors ml-4"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-amber-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-700">Total Segments: {pendingTravel.segments.length}</span>
                    <span className="text-amber-700">
                      Total Emissions: {pendingTravel.segments.reduce((sum, segment) => sum + segment.emissions, 0).toFixed(2)} kg CO₂
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Add New Record Button */}
            <div className="mb-8">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Add className="w-5 h-5 mr-3" />
                {pendingTravel ? 'Add Another Segment' : 'Start New Business Trip'}
              </button>
            </div>

            {/* Add Record Form */}
            {showAddForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  {pendingTravel ? 'Add Travel Segment' : 'New Business Travel Trip'}
                </h3>
                {pendingTravel && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Current Trip:</strong> {pendingTravel.purpose} 
                      ({getTripDateRange(pendingTravel.segments)})
                    </p>
                  </div>
                )}
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(onSubmit)(e);
                  }} 
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Date
                      </label>
                      <div className="relative">
                        <CalendarToday className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('date', { required: 'Date is required' })}
                          type="date"
                          className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                        />
                      </div>
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Travel Mode
                      </label>
                      <select
                        {...register('mode', { required: 'Travel mode is required' })}
                        className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                      >
                        <option value="">Select travel mode</option>
                        {travelModes.map((mode) => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                      {errors.mode && (
                        <p className="mt-1 text-sm text-red-600">{errors.mode.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Purpose
                      </label>
                      <div className="relative">
                        <Business className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          {...register('purpose', { required: 'Purpose is required' })}
                          type="text"
                          className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                          placeholder="e.g., Client Meeting, Conference"
                        />
                      </div>
                      {errors.purpose && (
                        <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
                      )}
                    </div>




                  </div>

                  {/* Hidden inputs for locations and distance */}
                  <input type="hidden" {...register('fromLocation')} />
                  <input type="hidden" {...register('toLocation')} />
                  <input type="hidden" {...register('distance')} />

                  {/* Location Selection */}
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">Select Travel Route</h4>
                    <button
                      type="button"
                      onClick={() => setShowLocationSelector(!showLocationSelector)}
                      className="flex items-center px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      <LocationOn className="w-5 h-5 mr-2 text-slate-600" />
                      {showLocationSelector ? 'Hide Map' : 'Show Map to Select Route'}
                    </button>
                  </div>

                  {showLocationSelector && (
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <LocationSelector
                        onLocationSelect={handleLocationSelect}
                        onDistanceCalculate={handleDistanceCalculate}
                        showDirections={false}
                      />
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">Business Travel Instructions</h4>
                        <div className="text-sm text-blue-700 space-y-1">
                          <p>• Set "Home" as your departure location</p>
                          <p>• Set "Office" as your destination location</p>
                          <p>• For international travel, the route calculation may not work, but distance will be calculated</p>
                          <p>• You can manually adjust the distance if needed</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Route Display */}
                  {(watch('fromLocation') || watch('toLocation')) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h5 className="text-sm font-semibold text-blue-800 mb-2">Selected Route</h5>
                      <div className="space-y-2 text-sm">
                        {watch('fromLocation') && (
                          <p className="text-blue-700">
                            <strong>From:</strong> {watch('fromLocation')}
                          </p>
                        )}
                        {watch('toLocation') && (
                          <p className="text-blue-700">
                            <strong>To:</strong> {watch('toLocation')}
                          </p>
                        )}
                        {watch('distance') && (
                          <p className="text-blue-700">
                            <strong>Distance:</strong> {watch('distance')} km
                          </p>
                        )}
                        {watch('distance') && watch('mode') && (
                          <p className="text-green-700">
                            <strong>Estimated Emissions:</strong> {
                              (watch('distance') * getEmissionFactor(watch('mode'), watch('distance'))).toFixed(2)
                            } kg CO₂e
                          </p>
                        )}
                      </div>
                      {!watch('distance') && watch('fromLocation') && watch('toLocation') && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={calculateManualDistance}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Calculate Distance & Continue
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setShowLocationSelector(false);
                        reset();
                      }}
                      className="px-6 py-3 text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!watch('fromLocation') || !watch('toLocation') || !watch('mode')}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pendingTravel ? 'Add Segment' : 'Start Trip'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Completed Records List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Completed Business Travel</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Transport Modes
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Segments
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Total Distance
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Total Emissions
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {travelRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-900">
                          {record.segments ? getTripDateRange(record.segments) : new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-900">
                          {record.purpose}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-900">
                          <div className="flex items-center space-x-2">
                            {getTransportModesUsed(record).split(', ').map((mode, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                {mode}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-900">
                          {record.segments ? record.segments.length : 1}
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-900">
                          {record.totalDistance || record.distance} km
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-sm text-slate-900">
                          {record.totalEmissions || record.emissions} kg CO₂
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BusinessTravelPage; 