import type { Lang } from '../ui';
import type { SiteCopy, Service, Case } from './types';
import type { ServiceId } from '../routes';
import { SITE } from '../../consts';
import { es } from './es';
import { en } from './en';

export const COPY: Record<Lang, SiteCopy> = { es, en };

export const copy = (lang: Lang): SiteCopy => COPY[lang];

export const service = (lang: Lang, id: ServiceId): Service =>
  COPY[lang].services.items.find((s) => s.id === id)!;

export const caseById = (lang: Lang, id: string): Case | undefined =>
  COPY[lang].work.items.find((c) => c.id === id);

/** A mailto: link with the subject and a short brief template prefilled. */
export const mailto = (lang: Lang): string => {
  const c = COPY[lang].common;
  return `mailto:${SITE.email}?subject=${encodeURIComponent(c.mailSubject)}&body=${encodeURIComponent(c.mailBody)}`;
};

export type { SiteCopy, Service, Case };

/** Icon for each service, shared by the nav, the cards and the footer. */
export const SERVICE_ICON = {
  voice: 'phone',
  docs: 'doc',
  billing: 'invoice',
  assistant: 'chat',
  infra: 'cloud',
  custom: 'code',
} as const satisfies Record<ServiceId, string>;
