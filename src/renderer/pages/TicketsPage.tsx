// Tickets Management Page

import React, { useState } from 'react';
import Layout from '@renderer/components/Layout';
import { useApi } from '@renderer/hooks/useApi';

export default function TicketsPage() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'entry' | 'search'>('entry');
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    slotId: '',
    vehicleType: 'CAR',
    vehicleColor: '',
  });
  const [searchFilters, setSearchFilters] = useState({
    vehicleNumber: '',
    status: 'ACTIVE',
  });
  const [tickets, setTickets] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.createTicket(formData);
      if (result.success) {
        setMessage(`Ticket created: ${result.data.ticketNumber}`);
        setFormData({ vehicleNumber: '', slotId: '', vehicleType: 'CAR', vehicleColor: '' });
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  const handleSearchTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.searchTickets(searchFilters);
      if (result.success) {
        setTickets(result.data.tickets);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets Management</h1>
          <p className="text-gray-600 mt-1">Create entry/exit tickets and search records</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('entry')}
              className={`py-3 px-4 font-medium border-b-2 transition ${
                activeTab === 'entry'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Create Entry Ticket
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-3 px-4 font-medium border-b-2 transition ${
                activeTab === 'search'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Search Tickets
            </button>
          </div>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {/* Create Entry Ticket */}
        {activeTab === 'entry' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Entry Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., DL01AB1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>CAR</option>
                    <option>BIKE</option>
                    <option>TRUCK</option>
                    <option>BUS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parking Slot ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slotId}
                    onChange={(e) => setFormData({ ...formData, slotId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter slot ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Color
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleColor}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleColor: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., White"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                Create Ticket
              </button>
            </form>
          </div>
        )}

        {/* Search Tickets */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Tickets</h2>
              <form onSubmit={handleSearchTickets} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={searchFilters.vehicleNumber}
                      onChange={(e) =>
                        setSearchFilters({ ...searchFilters, vehicleNumber: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Search by vehicle number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={searchFilters.status}
                      onChange={(e) =>
                        setSearchFilters({ ...searchFilters, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option>ACTIVE</option>
                      <option>COMPLETED</option>
                      <option>CANCELLED</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
                >
                  Search
                </button>
              </form>
            </div>

            {tickets.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow overflow-x-auto">
                <h3 className="font-semibold text-gray-900 mb-4">Results</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-900 font-medium">Ticket #</th>
                      <th className="px-4 py-2 text-left text-gray-900 font-medium">Vehicle</th>
                      <th className="px-4 py-2 text-left text-gray-900 font-medium">Status</th>
                      <th className="px-4 py-2 text-left text-gray-900 font-medium">Entry Time</th>
                      <th className="px-4 py-2 text-left text-gray-900 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-blue-600">{ticket.ticketNumber}</td>
                        <td className="px-4 py-2">{ticket.vehicleNumber}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ticket.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">{new Date(ticket.entryTime).toLocaleString()}</td>
                        <td className="px-4 py-2">{ticket.duration ? `${ticket.duration} min` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
