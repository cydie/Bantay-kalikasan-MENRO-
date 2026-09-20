import { Leaf } from 'lucide-react';
import type { SectionService } from '../lib/api';
import { groupServicesForDisplay } from '../lib/inquiryPrefill';
import { ServiceOfferCard } from './ServiceOfferCard';

interface DepartmentServicesListProps {
  services: SectionService[];
  onInquire: (offer: SectionService) => void;
  showRequirements?: boolean;
}

export function DepartmentServicesList({
  services,
  onInquire,
  showRequirements = true,
}: DepartmentServicesListProps) {
  const sections = groupServicesForDisplay(services);

  if (sections.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">
        No active services are available at this time.
      </p>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      {sections.map((section) => (
        <section key={section.departmentId}>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600 shrink-0" />
            <span className="break-words">{section.departmentName}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.offers.map((offer) => (
              <ServiceOfferCard
                key={offer.id}
                offer={offer}
                onInquire={onInquire}
                showRequirements={showRequirements}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
