import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Eye, CheckCircle, Clock, AlertCircle, Filter, Search, User, Mail, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { api, Inquiry as ApiInquiry } from '../../lib/api';
import { useDataRefresh, useReloadTracker } from '../../contexts/DataRefreshContext';

type Inquiry = ApiInquiry;

interface OnlineInquiriesTabProps {
  showAllDepartments?: boolean;
}

export function OnlineInquiriesTab({ showAllDepartments = false }: OnlineInquiriesTabProps) {
  const { user } = useAuth();
  const { refreshKey } = useDataRefresh();

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useReloadTracker(loading);

  useEffect(() => {
    setLoading(true);
    api.inquiries.list()
      .then(setInquiries)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load inquiries'))
      .finally(() => setLoading(false));
  }, [user?.department, refreshKey]);

  const categories = ['Nursery', 'Environmental', 'Solid Waste', 'Landfill', 'Enforcement', 'General'];

  const filteredInquiries = inquiries.filter(inq => {
    const matchesSearch = inq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inq.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inq.ticket_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inq.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || inq.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleRespond = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setResponseText(inquiry.response || '');
    setShowResponseForm(true);
  };

  const handleSubmitResponse = async () => {
    if (selectedInquiry && responseText.trim()) {
      try {
        const updated = await api.inquiries.update(selectedInquiry.id, {
          response: responseText,
          status: 'In Progress',
        });
        setInquiries(inquiries.map((inq) => (inq.id === selectedInquiry.id ? updated : inq)));
        setShowResponseForm(false);
        setSelectedInquiry(null);
        setResponseText('');
        toast.success('Response sent');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to send response');
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: Inquiry['status']) => {
    try {
      const updated = await api.inquiries.update(id, { status: newStatus });
      setInquiries(inquiries.map((inq) => (inq.id === id ? updated : inq)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-700';
      case 'Normal': return 'bg-blue-100 text-blue-700';
      case 'Low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: filteredInquiries.length,
    pending: filteredInquiries.filter(i => i.status === 'Pending').length,
    inProgress: filteredInquiries.filter(i => i.status === 'In Progress').length,
    resolved: filteredInquiries.filter(i => i.status === 'Resolved').length
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Online Inquiries</h2>
        <p className="text-gray-600 mt-1">
          {showAllDepartments ? 'Manage all community inquiries across departments' : 'View and respond to department inquiries'}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inquiries</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <MessageSquare className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-800">{stats.inProgress}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Resolved</p>
              <p className="text-3xl font-bold text-green-800">{stats.resolved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, subject, or ticket number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
            <Filter className="w-5 h-5 text-gray-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          {showAllDepartments && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Inquiries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
          </div>
        ) : filteredInquiries.map((inquiry) => (
          <div key={inquiry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <span className="font-mono text-sm text-gray-500">{inquiry.ticket_number}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(inquiry.priority)}`}>
                    {inquiry.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                    {inquiry.status}
                  </span>
                  {showAllDepartments && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {inquiry.category}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{inquiry.subject}</h3>
                <p className="text-gray-600 mb-3">{inquiry.message}</p>

                {/* Citizen Info */}
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-500 mb-3">
                  <span className="flex items-center gap-1 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="truncate">{inquiry.name}</span>
                  </span>
                  <span className="flex items-center gap-1 min-w-0">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{inquiry.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4 shrink-0" />
                    {inquiry.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 shrink-0" />
                    {inquiry.date_submitted}
                  </span>
                </div>

                {/* Response */}
                {inquiry.response && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                    <p className="text-sm font-semibold text-green-800 mb-1">Response:</p>
                    <p className="text-sm text-green-700">{inquiry.response}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => handleRespond(inquiry)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                {inquiry.response ? 'Update Response' : 'Respond'}
              </button>

              <select
                value={inquiry.status}
                onChange={(e) => handleStatusChange(inquiry.id, e.target.value as Inquiry['status'])}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="Pending">Mark as Pending</option>
                <option value="In Progress">Mark as In Progress</option>
                <option value="Resolved">Mark as Resolved</option>
                <option value="Closed">Mark as Closed</option>
              </select>
            </div>
          </div>
        ))}

        {filteredInquiries.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No inquiries found</p>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseForm && selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
              <h3 className="text-xl font-bold">Respond to Inquiry</h3>
              <p className="text-sm text-blue-100 mt-1">{selectedInquiry.ticket_number} - {selectedInquiry.subject}</p>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Original Message:</p>
                <p className="text-sm text-gray-600">{selectedInquiry.message}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  rows={6}
                  placeholder="Type your response here..."
                />
              </div>
              <div className="flex justify-end flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => { setShowResponseForm(false); setSelectedInquiry(null); }}
                  className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResponse}
                  className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Send Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
