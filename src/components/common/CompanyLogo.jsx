import React from 'react';
import logoImg from '../../assets/logos/Himmel-sale-logo.png';

const CompanyLogo = ({ className = 'h-10 w-auto', ...props }) => {
  return (
    <img
      src={logoImg}
      alt="Himmel Pharmaceutical Logo"
      className={`object-contain select-none ${className}`}
      {...props}
    />
  );
};

export default CompanyLogo;
