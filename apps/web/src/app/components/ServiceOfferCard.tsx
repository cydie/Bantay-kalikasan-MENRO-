import { Clock, MessageSquare } from 'lucide-react';
import type { SectionService } from '../lib/api';
import { btnPrimaryClass } from '../lib/uiClasses';

interface ServiceOfferCardProps {
  offer: SectionService;
  onInquire: (offer: SectionService) => void;
  showRequirements?: boolean;
}

export function ServiceOfferCard({ offer, onInquire, showRequirements = true }: ServiceOfferCardProps) {
  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5 hover:border-green-400 hover:shadow-md transition-all flex flex-col min-w-0 h-full">
      <h4 className="font-semibold text-gray-800 mb-2 break-words">{offer.service_name}</h4>
      <p className="text-sm text-gray-600 mb-4 flex-1 break-words">{offer.description}</p>
      {offer.processing_time && (
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {offer.processing_time}
        </p>
      )}
      {showRequirements && offer.requirements && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg min-w-0">
          <p className="text-xs font-medium text-gray-700 mb-1">Requirements</p>
          <p className="text-xs text-gray-600 break-words">{offer.requirements}</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => onInquire(offer)}
        className={`w-full mt-auto ${btnPrimaryClass}`}
      >
        <MessageSquare className="w-4 h-4" />
        Submit Inquiry
      </button>
    </article>
  );
}
