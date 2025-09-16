'use client';

import React, { useState, useEffect } from 'react';

interface Announcement {
    _id: string;
    userId: string;
    messageId: number;
    messageContent: string;
    sentAt: string;
}

export default function BroadcastPage() {
    const [message, setMessage] = useState<string>('');
    const [image, setImage] = useState<File | null>(null); // ✨ NEW: State to hold the image file
    const [status, setStatus] = useState<string>('');
    const [isSending, setIsSending] = useState<boolean>(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

    // fetchAnnouncements function remains the same
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

    // ✨ NEW: Handler for the file input change
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        } else {
            setImage(null);
        }
    };

    // 🔧 MODIFIED: handleBroadcast now sends FormData
    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!message.trim()) {
            setStatus('Please enter a message to send.');
            return;
        }

        setIsSending(true);
        setStatus('Sending broadcast...');

        // Create a FormData object to send both text and file
        const formData = new FormData();
        formData.append('message', message);
        if (image) {
            formData.append('image', image);
        }

        try {
            const response = await fetch('https://adminbackend.bingoogame.com/api/broadcast', {
                method: 'POST',
                // ⚠️ DO NOT set 'Content-Type' header. The browser will automatically set it to 'multipart/form-data' with the correct boundary.
                body: formData,
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server responded with an error:', errorText);
                setStatus(`❌ Server error: ${response.status} ${response.statusText}.`);
                return;
            }

            const data = await response.json();
            setStatus(`✅ Broadcast successful! Details: ${data.details.sentTo} sent, ${data.details.failedTo} failed.`);
            setMessage('');
            setImage(null); // Clear the image after sending
            
            fetchAnnouncements();

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error('Network or parsing error:', errorMessage);
            setStatus('❌ Failed to send broadcast due to a network or parsing error.');
        } finally {
            setIsSending(false);
        }
    };

    // handleDeleteClick and confirmDeleteAction remain the same
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

            // New endpoint to delete all instances of a message
            const response = await fetch('https://adminbackend.bingoogame.com/api/broadcast/delete-all', {
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
            setAnnouncements(prevAnnouncements => [...prevAnnouncements, announcementToDelete]);
            setStatus(`❌ Failed to delete announcement: ${errorMessage}`);
         } finally {
            setAnnouncementToDelete(null);
         }
     };
    
    const currentAnnouncement = announcements.length > 0 ? announcements[currentMessageIndex] : null;

    return (
        <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8 font-sans">
            <div className="flex-1">
                <h1 className="text-3xl font-bold mb-4 text-gray-800">Send New Broadcast</h1>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <form onSubmit={handleBroadcast}>
                        {/* Message Textarea */}
                        <div className="mb-4">
                            <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">Message Content</label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={8}
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200 ease-in-out"
                                placeholder="Type your announcement here..."
                                disabled={isSending}
                            />
                        </div>
                        
                        {/* ✨ NEW: Image Upload Input */}
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

                        {/* ✨ NEW: Image Preview */}
                        {image && (
                            <div className="mb-4 p-2 border rounded-lg bg-gray-50">
                                <p className="text-sm font-semibold text-gray-600 mb-2">Image Preview:</p>
                                <img src={URL.createObjectURL(image)} alt="Preview" className="max-h-40 rounded-md shadow-sm" />
                            </div>
                        )}

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

            {/* --- The Broadcast History and Modal sections remain unchanged --- */}
            <div className="flex-1 mt-8 md:mt-0">
                {/* ... your existing history JSX ... */}
            </div>
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 ...">
                     {/* ... your existing modal JSX ... */}
                </div>
            )}
        </div>
    );
}