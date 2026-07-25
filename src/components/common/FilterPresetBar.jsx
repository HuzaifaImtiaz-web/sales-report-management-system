import React, { useState, useEffect } from 'react';
import { FiBookmark, FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

export default function FilterPresetBar({
  moduleName = 'general',
  currentFilters = {},
  onApplyPreset,
  defaultPresets = []
}) {
  const storageKey = `himmel_filter_presets_${moduleName}`;

  const [savedPresets, setSavedPresets] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');

  // Load custom presets from localStorage + defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const custom = stored ? JSON.parse(stored) : [];
      setSavedPresets(custom);
    } catch (e) {
      console.error('Failed to load filter presets', e);
    }
  }, [moduleName]);

  const allPresets = [...defaultPresets, ...savedPresets];

  const handleSaveCurrentFilters = (e) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      filters: { ...currentFilters },
      isCustom: true
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewPresetName('');
    setShowSaveModal(false);
    setSelectedPresetId(newPreset.id);
  };

  const handleDeletePreset = (id, e) => {
    e.stopPropagation();
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (selectedPresetId === id) setSelectedPresetId('');
  };

  const handleSelectPreset = (presetId) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const found = allPresets.find(p => p.id === presetId);
    if (found && onApplyPreset) {
      onApplyPreset(found.filters);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-gray-500 dark:text-gray-400">
        <FiBookmark className="w-3.5 h-3.5 text-brand-primary" />
        <span className="hidden sm:inline">Saved Presets:</span>
      </div>

      <select
        value={selectedPresetId}
        onChange={(e) => handleSelectPreset(e.target.value)}
        className="px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
      >
        <option value="">-- Apply Filter Preset --</option>
        {allPresets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} {p.isCustom ? '(Custom)' : ''}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setShowSaveModal(true)}
        className="px-2.5 py-1.5 border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
        title="Save Current Filters as Preset"
      >
        <FiPlus className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Save Preset</span>
      </button>

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-gray-800 rounded-enterprise p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                <FiBookmark className="w-4 h-4 text-brand-primary" /> Save Filter Preset
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentFilters} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Preset Name *</label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Today's Pending Orders"
                  className="w-full px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-primary rounded-lg hover:bg-brand-primaryDark"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
