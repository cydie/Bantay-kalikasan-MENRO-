import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import type { SectionService } from '../lib/api';
import { buildInquiryPrefill } from '../lib/inquiryPrefill';
import { useCitizenAuth } from '../contexts/CitizenAuthContext';

export function useServiceInquiryAction() {
  const navigate = useNavigate();
  const { citizen } = useCitizenAuth();

  const startInquiry = useCallback(
    (offer: SectionService) => {
      const prefill = buildInquiryPrefill(offer);
      if (citizen) {
        navigate('/citizen-portal', { state: prefill });
        return;
      }
      navigate('/citizen-login', { state: prefill });
    },
    [citizen, navigate]
  );

  return { startInquiry };
}
