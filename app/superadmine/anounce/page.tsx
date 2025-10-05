'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { PlusCircle, Trash2, Zap, Link } from 'lucide-react';

// --- Button Editor Utilities and Interfaces ---
interface Announcement {
    _id: string;
    userId: string;
    messageId: number;
    messageContent: string;
    sentAt: string;
}

interface Button {
    id: string;
    text: string;
    data: string;
}

// Utility function to check if the data is a URL
const isURL = (data: string) => data.startsWith('http://') || data.startsWith('https://');

// Internal structure for managing buttons
const parseButtonsString = (buttonsString: string): Button[] => {
    if (!buttonsString) return [];
    return buttonsString.split(',').map((button, index) => {
        const [text = '', data = ''] = button.split('|');
        return {
            // Use a simple index key for initial parsing for stability
            id: `btn-init-${index}`, 
            text: text.trim(),
            data: data.trim(),
        };
    });
};

/**
 * Converts the structured array back into the required comma/pipe string format.
 */
const serializeButtons = (buttonArray: Button[]): string => {
    return buttonArray
        .map(btn => {
            // Ensure there's both text and data before including the button
            if (btn.text.trim() && btn.data.trim()) {
                return `${btn.text.trim()}|${btn.data.trim()}`;
            }
            return ''; // Return an empty string for buttons to be filtered out
        })
        .filter(str => str !== '') // Filter out empty strings
        .join(',');
};

// =========================================================================
// 1. CHANGE: Set the default text ('Play') and callback ('PLAY')
// Original: 'Acknowledge|ACK_YES,View Details|DETAILS_BTN'
const INITIAL_BUTTON_STRING = 'Play|Play';
// =========================================================================


// --- MEMOIZED BUTTON INPUT COMPONENT (The Definitive Fix) ---
interface ButtonInputItemProps {
    btn: Button;
    isSending: boolean;
    onButtonChange: (id: string, field: keyof Button, value: string) => void;
    onDeleteButton: (id: string) => void;
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: ButtonInputItemProps, nextProps: ButtonInputItemProps) => {
    // We only re-render if the core data for THIS button, or the sending state, changes.
    // The handler functions (onButtonChange, onDeleteButton) are stable due to useCallback, so they aren't checked.
    return (
        prevProps.btn.id === nextProps.btn.id &&
        prevProps.btn.text === nextProps.btn.text &&
        prevProps.btn.data === nextProps.btn.data &&
        prevProps.isSending === nextProps.isSending
    );
};

const ButtonInputItem = memo(
    ({ btn, isSending, onButtonChange, onDeleteButton }: ButtonInputItemProps) => {
        return (
            <div className="flex flex-col sm:flex-row gap-3 p-3 border border-indigo-300 rounded-lg bg-white shadow-sm items-center">
                
                {/* Button Text Input */}
                <div className="flex-1 w-full">
                    <label className="text-xs font-medium text-gray-500 block mb-1">Button Text</label>
                    <input
                        type="text"
                        value={btn.text}
                        // KEY FIX: This input is controlled by btn.text
                        onChange={(e) => onButtonChange(btn.id, 'text', e.target.value)}
                        placeholder="e.g., Start Deposit"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isSending}
                    />
                </div>

                {/* Separator Icon */}
                <div className="hidden sm:block text-2xl font-bold text-gray-400">|</div>
                
                {/* Data/URL Input */}
                <div className="flex-1 w-full relative">
                    <label className="text-xs font-medium text-gray-500 block mb-1 flex items-center">
                        {isURL(btn.data) ? <Link className="w-4 h-4 mr-1 text-green-500" /> : <Zap className="w-4 h-4 mr-1 text-purple-500" />}
                        {isURL(btn.data) ? 'URL (Link)' : 'Callback Data (Action)'}
                    </label>
                    <input
                        type="text"
                        value={btn.data}
                        // KEY FIX: This input is controlled by btn.data
                        onChange={(e) => onButtonChange(btn.id, 'data', e.target.value)}
                        placeholder={isURL(btn.data) ? "https://your.website.com" : "e.g., DEPOSIT_NOW_ACTION"}
                        className={`w-full p-2 border rounded-md text-sm transition duration-150 focus:ring-indigo-500 focus:border-indigo-500 ${isURL(btn.data) ? 'border-green-300' : 'border-purple-300'}`}
                        disabled={isSending}
                    />
                </div>

                {/* Delete Button */}
                <button
                    type="button"
                    onClick={() => onDeleteButton(btn.id)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full transition duration-150 self-end sm:self-center shrink-0 disabled:opacity-50"
                    aria-label="Delete button"
                    disabled={isSending}
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        );
    },
    arePropsEqual // Apply the custom comparison here
);

