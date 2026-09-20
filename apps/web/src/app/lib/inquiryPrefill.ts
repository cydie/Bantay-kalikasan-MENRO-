import type { SectionService } from './api';

export interface InquiryPrefill {
  department_id: string;
  service_id: string;
  subject: string;
  category: string;
}

/** Display order for public service listings */
export const PUBLIC_DEPARTMENT_ORDER = [
  'nursery',
  'solid-waste',
  'environmental',
  'landfill',
  'enforcement',
] as const;

export function buildInquiryPrefill(offer: SectionService): InquiryPrefill {
  return {
    department_id: offer.department_id,
    service_id: offer.id,
    subject: offer.service_name,
    category: offer.department_name || offer.section_name || '',
  };
}

export function groupServicesForDisplay(services: SectionService[], includeAdmin = false) {
  const filtered = includeAdmin
    ? services
    : services.filter((s) => s.department_id !== 'admin');

  const grouped = filtered.reduce<Record<string, SectionService[]>>((acc, service) => {
    const key = service.department_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(service);
    return acc;
  }, {});

  const orderIndex = (deptId: string) => {
    const idx = PUBLIC_DEPARTMENT_ORDER.indexOf(deptId as (typeof PUBLIC_DEPARTMENT_ORDER)[number]);
    return idx === -1 ? 999 : idx;
  };

  return Object.entries(grouped)
    .sort(([a], [b]) => orderIndex(a) - orderIndex(b))
    .map(([departmentId, offers]) => ({
      departmentId,
      departmentName: offers[0]?.department_name || offers[0]?.section_name || departmentId,
      offers: offers.sort((a, b) => a.service_name.localeCompare(b.service_name)),
    }));
}
