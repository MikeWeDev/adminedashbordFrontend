import React from 'react';
import { FaMoneyBill, FaChartLine, FaUsers, FaGamepad } from 'react-icons/fa';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: 'revenue' | 'profit' | 'users' | 'games';
}

const icons = {
  revenue: <FaMoneyBill className="text-3xl sm:text-4xl md:text-5xl text-green-500 flex-shrink-0" />,
  profit: <FaChartLine className="text-3xl sm:text-4xl md:text-5xl text-blue-500 flex-shrink-0" />,
  users: <FaUsers className="text-3xl sm:text-4xl md:text-5xl text-purple-500 flex-shrink-0" />,
  games: <FaGamepad className="text-3xl sm:text-4xl md:text-5xl text-yellow-500 flex-shrink-0" />,
};

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-md flex items-center space-x-3 sm:space-x-4 w-full min-w-0">
      {icons[icon]}
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm sm:text-base md:text-lg truncate">
          {title}
        </p>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
          {value}
        </h2>
      </div>
    </div>
  );
};
