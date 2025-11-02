'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Type Definitions ---
interface BonusSettings {
    initiationBonus: number;
    depositBonus: number;
    weeklyTopPlayerBonus: number;
    fiveWinDailyBonus: number;
    registerationBonus: number;
    claimLimitBonus: number;
    // CORRECTED FIELD NAME (Assuming this is the correct field name from the latest schema)
    bonusAmountClaimBonus: number; 
    broadcastCronSchedule: string;
}

// Flexible type for NewSettings to allow temporary string input (including empty string)
interface NewBonusSettings {
    initiationBonus: number | string;
    depositBonus: number | string;
    weeklyTopPlayerBonus: number | string;
    fiveWinDailyBonus: number | string;
    registerationBonus: number | string;
    claimLimitBonus: number | string;
    // CORRECTED FIELD NAME
    bonusAmountClaimBonus: number | string; 
    broadcastCronSchedule: string; // The raw CRON string (Minute Hour DayofMonth Month DayofWeek)
    
    // UI fields for time (managed locally for user convenience)
    broadcastTimeLocal: string; // HH:MM string in local time (EAT)
    broadcastMinute: string;    // The minute part of the CRON schedule
}

interface BonusState {
    currentSettings: BonusSettings;
    newSettings: NewBonusSettings;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    message: string | null;
}

// Define EAT time zone offset (UTC+3)
const EAT_OFFSET_HOURS = 3;
const TARGET_TIME_ZONE = "EAT (UTC+3)"; // For display purposes

// Helper function for type-safe error message extraction
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

// --- Time Zone Conversion Helpers ---

/**
 * Converts a UTC hour (0-23) to an EAT hour (0-23).
 * EAT = UTC + 3
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const convertUtcHourToLocal = (utcHour: number): number => {
    // Add the offset and ensure it wraps around 24 hours
    return (utcHour + EAT_OFFSET_HOURS) % 24;
};

/**
 * Converts a Local (EAT) hour (0-23) back to a UTC hour (0-23).
 * UTC = EAT - 3
 */
const convertLocalHourToUtc = (localHour: number): number => {
    // Subtract the offset and ensure it wraps around 24 hours (JavaScript % handles negatives oddly, so add 24)
    return (localHour - EAT_OFFSET_HOURS + 24) % 24;
};

/**
 * Parses a CRON string ('30 11 * * *') to extract the minute and hour (UTC).
 * Returns the local hour and minute for the UI.
 */
const parseCronToLocalTime = (cron: string) => {
    try {
        const parts = cron.split(/\s+/);
        if (parts.length < 2) throw new Error("Invalid CRON format.");
        
        const minute = parseInt(parts[0], 10);
        const utcHour = parseInt(parts[1], 10);

        if (isNaN(minute) || isNaN(utcHour)) throw new Error("Invalid numeric part in CRON.");

        const localHour = convertUtcHourToLocal(utcHour);

        // Format hour to HH and minute to MM (e.g., 9 -> 09)
        const localHourFormatted = String(localHour).padStart(2, '0');
        const minuteFormatted = String(minute).padStart(2, '0');

        return {
            localTime: `${localHourFormatted}:${minuteFormatted}`,
            minute: minuteFormatted,
            utcHour: utcHour
        };
    } catch (e) {
        console.error("Error parsing CRON schedule:", e);
        return { localTime: "00:30", minute: "30", utcHour: 0 }; // Default fallback
    }
};


