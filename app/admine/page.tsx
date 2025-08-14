'use client'; // This directive marks the component as a Client Component in Next.js
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DashboardCard } from '../components/DashboardCard'; // Component for displaying individual dashboard metrics
import { DashboardTable } from '../components/DashboardTable'; // Component for displaying the table of games played


/* ------------------- Session Check Hook ------------------- */
function useSessionCheck() {
  const router = useRouter();

  useEffect(() => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const expiry = localStorage.getItem('expiry');

    if (!username || !role || !expiry) {
      router.push('/auth/login');
      return;
    }

    const expiryTime = parseInt(expiry, 10);
    const now = new Date().getTime();

    if (now > expiryTime) {
      // Session expired → clear storage and redirect
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('expiry');
      router.push('/auth/login');
    }
  }, [router]);
}
/* ----------------------------------------------------------- */






/**
 * Interface defining the structure of the summary data fetched from the backend.
 * This ensures type safety for the dashboard's aggregate metrics.
 */
interface SummaryData {
  revenue: number; // Total successful deposits
  profit: number;  // Total profit recorded
  users: number;   // Total registered users
  gamesPlayed: { [key: number]: number }; // Object mapping stake amounts (e.g., 10, 20, 30 Birr) to the count of games played at that stake today
  totalGamesToday: number; // Total number of games played today across all stake amounts
}

/**
 * Interface defining the structure of a single game history entry fetched for the table.
 * This matches the data returned by the backend's '/games-today' endpoint.
 */
interface GameHistoryEntry {
  _id: string; // MongoDB document ID
  GameSessionId: string; // Unique ID for the game session
  gameId: string; // Logical ID of the game type
  playersCount: number; // Number of players in this game session
  stakeAmount: number; // Amount staked for this game session
  winnerTelegramId: string; // Telegram ID of the winner
  winnerUsername: string; // Username of the winner
  createdAt: string; // Timestamp when the game session was created
  endedAt: string | null; // Timestamp when the game session ended, can be null if ongoing or not properly closed
}

// Base URL for the backend API endpoints  
const API_URL = ' https://adminedashbordbackend.onrender.com/api/dashboard';

/**
 * Defines the default values for the summary data.
 * This is crucial for ensuring the dashboard components always have initial data to render,
 * preventing a blank UI if the API call fails or is still loading.
 */
const defaultSummary: SummaryData = {
  revenue: 0,
  profit: 0,
  users: 0,
  gamesPlayed: { 10: 0, 20: 0, 30: 0 }, // Explicitly initialize all expected stake amounts to 0
  totalGamesToday: 0,
};

/**
 * The main Home component for the Admin Dashboard.
 * It fetches and displays summary statistics and a list of games played today.
 */
export default function Home() {
    useSessionCheck(); // ✅ Check session immediately

  // State to hold the summary data for the dashboard cards.
  // Initialized with `defaultSummary` to ensure the UI always renders.
  const [summary, setSummary] = useState<SummaryData>(defaultSummary);
  
  // State to hold the list of game history entries for the table.
  // Initialized as an empty array. The DashboardTable component gracefully handles empty arrays.
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  
  // State to manage the loading status of the data fetch.
  const [loading, setLoading] = useState<boolean>(true);
  
  // State to store any error message that occurs during data fetching.
  const [error, setError] = useState<string | null>(null);

  /**
   * useEffect hook to fetch data when the component mounts.
   * The empty dependency array `[]` ensures this effect runs only once after the initial render.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reset error state at the start of a new fetch attempt
        setError(null); 
        setLoading(true); // Indicate loading has started

        // Use Promise.all to fetch summary and games data concurrently for efficiency
        const [summaryRes, gamesRes] = await Promise.all([
          fetch(`${API_URL}/summary`), // Fetch overall dashboard summary
          fetch(`${API_URL}/games-today`), // Fetch today's game history for the table
        ]);

        // --- Robust Error Handling ---

        // Check if the summary data response was successful (HTTP status 200-299)
        if (!summaryRes.ok) {
          // If not OK, throw an error with status and text for debugging
          throw new Error(`Failed to fetch summary data: ${summaryRes.status} ${summaryRes.statusText}`);
        }
        // Check if the games data response was successful
        if (!gamesRes.ok) {
          // If not OK, throw an error with status and text for debugging
          throw new Error(`Failed to fetch games data: ${gamesRes.status} ${gamesRes.statusText}`);
        }

        // Parse the JSON responses
        const summaryData = await summaryRes.json();
        const gamesData = await gamesRes.json();

        // Update the summary state.
        // We spread `defaultSummary` first to ensure all keys are present,
        // then overlay with `summaryData`.
        // Specifically for `gamesPlayed`, we do another merge to guarantee all
        // stake amounts (10, 20, 30) are explicitly represented, even if the backend
        // doesn't return counts for all of them.
        setSummary({
          ...defaultSummary, 
          ...summaryData,    
          gamesPlayed: {
            ...defaultSummary.gamesPlayed, // Ensure all 10, 20, 30 keys exist with default 0
            ...summaryData.gamesPlayed     // Override with actual fetched counts
          }
        });
        
        // Update the games state with the fetched data
        setGames(gamesData);

      } catch (err: unknown) { // ⭐ FIX: Changed 'any' to 'unknown'
        // Catch any errors during the fetch operation (network issues, JSON parsing errors,
        // or errors explicitly thrown by our `if (!res.ok)` checks).
        console.error("Error fetching dashboard data:", err); // Log the full error for development
        setError((err as Error).message); // ⭐ FIX: Type assertion to safely access .message
        // IMPORTANT: If an error occurs, the `summary` and `games` states
        // retain their initial `defaultSummary` and empty array values,
        // ensuring the UI does not disappear and shows "0" or "N/A" for data.
      } finally {
        // This block always runs, regardless of success or failure, to stop loading indicator
        setLoading(false); 
      }
    };

    fetchData(); // Execute the data fetching function

    // No cleanup needed for this simple fetch, so no return from useEffect
  }, []); // Empty dependency array means this effect runs only once on mount

  // Conditional rendering for loading and error states.
  // These are displayed as full-page overlays for clear user feedback.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-xl font-semibold text-gray-700 p-6 rounded-lg shadow-md bg-white">
          Loading dashboard data... Please wait.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center text-xl font-semibold text-red-600 p-6 rounded-lg shadow-md bg-white">
          <p>Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">Displaying default values due to a data fetching issue. Please check the backend server and network connection.</p>
        </div>
      </div>
    );
  }

  // Main dashboard content rendered once data is loaded or defaults are set
  return (
   // ADDED responsive padding & margins for mobile
<main className="bg-gray-100 min-h-screen p-4 sm:p-6 lg:p-8 ">
  {/* Page Title */}
  <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800">
    Admin Dashboard Overview
  </h1>

  {/* Cards Section: Displays key summary metrics */}
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
    <DashboardCard
      title="Total Revenue"
      value={`${summary.revenue.toLocaleString()} Birr`}
      icon="revenue"
    />
    <DashboardCard
      title="Total Profit"
      value={`${summary.profit.toLocaleString()} Birr`}
      icon="profit"
    />
    <DashboardCard
      title="Total Users"
      value={summary.users.toLocaleString()}
      icon="users"
    />
    <DashboardCard
      title="Games Played Today"
      value={`${summary.totalGamesToday}`}
      icon="games"
    />
  </div>

  {/* Table Section: Lists individual games played today */}
  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 overflow-x-auto">
    <DashboardTable games={games} />
  </div>
</main>

  );
}
