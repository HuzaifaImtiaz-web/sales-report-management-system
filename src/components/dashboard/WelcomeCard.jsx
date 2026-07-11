import React from 'react';
import { useAuth } from '../../context/AuthContext';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formatDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const WelcomeCard = () => {
  const { user } = useAuth();
  const name = user?.name || user?.email?.split('@')[0] || 'Huzaifa';

  return (
    <div className="relative overflow-hidden rounded-enterprise bg-gradient-to-br from-brand-navy via-[#162447] to-[#1a2e5a] shadow-premium p-6 sm:p-8 text-white transition-all duration-250 hover:shadow-premium">
      {/* Visual background details */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -right-4 -top-2 w-24 h-24 rounded-full bg-brand-primary/20 pointer-events-none" />
      
      <div className="relative z-10 space-y-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight capitalize">
            Welcome Back, {name}
          </h2>
          <p className="text-brand-secondary text-sm font-bold mt-1 uppercase tracking-wide">
            {getGreeting()}
          </p>
        </div>

        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-white/80 font-bold uppercase tracking-wider">
            {formatDate()}
          </p>
          <p className="text-white/60 italic font-semibold">
            &ldquo;Focus on the target. Excellence is not an act, but a habit.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