// --- Main Dashboard Component ---
const BonusConfigurationPage = () => {
    // Initial state setup
    const initialCron = '30 11 * * *'; // Default value from schema
    const initialTimeData = parseCronToLocalTime(initialCron);

    const [state, setState] = useState<BonusState>({
        currentSettings: { 
            initiationBonus: 0, depositBonus: 0, weeklyTopPlayerBonus: 0, fiveWinDailyBonus: 0, registerationBonus: 0,
            claimLimitBonus: 50, bonusAmountClaimBonus: 10, broadcastCronSchedule: initialCron, 
        },
        newSettings: { 
            initiationBonus: 0, depositBonus: 0, weeklyTopPlayerBonus: 0, fiveWinDailyBonus: 0, registerationBonus: 0,
            claimLimitBonus: 50, bonusAmountClaimBonus: 10, broadcastCronSchedule: initialCron, 
            broadcastTimeLocal: initialTimeData.localTime,
            broadcastMinute: initialTimeData.minute,
        },
        isLoading: true,
        isSaving: false,
        error: null,
        message: null,
    });

    // NOTE: In a real Next.js app, NEXT_PUBLIC_API_BASE_URL should be defined in .env files.
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
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

            // Destructure and default all fields from the API response
            const fetchedSettings: BonusSettings = {
                initiationBonus: data.initiationBonus || 0,
                depositBonus: data.depositBonus || 0,
                weeklyTopPlayerBonus: data.weeklyTopPlayerBonus || 0,
                fiveWinDailyBonus: data.fiveWinDailyBonus || 0,
                registerationBonus: data.registerationBonus || 0,
                claimLimitBonus: data.claimLimitBonus || 50,
                // Safely handle if the API returns the old name (bonusAmountClimBonus)
                bonusAmountClaimBonus: data.bonusAmountClaimBonus || data.bonusAmountClimBonus || 10, 
                broadcastCronSchedule: data.broadcastCronSchedule || initialCron,
            };

            const timeData = parseCronToLocalTime(fetchedSettings.broadcastCronSchedule);

            setState((s) => ({
                ...s,
                currentSettings: fetchedSettings,
                // Initialize form fields with current values, and set local time fields
                newSettings: {
                    ...fetchedSettings,
                    broadcastTimeLocal: timeData.localTime,
                    broadcastMinute: timeData.minute,
                }, 
                isLoading: false,
            }));
        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            console.error('Fetch error:', err);
            setState((s) => ({
                ...s,
                error: errorMessage,
                isLoading: false,
            }));
        }
    }, [API_URL, initialCron]);

    useEffect(() => {
        // Warning 1: Fixed by using useCallback for fetchSettings
        fetchSettings();
    }, [fetchSettings]); 

    // Handle input changes (handles both number and string fields)
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Handle numeric fields
        if (name !== 'broadcastCronSchedule' && name !== 'broadcastTimeLocal' && name !== 'broadcastMinute') {
            const isNumericField = true;
            if (value === "" || /^\d*(\.\d*)?$/.test(value)) {
                setState((s) => ({
                    ...s,
                    newSettings: {
                        ...s.newSettings,
                        [name]: isNumericField ? (value === "" ? "" : value) : value, 
                    } as NewBonusSettings,
                    message: null,
                    error: null,
                }));
            } else if (isNumericField) {
                setState(s => ({ ...s, error: `Invalid number format for ${name}.`, message: null }));
            }
        } 
        
        // Handle time fields (local time or minute selection)
        else if (name === 'broadcastTimeLocal' || name === 'broadcastMinute') {
            setState((s) => ({
                ...s,
                newSettings: {
                    ...s.newSettings,
                    [name]: value,
                } as NewBonusSettings,
                message: null,
                error: null,
            }));
        } 
        
        // Handle raw CRON field (if exposed, though we hide it now)
        else {
             setState((s) => ({
                ...s,
                newSettings: {
                    ...s.newSettings,
                    [name]: value,
                } as NewBonusSettings,
                message: null,
                error: null,
            }));
        }
    };
    
    // Convert the selected local time/minute back to the UTC CRON string on submission
    const getCronScheduleFromLocalTime = useMemo(() => {
        // Extract hour and minute from the local time string (e.g., "14:30")
        const [localHourStr] = state.newSettings.broadcastTimeLocal.split(':');
        
        const localHour = parseInt(localHourStr, 10);
        const minute = parseInt(state.newSettings.broadcastMinute, 10);

        if (isNaN(localHour) || isNaN(minute)) {
            return null; // Should be handled by form validation/defaults
        }

        const utcHour = convertLocalHourToUtc(localHour);

        // CRON format: minute hour dayOfMonth month dayOfWeek
        return `${minute} ${utcHour} * * *`;
    }, [state.newSettings.broadcastTimeLocal, state.newSettings.broadcastMinute]);


    // 2. Submit update
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (state.isSaving) return;
        
        const finalCronSchedule = getCronScheduleFromLocalTime;
        if (!finalCronSchedule) {
            setState(s => ({ ...s, error: "Invalid broadcast time selected.", isSaving: false }));
            return;
        }

        setState((s) => ({ ...s, isSaving: true, message: null, error: null }));

        // Pre-submission validation and parsing
        const submissionData: BonusSettings = {
            initiationBonus: parseFloat(String(state.newSettings.initiationBonus)) || 0,
            depositBonus: parseFloat(String(state.newSettings.depositBonus)) || 0,
            weeklyTopPlayerBonus: parseFloat(String(state.newSettings.weeklyTopPlayerBonus)) || 0,
            fiveWinDailyBonus: parseFloat(String(state.newSettings.fiveWinDailyBonus)) || 0,
            registerationBonus: parseFloat(String(state.newSettings.registerationBonus)) || 0,
            claimLimitBonus: parseFloat(String(state.newSettings.claimLimitBonus)) || 0,
            // CORRECTED FIELD NAME
            bonusAmountClaimBonus: parseFloat(String(state.newSettings.bonusAmountClaimBonus)) || 0,
            // Use the calculated UTC CRON string
            broadcastCronSchedule: finalCronSchedule,
        };
        
        // Check for negative values across all numeric fields
        const numericValues = [
            submissionData.initiationBonus, submissionData.depositBonus, submissionData.weeklyTopPlayerBonus, 
            submissionData.fiveWinDailyBonus, submissionData.registerationBonus, submissionData.claimLimitBonus,
            submissionData.bonusAmountClaimBonus
        ];
        
        const hasNegative = numericValues.some(val => val < 0);

        if (hasNegative) {
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
            
            // Re-parse the saved CRON string back into local time fields
            const savedSettings: BonusSettings = {
                ...result.settings, 
                broadcastCronSchedule: result.settings?.broadcastCronSchedule || submissionData.broadcastCronSchedule,
                // Handle the API potentially sending the old 'Clim' field, ensuring the new one is prioritized/set
                bonusAmountClaimBonus: result.settings?.bonusAmountClaimBonus || result.settings?.bonusAmountClimBonus || 0,
            };
            
            const timeData = parseCronToLocalTime(savedSettings.broadcastCronSchedule);
            
            setState((s) => ({
                ...s,
                currentSettings: savedSettings, 
                newSettings: {
                    ...savedSettings,
                    broadcastTimeLocal: timeData.localTime,
                    broadcastMinute: timeData.minute,
                }, // Reset form fields to the newly saved values
                message: result.message || 'Settings saved successfully!',
                isSaving: false,
                error: null,
            }));

            setTimeout(() => setState((s) => ({ ...s, message: null })), 5000);

        } catch (err: unknown) {
            const errorMessage = getErrorMessage(err);
            console.error('Save error:', err);
            setState((s) => ({
                ...s,
                error: errorMessage,
                isSaving: false,
            }));
        }
    };

    const { currentSettings, newSettings, isLoading, isSaving, error, message } = state;

    // Determine the local time to display on the dashboard
    const currentLocalTimeData = useMemo(() => {
        return parseCronToLocalTime(currentSettings.broadcastCronSchedule);
    }, [currentSettings.broadcastCronSchedule]);

    return (
        <div className="h-full bg-gray-900 text-gray-100 p-4 sm:p-6 font-sans flex flex-col">
            {/* REMOVED: <script src="https://cdn.tailwindcss.com"></script> (Caused the Next.js compilation error) */}
            <div className="w-full max-w-5xl mx-auto flex flex-col h-full">
                
                {/* Header */}
                <header className="mb-6 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-teal-400 tracking-wider">
                        System Bonus & Automation Controls
                    </h1>
                    <p className="mt-1 text-gray-400 text-base sm:text-lg">
                        Manage global reward limits, amounts, and broadcast schedules.
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

                        {/* Main Content Area: Current Settings */}
                        <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border-t-4 border-teal-500">
                            <h2 className="text-lg font-bold mb-4 text-teal-400 border-b border-gray-700 pb-2">
                                Active Bonus Values & Limits
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                
                                {/* Existing Settings */}
                                <SettingDisplay title="Invitation Bonus" value={currentSettings.initiationBonus} icon="💸" />
                                <SettingDisplay title="Deposit Bonus" value={currentSettings.depositBonus} icon="💰" />
                                <SettingDisplay title="Registration Bonus" value={currentSettings.registerationBonus} icon="✅" />
                                <SettingDisplay title="Weekly Top Player Bonus" value={currentSettings.weeklyTopPlayerBonus} icon="🏆" />
                                <SettingDisplay title="5-Win Daily Streak Bonus" value={currentSettings.fiveWinDailyBonus} icon="✨" />
                                
                                {/* NEW SETTINGS (Numeric) */}
                                <SettingDisplay title="Max Bonus Claims Per Day" value={currentSettings.claimLimitBonus} icon="🛑" />
                                <SettingDisplay title="Claim Bonus Amount" value={currentSettings.bonusAmountClaimBonus} icon="🎁" />
                                {/* NEW SETTING (String) - Show both local and UTC */}
                                <SettingDisplay 
                                    title={`Broadcast Time (${TARGET_TIME_ZONE})`} 
                                    value={currentLocalTimeData.localTime} 
                                    icon="⏰" 
                                    subtext={`(Stored as UTC Hour: ${currentLocalTimeData.utcHour})`}
                                />

                            </div>
                        </div>

                        {/* Update Form (Card 2) */}
                        <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border-t-4 border-teal-500">
                            <h2 className="text-lg font-bold mb-6 text-teal-400 border-b border-gray-700 pb-2">
                                Modify Global Settings
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    
                                    {/* Existing Inputs */}
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
                                    <InputField
                                        label="New Registration Bonus Amount"
                                        name="registerationBonus" 
                                        value={newSettings.registerationBonus}
                                        onChange={handleChange}
                                        disabled={isSaving}
                                    />
                                    <InputField
                                        label="New Weekly Top Player Bonus"
                                        name="weeklyTopPlayerBonus"
                                        value={newSettings.weeklyTopPlayerBonus}
                                        onChange={handleChange}
                                        disabled={isSaving}
                                    />
                                    <InputField
                                        label="New 5-Win Daily Streak Bonus"
                                        name="fiveWinDailyBonus"
                                        value={newSettings.fiveWinDailyBonus}
                                        onChange={handleChange}
                                        disabled={isSaving}
                                    />
                                    
                                    {/* NEW INPUTS (Numeric) */}
                                    <InputField
                                        label="New Max Bonus Claims Per Day"
                                        name="claimLimitBonus"
                                        value={newSettings.claimLimitBonus}
                                        onChange={handleChange}
                                        disabled={isSaving}
                                    />
                                    <InputField
                                        label="New Claim Bonus Amount"
                                        name="bonusAmountClaimBonus" // Used corrected name
                                        value={newSettings.bonusAmountClaimBonus}
                                        onChange={handleChange}
                                        disabled={isSaving}
                                    />
                                    
                                    {/* NEW INPUT (Time Selector - Local Time) */}
                                    <TimeInputGroup
                                        localTime={newSettings.broadcastTimeLocal}
                                        minute={newSettings.broadcastMinute}
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
                                    '💾 SAVE ALL BONUS SETTINGS'
                                    )}
                                </button>
                                <p className="text-sm text-gray-500 text-center pt-2">
                                    NOTE: Broadcast schedule is converted from {TARGET_TIME_ZONE} to UTC before saving to the database. The CRON string is generated as: <span className="font-mono bg-gray-700 p-1 rounded text-xs text-yellow-300">{getCronScheduleFromLocalTime || 'Error generating CRON'}</span>
                                </p>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Helper Component for Display ---
