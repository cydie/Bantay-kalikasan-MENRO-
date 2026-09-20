import { useState } from 'react';
import { Truck, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { btnPrimaryClass, btnSecondaryClass, statusBadgeClass } from '../../lib/uiClasses';

interface Collection {
  id: string;
  route: string;
  vehicle: string;
  driver: string;
  status: string;
  scheduledTime: string;
  volume: string;
}

interface WasteCollectionModalProps {
  onScheduleNew?: () => void;
}

export function WasteCollectionModal({ onScheduleNew }: WasteCollectionModalProps) {
  const [collections] = useState<Collection[]>([
    { id: '1', route: 'Route A - Downtown', vehicle: 'Truck #01', driver: 'Pedro Santos', status: 'Completed', scheduledTime: '08:30 AM', volume: '2.3 tons' },
    { id: '2', route: 'Route B - Residential', vehicle: 'Truck #02', driver: 'Maria Lopez', status: 'In Progress', scheduledTime: '09:00 AM', volume: '1.8 tons' },
    { id: '3', route: 'Route C - Commercial', vehicle: 'Truck #03', driver: 'Juan Reyes', status: 'In Progress', scheduledTime: '10:15 AM', volume: '3.1 tons' },
    { id: '4', route: 'Route D - Industrial', vehicle: 'Truck #04', driver: 'Carlos Diaz', status: 'Pending', scheduledTime: '11:00 AM', volume: '-' },
    { id: '5', route: 'Route E - Market Area', vehicle: 'Truck #05', driver: 'Roberto Cruz', status: 'Pending', scheduledTime: '02:00 PM', volume: '-' },
  ]);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6 min-w-0">
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 sm:p-6 border border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 shrink-0" />
          <span className="min-w-0">Today&apos;s Collection Schedule — {today}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Routes</p>
            <p className="text-2xl font-bold text-gray-800">{collections.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {collections.filter((c) => c.status === 'Completed').length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {collections.filter((c) => c.status === 'In Progress').length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {collections.map((collection) => (
          <div key={collection.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    collection.status === 'Completed'
                      ? 'bg-green-100'
                      : collection.status === 'In Progress'
                        ? 'bg-blue-100'
                        : 'bg-gray-100'
                  }`}
                >
                  <Truck
                    className={`w-6 h-6 ${
                      collection.status === 'Completed'
                        ? 'text-green-600'
                        : collection.status === 'In Progress'
                          ? 'text-blue-600'
                          : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-gray-800 break-words">{collection.route}</h4>
                  <p className="text-sm text-gray-600 truncate">
                    {collection.vehicle} • {collection.driver}
                  </p>
                </div>
              </div>
              <span className={statusBadgeClass(collection.status)}>{collection.status}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 shrink-0" />
                Scheduled: {collection.scheduledTime}
              </span>
              <span>Volume: {collection.volume}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => {
            onScheduleNew?.();
            toast.info('Opening Activities to schedule a new collection');
          }}
          className={`flex-1 ${btnPrimaryClass}`}
        >
          Schedule New Collection
        </button>
        <button
          type="button"
          onClick={() => toast.info('Map view will be available in a future update')}
          className={`flex-1 ${btnSecondaryClass}`}
        >
          View Map
        </button>
      </div>
    </div>
  );
}
