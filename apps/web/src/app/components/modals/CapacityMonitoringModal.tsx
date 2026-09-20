import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

export function CapacityMonitoringModal() {
  const currentCapacity = 68;
  const maxCapacity = 100;
  const dailyIncrease = 0.5;
  const estimatedFull = Math.floor((maxCapacity - currentCapacity) / dailyIncrease);

  const capacityHistory = [
    { month: 'Jan 2026', capacity: 50 },
    { month: 'Feb 2026', capacity: 55 },
    { month: 'Mar 2026', capacity: 60 },
    { month: 'Apr 2026', capacity: 64 },
    { month: 'May 2026', capacity: 68 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800">Landfill Capacity Monitoring</h3>
        <p className="text-sm text-gray-600">Real-time capacity tracking and projections</p>
      </div>

      {/* Current Capacity */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Current Capacity Status</h4>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">{currentCapacity}%</span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden mb-4">
          <div
            className="h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
            style={{
              width: `${currentCapacity}%`,
              background: `linear-gradient(to right, #10b981, #f59e0b, #ef4444)`
            }}
          >
            <span className="text-white font-semibold text-sm">{currentCapacity}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Current: {currentCapacity}%</p>
          </div>
          <div>
            <p className="text-gray-600">Remaining: {maxCapacity - currentCapacity}%</p>
          </div>
          <div>
            <p className="text-gray-600">Max: {maxCapacity}%</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {currentCapacity >= 70 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Critical Capacity Warning</p>
            <p className="text-sm text-red-700 mt-1">
              Landfill capacity has exceeded 70%. Immediate action required for expansion planning or waste reduction initiatives.
            </p>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Daily Increase</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <p className="text-2xl font-bold text-gray-800">{dailyIncrease}%</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Estimated Days to Full</p>
          <p className="text-2xl font-bold text-gray-800">{estimatedFull} days</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Monthly Average</p>
          <p className="text-2xl font-bold text-gray-800">15.2 tons</p>
        </div>
      </div>

      {/* Capacity History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-800 mb-4">Capacity Trend (Last 5 Months)</h4>
        <div className="space-y-3">
          {capacityHistory.map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 w-24">{item.month}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-orange-500 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                  style={{ width: `${item.capacity}%` }}
                >
                  <span className="text-white text-xs font-semibold">{item.capacity}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-3">Recommended Actions</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Begin expansion site survey and environmental impact assessment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Increase waste segregation and recycling programs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600">•</span>
            <span>Coordinate with neighboring municipalities for alternative disposal sites</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
