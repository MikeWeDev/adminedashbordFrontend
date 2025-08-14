import React from 'react';
import { FaMoneyBill, FaChartLine, FaUsers, FaGamepad } from 'react-icons/fa';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: 'revenue' | 'profit' | 'users' | 'games';
}

const icons = {
  revenue: <FaMoneyBill className="text-4xl text-green-500" />,
  profit: <FaChartLine className="text-4xl text-blue-500" />,
  users: <FaUsers className="text-4xl text-purple-500" />,
  games: <FaGamepad className="text-4xl text-yellow-500" />,
};

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md flex items-center space-x-3 sm:space-x-4">
      {icons[icon]}
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm sm:text-base truncate">{title}</p>
        <h2 className="text-lg sm:text-2xl font-bold truncate">{value}</h2>
      </div>
    </div>
  );
};
