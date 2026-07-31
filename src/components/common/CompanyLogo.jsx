import React from 'react';
import logoImg from '../../assets/logos/Himmel-Logo.png';

const CompanyLogo = ({
  className = 'h-10 w-auto',
  withCard = false,
  cardClassName = 'p-2 bg-white rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50',
  ...props
}) => {
  const imgElement = (
    <img
      src={logoImg}
      alt="Himmel Pharmaceutical Logo"
      className={`object-contain select-none ${className}`}
      {...props}
    />
  );

  if (withCard) {
    return (
      <div className={`shrink-0 inline-flex items-center justify-center ${cardClassName}`}>
        {imgElement}
      </div>
    );
  }

  return imgElement;
};

export default CompanyLogo;
