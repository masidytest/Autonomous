import { X, Check, Sparkles, Zap, Crown, Gift } from 'lucide-react';
import { useUsageStore } from '../stores/usage-store';
import { toastSuccess } from '../stores/toast-store';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    highlight: false,
    badge: null,
    features: [
      '10 AI builds per month',
      'Basic code generation',
      'Community templates',
      'Export as ZIP',
      '1 deployment',
    ],
    limits: [
      'No priority AI',
      'No custom domains',
      'No GitHub integration',
    ],
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    highlight: true,
    badge: '7 days free',
    features: [
      'Unlimited AI builds',
      'Priority Claude Opus 4.6',
      'Premium templates library',
      'GitHub push & pull',
      'Unlimited deployments',
      'Custom domains',
      'Real-time collaboration',
      'Priority support',
    ],
    limits: [],
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    highlight: false,
    badge: 'Coming soon',
    features: [
      'Everything in Pro',
      'Team workspaces',
      'Role-based access',
      'Shared templates',
      'Analytics dashboard',
      'API access',
      'SSO authentication',
      'Dedicated support',
    ],
    limits: [],
  },
];

export function UpgradeModal() {
  const { upgradeModalOpen, setUpgradeModalOpen, tasksCompleted, freeTasksLimit } = useUsageStore();

  if (!upgradeModalOpen) return null;

  function handleStartTrial() {
    toastSuccess('Welcome to Masidy Pro! Your 7-day free trial has started.', 'Trial Activated');
    setUpgradeModalOpen(false);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
      }}
      onClick={() => setUpgradeModalOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 880,
          backgroundColor: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            padding: '32px 32px 28px',
            position: 'relative',
          }}
        >
          <button
            onClick={() => setUpgradeModalOpen(false)}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={20} color="#fff" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#fff',
                  margin: 0,
                }}
              >
                Upgrade to Masidy Pro
              </h2>
              <p style={{ fontSize: 13, color: '#999', margin: 0 }}>
                Unlimited AI builds, priority processing, and more
              </p>
            </div>
          </div>
          {/* Usage bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Free plan usage</span>
              <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
                {tasksCompleted} / {freeTasksLimit} builds
              </span>
            </div>
            <div style={{ height: 4, backgroundColor: '#333', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (tasksCompleted / freeTasksLimit) * 100)}%`,
                  background: tasksCompleted >= freeTasksLimit - 2
                    ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                    : 'linear-gradient(90deg, #10b981, #059669)',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Plans grid */}
        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {plans.map((plan) => (
              <div
                key={plan.name}
                style={{
                  padding: '24px 20px',
                  borderRadius: 16,
                  border: plan.highlight ? '2px solid #6366f1' : '1px solid #e8e5e0',
                  backgroundColor: plan.highlight ? '#faf8ff' : '#fff',
                  position: 'relative',
                  transition: 'box-shadow 0.2s',
                }}
              >
                {plan.badge && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -10,
                      right: 16,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      backgroundColor: plan.highlight ? '#6366f1' : '#888',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {plan.highlight && <Gift size={11} />}
                    {plan.badge}
                  </div>
                )}
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>
                  {plan.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 20 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: '#888' }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <Check size={14} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#444' }}>{f}</span>
                    </li>
                  ))}
                  {plan.limits.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <X size={14} color="#ccc" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#bbb' }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={plan.highlight ? handleStartTrial : undefined}
                  disabled={plan.badge === 'Coming soon'}
                  style={{
                    width: '100%',
                    marginTop: 16,
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: plan.highlight ? '#fff' : '#555',
                    backgroundColor: plan.highlight ? '#6366f1' : '#f5f3ef',
                    border: plan.highlight ? 'none' : '1px solid #e0ddd8',
                    borderRadius: 10,
                    cursor: plan.badge === 'Coming soon' ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'opacity 0.15s',
                    opacity: plan.badge === 'Coming soon' ? 0.5 : 1,
                  }}
                >
                  {plan.highlight && <Sparkles size={14} />}
                  {plan.name === 'Free'
                    ? 'Current Plan'
                    : plan.badge === 'Coming soon'
                    ? 'Coming Soon'
                    : 'Start 7-Day Free Trial'}
                </button>
              </div>
            ))}
          </div>
          <p
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: '#bbb',
              marginTop: 20,
            }}
          >
            No credit card required for free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
