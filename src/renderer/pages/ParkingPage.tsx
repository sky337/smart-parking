// Parking Lot Management Page

import React, { useEffect, useState } from 'react';
import Layout from '@renderer/components/Layout';
import { useApi } from '@renderer/hooks/useApi';
import { ParkingSlot } from '@shared/types/index';

export default function ParkingPage() {
  const api = useApi();
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParkingLots();
  }, []);

  const loadParkingLots = async () => {
    try {
      const result = await api.getParkingLots();
      if (result.success) {
        setLots(result.data);
        if (result.data.length > 0) {
          setSelectedLot(result.data[0].id);
          loadSlots(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load parking lots:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async (lotId: string) => {
    try {
      const result = await api.getSlots(lotId);
      if (result.success) {
        setSlots(result.data);
      }
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
  };

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-300';
      case 'OCCUPIED':
        return 'bg-red-100 border-red-300';
      case 'RESERVED':
        return 'bg-yellow-100 border-yellow-300';
      case 'MAINTENANCE':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-white border-gray-300';
    }
  };

  if (loading) {
    return <Layout>Loading...</Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parking Management</h1>
          <p className="text-gray-600 mt-1">View and manage parking lots and slots</p>
        </div>

        {/* Lot Selection */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-gray-900 mb-3">Select Parking Lot</h2>
          <div className="flex gap-2  flex-wrap">
            {lots.map((lot) => (
              <button
                key={lot.id}
                onClick={() => {
                  setSelectedLot(lot.id);
                  loadSlots(lot.id);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedLot === lot.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lot.name}
              </button>
            ))}
          </div>
        </div>

        {/* Slots Visualization */}
        {selectedLot && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold text-gray-900 mb-4">Parking Slots</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-2 border-2 rounded text-center text-xs font-semibold cursor-pointer hover:shadow-md transition ${getSlotColor(
                    slot.status
                  )}`}
                  title={`${slot.slotNumber} - ${slot.status}`}
                >
                  {slot.slotNumber}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-3">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-sm text-gray-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
              <span className="text-sm text-gray-700">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
              <span className="text-sm text-gray-700">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-100 border-2 border-gray-300 rounded"></div>
              <span className="text-sm text-gray-700">Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
