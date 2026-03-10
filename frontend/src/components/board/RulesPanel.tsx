import type { CdrTracking, CdrStatus } from '../../types/encounter'
import IntelPanel from './IntelPanel'

interface RulesPanelProps {
  cdrTracking: CdrTracking
  delay?: number
}

const STATUS_STYLES: Record<
  CdrStatus,
  { color: string; bg: string; border: string; label: string }
> = {
  pending: {
    color: 'var(--color-text-muted, #555)',
    bg: 'transparent',
    border: 'var(--color-border-primary, #222)',
    label: 'PENDING',
  },
  partial: {
    color: 'var(--color-warning, #d97706)',
    bg: 'rgba(217, 119, 6, 0.08)',
    border: 'rgba(217, 119, 6, 0.3)',
    label: 'PARTIAL',
  },
  completed: {
    color: 'var(--color-accent, #e53e3e)',
    bg: 'rgba(229, 62, 62, 0.08)',
    border: 'rgba(229, 62, 62, 0.3)',
    label: 'COMPLETED',
  },
  dismissed: {
    color: 'var(--color-text-muted, #555)',
    bg: 'transparent',
    border: 'var(--color-border-primary, #222)',
    label: 'DISMISSED',
  },
}

export default function RulesPanel({ cdrTracking, delay = 0 }: RulesPanelProps) {
  const entries = Object.entries(cdrTracking)

  return (
    <IntelPanel title="Clinical Decision Rules" delay={delay}>
      {entries.length === 0 ? (
        <div
          style={{
            padding: '16px 12px',
            border: '1px dashed var(--color-border-primary, #222)',
            textAlign: 'center',
            color: 'var(--color-text-muted, #555)',
            fontSize: '12px',
            fontFamily: "var(--font-mono, 'JetBrains Mono', 'SF Mono', monospace)",
            letterSpacing: '0.05em',
          }}
        >
          No clinical decision rules identified
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(([cdrId, entry]) => {
            const statusStyle = STATUS_STYLES[entry.status]
            const isDismissed = entry.dismissed || entry.status === 'dismissed'

            return (
              <div
                key={cdrId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: `1px solid ${statusStyle.border}`,
                  background: statusStyle.bg || 'var(--color-bg-deep, #000)',
                  opacity: isDismissed ? 0.5 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: isDismissed
                        ? 'var(--color-text-muted, #555)'
                        : 'var(--color-text-primary, #fff)',
                      fontFamily: "var(--font-family, 'Inter', sans-serif)",
                      textDecoration: isDismissed ? 'line-through' : 'none',
                    }}
                  >
                    {entry.name}
                  </div>
                  {entry.interpretation && !isDismissed && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--color-text-secondary, #999)',
                        marginTop: 3,
                        lineHeight: 1.4,
                      }}
                    >
                      {entry.interpretation}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexShrink: 0,
                    marginLeft: 12,
                  }}
                >
                  {entry.score != null && !isDismissed && (
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color:
                          entry.status === 'completed'
                            ? 'var(--color-accent, #e53e3e)'
                            : 'var(--color-text-primary, #fff)',
                        fontFamily: "var(--font-mono, 'JetBrains Mono', 'SF Mono', monospace)",
                        letterSpacing: '0.05em',
                      }}
                    >
                      {entry.score}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: statusStyle.color,
                      letterSpacing: '0.08em',
                      fontFamily: "var(--font-mono, 'JetBrains Mono', 'SF Mono', monospace)",
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </IntelPanel>
  )
}
