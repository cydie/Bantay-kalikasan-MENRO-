export type SectionId = 'nursery' | 'environmental' | 'solid-waste' | 'landfill' | 'enforcement';

export const SECTIONS: Array<{
  id: SectionId;
  name: string;
  shortName: string;
  inquiryCategory: string;
}> = [
  { id: 'nursery', name: 'Nursery', shortName: 'Nursery', inquiryCategory: 'Nursery' },
  { id: 'environmental', name: 'Environmental Management', shortName: 'Environmental', inquiryCategory: 'Environmental Management' },
  { id: 'solid-waste', name: 'Solid Waste Management', shortName: 'Solid Waste', inquiryCategory: 'Solid Waste Management' },
  { id: 'landfill', name: 'Landfill Management', shortName: 'Landfill', inquiryCategory: 'Landfill Management' },
  { id: 'enforcement', name: 'Enforcement', shortName: 'Enforcement', inquiryCategory: 'Enforcement' },
];

export function getSectionLabel(id: string) {
  if (id === 'admin') return 'Main Admin';
  return SECTIONS.find((s) => s.id === id)?.name ?? id;
}
