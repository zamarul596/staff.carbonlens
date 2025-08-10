import React from 'react';

const SkeletonLoader = ({ type = 'default', className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
            <div className="animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-slate-200 rounded-lg mr-3"></div>
                <div className="h-6 bg-slate-200 rounded w-32"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 ${className}`}>
            <div className="px-8 py-6 border-b border-slate-200">
              <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                    <div className="h-4 bg-slate-200 rounded w-16"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-8 ${className}`}>
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
              <div className="space-y-6">
                <div>
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                </div>
                <div>
                  <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                  <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                </div>
                <div>
                  <div className="h-4 bg-slate-200 rounded w-28 mb-2"></div>
                  <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-8 ${className}`}>
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-40 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                </div>
                <div>
                  <div className="h-4 bg-slate-200 rounded w-28 mb-2"></div>
                  <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                </div>
                <div>
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                </div>
                <div>
                  <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                  <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'route-info':
        return (
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg mr-3"></div>
                  <div className="h-6 bg-slate-200 rounded w-32"></div>
                </div>
                <div className="h-8 bg-slate-200 rounded-lg w-24"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-slate-200 rounded-full mr-2"></div>
                  <div>
                    <div className="h-3 bg-slate-200 rounded w-8 mb-1"></div>
                    <div className="h-4 bg-slate-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-slate-200 rounded-full mr-2"></div>
                  <div>
                    <div className="h-3 bg-slate-200 rounded w-6 mb-1"></div>
                    <div className="h-4 bg-slate-200 rounded w-28"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-slate-200 rounded-full mr-2"></div>
                  <div>
                    <div className="h-3 bg-slate-200 rounded w-16 mb-1"></div>
                    <div className="h-4 bg-slate-200 rounded w-12"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-8 ${className}`}>
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 bg-slate-200 rounded w-48 mb-3"></div>
                  <div className="h-5 bg-slate-200 rounded w-64"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 ${className}`}>
            <div className="animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader; 