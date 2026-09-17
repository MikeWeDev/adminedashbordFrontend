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
    registrationBonusLimit: number; // The controllable limit
    registrationBonusCount: number; // The read-only counter
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
    registrationBonusLimit: number | string; // Input field for limit
     registrationBonusCount: number | string;
    
    // UI fields for time (managed locally for user convenience)
    // ⬇️ CHANGED: broadcastTimeLocal now stores the HH:MM AM/PM string (e.g., "02:30 PM")
    broadcastTimeLocal: string; 
    broadcastMinute: string;    // The minute part of the CRON schedule
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


// ----------------------------------------------------
// 💡 NEW HELPER FUNCTIONS FOR 12-HOUR FORMAT (UX)
// ----------------------------------------------------

/**
 * Converts 24-hour format (0-23) to 12-hour format (1-12 AM/PM).
 */
const formatHourTo12h = (hour24: number): { hour12: string, period: 'AM' | 'PM' } => {
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12Int = hour24 % 12 || 12; // 0 (midnight) and 12 (noon) become 12
    return { 
        hour12: String(hour12Int).padStart(2, '0'), // Pad 1-9 for consistent display (e.g., 09)
        period 
    };
};

/**
 * Converts 12-hour format components back to 24-hour format (0-23).
 */
const parse12hTo24h = (hour12Str: string, period: 'AM' | 'PM'): number => {
    const hour12 = parseInt(hour12Str, 10);
    if (isNaN(hour12) || hour12 < 1 || hour12 > 12) return 0; // Default to midnight on error

    if (period === 'AM') {
        // 12 AM (midnight) is 0 in 24h
        return hour12 === 12 ? 0 : hour12;
    } else { // PM
        // 12 PM (noon) is 12 in 24h
        return hour12 === 12 ? 12 : hour12 + 12;
    }
};

// ----------------------------------------------------
// 🔄 UPDATED CRON PARSING FUNCTION
// ----------------------------------------------------

/**
 * Parses a CRON string ('30 11 * * *') to extract the minute and hour (UTC).
 * Returns the local hour (EAT) in 12-hour format for the UI.
 */
const parseCronToLocalTime = (cron: string) => {
    try {
        const parts = cron.split(/\s+/);
        if (parts.length < 2) throw new Error("Invalid CRON format.");
        
        const minute = parseInt(parts[0], 10);
        const utcHour = parseInt(parts[1], 10);

        if (isNaN(minute) || isNaN(utcHour)) throw new Error("Invalid numeric part in CRON.");

        // 1. Convert UTC Hour (backend) to Local 24-hour Hour (EAT)
        const localHour24 = convertUtcHourToLocal(utcHour);
        
        // 2. Convert Local 24-hour Hour to 12-hour format
        const { hour12, period } = formatHourTo12h(localHour24);

        // Format minute to MM (e.g., 9 -> 09)
        const minuteFormatted = String(minute).padStart(2, '0');

        return {
            // 💡 localTime is now the 12-hour HH:MM AM/PM string
            localTime: `${hour12}:${minuteFormatted} ${period}`, 
            minute: minuteFormatted,
            utcHour: utcHour,
            // 💡 Added localHour24 for display/debugging if needed
            localHour24: localHour24 
        };
    } catch (e) {
        console.error("Error parsing CRON schedule:", e);
        // Default fallback (e.g., 12:30 AM EAT)
        const defaultLocalHour24 = convertUtcHourToLocal(0); // UTC 0 to EAT 3
        const defaultTime12h = formatHourTo12h(defaultLocalHour24);
        return { 
            localTime: `${defaultTime12h.hour12}:30 ${defaultTime12h.period}`, 
            minute: "30", 
            utcHour: 0,
            localHour24: defaultLocalHour24 
        }; 
    }
};


