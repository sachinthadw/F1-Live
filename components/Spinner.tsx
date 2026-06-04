import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC = () => (
  <div className="flex items-center justify-center h-full w-full">
    <Loader2 className="w-12 h-12 text-f1-cyan animate-spin" />
  </div>
);
