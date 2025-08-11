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
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
      {icons[icon]}
      <div>
        <p className="text-gray-500">{title}</p>
        <h2 className="text-2xl font-bold">{value}</h2>
      </div>
    </div>
  );
};