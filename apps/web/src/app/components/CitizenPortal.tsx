import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router';
import {
  LogOut, Plus, MessageSquare, Clock, CheckCircle,
  Send, Eye, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useCitizenAuth } from '../contexts/CitizenAuthContext';
import { api, Department, Inquiry, SectionService } from '../lib/api';
import type { InquiryPrefill } from '../lib/inquiryPrefill';
import { useDataRefresh, useReloadTracker } from '../contexts/DataRefreshContext';

export function CitizenPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { citizen, loading, logout } = useCitizenAuth();
  const { refreshKey } = useDataRefresh();

  const [activeTab, setActiveTab] = useState<'submit' | 'my-inquiries'>('submit');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentServices, setDepartmentServices] = useState<SectionService[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inquiryPrefill = location.state as Partial<InquiryPrefill> | null;

  const [formData, setFormData] = useState({
    department_id: inquiryPrefill?.department_id || '',
    service_id: inquiryPrefill?.service_id || '',
    subject: inquiryPrefill?.subject || '',
    message: '',
    priority: 'Normal' as Inquiry['priority'],
  });

  useEffect(() => {
    if (inquiryPrefill?.department_id || inquiryPrefill?.service_id || inquiryPrefill?.subject) {
      setFormData((prev) => ({
        ...prev,
        department_id: inquiryPrefill.department_id || prev.department_id,
        service_id: inquiryPrefill.service_id || prev.service_id,
        subject: inquiryPrefill.subject || prev.subject,
      }));
      setActiveTab('submit');
    }
  }, [inquiryPrefill?.department_id, inquiryPrefill?.service_id, inquiryPrefill?.subject]);

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useReloadTracker(fetching);

  useEffect(() => {
    api.departments.list()
      .then(setDepartments)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load departments'));
  }, [refreshKey]);

  useEffect(() => {
    if (!formData.department_id) {
      setDepartmentServices([]);
      return;
    }
    setLoadingServices(true);
    api.services.list({ department_id: formData.department_id })
      .then((rows) => {
        setDepartmentServices(rows);
        if (formData.service_id && !rows.some((r) => r.id === formData.service_id)) {
          setFormData((prev) => ({ ...prev, service_id: '', subject: '' }));
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load services'))
      .finally(() => setLoadingServices(false));
  }, [formData.department_id]);

  useEffect(() => {
    if (!citizen) return;
    setFetching(true);
    api.inquiries.list()
      .then(setInquiries)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load inquiries'))
      .finally(() => setFetching(false));
  }, [citizen, refreshKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (!citizen) {
    return <Navigate to="/citizen-login" replace />;
  }

  const handleDepartmentChange = (departmentId: string) => {
    setFormData({
      ...formData,
      department_id: departmentId,
      service_id: '',
      subject: '',
    });
  };

  const handleServiceChange = (serviceId: string) => {
    const service = departmentServices.find((s) => s.id === serviceId);
    setFormData({
      ...formData,
      service_id: serviceId,
      subject: service?.service_name || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department_id || !formData.service_id) {
      toast.error('Please select a department and service');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.inquiries.create({
        department_id: formData.department_id,
        service_id: formData.service_id,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
      });
      setInquiries([created, ...inquiries]);
      setFormData({ department_id: '', service_id: '', subject: '', message: '', priority: 'Normal' });
      setActiveTab('my-inquiries');
      toast.success('Inquiry submitted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/citizen-login');
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

  const selectedService = departmentServices.find((s) => s.id === formData.service_id);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <nav className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <MessageSquare className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold truncate">MENRO Citizen Portal</h1>
                <p className="text-xs sm:text-sm text-green-100">Municipality of Rizal</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="text-right hidden sm:block min-w-0">
                <p className="text-sm font-medium truncate max-w-[140px]">{citizen.name}</p>
                <p className="text-xs text-green-100 truncate max-w-[140px]">{citizen.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-6xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Welcome, {citizen.name}!</h2>
          <p className="text-gray-600">
            Choose a department and service, then submit your inquiry. It will be routed to the correct MENRO division.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === 'submit' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-5 h-5" />
            Submit New Inquiry
          </button>
          <button
            onClick={() => setActiveTab('my-inquiries')}
            className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              activeTab === 'my-inquiries' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            My Inquiries ({inquiries.length})
          </button>
        </div>

        {activeTab === 'submit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Submit New Inquiry</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    required
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
                  <select
                    value={formData.service_id}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-50"
                    required
                    disabled={!formData.department_id || loadingServices}
                  >
                    <option value="">
                      {loadingServices ? 'Loading services...' : formData.department_id ? 'Select a service' : 'Choose department first'}
                    </option>
                    {departmentServices.map((svc) => (
                      <option key={svc.id} value={svc.id}>{svc.service_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedService && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900 space-y-1">
                  <p><strong>Description:</strong> {selectedService.description}</p>
                  {selectedService.requirements && <p><strong>Requirements:</strong> {selectedService.requirements}</p>}
                  {selectedService.processing_time && <p><strong>Processing time:</strong> {selectedService.processing_time}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Inquiry['priority'] })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none md:max-w-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Brief description of your inquiry"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  rows={6}
                  placeholder="Provide detailed information about your inquiry..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-70 transition-colors font-medium text-lg"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'my-inquiries' && (
          <div className="space-y-4">
            {fetching ? (
              <div className="text-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
              </div>
            ) : (
              <>
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-mono text-sm font-medium text-gray-700">{inquiry.ticket_number}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                            {inquiry.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(inquiry.priority)}`}>
                            {inquiry.priority}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{inquiry.subject}</h3>
                        <p className="text-sm text-gray-600 mb-2">Department: {inquiry.category}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Submitted: {inquiry.date_submitted}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>

                    {inquiry.response && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <p className="font-semibold text-green-800">MENRO Response:</p>
                        </div>
                        <p className="text-sm text-green-700">{inquiry.response}</p>
                      </div>
                    )}
                  </div>
                ))}

                {inquiries.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You haven&apos;t submitted any inquiries yet</p>
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Submit Your First Inquiry
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
              <h3 className="text-xl font-bold">{selectedInquiry.ticket_number}</h3>
              <p className="text-sm text-green-100">{selectedInquiry.subject}</p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Department</p>
                  <p className="text-gray-800">{selectedInquiry.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedInquiry.status)}`}>
                    {selectedInquiry.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Message</p>
                  <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">{selectedInquiry.message}</p>
                </div>
                {selectedInquiry.response && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">MENRO Response</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800">{selectedInquiry.response}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
