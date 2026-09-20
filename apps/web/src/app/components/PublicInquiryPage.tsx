import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, SectionService } from '../lib/api';
import { appLogo } from '../../assets/brand';
import { DepartmentServicesList } from './DepartmentServicesList';
import { useServiceInquiryAction } from '../hooks/useServiceInquiryAction';
import { useCitizenAuth } from '../contexts/CitizenAuthContext';

export function PublicInquiryPage() {
  const navigate = useNavigate();
  const { citizen } = useCitizenAuth();
  const { startInquiry } = useServiceInquiryAction();
  const [services, setServices] = useState<SectionService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.services.list()
      .then(setServices)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load services'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={appLogo} alt="Bantay Kalikasan Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold">MENRO Online Inquiries</h1>
              <p className="text-xs sm:text-sm text-green-100">Browse active services by department and submit your request</p>
            </div>
          </div>
          <button
            onClick={() => navigate(citizen ? '/citizen-portal' : '/citizen-login')}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-green-700 rounded-lg font-medium hover:bg-green-50 text-sm sm:text-base text-center"
          >
            {citizen ? 'My inquiries' : 'Sign in to track inquiries'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-8 sm:space-y-10">
        <section className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Services Offered by Departments</h2>
          <p className="text-gray-600">
            Each department provides specific services. Select an offer below to submit an inquiry routed to the correct division.
          </p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500 py-12">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading services...
          </div>
        ) : (
          <DepartmentServicesList services={services} onInquire={startInquiry} />
        )}

        <div className="text-center">
          <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-700">← Back to website</button>
        </div>
      </main>
    </div>
  );
}
