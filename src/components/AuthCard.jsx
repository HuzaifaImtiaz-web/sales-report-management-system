import React from 'react';

const AuthCard = ({ children }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-enterprise shadow-premium p-8 sm:p-10 w-full max-w-md mx-auto transition-all duration-300 transform animate-slide-up">
      {children}
    </div>
  );
};

export default AuthCard;
