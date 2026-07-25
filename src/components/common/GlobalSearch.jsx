import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiPackage, FiUser, FiHome, FiMapPin,
  FiUsers, FiShoppingBag, FiCornerDownLeft, FiLoader
} from 'react-icons/fi';
import { searchService } from '../../services/searchService';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Keyboard shortcut listener (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query trigger
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      searchService.globalSearch(query).then((res) => {
        setResults(res);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (path) => {
    setIsOpen(false);
    setQuery('');
    setResults(null);
    navigate(path);
  };

  const hasResults = results && (
    (results.products && results.products.length > 0) ||
    (results.doctors && results.doctors.length > 0) ||
    (results.institutions && results.institutions.length > 0) ||
    (results.areas && results.areas.length > 0) ||
    (results.teamMembers && results.teamMembers.length > 0) ||
    (results.orders && results.orders.length > 0)
  );

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <FiSearch className="absolute left-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Global search (Products, Doctors, Sales, POs...)"
          className="w-full pl-9 pr-16 py-1.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-medium text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all duration-150"
        />
        {query ? (
          <button
            onClick={() => { setQuery(''); setResults(null); }}
            className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-bold text-gray-400 bg-gray-200/60 dark:bg-gray-700/60 rounded border border-gray-300/50 dark:border-gray-600/50 pointer-events-none">
            ⌘K
          </span>
        )}
      </div>

      {/* Instant Search Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#0f172a] border border-gray-150 dark:border-gray-800 rounded-enterprise shadow-2xl overflow-hidden z-50 max-h-[480px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 animate-slide-up">
          {loading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-xs font-semibold text-gray-500">
              <FiLoader className="w-4 h-4 animate-spin text-brand-primary" />
              Searching records across modules...
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center text-xs font-medium text-gray-400 dark:text-gray-500">
              No matching records found for "<span className="text-gray-700 dark:text-gray-300 font-bold">{query}</span>"
            </div>
          ) : (
            <div className="py-2 space-y-2">
              {/* Products */}
              {results.products && results.products.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-primary flex items-center gap-1.5">
                    <FiPackage className="w-3 h-3" /> Products ({results.products.length})
                  </div>
                  {results.products.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectResult(`/products?search=${encodeURIComponent(p.brand_name || p.brandName || '')}`)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 flex items-center justify-between group text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          [{p.product_code || p.productCode || p.code}] {p.brand_name || p.brandName || p.name}
                        </span>
                        {p.generic_name && (
                          <span className="block text-[10px] text-gray-400 font-medium">{p.generic_name}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 group-hover:text-brand-primary flex items-center gap-1 font-semibold">
                        View <FiCornerDownLeft className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Doctors */}
              {results.doctors && results.doctors.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <FiUser className="w-3 h-3" /> Doctors ({results.doctors.length})
                  </div>
                  {results.doctors.map(d => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectResult(`/doctors?search=${encodeURIComponent(d.name)}`)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 flex items-center justify-between group text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">{d.name}</span>
                        {d.specialization && (
                          <span className="block text-[10px] text-gray-400 font-medium">{d.specialization}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 group-hover:text-indigo-600 flex items-center gap-1 font-semibold">
                        View <FiCornerDownLeft className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Institutions */}
              {results.institutions && results.institutions.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <FiHome className="w-3 h-3" /> Institutions ({results.institutions.length})
                  </div>
                  {results.institutions.map(inst => (
                    <button
                      key={inst.id}
                      onClick={() => handleSelectResult(`/institutions?search=${encodeURIComponent(inst.name)}`)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 flex items-center justify-between group text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">{inst.name}</span>
                        {inst.type && (
                          <span className="block text-[10px] text-gray-400 font-medium">{inst.type}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 group-hover:text-emerald-600 flex items-center gap-1 font-semibold">
                        View <FiCornerDownLeft className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Orders & Sales */}
              {results.orders && results.orders.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <FiShoppingBag className="w-3 h-3" /> Purchase Orders & Sales ({results.orders.length})
                  </div>
                  {results.orders.map(o => (
                    <button
                      key={o.id}
                      onClick={() => handleSelectResult(`/sales/${o.id}`)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 flex items-center justify-between group text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          PO #{o.order_number || o.poNumber} ({o.status})
                        </span>
                        <span className="block text-[10px] text-gray-400 font-medium">
                          {o.doctor_name || o.doctor} • {o.institution_name || o.institution}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 group-hover:text-amber-600 flex items-center gap-1 font-semibold">
                        View PO <FiCornerDownLeft className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Areas */}
              {results.areas && results.areas.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                    <FiMapPin className="w-3 h-3" /> Areas ({results.areas.length})
                  </div>
                  {results.areas.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleSelectResult(`/areas?search=${encodeURIComponent(a.name)}`)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 flex items-center justify-between group text-xs transition-colors"
                    >
                      <span className="font-bold text-gray-900 dark:text-white">{a.name} [{a.code}]</span>
                      <span className="text-[10px] text-gray-400 group-hover:text-sky-600 flex items-center gap-1 font-semibold">
                        View <FiCornerDownLeft className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Team Members */}
              {results.teamMembers && results.teamMembers.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <FiUsers className="w-3 h-3" /> Team Members ({results.teamMembers.length})
                  </div>
                  {results.teamMembers.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectResult(`/team-members?search=${encodeURIComponent(t.name)}`)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 flex items-center justify-between group text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white">{t.name}</span>
                        <span className="block text-[10px] text-gray-400 font-medium">{t.role}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 group-hover:text-purple-600 flex items-center gap-1 font-semibold">
                        View <FiCornerDownLeft className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
