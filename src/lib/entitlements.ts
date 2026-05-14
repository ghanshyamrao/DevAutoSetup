import type { SubscriptionSummary } from '../vite-env';

export type PlanDef = {
  id: 'free' | 'pro' | 'lifetime';
  label: string;
  priceUsd: number;
  priceLabel: string;
  cadence: string;
  installLimitLabel: string;
  manageEnabled: boolean;
  features: string[];
  highlight?: boolean;
};

export const PLAN_DEFS: PlanDef[] = [
  {
    id: 'free',
    label: 'Free',
    priceUsd: 0,
    priceLabel: 'Free',
    cadence: 'forever',
    installLimitLabel: '3 software installs',
    manageEnabled: false,
    features: [
      'Browse the full software catalog',
      'Install up to 3 applications',
      'Single-click setup via winget',
      'Manage Software locked',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    priceUsd: 25,
    priceLabel: '$25',
    cadence: 'per month',
    installLimitLabel: 'Unlimited installs',
    manageEnabled: true,
    features: [
      'Unlimited software installs every month',
      'Full Manage Software access',
      'Catalog updates and version pinning',
      'Cancel any time',
    ],
    highlight: true,
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    priceUsd: 100,
    priceLabel: '$100',
    cadence: 'one-time',
    installLimitLabel: 'Unlimited forever',
    manageEnabled: true,
    features: [
      'Lifetime access to every feature',
      'Unlimited installs, no recurring fee',
      'All future updates included',
      'Best value for power users',
    ],
  },
];

export function planById(id: PlanDef['id']): PlanDef | undefined {
  return PLAN_DEFS.find((p) => p.id === id);
}

export function installsBadge(sub: SubscriptionSummary): string {
  if (sub.installsRemaining == null) return 'Unlimited installs';
  return `${sub.installsRemaining} install${sub.installsRemaining === 1 ? '' : 's'} remaining`;
}

export function expiryBadge(sub: SubscriptionSummary): string {
  if (sub.planId === 'lifetime') return 'Lifetime access';
  if (sub.planId === 'free') return '';
  if (sub.expired) return 'Expired';
  if (sub.daysRemaining == null) return '';
  return `${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'} remaining`;
}
