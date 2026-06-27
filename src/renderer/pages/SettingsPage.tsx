// Settings Page

import React from 'react';
import Layout from '@renderer/components/Layout';
import { useApi } from '@renderer/hooks/useApi';
import { useAuth } from '@renderer/context/AuthContext';
import { useState } from 'react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const api = useApi();
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const result = await api.createBackup(user?.id || '');
      if (result.success) {
        setMessage('Backup created successfully');
        loadBackups();
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const result = await api.listBackups();
      if (result.success) {
        setBackups(result.data);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  React.useEffect(() => {
    loadBackups();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage system configuration and backups</p>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {/* User Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Username:</span> {user?.username}</p>
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Role:</span> {user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Database Backups */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Database Backups</h2>
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Creating...' : 'Create Backup'}
            </button>
          </div>

          {backups.length > 0 ? (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                  <div>
                    <p className="font-medium text-gray-900">{backup.backupName}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(backup.createdAt).toLocaleString()} - {(backup.backupSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded transition">
                      Restore
                    </button>
                    <button className="text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No backups created yet</p>
          )}
        </div>

        {/* System Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">Application:</span> Smart Parking Management System</p>
            <p><span className="font-medium">Version:</span> 1.0.0</p>
            <p><span className="font-medium">Environment:</span> Production</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
