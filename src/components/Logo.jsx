import React from 'react';
import CompanyLogo from './common/CompanyLogo';

const Logo = () => {
  return (
    <div className="flex flex-col items-center select-none">
      <CompanyLogo className="h-14 w-14 mb-4" />
      <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-gray-800 leading-none">Himmel</h2>
      <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-brand-primary mt-1">Pharmaceuticals</p>
    </div>
  );
};

export default Logo;
