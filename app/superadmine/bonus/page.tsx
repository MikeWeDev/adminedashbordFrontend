'use client';
import React, { useState, useEffect, useCallback } from 'react';

// --- Type Definitions ---
interface BonusSettings {
  initiationBonus: number;
  depositBonus: number;
}

// Flexible type for NewSettings to allow temporary string input (including empty string)
interface NewBonusSettings {
    initiationBonus: number | string;
    depositBonus: number | string;
}

interface BonusState {
  currentSettings: BonusSettings;
  newSettings: NewBonusSettings;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  message: string | null;
}

// --- Main Dashboard Component ---
const BonusConfigurationPage = () => {
  const [state, setState] = useState<BonusState>({
    currentSettings: { initiationBonus: 0, depositBonus: 0 },
    newSettings: { initiationBonus: 0, depositBonus: 0 },
    isLoading: true,
    isSaving: false,
    error: null,
    message: null,
  });

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  // NOTE: API_URL is concatenated here but would normally be managed by a client hook or service in a real app
  const API_URL = `${BASE_URL}/api/bonus`; 

  // 1. Fetch current settings
  const fetchSettings = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch settings.');
      }

      const fetchedSettings: BonusSettings = {
        initiationBonus: data.initiationBonus || 0,
        depositBonus: data.depositBonus || 0,
      };

      setState((s) => ({
        ...s,
        currentSettings: fetchedSettings,
        // New settings get initialized as numbers
        newSettings: fetchedSettings, 
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Fetch error:', err);
      setState((s) => ({
        ...s,
        error: err.message,
        isLoading: false,
      }));
    }
  }, [API_URL]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // FIX: Allow empty string or string representation of a number
    if (value === "" || /^\d*(\.\d*)?$/.test(value)) {
        setState((s) => ({
            ...s,
            newSettings: {
                ...s.newSettings,
                // Store the raw string value to allow user deletion/typing
                [name]: value, 
            },
            message: null,
            error: null,
        }));
    }
  };

  // 2. Submit update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isSaving) return;

    setState((s) => ({ ...s, isSaving: true, message: null, error: null }));

    // Pre-submission validation and parsing
    const submissionData: BonusSettings = {
        initiationBonus: parseFloat(String(state.newSettings.initiationBonus)) || 0,
        depositBonus: parseFloat(String(state.newSettings.depositBonus)) || 0,
    };
    
    if (submissionData.initiationBonus < 0 || submissionData.depositBonus < 0) {
        setState(s => ({ ...s, isSaving: false, error: "Bonus amounts cannot be negative." }));
        return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save settings.');
      }
      
      // Update the saved settings from response data or fallback
      const savedSettings: BonusSettings = result.settings || submissionData;

      setState((s) => ({
        ...s,
        currentSettings: savedSettings, 
        newSettings: {
            initiationBonus: savedSettings.initiationBonus,
            depositBonus: savedSettings.depositBonus,
        },
        message: result.message || 'Settings saved successfully!',
        isSaving: false,
      }));

      setTimeout(() => setState((s) => ({ ...s, message: null })), 5000);

    } catch (err: any) {
      console.error('Save error:', err);
      setState((s) => ({
        ...s,
        error: err.message,
        isSaving: false,
      }));
    }
  };

  const { currentSettings, newSettings, isLoading, isSaving, error, message } = state;

  return (
    <div className="h-full bg-gray-900 text-gray-100 p-4 sm:p-6 font-sans flex flex-col">
      <script src="https://cdn.tailwindcss.com"></script>
      <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
        
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-400 tracking-wider">
            System Bonus Controls
          </h1>
          <p className="mt-1 text-gray-400 text-base sm:text-lg">
            Manage global reward settings for new users and deposits.
          </p>
        </header>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center flex-grow p-12 bg-gray-800 rounded-2xl shadow-2xl">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-teal-400 text-xl">Fetching Configuration Data...</p>
          </div>
        ) : (
          <div className="flex flex-col flex-grow w-full gap-6">
            
            {/* Status Messages - Always visible at the top of the main area */}
            {(error || message) && (
              <div className={`p-4 rounded-xl font-medium text-sm sm:text-base shadow-lg ${
                error ? 'bg-red-900 text-red-300 border border-red-700' : 'bg-green-900 text-green-300 border border-green-700'
              }`} role="alert">
                {error ? `ERROR: ${error}` : `SUCCESS: ${message}`}
              </div>
            )}

            {/* Main Content Area: Side-by-Side Grid on Desktop, Stacked on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
                
                {/* Current Settings (Card 1 - Smaller on desktop) */}
                <div className="md:col-span-1 bg-gray-800 p-6 rounded-2xl shadow-2xl border-t-4 border-teal-500 h-full">
                    <h2 className="text-lg font-bold mb-4 text-teal-400 border-b border-gray-700 pb-2">
                        Active Values
                    </h2>
                    <div className="space-y-4">
                        <SettingDisplay
                            title="Invitation Bonus"
                            value={currentSettings.initiationBonus}
                            icon="💸"
                        />
                        <SettingDisplay
                            title="Deposit Bonus"
                            value={currentSettings.depositBonus}
                            icon="💰"
                        />
                    </div>
                </div>

                {/* Update Form (Card 2 - Larger on desktop) */}
                <div className="md:col-span-2 bg-gray-800 p-6 rounded-2xl shadow-2xl border-t-4 border-teal-500 h-full">
                    <h2 className="text-lg font-bold mb-6 text-teal-400 border-b border-gray-700 pb-2">
                        Modify Global Settings
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                                label="New Invitation Bonus Amount"
                                name="initiationBonus"
                                value={newSettings.initiationBonus}
                                onChange={handleChange}
                                disabled={isSaving}
                            />
                            
                            <InputField
                                label="New Deposit Bonus Amount"
                                name="depositBonus"
                                value={newSettings.depositBonus}
                                onChange={handleChange}
                                disabled={isSaving}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-3 px-4 rounded-xl text-lg font-bold transition duration-300 transform ${
                                isSaving 
                                ? 'bg-teal-600/50 cursor-not-allowed text-gray-400' 
                                : 'bg-teal-600 hover:bg-teal-500 hover:scale-[1.01] active:scale-[0.99] text-white'
                            } shadow-md hover:shadow-xl mt-4`}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                SAVING CHANGES...
                            </div>
                            ) : (
                            '💾 SAVE BONUS SETTINGS'
                            )}
                        </button>
                    </form>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper Component for Display ---
const SettingDisplay: React.FC<{ title: string; value: number; icon: string }> = ({ title, value, icon }) => (
  <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 shadow-inner flex flex-col sm:flex-row items-start sm:items-center justify-between">
    <div>
        <div className="text-2xl sm:text-3xl">{icon}</div>
        <span className="text-xs font-medium text-gray-400 block mt-1 sm:mt-2">{title}</span>
    </div>
    <span className="text-3xl sm:text-4xl font-extrabold text-teal-400 mt-2 sm:mt-0">
        {value.toFixed(2)}
    </span>
  </div>
);

// --- Helper Component for Input Fields ---
const InputField: React.FC<{ label: string; name: keyof BonusSettings; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean; }> = ({ label, name, value, onChange, disabled }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
      {label}
    </label>
    <input
      type="number"
      id={name}
      name={name}
      // Value can be a number (from load) or string (while typing/empty)
      value={value} 
      onChange={onChange}
      step="0.01"
      min="0"
      required
      disabled={disabled}
      className="mt-1 block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-inner bg-gray-900 text-teal-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-lg"
      placeholder="e.g., 50.00"
    />
  </div>
);

export default BonusConfigurationPage;
