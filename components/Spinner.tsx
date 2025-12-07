import React from 'react';

export const Spinner: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-f1-cyan border-t-transparent rounded-full animate-spin"></div>
      <div className="absolute top-2 left-2 w-12 h-12 border-4 border-f1-red border-b-transparent rounded-full animate-spin direction-reverse"></div>
    </div>
  </div>
);