const SettingDisplay: React.FC<{ title: string; value: string | number; icon: string; subtext?: string }> = ({ title, value, icon, subtext }) => (
    <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 shadow-inner flex items-center justify-between">
        <div>
            <div className="text-xl">{icon}</div>
            <span className="text-xs font-medium text-gray-400 block mt-1">{title}</span>
            {subtext && <span className="text-xs text-gray-500 block mt-1">{subtext}</span>}
        </div>
        <span className={`text-xl sm:text-2xl font-extrabold ${typeof value === 'string' ? 'text-yellow-400 text-right font-mono' : 'text-teal-400'}`}>
            {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
    </div>
);

// --- Helper Component for Numeric Input Fields ---
const InputField: React.FC<{ label: string; name: keyof Omit<BonusSettings, 'broadcastCronSchedule'>; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled: boolean; }> = ({ label, name, value, onChange, disabled }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
            {label}
        </label>
        <input
            type="number"
            id={name}
            name={name}
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

// --- Time Input Group Component ---
const TimeInputGroup: React.FC<{ localTime: string; minute: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; disabled: boolean; }> = ({ localTime, minute, onChange, disabled }) => {
    
    // Generate options for hours (00:00 to 23:00)
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    // Generate options for minutes (00, 15, 30, 45)
    const minutes = ['00', '15', '30', '45'];
    
    // Extract the currently selected hour (HH)
    const currentHour = localTime.split(':')[0];

    return (
        <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
                New Broadcast Time ({TARGET_TIME_ZONE})
            </label>
            <div className="flex space-x-2">
                {/* Hour Selector (HH) */}
                <select
                    name="broadcastTimeLocal"
                    value={currentHour}
                    onChange={(e) => {
                        // When hour changes, reconstruct the full HH:MM string for local state
                        const newHour = e.target.value;
                        const newTime = `${newHour}:${minute}`;
                        // Create a synthetic event object to pass to the main handler
                        onChange({ target: { name: 'broadcastTimeLocal', value: newTime } } as React.ChangeEvent<HTMLSelectElement>);
                    }}
                    required
                    disabled={disabled}
                    className="mt-1 block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-inner bg-gray-900 text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-150 text-lg font-mono appearance-none"
                >
                    {hours.map(h => (
                        <option key={h} value={h}>{h}:00</option>
                    ))}
                </select>

                {/* Minute Selector (MM) */}
                <select
                    name="broadcastMinute"
                    value={minute}
                    onChange={onChange}
                    required
                    disabled={disabled}
                    className="mt-1 block w-20 px-2 py-3 border border-gray-700 rounded-xl shadow-inner bg-gray-900 text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-150 text-lg font-mono appearance-none"
                >
                    {minutes.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">Select the desired hour and minute in EAT.</p>
        </div>
    );
};

export default BonusConfigurationPage;