ButtonInputItem.displayName = 'ButtonInputItem';
// --- END MEMOIZED BUTTON INPUT COMPONENT ---


// --- Main Component ---
export default function BroadcastPage() {
    // =========================================================================
    // 2. CHANGE: Set the default message text
    // Original: const [message, setMessage] = useState<string>('');
    const DEFAULT_MESSAGE = 'players Are Active ባለ 10 ብር bingo አሁን ይጫወቱ 🎮🎮';
    const [message, setMessage] = useState<string>(DEFAULT_MESSAGE);
    // =========================================================================
    const [image, setImage] = useState<File | null>(null);
    const [status, setStatus] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
    
    // Structured array for editor and final string for backend
    const [structuredButtons, setStructuredButtons] = useState<Button[]>(parseButtonsString(INITIAL_BUTTON_STRING));
    const [callbackButtonsString, setCallbackButtonsString] = useState<string>(INITIAL_BUTTON_STRING);

    const API_BASE_URL = 'https://adminbackend.bingoogame.com/api/broadcast';

    // Effect to serialize the structured array into the final string
    useEffect(() => {
        const serialized = serializeButtons(structuredButtons);
        setCallbackButtonsString(serialized);
    }, [structuredButtons]);


    // --- Button Editor Handlers (wrapped in useCallback for memoized child) ---
    const handleAddButton = useCallback(() => {
        setStructuredButtons(prev => [
            ...prev,
            // Use a reliably unique ID here
            { id: `btn-new-${Date.now()}`, text: '', data: '' } 
        ]);
    }, []);

    const handleButtonChange = useCallback((id: string, field: keyof Button, value: string) => {
        // Correct immutability ensures object references are only updated for the changed button
        setStructuredButtons(prev => 
            prev.map(btn => 
                btn.id === id ? { ...btn, [field]: value } : btn
            )
        );
    }, []);

    const handleDeleteButton = useCallback((id: string) => {
        setStructuredButtons(prev => prev.filter(btn => btn.id !== id));
    }, []);
    // --- End Button Editor Handlers ---

    const fetchAnnouncements = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/announcements`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch announcements: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data: Announcement[] = await response.json();
            const uniqueAnnouncementsMap = new Map<string, Announcement>();
            data.forEach(announcement => {
                const existing = uniqueAnnouncementsMap.get(announcement.messageContent);
                if (!existing || new Date(announcement.sentAt) > new Date(existing.sentAt)) {
                    uniqueAnnouncementsMap.set(announcement.messageContent, announcement);
                }
            });
            const uniqueAnnouncements = Array.from(uniqueAnnouncementsMap.values());
            uniqueAnnouncements.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
            setAnnouncements(uniqueAnnouncements);
            setCurrentMessageIndex(0);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Error fetching announcements:', error);
            setHistoryError(errorMessage);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        } else {
            setImage(null);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            setStatus('Please enter a message to send.');
            return;
        }
        
        setIsSending(true);
        setStatus('Sending broadcast...');
        const formData = new FormData();
        formData.append('message', message);
        
        formData.append('callbackButtons', callbackButtonsString); 
        
        if (image) formData.append('image', image);

        
        try {
            const response = await fetch(API_BASE_URL, { method: 'POST', body: formData });
            if (!response.ok) {
                const errorText = await response.text();
                setStatus(`❌ Server error: ${response.status} ${response.statusText}.`);
                return;
            }
            const data = await response.json();
            setStatus(`✅ Broadcast successful! Details: ${data.details.sentTo} sent, ${data.details.failedTo} failed.`);
            setMessage(DEFAULT_MESSAGE); // Reset message to default after successful send
            setImage(null);
            // After successful send, reset the editor to a clean state
            setStructuredButtons(parseButtonsString(INITIAL_BUTTON_STRING));
            fetchAnnouncements();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Network or parsing error:', errorMessage);
            setStatus('❌ Failed to send broadcast due to a network or parsing error.');
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteClick = (announcement: Announcement) => {
        setAnnouncementToDelete(announcement);
        setShowConfirmModal(true);
    };

    const confirmDeleteAction = async () => {
        if (!announcementToDelete) return;
        setAnnouncements(announcements.filter(item => item.messageContent !== announcementToDelete.messageContent));
        setShowConfirmModal(false);
        setStatus('Deleting announcement...');
        try {
            const response = await fetch(`${API_BASE_URL}/delete-all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageContent: announcementToDelete.messageContent }),
            });
            if (!response.ok) throw new Error(await response.text());
            await fetchAnnouncements();
            setStatus('✅ Announcement deleted successfully!');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Error deleting announcement:', errorMessage);
            // Re-add the deleted item if the API call fails
            setAnnouncements(prev => [...prev, announcementToDelete]); 
            setStatus(`❌ Failed to delete announcement: ${errorMessage}`);
        } finally {
            setAnnouncementToDelete(null);
        }
    };

    const currentAnnouncement = announcements.length > 0 ? announcements[currentMessageIndex] : null;

    // --- Button Editor Component (Inline for Single File) ---
    const ButtonEditor = () => (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <h3 className="text-md font-semibold text-blue-800 mb-3 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-blue-500" />
                Inline Callback Buttons
            </h3>
            <p className="text-xs text-gray-600 mb-4">
                Add buttons below your message. Use **Callback** for bot actions or **URL** for external links.
            </p>

            <div className="space-y-3">
                {structuredButtons.map((btn) => (
                    // The unique key combined with the custom memoization should stabilize the inputs
                    <ButtonInputItem 
                        key={btn.id}
                        btn={btn}
                        isSending={isSending}
                        onButtonChange={handleButtonChange}
                        onDeleteButton={handleDeleteButton}
                    />
                ))}
            </div>

            {/* Add Button */}
            <button
                type="button"
                onClick={handleAddButton}
                className="mt-4 flex items-center justify-center w-full py-2 px-4 border border-dashed border-blue-400 text-blue-700 rounded-lg hover:bg-blue-100 transition duration-150 disabled:opacity-50"
                disabled={isSending}
            >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add New Button
            </button>
            
            {/* Backend Output Preview (For confirmation) */}
            <div className="mt-4 pt-3 border-t border-blue-200">
                <label className="text-xs font-medium text-gray-500 block mb-1">Backend Payload String:</label>
                <div className="p-2 bg-gray-100 rounded text-xs font-mono break-all border border-gray-300">
                    {callbackButtonsString || "No buttons defined"}
                </div>
            </div>
        </div>
    );
    // --- End Button Editor Component ---


    return (
        <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8 font-sans">
            {/* --- Broadcast Form --- */}
            <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4 text-gray-800">Send New Broadcast</h1>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <form onSubmit={handleBroadcast}>
                        <div className="mb-4">
                            <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">Message Content</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                rows={8}
                                className="shadow-sm border border-gray-300 rounded-xl w-full py-3 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out"
                                placeholder="Type your announcement here..."
                                disabled={isSending}
                            />
                        </div>
                        
                        <div className="mb-6">
                            <ButtonEditor />
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="image" className="block text-gray-700 font-semibold mb-2">Attach Image (Optional)</label>
                            <input
                                type="file"
                                id="image"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleImageChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                disabled={isSending}
                            />
                        </div>
                        {image && (
                            <div className="mb-4 p-2 border rounded-xl bg-gray-50 flex justify-center">
                                <img src={URL.createObjectURL(image)} alt="Preview" className="max-h-40 rounded-xl shadow-sm" />
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <button
                                type="submit"
                                className={`flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-6 rounded-2xl shadow-md hover:bg-blue-700 transition duration-300 ease-in-out ${isSending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Send Broadcast'}
                            </button>
                            {status && <p className="text-gray-600 text-sm mt-2 sm:mt-0">{status}</p>}
                        </div>
                    </form>
                </div>
            </div>

            {/* --- Broadcast History --- */}
            <div className="flex-1 mt-8 md:mt-0">
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Broadcast History</h2>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 h-96 flex flex-col justify-between">
                    {isLoadingHistory ? (
                        <div className="flex-1 flex justify-center items-center">
                            <p className="text-gray-500">Loading history...</p>
                        </div>
                    ) : historyError ? (
                        <div className="flex-1 flex justify-center items-center text-red-500">
                            <p>Error loading history: {historyError}</p>
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="flex-1 flex justify-center items-center">
                            <p className="text-gray-500">No announcements found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto">
                                <p className="text-gray-800 text-lg whitespace-pre-wrap">{currentAnnouncement?.messageContent}</p>
                                <div className="text-right text-gray-500 text-sm mt-4">
                                    <time>{new Date(currentAnnouncement?.sentAt || '').toLocaleString()}</time>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setCurrentMessageIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentMessageIndex === 0}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-2xl disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">{currentMessageIndex + 1} of {announcements.length}</span>
                                <button
                                    onClick={() => setCurrentMessageIndex(prev => Math.min(announcements.length - 1, prev + 1))}
                                    disabled={currentMessageIndex === announcements.length - 1}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-2xl disabled:opacity-50 transition-colors"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => currentAnnouncement && handleDeleteClick(currentAnnouncement)}
                                    className="ml-4 text-red-500 hover:text-red-700 transition duration-200 ease-in-out p-1 rounded-full hover:bg-red-100 focus:outline-none"
                                    aria-label="Delete announcement"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- Confirm Delete Modal --- */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-300 w-11/12 md:w-1/3">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete this announcement?</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-6 py-2 rounded-xl text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAction}
                                className="px-6 py-2 rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}