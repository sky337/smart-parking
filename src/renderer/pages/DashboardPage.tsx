// Dashboard Page

import React, { useEffect, useState } from 'react';
import Layout from '@renderer/components/Layout';
import { useApi } from '@renderer/hooks/useApi';
import { DashboardStats } from '@shared/types/index';

export default function DashboardPage() {
  const api = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await api.getSystemHealth();
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <Layout>Loading...</Layout>;
  }

  if (!stats) {
    return <Layout>Failed to load dashboard</Layout>;
  }

  const StatCard = ({ title, value, subtext }: any) => (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      {subtext && <p className="text-gray-500 text-xs mt-1">{subtext}</p>}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your parking overview.</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Slots"
            value={stats.totalSlots}
            subtext="Available parking spaces"
          />
          <StatCard
            title="Occupied"
            value={stats.occupiedSlots}
            subtext={`${stats.occupancyRate}% occupancy`}
          />
          <StatCard
            title="Available"
            value={stats.availableSlots}
            subtext="Ready for parking"
          />
          <StatCard
            title="Today's Revenue"
            value={`₹${stats.todayRevenue.toFixed(2)}`}
            subtext={`${stats.todayTickets} transactions`}
          />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatCard
            title="Active Tickets"
            value={stats.activeTickets}
            subtext="Current parking sessions"
          />
          <StatCard
            title="Average Charge"
            value={`₹${stats.averageCharge.toFixed(2)}`}
            subtext="Per transaction"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toFixed(2)}`}
            subtext="All time"
          />
          <StatCard
            title="Avg Stay Duration"
            value={`${stats.averageStayDuration} min`}
            subtext="Average parking time"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-600 font-medium transition">
              Create Entry Ticket
            </button>
            <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-600 font-medium transition">
              Process Exit
            </button>
            <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-600 font-medium transition">
              Generate Report
            </button>
            <button className="p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-600 font-medium transition">
              Backup Database
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
