import { useEffect, useState } from 'react';
import { Users, Search, Loader2, ShieldCheck, UserCircle } from 'lucide-react';
import { api, UserAccount } from '../../lib/api';
import { useDataRefresh, useReloadTracker } from '../../contexts/DataRefreshContext';

type AccountFilter = 'all' | 'staff' | 'citizen';

export function UsersTab() {
  const { refreshKey } = useDataRefresh();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<AccountFilter>('all');
  const [error, setError] = useState('');

  useReloadTracker(loading);

  useEffect(() => {
    setLoading(true);
    api.users
      .list()
      .then(setAccounts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load user accounts'))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || account.account_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const staffCount = accounts.filter((a) => a.account_type === 'staff').length;
  const citizenCount = accounts.filter((a) => a.account_type === 'citizen').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">All Users</h2>
        <p className="text-gray-600 mt-1">
          View every registered account in the system, including staff and citizen portal users.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Accounts</p>
          <p className="text-2xl font-bold text-gray-800">{accounts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Staff Accounts</p>
          <p className="text-2xl font-bold text-blue-700">{staffCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Citizen Accounts</p>
          <p className="text-2xl font-bold text-green-700">{citizenCount}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AccountFilter)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
        >
          <option value="all">All account types</option>
          <option value="staff">Staff only</option>
          <option value="citizen">Citizens only</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden table-scroll">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Account Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role / Section</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-gray-500">
                    No user accounts found.
                  </td>
                </tr>
              ) : (
                filtered.map((account) => (
                  <tr key={`${account.account_type}-${account.id}`} className="border-t border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {account.account_type === 'staff' ? (
                          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <UserCircle className="w-4 h-4 text-green-600 shrink-0" />
                        )}
                        <span className="font-medium">{account.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{account.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.account_type === 'staff'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {account.account_type === 'staff' ? 'Staff' : 'Citizen'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {account.account_type === 'staff' ? (
                        <div className="space-y-1">
                          <p>{account.role}</p>
                          <p className="text-xs text-gray-500">
                            {account.staff_role === 'main_admin' ? 'Main Admin' : 'Section Admin'} ·{' '}
                            {account.section_label}
                          </p>
                        </div>
                      ) : (
                        account.section_label
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{account.phone || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Showing {filtered.length} of {accounts.length} accounts
        </p>
      )}
    </div>
  );
}
