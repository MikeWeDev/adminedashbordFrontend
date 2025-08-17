'use client';

import React, { useState, useMemo } from 'react';
import { FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';

interface AuditEntry {
  type: 'Balance Change' | 'Transaction Change';
  target: string;
  oldValue: string | number;
  newValue: string | number;
  reason: string;
  timestamp: string;
}

interface AuditTableProps {
  entries: AuditEntry[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSortChange: (field: string, order: 'asc' | 'desc') => void;
  currentSortBy: string;
  currentSortOrder: 'asc' | 'desc';
}

export const AuditTable: React.FC<AuditTableProps> = ({
  entries,
  currentPage,
  totalItems,
  totalPages,
  onPageChange,
  onSortChange,
  currentSortBy,
  currentSortOrder,
}) => {
  const [typeQuery, setTypeQuery] = useState('');
  const [targetQuery, setTargetQuery] = useState('');

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesType = entry.type.toLowerCase().includes(typeQuery.toLowerCase());
      const matchesTarget = entry.target.toLowerCase().includes(targetQuery.toLowerCase());
      return matchesType && (targetQuery ? matchesTarget : true);
    });
  }, [entries, typeQuery, targetQuery]);

  const handleSortClick = (field: string) => {
    if (currentSortBy === field) {
      onSortChange(field, currentSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (currentSortBy === field) {
      return currentSortOrder === 'asc' ? <FaSortAlphaUp className="inline ml-1" /> : <FaSortAlphaDown className="inline ml-1" />;
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Audit Log</h3>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4 w-1/2 md:w-full">
        <input
          type="text"
          placeholder="Filter by Type..."
          value={typeQuery}
          onChange={(e) => setTypeQuery(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          placeholder="Filter by Target..."
          value={targetQuery}
          onChange={(e) => setTargetQuery(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-auto border-collapse w-full">
          <thead>
            <tr className="bg-gray-200 text-gray-700 uppercase text-xs leading-normal">
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 rounded-tl-lg"
                onClick={() => handleSortClick('type')}
              >
                Type {renderSortIcon('type')}
              </th>
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150"
                onClick={() => handleSortClick('target')}
              >
                Target {renderSortIcon('target')}
              </th>
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150"
                onClick={() => handleSortClick('oldValue')}
              >
                Old Value {renderSortIcon('oldValue')}
              </th>
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150"
                onClick={() => handleSortClick('newValue')}
              >
                New Value {renderSortIcon('newValue')}
              </th>
              <th className="py-3 px-6 text-left">Reason</th>
              <th
                className="py-3 px-6 text-left cursor-pointer hover:bg-gray-300 transition-colors duration-150 rounded-tr-lg"
                onClick={() => handleSortClick('timestamp')}
              >
                Timestamp {renderSortIcon('timestamp')}
              </th>
            </tr>
          </thead>
          <tbody className="text-gray-700 text-sm font-light">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-100 transition-colors duration-150">
                  <td className="py-3 px-6 whitespace-nowrap">{entry.type}</td>
                  <td className="py-3 px-6 whitespace-nowrap">{entry.target}</td>
                  <td className="py-3 px-6 whitespace-nowrap">{entry.oldValue}</td>
                  <td className="py-3 px-6 whitespace-nowrap">{entry.newValue}</td>
                  <td className="py-3 px-6 whitespace-nowrap">{entry.reason}</td>
                  <td className="py-3 px-6 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleDateString()}{' '}
                    <span className="block text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 p-3 bg-gray-50 rounded-lg gap-2 w-1/2 md:w-full">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
          >
            Previous
          </button>

          <span className="text-gray-700 text-center">
            Page {currentPage} of {totalPages} ({totalItems} entries)
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full md:w-auto"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
