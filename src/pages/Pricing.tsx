import { useState } from 'react';
import { Check, ExternalLink, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { PLAN_DEFS } from '../lib/entitlements';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../components/Notifications';

export function Pricing() {
  const { user, subscription, subscribeAndVerify } = useAuth();
  const { notify } = useNotifications();
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  const currentPlanId = subscription.planId;
  const isPaidPlan = (id: string) => id !== 'free';

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      notify({ kind: 'warning', title: 'Sign in required', message: 'Please sign in before subscribing.' });
      return;
    }
    setBusyPlanId(planId);
    notify({
      kind: 'info',
      title: 'Opening Stripe Checkout',
      message: 'Complete your payment in the browser tab. We will activate your plan automatically when Stripe confirms.',
    });
    const result = await subscribeAndVerify(planId);
    setBusyPlanId(null);
    if (result.ok && result.status === 'paid') {
      notify({
        kind: 'success',
        title: 'Plan activated',
        message: 'Payment verified with Stripe. Your new entitlements are live.',
      });
      return;
    }
    switch (result.status) {
      case 'cancelled':
        notify({
          kind: 'warning',
          title: 'Checkout cancelled',
          message: 'No charge was made. You can try again any time.',
        });
        break;
      case 'unpaid':
        notify({
          kind: 'warning',
          title: 'Payment not completed',
          message: 'Stripe did not confirm the payment. Your plan is unchanged.',
        });
        break;
      case 'timeout':
        notify({
          kind: 'warning',
          title: 'Checkout timed out',
          message: 'We stopped waiting after 15 minutes. Try again if you still want to upgrade.',
        });
        break;
      case 'unauthenticated':
        notify({ kind: 'warning', title: 'Sign in required', message: result.error || 'Please sign in first.' });
        break;
      default:
        notify({
          kind: 'warning',
          title: 'Checkout failed',
          message: result.error || 'Something went wrong opening Stripe Checkout.',
        });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Plans &amp; Pricing</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
          Choose the plan that fits your workflow. You&apos;re currently on <strong>{subscription.planLabel}</strong>.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {PLAN_DEFS.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          const isPaid = isPaidPlan(plan.id);
          const isBusy = busyPlanId === plan.id;
          return (
            <div
              key={plan.id}
              style={{
                position: 'relative',
                background: 'var(--bg-card)',
                border: `1px solid ${plan.highlight ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: plan.highlight ? '0 8px 24px rgba(139, 92, 246, 0.15)' : 'none',
              }}
            >
              {plan.highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    right: 16,
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Sparkles size={12} /> Popular
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{plan.installLimitLabel}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 700 }}>{plan.priceLabel}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{plan.cadence}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                    <Check size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: 'var(--text-primary)' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                {isCurrent ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius)',
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid var(--success)',
                      color: 'var(--success)',
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    Current plan
                  </div>
                ) : plan.id === 'free' ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      textAlign: 'center',
                    }}
                  >
                    Active on sign-in
                  </div>
                ) : isPaid ? (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isBusy || !user}
                    style={{
                      width: '100%',
                      background: plan.highlight ? 'var(--accent)' : 'var(--bg-primary)',
                      color: plan.highlight ? '#fff' : 'var(--text-primary)',
                      border: plan.highlight ? 'none' : '1px solid var(--border)',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius)',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isBusy ? 'wait' : user ? 'pointer' : 'not-allowed',
                      opacity: !user ? 0.6 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isBusy ? <Loader2 size={16} className="spinner" /> : <ExternalLink size={16} />}
                    {isBusy ? 'Waiting for Stripe...' : 'Subscribe via Stripe'}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {busyPlanId && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-lg)',
            padding: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            marginBottom: 24,
          }}
        >
          <Loader2 size={18} className="spinner" style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>
              Waiting for Stripe to confirm your payment
            </div>
            <div>
              We&apos;ll activate your plan automatically as soon as Stripe reports the payment as <code>paid</code>.
              If you close the checkout tab without paying, nothing changes.
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <ShieldCheck size={18} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 2 }}>
            Server-verified Stripe Checkout <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(test mode)</span>
          </div>
          <div>
            DevOnboard never trusts a client-side &quot;I paid&quot; click. After you complete checkout, Stripe redirects
            back to the app and we verify the session status with Stripe&apos;s API before flipping your plan.
            Card details never touch DevOnboard.
          </div>
        </div>
      </div>
    </div>
  );
}
