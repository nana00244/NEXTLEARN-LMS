import React from 'react';

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeMap = {
    sm: '24px',
    md: '40px',
    lg: '64px'
  };

  return (
    <div className="flex justify-center items-center py-4" role="status">
      <div 
        className="loading-spinner" 
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      ></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};