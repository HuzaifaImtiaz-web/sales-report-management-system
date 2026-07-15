import React from 'react';
import logoImg from '../../assets/logos/himmel-logo.png';

const CompanyLogo = ({ className = 'h-10 w-auto', ...props }) => {
  return (
    <img
      src={logoImg}
      alt="Himmel Pharmaceuticals Logo"
      className={`object-contain select-none ${className}`}
      {...props}
    />
  );
};

export default CompanyLogo;
