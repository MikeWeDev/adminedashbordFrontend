'use client';

import React, { useState, useEffect } from 'react';

// Define the interface for an announcement to ensure type safety.
interface Announcement {
    _id: string;
    userId: string;
    messageId: number;
    messageContent: string;
    sentAt: string;
}

// Main component for the Broadcast page.
export default function BroadcastPage() {
    const [message, setMessage] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

    // Function to fetch and process announcements from the backend.
    const fetchAnnouncements = async () => {
        setIsLoadingHistory(true);
        setHistoryError(null);
        try {
            const response = await fetch('https://adminbackend.bingoogame.com/api/broadcast/announcements');
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch announcements: ${response.status} ${response.statusText} - ${errorText}`);
            }
            const data: Announcement[] = await response.json();

            // Consolidate announcements by message content to show unique messages.
            const uniqueAnnouncementsMap = new Map<string, Announcement>();
            data.forEach(announcement => {
                const existing = uniqueAnnouncementsMap.get(announcement.messageContent);
                // Keep the most recent announcement for each message content.
                if (!existing || new Date(announcement.sentAt) > new Date(existing.sentAt)) {
                    uniqueAnnouncementsMap.set(announcement.messageContent, announcement);
                }
            });
            const uniqueAnnouncements = Array.from(uniqueAnnouncementsMap.values());
            
            // Sort by most recent sentAt date.
            uniqueAnnouncements.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

            setAnnouncements(uniqueAnnouncements);
            setCurrentMessageIndex(0); // Reset index when new data is fetched.
        } catch (error: unknown) {
            // Fix: Changed 'any' to 'unknown' for better type safety.
            // Safely access the error message.
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Error fetching announcements:', error);
            setHistoryError(errorMessage);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Use a useEffect hook to fetch announcements when the component first mounts.
    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!message.trim()) {
            setStatus('Please enter a message to send.');
            return;
        }

        setIsSending(true);
        setStatus('Sending broadcast...');

        try {
            const response = await fetch('https://adminbackend.bingoogame.com/api/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server responded with an error:', errorText);
                setStatus(`❌ Server error: ${response.status} ${response.statusText}. Please check the server logs.`);
                return;
            }

            const data = await response.json();

            setStatus(`✅ Broadcast successful! Details: ${data.details.sentTo} sent, ${data.details.failedTo} failed.`);
            setMessage(''); 
            
            // Refresh the announcements list after a successful broadcast.
            fetchAnnouncements();

        } catch (error: unknown) {
            // Fix: Changed 'any' to 'unknown' for better type safety.
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Network or parsing error:', errorMessage);
            setStatus('❌ Failed to send broadcast due to a network or JSON parsing error. See console for details.');
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

        // Optimistically remove the item from the UI
        setAnnouncements(announcements.filter(item => item.messageContent !== announcementToDelete.messageContent));
        setShowConfirmModal(false);
        setStatus('Deleting announcement...'); // Provide feedback to the user

        try {
            // New endpoint to delete all instances of a message
            const response = await fetch('https://adminbackend.bingoogame.com/api/broadcast/delete-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageContent: announcementToDelete.messageContent }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText);
            }

            // Re-fetch to ensure the UI is in sync with the server.
            await fetchAnnouncements();
            setStatus('✅ Announcement deleted successfully!');
        } catch (error: unknown) {
            // Fix: Changed 'any' to 'unknown' for better type safety.
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Error deleting announcement:', errorMessage);
            
            // If the deletion fails, revert the UI change and show an error.
            setAnnouncements(prevAnnouncements => [...prevAnnouncements, announcementToDelete]);
            setStatus(`❌ Failed to delete announcement: ${errorMessage}`);
        } finally {
            setAnnouncementToDelete(null);
        }
    };
    
    // Check if an announcement exists before trying to access its properties.
    const currentAnnouncement = announcements.length > 0 ? announcements[currentMessageIndex] : null;

    return (
        <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8 font-sans">
            {/* Broadcast Form Section */}
            <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4 text-gray-800">Send New Broadcast</h1>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <form onSubmit={handleBroadcast}>
                        <div className="mb-4">
                            <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">Message Content</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={10}
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out"
                                placeholder="Type your announcement here..."
                                disabled={isSending}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                type="submit"
                                className={`flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-6 rounded-xl shadow-md hover:bg-blue-700 transition duration-300 ease-in-out ${isSending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Send Broadcast'}
                            </button>
                            {status && <p className="ml-4 text-sm font-medium text-gray-600">{status}</p>}
                        </div>
                    </form>
                </div>
            </div>

            {/* Broadcast History Section */}
            <div className="flex-1 mt-8 md:mt-0">
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Broadcast History</h2>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-96 flex flex-col justify-between">
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
                                    onClick={() => setCurrentMessageIndex(prevIndex => Math.max(0, prevIndex - 1))}
                                    disabled={currentMessageIndex === 0}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    {currentMessageIndex + 1} of {announcements.length}
                                </span>
                                <button
                                    onClick={() => setCurrentMessageIndex(prevIndex => Math.min(announcements.length - 1, prevIndex + 1))}
                                    disabled={currentMessageIndex === announcements.length - 1}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-xl disabled:opacity-50 transition-colors"
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

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-300 w-11/12 md:w-1/3">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete this announcement?</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAction}
                                className="px-6 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
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
