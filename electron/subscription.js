const PLANS = {
  none: { id: 'none', label: 'Not signed in' },
  free: {
    id: 'free',
    label: 'Free',
    durationDays: null,
    installLimit: 3,
    manageEnabled: false,
    priceUsd: 0,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    durationDays: 30,
    installLimit: null,
    manageEnabled: true,
    priceUsd: 25,
  },
  lifetime: {
    id: 'lifetime',
    label: 'Lifetime',
    durationDays: null,
    installLimit: null,
    manageEnabled: true,
    priceUsd: 100,
  },
};

const PAYMENT_LINKS = {
  pro: process.env.STRIPE_LINK_PRO || 'https://buy.stripe.com/test_28E9AS3JMbql3VFaDZefC00',
  lifetime: process.env.STRIPE_LINK_LIFETIME || 'https://buy.stripe.com/test_5kQ28q4NQfGB1Nx6nJefC01',
};

function dayMs() { return 24 * 60 * 60 * 1000; }

function loadProfile(store, userId) {
  if (!userId) return null;
  const profiles = store.get('subscriptionProfiles', {});
  return profiles[userId] || null;
}

function saveProfile(store, userId, profile) {
  if (!userId) return;
  const profiles = store.get('subscriptionProfiles', {});
  profiles[userId] = profile;
  store.set('subscriptionProfiles', profiles);
}

function ensureProfile(store, userId) {
  let profile = loadProfile(store, userId);
  if (!profile) {
    profile = {
      planId: 'free',
      startedAt: Date.now(),
      expiresAt: null,
      installsUsed: 0,
      lastReceipt: null,
    };
    saveProfile(store, userId, profile);
  }
  return profile;
}

function isExpired(profile) {
  if (!profile) return true;
  if (profile.planId === 'lifetime' || profile.planId === 'free') return false;
  if (!profile.expiresAt) return false;
  return Date.now() > profile.expiresAt;
}

function summarize(profile) {
  if (!profile) {
    return {
      planId: 'none',
      planLabel: 'Not signed in',
      installLimit: 0,
      installsUsed: 0,
      installsRemaining: 0,
      manageEnabled: false,
      expiresAt: null,
      daysRemaining: 0,
      expired: true,
      trialActive: false,
    };
  }
  const planDef = PLANS[profile.planId] || PLANS.free;
  const expired = isExpired(profile);
  const limit = planDef.installLimit;
  const remaining = limit == null ? null : Math.max(0, limit - (profile.installsUsed || 0));
  const daysRemaining = profile.expiresAt
    ? Math.max(0, Math.ceil((profile.expiresAt - Date.now()) / dayMs()))
    : null;
  return {
    planId: expired ? 'expired' : profile.planId,
    planLabel: expired ? `${planDef.label} (expired)` : planDef.label,
    installLimit: limit,
    installsUsed: profile.installsUsed || 0,
    installsRemaining: remaining,
    manageEnabled: !expired && planDef.manageEnabled,
    expiresAt: profile.expiresAt,
    daysRemaining,
    expired,
    trialActive: profile.planId === 'free' && !expired,
  };
}

function canInstall(profile) {
  if (!profile) return { allowed: false, reason: 'Sign in to install software.' };
  if (isExpired(profile)) {
    return {
      allowed: false,
      reason: 'Your Pro subscription has expired. Renew to continue installing software.',
    };
  }
  const planDef = PLANS[profile.planId];
  if (planDef.installLimit == null) return { allowed: true };
  const used = profile.installsUsed || 0;
  if (used >= planDef.installLimit) {
    return {
      allowed: false,
      reason: `The Free plan only includes ${planDef.installLimit} installs. Upgrade to Pro or Lifetime for unlimited installs.`,
    };
  }
  return { allowed: true };
}

function canManage(profile) {
  if (!profile) return { allowed: false, reason: 'Sign in to manage installed software.' };
  if (isExpired(profile)) {
    return {
      allowed: false,
      reason: 'Your Pro subscription has expired. Renew to regain Manage Software access.',
    };
  }
  const planDef = PLANS[profile.planId];
  if (!planDef.manageEnabled) {
    return {
      allowed: false,
      reason: 'Manage Software is not included in the Free plan. Upgrade to Pro or Lifetime to unlock.',
    };
  }
  return { allowed: true };
}

function incrementInstall(store, userId) {
  const profile = ensureProfile(store, userId);
  profile.installsUsed = (profile.installsUsed || 0) + 1;
  saveProfile(store, userId, profile);
  return profile;
}

function activatePaidPlan(store, userId, planId, receipt = null) {
  if (!PLANS[planId] || planId === 'free') {
    throw new Error(`Unknown plan: ${planId}`);
  }
  const planDef = PLANS[planId];
  const startedAt = Date.now();
  const expiresAt = planDef.durationDays == null ? null : startedAt + planDef.durationDays * dayMs();
  const profile = {
    planId,
    startedAt,
    expiresAt,
    installsUsed: 0,
    lastReceipt: receipt,
  };
  saveProfile(store, userId, profile);
  return profile;
}

module.exports = {
  PLANS,
  PAYMENT_LINKS,
  ensureProfile,
  summarize,
  canInstall,
  canManage,
  incrementInstall,
  activatePaidPlan,
  loadProfile,
};