// --- Main Dashboard Component ---
const BonusConfigurationPage = () => {
    // Initial state setup
    // Initial CRON '30 11 * * *' (UTC 11:30) converts to EAT 14:30 (2:30 PM)
    const initialCron = '30 11 * * *'; 
    const initialTimeData = parseCronToLocalTime(initialCron);

    const [state, setState] = useState<BonusState>({
        currentSettings: { 
            initiationBonus: 0, depositBonus: 0, weeklyTopPlayerBonus: 0, fiveWinDailyBonus: 0, registerationBonus: 0,
            claimLimitBonus: 50, bonusAmountClaimBonus: 10, broadcastCronSchedule: initialCron, 
            registrationBonusLimit: 2, // Matches default in your schema snippet
             registrationBonusCount: 0,
        },
        newSettings: { 
            initiationBonus: 0, depositBonus: 0, weeklyTopPlayerBonus: 0, fiveWinDailyBonus: 0, registerationBonus: 0,
            claimLimitBonus: 50, bonusAmountClaimBonus: 10, broadcastCronSchedule: initialCron, 
            broadcastTimeLocal: initialTimeData.localTime,
            broadcastMinute: initialTimeData.minute,
            registrationBonusLimit: 2,
            registrationBonusCount: 0,
        },
        isLoading: true,
        isSaving: false,
        error: null,
        message: null,
    });

    // NOTE: In a real Next.js app, NEXT_PUBLIC_API_BASE_URL should be defined in .env files.
    const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!BASE_URL) throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured.');
    const API_URL = `${BASE_URL}/api/bonus`; 

    // 1. Fetch current settings (fetchSettings remains largely the same, using the updated parseCronToLocalTime)
    const fetchSettings = useCallback(async () => {
        // ... (fetch logic remains the same) ...
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
                claimLimitBonus: data.claimLimitBonus ?? 1,                // Safely handle if the API returns the old name (bonusAmountClimBonus)
                bonusAmountClaimBonus: data.bonusAmountClaimBonus || data.bonusAmountClimBonus || 10, 
                broadcastCronSchedule: data.broadcastCronSchedule || initialCron,
                registrationBonusLimit: data.registrationBonusLimit ?? 2, // Use 2 as the default if not present
                registrationBonusCount: data.registrationBonusCount || 0, // Use 0 as the default if not present
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
                    registrationBonusLimit: fetchedSettings.registrationBonusLimit,
                    registrationBonusCount: fetchedSettings.registrationBonusCount,
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
        fetchSettings();
    }, [fetchSettings]); 

    // Handle input changes (handleChange remains largely the same, handling the 'broadcastTimeLocal' and 'broadcastMinute' strings)
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
    
    // ----------------------------------------------------
    // 🔄 UPDATED CRON GENERATION FUNCTION
    // ----------------------------------------------------
    
    // Convert the selected local time/minute back to the UTC CRON string on submission
    const getCronScheduleFromLocalTime = useMemo(() => {
        // Extract hour and minute from the local time string (e.g., "02:30 PM")
        const timeParts = state.newSettings.broadcastTimeLocal.split(' ');
        if (timeParts.length !== 2) return null; // Ensure format is correct

        const [hour12Str] = timeParts[0].split(':');
        const period = timeParts[1] as 'AM' | 'PM';
        
        // Use the minute from the separate state field
        const minute = parseInt(state.newSettings.broadcastMinute, 10);

        if (!hour12Str || !period || isNaN(minute)) {
             return null; 
        }

        // 1. Convert 12-hour format back to Local 24-hour hour (EAT)
        const localHour24 = parse12hTo24h(hour12Str, period);
        
        // 2. Convert Local 24-hour hour to UTC Hour (for the backend)
        const utcHour = convertLocalHourToUtc(localHour24);

        // CRON format: minute hour dayOfMonth month dayOfWeek
        return `${minute} ${utcHour} * * *`;
    }, [state.newSettings.broadcastTimeLocal, state.newSettings.broadcastMinute]);


    // 2. Submit update (handleSubmit remains the same, relying on the updated getCronScheduleFromLocalTime)
    const handleSubmit = async (e: React.FormEvent) => {
        // ... (submission logic remains the same) ...
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
            registrationBonusLimit: parseFloat(String(state.newSettings.registrationBonusLimit)) || 0,
            // ⭐ INCLUDE THE READ-ONLY COUNT from the current state
            registrationBonusCount: parseFloat(String(state.newSettings.registrationBonusCount)) || 0,
        };
        
        // Check for negative values across all numeric fields
        const numericValues = [
            submissionData.initiationBonus, submissionData.depositBonus, submissionData.weeklyTopPlayerBonus, 
            submissionData.fiveWinDailyBonus, submissionData.registerationBonus, submissionData.claimLimitBonus,
            submissionData.bonusAmountClaimBonus,
            submissionData.registrationBonusLimit
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
                registrationBonusLimit: result.settings?.registrationBonusLimit || 0,
               registrationBonusCount: result.settings?.registrationBonusCount || 0,
            };
            
            const timeData = parseCronToLocalTime(savedSettings.broadcastCronSchedule);
            
            setState((s) => ({
                ...s,
                currentSettings: savedSettings, 
                newSettings: {
                    ...savedSettings,
                    broadcastTimeLocal: timeData.localTime,
                    broadcastMinute: timeData.minute,
                    registrationBonusLimit: savedSettings.registrationBonusLimit,
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

    // ----------------------------------------------------
    // 🎨 UI RENDER LOGIC (No major change here, relies on updated TimeInputGroup)
    // ----------------------------------------------------

    return (
        <div className="h-full bg-gray-900 text-gray-100 p-4 sm:p-6 font-sans flex flex-col">
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
                                {/* NEW SETTING (String) - Show local time in 12h format and UTC hour */}
                                <SettingDisplay 
                                    title={`Broadcast Time (${TARGET_TIME_ZONE})`} 
                                    value={currentLocalTimeData.localTime} 
                                    icon="⏰" 
                                    subtext={`(Stored as UTC Hour: ${currentLocalTimeData.utcHour})`}
                                />
                               <SettingDisplay 
                                       title="Registration Limit (Total Users)" 
                                       value={currentSettings.registrationBonusLimit} 
                                       icon="👥" 
                                           />
                            {/* ⭐ NEW FIELD DISPLAY (COUNT) */}
                            <SettingDisplay 
                                title="Registration Users Claimed" 
                                value={currentSettings.registrationBonusCount} 
                                icon="📈" 
                                subtext={`Progress: ${((currentSettings.registrationBonusCount / currentSettings.registrationBonusLimit) * 100).toFixed(2)}%`}
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
                                    
                                    {/* Existing Inputs (Numeric) */}
                                    <InputField label="New Invitation Bonus Amount" name="initiationBonus" value={newSettings.initiationBonus} onChange={handleChange} disabled={isSaving} />
                                    <InputField label="New Deposit Bonus Amount" name="depositBonus" value={newSettings.depositBonus} onChange={handleChange} disabled={isSaving} />
                                    <InputField label="New Registration Bonus Amount" name="registerationBonus" value={newSettings.registerationBonus} onChange={handleChange} disabled={isSaving} />
                                    <InputField label="New Weekly Top Player Bonus" name="weeklyTopPlayerBonus" value={newSettings.weeklyTopPlayerBonus} onChange={handleChange} disabled={isSaving} />
                                    <InputField label="New 5-Win Daily Streak Bonus" name="fiveWinDailyBonus" value={newSettings.fiveWinDailyBonus} onChange={handleChange} disabled={isSaving} />
                                    <InputField label="New Max Bonus Claims Per Day" name="claimLimitBonus" value={newSettings.claimLimitBonus} onChange={handleChange} disabled={isSaving} />
                                    <InputField label="New Claim Bonus Amount" name="bonusAmountClaimBonus" value={newSettings.bonusAmountClaimBonus} onChange={handleChange} disabled={isSaving} />
                                    <InputField 
                                        label="New Registration Bonus Limit (Users)" 
                                        name="registrationBonusLimit" 
                                        value={newSettings.registrationBonusLimit} 
                                        onChange={handleChange} 
                                        disabled={isSaving} 
                                    />
                                    {/* ⭐ NEW INPUT FIELD FOR MANUAL COUNT UPDATE/RESET */}
                                    <InputField 
                                        label="New Registration Count (Manual Reset)" 
                                        name="registrationBonusCount" 
                                        value={newSettings.registrationBonusCount} 
                                        onChange={handleChange} 
                                        disabled={isSaving} 
                                    />
                                    {/* 🔄 UPDATED TIME INPUT */}
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
                                    NOTE: Broadcast schedule is converted from **{TARGET_TIME_ZONE}** to UTC before saving to the database. The CRON string is generated as: <span className="font-mono bg-gray-700 p-1 rounded text-xs text-yellow-300">{getCronScheduleFromLocalTime || 'Error generating CRON'}</span>
                                </p>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Helper Component for Display (No changes) ---
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


const InputField: React.FC<{ 
    label: string; 
    name: keyof Omit<BonusSettings, 'broadcastCronSchedule'>; // name is one of the numeric fields
    value: string | number; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    disabled: boolean; 
}> = ({ label, name, value, onChange, disabled }) => (
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
            // ⭐ UPDATED: Use step="1" for limit fields, otherwise use step="0.01"
            step={['claimLimitBonus', 'registrationBonusLimit'].includes(name as string) ? "1" : "0.01"}
            min="0"
            required
            disabled={disabled}
            className="mt-1 block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-inner bg-gray-900 text-teal-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-lg"
            placeholder={['claimLimitBonus', 'registrationBonusLimit'].includes(name as string) ? "e.g., 50" : "e.g., 50.00"}
        />
    </div>
);
// ----------------------------------------------------
// 🔄 UPDATED TIME INPUT GROUP COMPONENT
// ----------------------------------------------------

// --- Time Input Group Component ---
const TimeInputGroup: React.FC<{ localTime: string; minute: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; disabled: boolean; }> = ({ localTime, minute, onChange, disabled }) => {
    
    // Generate options for 12-hour format (01 to 12)
    const hours12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

    // 💡 1. Dynamically generate minutes in steps of 5 from 00 to 55
    const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

    const periods: ('AM' | 'PM')[] = ['AM', 'PM'];
    
    // Extract the currently selected 12-hour hour (HH) and period (AM/PM)
    const timeParts = localTime.split(' '); // e.g., ["02:30", "PM"]
    const currentHour12 = timeParts[0]?.split(':')[0] || '12'; // Default hour
    const currentPeriod = timeParts[1] || 'PM'; // Default period

    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newHour12 = e.target.value;
        const newTime = `${newHour12}:${minute} ${currentPeriod}`;
        onChange({ target: { name: 'broadcastTimeLocal', value: newTime } } as React.ChangeEvent<HTMLSelectElement>);
    };

    const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPeriod = e.target.value;
        const newTime = `${currentHour12}:${minute} ${newPeriod}`;
        onChange({ target: { name: 'broadcastTimeLocal', value: newTime } } as React.ChangeEvent<HTMLSelectElement>);
    };

    return (
        <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
                New Broadcast Time (**12-Hour**) ({TARGET_TIME_ZONE})
            </label>
            <div className="flex space-x-2">
                
                {/* Hour Selector (HH) in 12h format */}
                <select
                    name="broadcastHour12"
                    value={currentHour12}
                    onChange={handleHourChange}
                    required
                    disabled={disabled}
                    className="mt-1 block w-full px-4 py-3 border border-gray-700 rounded-xl shadow-inner bg-gray-900 text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-150 text-lg font-mono appearance-none"
                >
                    {hours12.map(h => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
                
                {/* Minute Selector (MM) - Updated to show 00 through 55 in 5-min increments */}
                <select
                    name="broadcastMinute"
                    value={minute}
                    onChange={onChange}
                    required
                    disabled={disabled}
                    className="mt-1 block w-24 px-2 py-3 border border-gray-700 rounded-xl shadow-inner bg-gray-900 text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-150 text-lg font-mono appearance-none"
                >
                    {minutes.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>

                {/* AM/PM Selector */}
                <select
                    name="broadcastPeriod"
                    value={currentPeriod}
                    onChange={handlePeriodChange}
                    required
                    disabled={disabled}
                    className="mt-1 block w-20 px-2 py-3 border border-gray-700 rounded-xl shadow-inner bg-gray-900 text-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-150 text-lg font-mono appearance-none"
                >
                    {periods.map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>

            </div>
            <p className="text-xs text-gray-500 mt-1">Select the desired hour, minute (5-min intervals), and AM/PM in EAT.</p>
        </div>
    );
};

export default BonusConfigurationPage;
