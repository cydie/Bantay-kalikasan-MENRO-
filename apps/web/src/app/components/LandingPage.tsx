import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Leaf, Droplet, Shield, Users, FileText, MessageSquare,
  ArrowRight, MapPin, Phone, Mail, Recycle, Sprout, Globe
} from 'lucide-react';
import { appLogo } from '../../assets/brand';
import { api, SectionService } from '../lib/api';
import { DepartmentServicesList } from './DepartmentServicesList';
import { useServiceInquiryAction } from '../hooks/useServiceInquiryAction';

export function LandingPage() {
  const navigate = useNavigate();
  const { startInquiry } = useServiceInquiryAction();
  const [departmentServices, setDepartmentServices] = useState<SectionService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    api.services.list()
      .then(setDepartmentServices)
      .catch(() => undefined)
      .finally(() => setServicesLoading(false));
  }, []);

  const departments = [
    { name: 'Nursery', icon: Sprout, desc: 'Seedling production & tree planting programs' },
    { name: 'Environmental', icon: Droplet, desc: 'Ecosystem protection & wildlife conservation' },
    { name: 'Solid Waste', icon: Recycle, desc: 'Waste collection & community sanitation' },
    { name: 'Landfill', icon: Shield, desc: 'Proper waste disposal & landfill operations' },
    { name: 'Enforcement', icon: Shield, desc: 'Environmental law enforcement & monitoring' },
  ];

  const services = [
    { title: 'Browse Services & Inquiries', desc: 'View MENRO offers by section and submit an online inquiry', action: () => navigate('/inquiries') },
    { title: 'Citizen Portal', desc: 'Sign in to track your submitted inquiries and responses', action: () => navigate('/citizen-login') },
    { title: 'Staff Portal', desc: 'Activity, History, Records, Reports, and section management', action: () => navigate('/staff-login') },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white">
        <nav className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={appLogo} alt="Bantay Kalikasan Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-base sm:text-lg leading-tight truncate">BANTAY KALIKASAN</p>
              <p className="text-xs sm:text-sm text-green-100 truncate">Municipality of Rizal - MENRO</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/citizen-login')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="sm:hidden">Citizen</span>
              <span className="hidden sm:inline">Citizen Portal</span>
            </button>
            <button
              onClick={() => navigate('/staff-login')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white text-green-700 hover:bg-green-50 transition-colors text-sm font-medium"
            >
              Staff Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-16 md:py-24 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-green-100 text-xs sm:text-sm mb-4 sm:mb-6">
              <Globe className="w-4 h-4 shrink-0" />
              <span className="leading-snug">Municipal Environment & Natural Resources Office</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-6">
              Protecting Rizal&apos;s Environment Together
            </h1>
            <p className="text-base sm:text-lg text-green-100 mb-6 sm:mb-8 max-w-xl">
              Bantay Kalikasan is the centralized platform for environmental management,
              citizen services, and department operations across all MENRO divisions.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/inquiries')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-white text-green-700 font-semibold hover:bg-green-50 transition-all shadow-lg text-sm sm:text-base"
              >
                <MessageSquare className="w-5 h-5" />
                Browse Services & Inquire
              </button>
              <button
                onClick={() => navigate('/staff-login')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl border-2 border-white/40 hover:bg-white/10 font-semibold transition-all text-sm sm:text-base"
              >
                MENRO Staff Access
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative md:hidden">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { label: 'Departments', value: '6', icon: Users },
                  { label: 'Active Programs', value: '34+', icon: Leaf },
                  { label: 'Citizen Inquiries', value: 'Online', icon: MessageSquare },
                  { label: 'Coverage', value: 'Rizal', icon: MapPin },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                    <stat.icon className="w-6 h-6 mb-2 text-green-200" />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-green-100">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Departments', value: '6', icon: Users },
                  { label: 'Active Programs', value: '34+', icon: Leaf },
                  { label: 'Citizen Inquiries', value: 'Online', icon: MessageSquare },
                  { label: 'Coverage', value: 'Rizal', icon: MapPin },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                    <stat.icon className="w-6 h-6 mb-2 text-green-200" />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-green-100">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Departments */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">Our Departments</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            MENRO coordinates environmental programs across specialized divisions serving the Municipality of Rizal.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {departments.map((dept) => (
            <div
              key={dept.name}
              className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 hover:border-green-400 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                <dept.icon className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{dept.name}</h3>
              <p className="text-sm text-gray-600">{dept.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Department Services */}
      <section className="bg-emerald-50 py-10 sm:py-16 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">Services Offered by Departments</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select a service below to submit an inquiry routed to the correct MENRO department.
            </p>
          </div>
          {servicesLoading ? (
            <p className="text-center text-gray-500 py-12">Loading services...</p>
          ) : (
            <DepartmentServicesList
              services={departmentServices}
              onInquire={startInquiry}
              showRequirements={false}
            />
          )}
        </div>
      </section>

      {/* Services */}
      <section className="bg-gray-50 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">Platform Services</h2>
            <p className="text-gray-600">Available as a website and desktop application for staff and citizens.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {services.map((service) => (
              <button
                key={service.title}
                onClick={service.action}
                className="text-left bg-white rounded-xl border border-gray-200 p-6 hover:border-green-500 hover:shadow-lg transition-all group"
              >
                <FileText className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="font-bold text-gray-800 mb-2 group-hover:text-green-700">{service.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{service.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm text-green-600 font-medium">
                  Get started <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 sm:p-8 md:p-12 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Contact MENRO</h2>
              <p className="text-green-100 mb-6">
                Visit our office or reach out for environmental concerns, seedling requests,
                waste management inquiries, and community program coordination.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-green-200" />
                  <span>Municipal Hall, Rizal, Philippines</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-200" />
                  <span>(049) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-200" />
                  <span>menro@rizal.gov</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate('/inquiries')}
                className="w-full py-3 rounded-xl bg-white text-green-700 font-semibold hover:bg-green-50 transition-colors"
              >
                Browse Services & Submit Inquiry
              </button>
              <button
                onClick={() => navigate('/staff-login')}
                className="w-full py-3 rounded-xl border-2 border-white/40 hover:bg-white/10 font-semibold transition-colors"
              >
                Staff Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center md:justify-start">
          <div className="flex items-center gap-3">
            <img src={appLogo} alt="Bantay Kalikasan Logo" className="w-10 h-10 object-contain" />
            <div>
              <p className="font-semibold text-gray-800">Bantay Kalikasan MENRO</p>
              <p className="text-xs text-gray-500">© 2026 Municipality of Rizal</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
