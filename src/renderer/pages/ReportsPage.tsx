// Reports Page

import React, { useState } from 'react';
import Layout from '@renderer/components/Layout';
import { useApi } from '@renderer/hooks/useApi';

export default function ReportsPage() {
  const api = useApi();
  const [reportType, setReportType] = useState('DAILY_SUMMARY');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let params: any = {};
      if (reportType === 'DAILY_SUMMARY') {
        params = { date: fromDate };
      } else {
        params = { fromDate, toDate };
      }

      const result = await api.generateReport(reportType, params);
      if (result.success) {
        setReportData(result.data);
        setMessage('Report generated successfully');
      } else {
        setMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'PDF' | 'EXCEL') => {
    try {
      const result = await api.exportReport(reportType, format);
      if (result.success) {
        setMessage(`Report exported as ${format}: ${result.data.filepath}`);
      }
    } catch (error) {
      setMessage(`Export error: ${(error as Error).message}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and export parking reports</p>
        </div>

        {/* Report Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h2>
          <form onSubmit={handleGenerateReport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2  gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DAILY_SUMMARY">Daily Summary</option>
                  <option value="REVENUE_REPORT">Revenue Report</option>
                  <option value="OCCUPANCY_REPORT">Occupancy Report</option>
                </select>
              </div>

              {reportType === 'DAILY_SUMMARY' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {reportType !== 'DAILY_SUMMARY' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {/* Report Results */}
        {reportData && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div className="flex justify-between items-centeritems-center">
              <h3 className="text-lg font-semibold text-gray-900">Report Results</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('PDF')}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => handleExport('EXCEL')}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  Export Excel
                </button>
              </div>
            </div>

            <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto text-gray-700">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Layout>
  );
}
